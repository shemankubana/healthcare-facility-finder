-- Create function to calculate district bounds from geometry
-- This replaces hardcoded bounds with actual PostGIS calculations

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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_district_bounds(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_district_bounds(uuid) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION get_district_bounds(uuid) IS 'Calculate the bounding box (min/max lat/lon) for a district from its PostGIS geometry';
