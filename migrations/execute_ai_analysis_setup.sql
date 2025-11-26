-- Script para adicionar colunas de análise da IA
-- Execute este script no seu banco de dados PostgreSQL

-- Adicionar coluna strengths se não existir
ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS strengths text[] DEFAULT ARRAY[]::text[];

-- Adicionar coluna attention se não existir
ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS attention text[] DEFAULT ARRAY[]::text[];

-- Opcional: Adicionar coluna isLeader se não existir (para versões antigas)
ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS is_leader boolean DEFAULT false;
