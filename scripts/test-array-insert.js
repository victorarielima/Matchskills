import pkg from 'pg';
import { config } from 'dotenv';

const { Pool } = pkg;

// Carregue as variáveis de ambiente
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Erro: DATABASE_URL não está definido');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function testArrayInsert() {
  const client = await pool.connect();
  try {
    console.log('🧪 Testando inserção de arrays...\n');
    
    // Obter um division_id válido
    const divisionResult = await client.query(
      `SELECT id FROM group_divisions LIMIT 1`
    );
    
    if (divisionResult.rows.length === 0) {
      console.log('⚠️  Nenhuma divisão encontrada. Criando uma para teste...');
      const newDivision = await client.query(
        `INSERT INTO group_divisions (class_id, name, members_per_group, prompt, created_at)
         SELECT id, 'Teste de Arrays', 3, 'Test prompt', NOW() FROM classes LIMIT 1
         RETURNING id`
      );
      
      if (newDivision.rows.length === 0) {
        console.error('❌ Erro: Nenhuma classe disponível para criar divisão de teste');
        process.exit(1);
      }
    }
    
    const divisionId = divisionResult.rows[0]?.id || divisionResult.rows[0]?.id;
    
    // Obter um form_response_id válido
    const responseResult = await client.query(
      `SELECT id FROM form_responses LIMIT 1`
    );
    
    if (responseResult.rows.length === 0) {
      console.error('❌ Erro: Nenhuma resposta de formulário disponível para teste');
      process.exit(1);
    }
    
    const formResponseId = responseResult.rows[0].id;
    
    // Inserir um registro de teste com arrays
    const testStrengths = ['Comunicação clara', 'Análise de dados', 'Liderança'];
    const testAttention = ['Melhorar habilidades técnicas', 'Desenvolver criatividade', 'Aumentar confiança'];
    
    console.log('📥 Inserindo registro com arrays:');
    console.log(`   - Strengths: ${JSON.stringify(testStrengths)}`);
    console.log(`   - Attention: ${JSON.stringify(testAttention)}`);
    
    const insertResult = await client.query(
      `INSERT INTO group_members (division_id, group_number, form_response_id, is_leader, strengths, attention, created_at)
       VALUES ($1, $2, $3, $4, $5::text[], $6::text[], NOW())
       RETURNING id, strengths, attention`,
      [divisionId, 1, formResponseId, true, testStrengths, testAttention]
    );
    
    const insertedRow = insertResult.rows[0];
    console.log('\n✅ Inserção bem-sucedida!');
    console.log(`   - ID: ${insertedRow.id}`);
    console.log(`   - Strengths salvo: ${JSON.stringify(insertedRow.strengths)}`);
    console.log(`   - Attention salvo: ${JSON.stringify(insertedRow.attention)}`);
    
    // Verificar que foi salvo corretamente
    const selectResult = await client.query(
      `SELECT strengths, attention FROM group_members WHERE id = $1`,
      [insertedRow.id]
    );
    
    const selectedRow = selectResult.rows[0];
    console.log('\n✅ Leitura bem-sucedida!');
    console.log(`   - Strengths lido: ${JSON.stringify(selectedRow.strengths)}`);
    console.log(`   - Attention lido: ${JSON.stringify(selectedRow.attention)}`);
    
    // Verificar se os arrays têm 3 itens
    if (selectedRow.strengths.length === 3 && selectedRow.attention.length === 3) {
      console.log('\n✅ Arrays têm exatamente 3 itens cada - PERFEITO!');
    } else {
      console.warn(`\n⚠️  Aviso: Esperado 3 itens em cada array`);
      console.log(`   - Strengths: ${selectedRow.strengths.length} itens`);
      console.log(`   - Attention: ${selectedRow.attention.length} itens`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao testar arrays:', error instanceof Error ? error.message : error);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

testArrayInsert();
