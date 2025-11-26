import { z } from "zod";

// Função para limpar strings com quebras de linha
function cleanString(str: string): string {
  if (!str || typeof str !== "string") return "";
  
  return str
    .replace(/\\n/g, " ")           // Substituir \n literal por espaço
    .replace(/\n/g, " ")            // Substituir quebras de linha reais por espaço
    .replace(/\\"/g, '"')           // Substituir \" por "
    .replace(/\\t/g, " ")           // Substituir \t por espaço
    .replace(/  +/g, " ")           // Remover múltiplos espaços
    .trim();                        // Remover espaços no início e fim
}

// Refinar o schema de validação para aceitar strings com quebras de linha
const cleanedStringSchema = z.string().transform(cleanString);

// Schemas de validação para a resposta da IA
export const aiStudentSchema = z.object({
  id: z.string().uuid(),
  studentName: z.string().transform(cleanString),
  strengths: z
    .array(cleanedStringSchema)
    .optional()
    .default([])
    .transform((arr) => arr.filter((s) => s.length > 0)), // Remover strings vazias
  attention: z
    .array(cleanedStringSchema)
    .optional()
    .default([])
    .transform((arr) => arr.filter((s) => s.length > 0)), // Remover strings vazias
});

export const aiGroupSchema = z.object({
  groupNumber: z.number().int().positive(),
  leaderId: z.string().uuid(),
  students: z.array(aiStudentSchema),
});

export const aiDivisionResponseSchema = z.object({
  groups: z.array(aiGroupSchema),
});

// Types derivados do schema
export type AIStudent = z.infer<typeof aiStudentSchema>;
export type AIGroup = z.infer<typeof aiGroupSchema>;
export type AIDivisionResponse = z.infer<typeof aiDivisionResponseSchema>;

/**
 * Função auxiliar para logar dados de limpeza de strings
 */
export function logStringCleaning(
  original: string,
  cleaned: string,
  type: "strength" | "attention" | "name"
): void {
  if (original !== cleaned) {
    console.log(`🧹 ${type === "strength" ? "💪" : type === "attention" ? "⚠️" : "👤"} String limpa:`);
    console.log(`   Original: ${original.substring(0, 50)}${original.length > 50 ? "..." : ""}`);
    console.log(`   Limpa:    ${cleaned.substring(0, 50)}${cleaned.length > 50 ? "..." : ""}`);
  }
}

/**
 * Valida e limpa a resposta do webhook da IA
 * Trata respostas como string JSON, objeto, ou string formatada
 * Também lida com respostas em array (quando N8N retorna [{ output: "..." }])
 */
export function parseAndValidateAIResponse(
  rawResponse: any
): AIDivisionResponse {
  // Etapa 0: Se for array, extrair o primeiro elemento
  let response = rawResponse;
  if (Array.isArray(response) && response.length > 0) {
    console.log("📦 Resposta é um array, extraindo primeiro elemento");
    response = response[0];
  }

  // Etapa 0.5: Se houver chave `output`, extrair dela
  if (response && typeof response === "object" && "output" in response && !("groups" in response)) {
    console.log("📦 Resposta tem chave 'output', extraindo");
    response = response.output;
  }

  // Etapa 1: Converter para string se necessário
  let jsonString = response;
  
  if (typeof response === "object") {
    jsonString = JSON.stringify(response);
  } else if (typeof response !== "string") {
    throw new Error(
      `Resposta inválida: esperado string ou objeto, recebido ${typeof response}`
    );
  }

  // Etapa 2: Lidar com strings escapadas (quando vem de um JSON dentro de um JSON)
  // Se a string contém \\ então foi escapada
  if (jsonString.includes('\\\\')) {
    console.log("🧹 Detectado escape duplo, desescapando...");
    jsonString = JSON.parse('"' + jsonString + '"'); // Faz parse para desescapar
  }

  // Etapa 3: Limpar formatação de markdown/escape
  // Remove ```json e ```
  jsonString = jsonString
    .replace(/^```json\s*\\?n?/, "")     // Remove ```json com possível \n escapado
    .replace(/^```json\s*\n?/, "")       // Remove ```json com quebra real
    .replace(/\\?n?```$/, "")            // Remove ``` no final com possível \n escapado
    .replace(/\n?```$/, "")              // Remove ``` no final com quebra real
    .trim();

  console.log("📝 String após limpeza de markdown (primeiros 200 chars):");
  console.log(jsonString.substring(0, 200));

  // Etapa 4: Fazer parse do JSON
  let parsedData: any;
  try {
    parsedData = JSON.parse(jsonString);
  } catch (parseError) {
    throw new Error(
      `Erro ao fazer parse de JSON: ${parseError instanceof Error ? parseError.message : "Desconhecido"}`
    );
  }

  // Etapa 5: Logar dados antes de validação (para debug)
  console.log("📊 Dados antes da limpeza (primeiros 500 chars):");
  console.log(JSON.stringify(parsedData, null, 2).substring(0, 500));

  // Etapa 6: Validar com schema Zod (que também limpa as strings)
  const validationResult = aiDivisionResponseSchema.safeParse(parsedData);

  if (!validationResult.success) {
    console.error("❌ Erros de validação:", validationResult.error.issues);
    throw new Error(
      `Validação falhou: ${validationResult.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`
    );
  }

  // Etapa 7: Logar dados após limpeza
  console.log("✅ Dados após limpeza (primeiros 500 chars):");
  console.log(JSON.stringify(validationResult.data, null, 2).substring(0, 500));

  return validationResult.data;
}

/**
 * Valida se um estudante existe no banco
 */
export function validateStudentExists(
  studentId: string,
  availableStudents: Array<{ id: string; [key: string]: any }>
): boolean {
  return availableStudents.some((student) => student.id === studentId);
}

/**
 * Valida um grupo completo com contexto dos estudantes disponíveis
 */
export function validateGroupIntegrity(
  group: AIGroup,
  availableStudents: Array<{ id: string; [key: string]: any }>
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar que o líder existe
  if (!validateStudentExists(group.leaderId, availableStudents)) {
    errors.push(
      `Líder do grupo ${group.groupNumber} (${group.leaderId}) não encontrado nos estudantes disponíveis`
    );
  }

  // Validar que todos os estudantes existem
  group.students.forEach((student) => {
    if (!validateStudentExists(student.id, availableStudents)) {
      errors.push(
        `Estudante ${student.id} do grupo ${group.groupNumber} não encontrado nos estudantes disponíveis`
      );
    }
  });

  // Validar que o líder está no grupo
  const leaderInGroup = group.students.some((s) => s.id === group.leaderId);
  if (!leaderInGroup) {
    errors.push(
      `Líder (${group.leaderId}) não está listado como membro do grupo ${group.groupNumber}`
    );
  }

  // Avisos
  if (group.students.length === 0) {
    warnings.push(`Grupo ${group.groupNumber} está vazio`);
  }

  if (group.students.length === 1) {
    warnings.push(`Grupo ${group.groupNumber} tem apenas 1 estudante`);
  }

  if (
    group.students.some(
      (s) => !s.strengths || s.strengths.length === 0
    )
  ) {
    warnings.push(
      `Alguns estudantes do grupo ${group.groupNumber} não têm strengths definidos`
    );
  }

  if (
    group.students.some(
      (s) => !s.attention || s.attention.length === 0
    )
  ) {
    warnings.push(
      `Alguns estudantes do grupo ${group.groupNumber} não têm attention definidos`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valida toda a divisão com contexto dos estudantes
 */
export function validateCompleteDivision(
  response: AIDivisionResponse,
  availableStudents: Array<{ id: string; [key: string]: any }>
): {
  isValid: boolean;
  groupValidations: Array<{
    groupNumber: number;
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
  globalErrors: string[];
  summary: string;
} {
  const groupValidations = response.groups.map((group) =>
    ({
      groupNumber: group.groupNumber,
      ...validateGroupIntegrity(group, availableStudents),
    })
  );

  const globalErrors: string[] = [];

  // Verificar duplicatas de estudantes
  const allStudentIds = new Set<string>();
  const duplicateStudents = new Set<string>();

  response.groups.forEach((group) => {
    group.students.forEach((student) => {
      if (allStudentIds.has(student.id)) {
        duplicateStudents.add(student.id);
      }
      allStudentIds.add(student.id);
    });
  });

  if (duplicateStudents.size > 0) {
    globalErrors.push(
      `Estudantes duplicados: ${Array.from(duplicateStudents).join(", ")}`
    );
  }

  // Verificar se todos os estudantes foram atribuídos
  const unassignedStudents = availableStudents.filter(
    (student) => !allStudentIds.has(student.id)
  );

  if (unassignedStudents.length > 0) {
    globalErrors.push(
      `${unassignedStudents.length} estudante(s) não foram atribuídos a nenhum grupo`
    );
  }

  // Verificar numeração dos grupos
  const groupNumbers = response.groups.map((g) => g.groupNumber).sort();
  if (groupNumbers[0] !== 1 || groupNumbers[groupNumbers.length - 1] !== groupNumbers.length) {
    globalErrors.push("Numeração dos grupos não é sequencial");
  }

  const isValid =
    globalErrors.length === 0 &&
    groupValidations.every((g) => g.isValid);

  const validGroupsCount = groupValidations.filter((g) => g.isValid).length;
  const totalGroups = response.groups.length;

  return {
    isValid,
    groupValidations,
    globalErrors,
    summary: `${validGroupsCount}/${totalGroups} grupos válidos. ${
      globalErrors.length > 0
        ? `${globalErrors.length} erro(s) global(is).`
        : "Nenhum erro global."
    }`,
  };
}

/**
 * Formata um relatório de validação para logging/debug
 */
export function formatValidationReport(
  validation: ReturnType<typeof validateCompleteDivision>
): string {
  const lines: string[] = [];

  lines.push("📊 RELATÓRIO DE VALIDAÇÃO");
  lines.push("=".repeat(50));
  lines.push(`Status geral: ${validation.isValid ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`);
  lines.push(`Resumo: ${validation.summary}`);
  lines.push("");

  if (validation.globalErrors.length > 0) {
    lines.push("🔴 ERROS GLOBAIS:");
    validation.globalErrors.forEach((error) => {
      lines.push(`  • ${error}`);
    });
    lines.push("");
  }

  lines.push("📋 VALIDAÇÃO POR GRUPO:");
  validation.groupValidations.forEach((groupVal) => {
    const icon = groupVal.isValid ? "✅" : "❌";
    lines.push(`${icon} Grupo ${groupVal.groupNumber}:`);

    if (groupVal.errors.length > 0) {
      lines.push("  Erros:");
      groupVal.errors.forEach((error) => {
        lines.push(`    • ${error}`);
      });
    }

    if (groupVal.warnings.length > 0) {
      lines.push("  Avisos:");
      groupVal.warnings.forEach((warning) => {
        lines.push(`    • ${warning}`);
      });
    }

    if (groupVal.errors.length === 0 && groupVal.warnings.length === 0) {
      lines.push("  Tudo Ok!");
    }

    lines.push("");
  });

  return lines.join("\n");
}
