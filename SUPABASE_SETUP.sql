-- ============================================================================
-- Supabase Database Setup for Healthcare Facility Finder
-- ============================================================================
-- Run this SQL script in your Supabase SQL Editor to set up missing schema
-- Dashboard → SQL Editor → New Query → Paste and Run
-- ============================================================================

-- 1. Add the recommendation_method column (needed for ML integration)
-- ----------------------------------------------------------------------------
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

-- 2. Create get_district_bounds function (if not exists)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_district_bounds(district_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'minLat', ST_YMin(geom),
    'maxLat', ST_YMax(geom),
    'minLon', ST_XMin(geom),
    'maxLon', ST_XMax(geom)
  ) INTO result
  FROM districts
  WHERE id = district_id;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_district_bounds(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_district_bounds(uuid) TO anon;

COMMENT ON FUNCTION get_district_bounds(uuid) IS
'Calculate the bounding box (min/max lat/lon) for a district from its PostGIS geometry';

-- 3. Update RLS policies for anonymous insert (optional - for demo)
-- ----------------------------------------------------------------------------
-- This allows the app to insert recommendations without authentication
-- Remove this in production if you want to require authentication

DROP POLICY IF EXISTS "Anonymous users can create recommendations" ON recommendations;

CREATE POLICY "Anonymous users can create recommendations"
  ON recommendations FOR INSERT
  TO anon
  WITH CHECK (true);

-- Keep the authenticated policy as well
DROP POLICY IF EXISTS "Authenticated users can create recommendations" ON recommendations;

CREATE POLICY "Authenticated users can create recommendations"
  ON recommendations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Run these to verify everything is set up correctly:

-- Check if recommendation_method column exists
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'recommendations' AND column_name = 'recommendation_method';

-- Check if function exists
-- SELECT routine_name, routine_type
-- FROM information_schema.routines
-- WHERE routine_name = 'get_district_bounds';

-- Check policies
-- SELECT policyname, cmd, roles
-- FROM pg_policies
-- WHERE tablename = 'recommendations';

-- ============================================================================
-- Done! Your database is now ready for ML recommendations
-- ============================================================================
