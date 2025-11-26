ALTER TABLE group_members ADD COLUMN strengths text[] DEFAULT ARRAY[]::text[];
ALTER TABLE group_members ADD COLUMN attention text[] DEFAULT ARRAY[]::text[];
