-- ==============================================================================
-- Schéma databáze pro herní mód „Detektivní výslech“ (Hádači.cz)
-- Spusťte tento skript v Supabase SQL Editoru před prvním spuštěním synchronizace.
-- ==============================================================================

-- 1. Povolení pgvector rozšíření pro ukládání a vyhledávání vektorových embeddingů
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Hlavní tabulka detektivních případů
CREATE TABLE IF NOT EXISTS detective_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    publish_date DATE NOT NULL,
    entity_type TEXT NOT NULL, -- 'person' | 'place' | 'object' | 'event' | 'concept'
    difficulty TEXT NOT NULL DEFAULT 'medium', -- 'easy' | 'medium' | 'hard'
    secret_answer TEXT NOT NULL,
    accepted_synonyms JSONB NOT NULL DEFAULT '[]'::jsonb,
    initial_clue TEXT NOT NULL,
    content_hash TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_detective_cases_publish_date ON detective_cases(publish_date);
CREATE INDEX IF NOT EXISTS idx_detective_cases_slug ON detective_cases(slug);

-- 3. Tabulka znalostních faktů a otázek s vektorovými embeddingy
CREATE TABLE IF NOT EXISTS detective_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES detective_cases(id) ON DELETE CASCADE,
    fact_type TEXT NOT NULL CHECK (fact_type IN ('core', 'key_fact', 'qa')),
    fact_text TEXT NOT NULL,
    embedding vector(1536), -- text-embedding-3-small (1536 dimenzí)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_detective_facts_case_id ON detective_facts(case_id);
CREATE INDEX IF NOT EXISTS idx_detective_facts_fact_type ON detective_facts(fact_type);

-- HNSW index pro rychlé kosinové hledání nejrelevantnějších faktů
CREATE INDEX IF NOT EXISTS idx_detective_facts_embedding ON detective_facts 
USING hnsw (embedding vector_cosine_ops);

-- 4. Funkce pro sémantické vyhledávání nejrelevantnějších faktů k hráčské otázce
CREATE OR REPLACE FUNCTION match_detective_facts(
    query_embedding vector(1536),
    match_case_id UUID,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    case_id UUID,
    fact_type TEXT,
    fact_text TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        df.id,
        df.case_id,
        df.fact_type,
        df.fact_text,
        1 - (df.embedding <=> query_embedding) AS similarity
    FROM detective_facts df
    WHERE df.case_id = match_case_id
    ORDER BY df.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;



-- 5. Veřejný pohled na případy (bez odhalení tajenky)
CREATE OR REPLACE VIEW detective_cases_public AS
SELECT 
    id,
    slug,
    publish_date,
    entity_type,
    difficulty,
    initial_clue,
    is_active,
    created_at,
    updated_at
FROM detective_cases;

-- 6. Herní stav přihlášeného hráče pro Detektivní výslech
CREATE TABLE IF NOT EXISTS user_detective_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES detective_cases(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS' | 'SOLVED' | 'DRAWER'
    score_earned INT DEFAULT 100,
    questions_log JSONB NOT NULL DEFAULT '[]'::jsonb,
    wrong_guesses_count INT NOT NULL DEFAULT 0,
    is_drawer_repair BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, case_id)
);

CREATE INDEX IF NOT EXISTS idx_user_detective_state_user ON user_detective_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_detective_state_case ON user_detective_state(case_id);
