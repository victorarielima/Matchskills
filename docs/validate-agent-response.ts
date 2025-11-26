#!/usr/bin/env node

/**
 * Validador de Respostas do Agente de Formação de Grupos
 * 
 * Este arquivo valida se as respostas do agente estão no formato correto
 * e se atendem aos critérios especificados no prompt.
 */

interface StudentResponse {
  id: string;
  studentName: string;
  strengths: string[];
  attention: string[];
}

interface Group {
  groupNumber: number;
  leaderId: string;
  students: StudentResponse[];
}

interface AgentResponse {
  groups: Group[];
}

/**
 * Valida a resposta do agente
 */
function validateAgentResponse(
  response: AgentResponse,
  totalStudents: number,
  membersPerGroup: number,
  projectDescription: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Validar estrutura básica
  if (!response.groups || !Array.isArray(response.groups)) {
    errors.push("❌ Resposta não tem 'groups' como array");
    return { isValid: false, errors };
  }

  if (response.groups.length === 0) {
    errors.push("❌ Array 'groups' está vazio");
    return { isValid: false, errors };
  }

  // 2. Validar cada grupo
  let totalStudentsInGroups = 0;

  response.groups.forEach((group, groupIndex) => {
    // 2.1 Validar groupNumber
    if (group.groupNumber !== groupIndex + 1) {
      errors.push(
        `❌ Grupo ${groupIndex} tem groupNumber ${group.groupNumber}, esperado ${groupIndex + 1}`
      );
    }

    // 2.2 Validar leaderId
    if (!group.leaderId || typeof group.leaderId !== "string") {
      errors.push(`❌ Grupo ${group.groupNumber} não tem leaderId válido`);
    }

    // 2.3 Validar students array
    if (!Array.isArray(group.students) || group.students.length === 0) {
      errors.push(`❌ Grupo ${group.groupNumber} não tem students array válido`);
      return;
    }

    // 2.4 Validar quantidade de membros por grupo
    if (
      groupIndex < response.groups.length - 1 &&
      group.students.length !== membersPerGroup
    ) {
      errors.push(
        `❌ Grupo ${group.groupNumber} tem ${group.students.length} membros, esperado ${membersPerGroup}`
      );
    }

    totalStudentsInGroups += group.students.length;

    // 2.5 Validar leaderId existe em students
    const leaderExists = group.students.some((s) => s.id === group.leaderId);
    if (!leaderExists) {
      errors.push(
        `❌ Grupo ${group.groupNumber}: leaderId "${group.leaderId}" não existe em students`
      );
    }

    // 2.6 Validar cada aluno no grupo
    group.students.forEach((student, studentIndex) => {
      if (!student.id || typeof student.id !== "string") {
        errors.push(
          `❌ Grupo ${group.groupNumber}, aluno ${studentIndex}: id inválido`
        );
      }

      if (!student.studentName || typeof student.studentName !== "string") {
        errors.push(
          `❌ Grupo ${group.groupNumber}, aluno ${student.id}: studentName inválido`
        );
      }

      // 2.6.1 Validar strengths
      if (!Array.isArray(student.strengths)) {
        errors.push(
          `❌ Grupo ${group.groupNumber}, aluno ${student.id}: strengths não é array`
        );
      } else if (student.strengths.length !== 3) {
        errors.push(
          `❌ Grupo ${group.groupNumber}, aluno ${student.id}: strengths tem ${student.strengths.length} itens, esperado 3`
        );
      } else {
        student.strengths.forEach((strength, strengthIndex) => {
          if (!strength || typeof strength !== "string" || strength.trim() === "") {
            errors.push(
              `❌ Grupo ${group.groupNumber}, aluno ${student.id}: strength[${strengthIndex}] está vazio`
            );
          }
          // Validar que não é genérico
          if (
            strength.toLowerCase().match(/^(extrovertido|criativo|bom em|melhorar)$/i)
          ) {
            errors.push(
              `⚠️  Grupo ${group.groupNumber}, aluno ${student.id}: strength "${strength}" é genérico, deveria ser contextualizado ao projeto`
            );
          }
        });
      }

      // 2.6.2 Validar attention
      if (!Array.isArray(student.attention)) {
        errors.push(
          `❌ Grupo ${group.groupNumber}, aluno ${student.id}: attention não é array`
        );
      } else if (student.attention.length !== 3) {
        errors.push(
          `❌ Grupo ${group.groupNumber}, aluno ${student.id}: attention tem ${student.attention.length} itens, esperado 3`
        );
      } else {
        student.attention.forEach((att, attIndex) => {
          if (!att || typeof att !== "string" || att.trim() === "") {
            errors.push(
              `❌ Grupo ${group.groupNumber}, aluno ${student.id}: attention[${attIndex}] está vazio`
            );
          }
        });
      }
    });
  });

  // 3. Validar total de alunos
  if (totalStudentsInGroups !== totalStudents) {
    errors.push(
      `❌ Total de alunos: ${totalStudentsInGroups}, esperado ${totalStudents}`
    );
  }

  // 4. Validar que todos os alunos têm ID único
  const allStudentIds = response.groups.flatMap((g) => g.students.map((s) => s.id));
  const uniqueIds = new Set(allStudentIds);
  if (uniqueIds.size !== allStudentIds.length) {
    errors.push("❌ IDs duplicados detectados na resposta");
  }

  // 5. Validar líderes distribuídos
  const leaderIds = response.groups.map((g) => g.leaderId);
  const uniqueLeaders = new Set(leaderIds);
  if (uniqueLeaders.size !== leaderIds.length) {
    errors.push("❌ Um aluno foi designado líder de múltiplos grupos");
  }

  return {
    isValid: errors.filter((e) => e.startsWith("❌")).length === 0,
    errors,
  };
}

/**
 * Exemplo de uso
 */
const exampleResponse: AgentResponse = {
  groups: [
    {
      groupNumber: 1,
      leaderId: "aluno-001",
      students: [
        {
          id: "aluno-001",
          studentName: "João Silva",
          strengths: [
            "Forte liderança e iniciativa demonstrada (nota 5 em liderança)",
            "Experiência com desenvolvimento Python (nota 4)",
            "Capacidade de organização e planejamento estruturado (nota 4)",
          ],
          attention: [
            "Pode precisar compartilhar poder de decisão com colegas",
            "Tendência a centralizar tarefas - deve delegar mais",
            "Experiência moderada em desenvolvimento - pode necessitar suporte técnico avançado",
          ],
        },
        {
          id: "aluno-002",
          studentName: "Maria Santos",
          strengths: [
            "Excelente nível de organização (nota 5)",
            "Confiabilidade e cumprimento de prazos",
            "Pode ser mediadora e estabilizadora do grupo",
          ],
          attention: [
            "Baixa liderança (nota 2) - precisa de suporte do líder",
            "Experiência limitada em desenvolvimento (nota 3)",
            "Pode precisar de empoderamento para tomar decisões estratégicas",
          ],
        },
      ],
    },
  ],
};

// Validar
const result = validateAgentResponse(exampleResponse, 2, 2, "Sistema de Gestão");
console.log("\n=== VALIDAÇÃO DA RESPOSTA DO AGENTE ===\n");
console.log(`Status: ${result.isValid ? "✅ VÁLIDO" : "❌ INVÁLIDO"}\n`);
console.log("Mensagens:");
result.errors.forEach((error) => console.log(error));

// Exportar para uso em Node.js ou TypeScript
export { validateAgentResponse, AgentResponse, Group, StudentResponse };
