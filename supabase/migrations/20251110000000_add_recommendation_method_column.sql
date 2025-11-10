-- Add recommendation_method column to recommendations table
-- This tracks whether recommendations came from ML or LLM

ALTER TABLE recommendations
ADD COLUMN IF NOT EXISTS recommendation_method text
CHECK (recommendation_method IN ('ml', 'llm', 'llm-fallback'))
DEFAULT 'llm';

-- Add index for filtering by method
CREATE INDEX IF NOT EXISTS idx_recommendations_method
ON recommendations(recommendation_method);

-- Add comment for documentation
COMMENT ON COLUMN recommendations.recommendation_method IS
'Method used to generate recommendations: ml (ML service), llm (LLM only), llm-fallback (LLM after ML failed)';
