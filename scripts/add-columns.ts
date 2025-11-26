#!/usr/bin/env node

import { sql } from 'drizzle-orm';
import { db } from '../server/db.js';

async function addColumnsToGroupMembers() {
  try {
    console.log('🔨 Adicionando colunas strengths e attention à tabela group_members...');
    
    // Adicionar colunas se não existirem
    await db.execute(
      sql`ALTER TABLE group_members 
          ADD COLUMN IF NOT EXISTS strengths text[] DEFAULT ARRAY[]::text[],
          ADD COLUMN IF NOT EXISTS attention text[] DEFAULT ARRAY[]::text[]`
    );
    
    console.log('✅ Colunas adicionadas com sucesso!');
    
    // Criar índices GIN para melhor performance
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_group_members_strengths ON group_members USING gin(strengths)`
    );
    
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_group_members_attention ON group_members USING gin(attention)`
    );
    
    console.log('✅ Índices criados com sucesso!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error);
    process.exit(1);
  }
}

addColumnsToGroupMembers();
