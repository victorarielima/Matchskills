/**
 * Utilitários para reparar e normalizar respostas incompletas da IA
 */

export interface AIStudent {
  id: string;
  studentName: string;
  strengths?: string[];
  attention?: string[];
}

export interface AIGroup {
  groupNumber: number;
  leaderId: string;
  students: AIStudent[];
}

export interface AIDivisionResponse {
  groups: AIGroup[];
}

/**
 * Repara numeração de grupos se estiverem fora de ordem
 * Exemplo: [1, 6] -> renumera para [1, 2]
 */
export function normalizeGroupNumbers(response: AIDivisionResponse): AIDivisionResponse {
  const sorted = [...response.groups].sort((a, b) => a.groupNumber - b.groupNumber);
  
  return {
    groups: sorted.map((group, idx) => ({
      ...group,
      groupNumber: idx + 1
    }))
  };
}

/**
 * Detecta estudantes duplicados e remove duplicatas mantendo a primeira ocorrência
 */
export function removeDuplicateStudents(response: AIDivisionResponse): {
  response: AIDivisionResponse;
  duplicates: string[];
} {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  const groups = response.groups.map(group => ({
    ...group,
    students: group.students.filter(student => {
      if (seen.has(student.id)) {
        duplicates.push(`${student.studentName} (${student.id})`);
        return false;
      }
      seen.add(student.id);
      return true;
    })
  }));

  return {
    response: { groups },
    duplicates
  };
}

/**
 * Valida e sugere correções para uma resposta incompleta
 */
export function getSuggestions(
  response: AIDivisionResponse,
  availableStudents: Array<{ id: string; studentName: string }>
): {
  issues: string[];
  suggestions: string[];
  canAutoFix: boolean;
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Extrair todos os estudantes incluídos
  const includedIds = new Set<string>();
  response.groups.forEach(g => {
    g.students.forEach(s => includedIds.add(s.id));
  });

  // Verificar faltantes
  const missing = availableStudents.filter(s => !includedIds.has(s.id));
  if (missing.length > 0) {
    issues.push(`${missing.length} estudante(s) ausente(s)`);
    suggestions.push(`Faltam: ${missing.map(m => m.studentName).join(", ")}`);
  }

  // Verificar numeração
  const groupNumbers = response.groups.map(g => g.groupNumber).sort((a, b) => a - b);
  const expectedNumbers = Array.from({ length: response.groups.length }, (_, i) => i + 1);
  const numbersMatch = JSON.stringify(groupNumbers) === JSON.stringify(expectedNumbers);
  
  if (!numbersMatch) {
    issues.push("Numeração de grupos não é sequencial");
    suggestions.push(`Grupos encontrados: ${groupNumbers.join(", ")} → Esperado: ${expectedNumbers.join(", ")}`);
  }

  // Verificar duplicatas
  const allStudentIds = new Map<string, number>();
  response.groups.forEach(g => {
    g.students.forEach(s => {
      allStudentIds.set(s.id, (allStudentIds.get(s.id) || 0) + 1);
    });
  });

  const duplicates = Array.from(allStudentIds.entries())
    .filter(([_, count]) => count > 1)
    .map(([id]) => id);

  if (duplicates.length > 0) {
    issues.push(`${duplicates.length} estudante(s) duplicado(s)`);
    suggestions.push("Os duplicados serão removidos mantendo a primeira ocorrência");
  }

  // Poder corrigir automaticamente?
  const canAutoFix = missing.length === 0 && duplicates.length === 0;

  return {
    issues,
    suggestions,
    canAutoFix
  };
}

/**
 * Log amigável das sugestões
 */
export function logSuggestions(
  suggestions: ReturnType<typeof getSuggestions>
): string {
  const lines: string[] = [];

  lines.push("⚠️ PROBLEMAS DETECTADOS NA RESPOSTA DA IA:");
  lines.push("=".repeat(50));

  if (suggestions.issues.length === 0) {
    lines.push("✅ Nenhum problema encontrado!");
    return lines.join("\n");
  }

  lines.push("Problemas:");
  suggestions.issues.forEach((issue, i) => {
    lines.push(`  ${i + 1}. ${issue}`);
  });

  if (suggestions.suggestions.length > 0) {
    lines.push("\nSugestões:");
    suggestions.suggestions.forEach((suggestion, i) => {
      lines.push(`  ${i + 1}. ${suggestion}`);
    });
  }

  if (suggestions.canAutoFix) {
    lines.push("\n✅ Pode ser corrigido automaticamente!");
  } else {
    lines.push("\n❌ Precisa de revisão manual da IA");
  }

  return lines.join("\n");
}
