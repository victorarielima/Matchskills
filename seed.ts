import "dotenv/config";

console.log("🌱 Iniciando seed completo do banco de dados...");

async function seedDatabase() {
  try {
    console.log("📦 Importando dependências...");
    const { db } = await import("./server/db.js");
    const { users, classes, formQuestions, formResponses } = await import("./shared/schema.js");
    const bcrypt = await import("bcrypt");
    
    console.log("✅ Dependências importadas!");

    // Limpar dados existentes
    console.log("🧹 Limpando dados existentes...");
    await db.delete(formResponses);
    await db.delete(formQuestions);
    await db.delete(classes);
    await db.delete(users);
    console.log("✅ Dados limpos!");

    // Criar usuários de exemplo
    console.log("👥 Criando usuários...");
    const hashedPassword = await bcrypt.hash("123456", 10);
    
    const newUsers = await db.insert(users).values([
      {
        email: "ana.silva@matchskills.com",
        password: hashedPassword,
        firstName: "Ana",
        lastName: "Silva",
      },
      {
        email: "carlos.santos@matchskills.com",
        password: hashedPassword,
        firstName: "Carlos",
        lastName: "Santos",
      },
      {
        email: "maria.oliveira@matchskills.com",
        password: hashedPassword,
        firstName: "Maria",
        lastName: "Oliveira",
      },
    ]).returning();

    console.log("✅ Usuários criados:", newUsers.length);

    // Criar turmas de exemplo
    console.log("🏫 Criando turmas...");
    const newClasses = await db.insert(classes).values([
      {
        teacherId: newUsers[0].id,
        name: "Avaliação de Competências - Equipe Marketing",
        code: "6567213123",
        studentLimit: 15,
        groupCount: 3,
        isActive: true,
      },
      {
        teacherId: newUsers[0].id,
        name: "Soft Skills - Desenvolvimento",
        code: "9876543210",
        studentLimit: 20,
        groupCount: 4,
        isActive: false,
      },
    ]).returning();

    console.log("✅ Turmas criadas:", newClasses.length);

    // Criar perguntas de exemplo
    console.log("❓ Criando perguntas...");
    const newQuestions = await db.insert(formQuestions).values([
      {
        classId: newClasses[0].id,
        question: "Como você avalia suas habilidades de comunicação?",
        type: "scale",
        isRequired: true,
        order: 1,
        scaleMin: 1,
        scaleMax: 5,
      },
      {
        classId: newClasses[0].id,
        question: "Qual sua experiência com trabalho em equipe?",
        type: "radio",
        options: ["Nenhuma", "Pouca", "Moderada", "Muita", "Excelente"],
        isRequired: true,
        order: 2,
      },
      {
        classId: newClasses[0].id,
        question: "Descreva seus pontos fortes profissionais:",
        type: "textarea",
        isRequired: false,
        order: 3,
      },
    ]).returning();

    console.log("✅ Perguntas criadas:", newQuestions.length);

    // Criar algumas respostas de exemplo
    console.log("📝 Criando respostas de exemplo...");
    const newResponses = await db.insert(formResponses).values([
      {
        classId: newClasses[0].id,
        studentName: "João Silva",
        studentEmail: "joao.silva@email.com",
        responses: {
          [newQuestions[0].id]: "4",
          [newQuestions[1].id]: "Muita",
          [newQuestions[2].id]: "Sou proativo e trabalho bem sob pressão"
        },
      },
      {
        classId: newClasses[0].id,
        studentName: "Maria Santos",
        studentEmail: "maria.santos@email.com",
        responses: {
          [newQuestions[0].id]: "5",
          [newQuestions[1].id]: "Excelente",
          [newQuestions[2].id]: "Tenho facilidade para liderar e comunicar ideias"
        },
      },
    ]).returning();

    console.log("✅ Respostas criadas:", newResponses.length);
    
    console.log("\n🎉 Seed do banco de dados concluído com sucesso!");
    console.log("\n📊 Resumo:");
    console.log(`- ${newUsers.length} usuários criados`);
    console.log(`- ${newClasses.length} turmas criadas`);
    console.log(`- ${newQuestions.length} perguntas criadas`);
    console.log(`- ${newResponses.length} respostas de exemplo criadas`);
    
    console.log("\n🔑 Credenciais de login:");
    console.log("Email: ana.silva@matchskills.com");
    console.log("Senha: 123456");

  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    throw error;
  }
}

seedDatabase()
  .then(() => {
    console.log("🏁 Seed finalizado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erro no seed:", error);
    process.exit(1);
  });
