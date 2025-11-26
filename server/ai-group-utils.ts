import type { GroupMember } from "@shared/schema";

/**
 * Converte a resposta validada da IA para formato de salvamento no banco
 */
export function convertAIResponseToGroupMembers(
  groupNumber: number,
  divisionId: string,
  students: Array<{
    id: string;
    studentName: string;
    strengths?: string[];
    attention?: string[];
  }>,
  leaderId: string,
  formResponseIds: Map<string, string> // Mapeia ID do estudante para ID da resposta do formulário
): Omit<GroupMember, "id" | "createdAt">[] {
  return students.map((student) => {
    const formResponseId = formResponseIds.get(student.id);
    if (!formResponseId) {
      throw new Error(
        `Não foi encontrado formResponseId para o estudante ${student.id}`
      );
    }

    return {
      divisionId,
      groupNumber,
      formResponseId,
      isLeader: student.id === leaderId,
      strengths: student.strengths || [],
      attention: student.attention || [],
    };
  });
}

/**
 * Valida se todos os estudantes têm strengths e attention
 */
export function validateStudentAnalysis(
  students: Array<{
    id: string;
    strengths?: string[];
    attention?: string[];
  }>
): { isComplete: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  students.forEach((student) => {
    if (!student.strengths || student.strengths.length === 0) {
      missingFields.push(`${student.id}: strengths vazios`);
    }
    if (!student.attention || student.attention.length === 0) {
      missingFields.push(`${student.id}: attention vazios`);
    }
  });

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Log estruturado de uma divisão de grupo
 */
export function logGroupDivision(
  divisionId: string,
  groupMembers: Omit<GroupMember, "id" | "createdAt">[]
): void {
  console.log("📊 DIVISÃO DE GRUPOS VALIDADA");
  console.log("=".repeat(60));
  console.log(`Divisão ID: ${divisionId}`);

  const groupedByNumber = new Map<number, typeof groupMembers>();
  groupMembers.forEach((member) => {
    const group = groupedByNumber.get(member.groupNumber) || [];
    group.push(member);
    groupedByNumber.set(member.groupNumber, group);
  });

  groupedByNumber.forEach((members, groupNumber) => {
    console.log(`\n👥 Grupo ${groupNumber}:`);
    members.forEach((member) => {
      const leaderBadge = member.isLeader ? "👨‍💼 LÍDER" : "👤";
      console.log(`  ${leaderBadge} ${member.formResponseId}`);
      console.log(`     Strengths: ${(member.strengths || []).join("; ")}`);
      console.log(`     Attention: ${(member.attention || []).join("; ")}`);
    });
  });

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Total de membros: ${groupMembers.length}`);
}
