import pkg from 'pg';
import { config } from 'dotenv';

const { Pool } = pkg;

// Carregue as variáveis de ambiente
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Erro: DATABASE_URL não está definido nas variáveis de ambiente');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function addColumnsToGroupMembers() {
  const client = await pool.connect();
  try {
    console.log('🔨 Conectando ao banco de dados...');
    
    console.log('📝 Executando: ALTER TABLE group_members ADD COLUMN IF NOT EXISTS strengths text[] DEFAULT ARRAY[]::text[]');
    await client.query(
      `ALTER TABLE group_members 
       ADD COLUMN IF NOT EXISTS strengths text[] DEFAULT ARRAY[]::text[],
       ADD COLUMN IF NOT EXISTS attention text[] DEFAULT ARRAY[]::text[]`
    );
    console.log('✅ Colunas adicionadas com sucesso!');
    
    console.log('📝 Criando índice GIN para strengths...');
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_group_members_strengths ON group_members USING gin(strengths)`
    );
    console.log('✅ Índice strengths criado!');
    
    console.log('📝 Criando índice GIN para attention...');
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_group_members_attention ON group_members USING gin(attention)`
    );
    console.log('✅ Índice attention criado!');
    
    // Verificar as colunas
    console.log('\n📋 Verificando colunas criadas...');
    const result = await client.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name='group_members' 
       AND column_name IN ('strengths', 'attention')
       ORDER BY column_name`
    );
    
    if (result.rows.length === 2) {
      console.log('✅ Colunas verificadas:');
      result.rows.forEach((row) => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.warn(`⚠️  Apenas ${result.rows.length} coluna(s) encontrada(s)`);
    }
    
    console.log('\n✅ Operação concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

addColumnsToGroupMembers();
