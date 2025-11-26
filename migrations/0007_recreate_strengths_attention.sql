-- Recriar as colunas strengths e attention com suporte apropriado para arrays de texto
ALTER TABLE IF EXISTS group_members 
ADD COLUMN IF NOT EXISTS strengths text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS attention text[] DEFAULT ARRAY[]::text[];

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_group_members_strengths ON group_members USING gin(strengths);
CREATE INDEX IF NOT EXISTS idx_group_members_attention ON group_members USING gin(attention);
