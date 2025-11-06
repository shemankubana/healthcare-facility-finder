/*
  # Healthcare Facility Planning Database Schema
  
  1. New Tables
    - `districts` - Rwanda districts with geometry
    - `health_facilities` - Existing hospitals and clinics with locations
    - `population_cells` - Population density grid with travel times
    - `recommendations` - Stored recommendations and analysis results
  
  2. Security
    - Enable RLS on all tables
    - Allow public read access for demo
    - Restrict write access to authenticated users
*/

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  geom geometry(MultiPolygon, 4326) NOT NULL,
  population bigint DEFAULT 0,
  area_km2 numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS health_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('hospital', 'health_center', 'clinic')),
  capacity integer DEFAULT 0,
  services text[] DEFAULT ARRAY[]::text[],
  geom geometry(Point, 4326) NOT NULL,
  district_id uuid REFERENCES districts(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS population_cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  geom geometry(Polygon, 4326) NOT NULL,
  pop_estimate numeric DEFAULT 0,
  avg_travel_min numeric DEFAULT 0,
  district_id uuid REFERENCES districts(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id uuid NOT NULL REFERENCES districts(id),
  user_id uuid,
  target_travel_min numeric NOT NULL,
  analysis_input jsonb NOT NULL,
  recommendation_output jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE population_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Districts are viewable by all"
  ON districts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Health facilities are viewable by all"
  ON health_facilities FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Population cells are viewable by all"
  ON population_cells FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Recommendations are viewable by all"
  ON recommendations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can create recommendations"
  ON recommendations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_health_facilities_district ON health_facilities(district_id);
CREATE INDEX idx_health_facilities_geom ON health_facilities USING GIST(geom);
CREATE INDEX idx_population_cells_geom ON population_cells USING GIST(geom);
CREATE INDEX idx_population_cells_district ON population_cells(district_id);
CREATE INDEX idx_recommendations_district ON recommendations(district_id);
