/*
  # Load Sample Rwanda Districts and Health Facilities
  
  1. Inserts
    - 4 sample districts (Eastern Rwanda)
    - 20+ health facilities with realistic locations
    - Population cell estimates
  
  2. Notes
    - Using simplified geometries for demo
    - Coordinates are actual Rwanda locations
    - Travel times are estimated based on distance
*/

INSERT INTO districts (name, geom, population, area_km2) VALUES
  ('Kayonza', ST_GeomFromText('MULTIPOLYGON(((30.05 -2.05, 30.15 -2.05, 30.15 -1.95, 30.05 -1.95, 30.05 -2.05)))', 4326), 400000, 800),
  ('Rwamagana', ST_GeomFromText('MULTIPOLYGON(((29.85 -2.15, 30.05 -2.15, 30.05 -2.05, 29.85 -2.05, 29.85 -2.15)))', 4326), 350000, 850),
  ('Nyagatare', ST_GeomFromText('MULTIPOLYGON(((30.25 -1.95, 30.45 -1.95, 30.45 -1.75, 30.25 -1.75, 30.25 -1.95)))', 4326), 450000, 1200),
  ('Ngoma', ST_GeomFromText('MULTIPOLYGON(((30.05 -1.85, 30.25 -1.85, 30.25 -1.65, 30.05 -1.65, 30.05 -1.85)))', 4326), 200000, 600)
ON CONFLICT DO NOTHING;

INSERT INTO health_facilities (name, type, capacity, services, geom, district_id) 
SELECT 
  f.name, f.type, f.capacity, f.services,
  ST_GeomFromText(f.geom_text, 4326),
  d.id
FROM (
  VALUES
    ('Kayonza District Hospital', 'hospital', 150, ARRAY['surgery', 'maternity', 'pediatrics'], 'POINT(30.10 -2.00)', 'Kayonza'),
    ('Kayonza Health Center I', 'health_center', 40, ARRAY['primary_care', 'antenatal'], 'POINT(30.08 -1.98)', 'Kayonza'),
    ('Kayonza Health Center II', 'health_center', 35, ARRAY['primary_care'], 'POINT(30.12 -2.02)', 'Kayonza'),
    ('Kayonza Clinic A', 'clinic', 20, ARRAY['basic_consultation'], 'POINT(30.07 -2.03)', 'Kayonza'),
    ('Kayonza Clinic B', 'clinic', 20, ARRAY['basic_consultation'], 'POINT(30.13 -1.97)', 'Kayonza'),
    
    ('Rwamagana General Hospital', 'hospital', 200, ARRAY['surgery', 'maternity', 'pediatrics', 'radiology'], 'POINT(29.95 -2.10)', 'Rwamagana'),
    ('Rwamagana Health Center I', 'health_center', 50, ARRAY['primary_care', 'vaccination'], 'POINT(29.90 -2.08)', 'Rwamagana'),
    ('Rwamagana Health Center II', 'health_center', 40, ARRAY['primary_care'], 'POINT(30.00 -2.12)', 'Rwamagana'),
    ('Rwamagana Health Center III', 'health_center', 35, ARRAY['primary_care'], 'POINT(29.92 -2.06)', 'Rwamagana'),
    ('Rwamagana Clinic A', 'clinic', 25, ARRAY['basic_consultation'], 'POINT(29.88 -2.11)', 'Rwamagana'),
    
    ('Nyagatare Hospital', 'hospital', 180, ARRAY['surgery', 'maternity', 'pediatrics'], 'POINT(30.35 -1.85)', 'Nyagatare'),
    ('Nyagatare Health Center I', 'health_center', 45, ARRAY['primary_care', 'antenatal'], 'POINT(30.30 -1.80)', 'Nyagatare'),
    ('Nyagatare Health Center II', 'health_center', 40, ARRAY['primary_care'], 'POINT(30.40 -1.88)', 'Nyagatare'),
    ('Nyagatare Health Center III', 'health_center', 35, ARRAY['primary_care'], 'POINT(30.28 -1.82)', 'Nyagatare'),
    ('Nyagatare Clinic A', 'clinic', 20, ARRAY['basic_consultation'], 'POINT(30.42 -1.80)', 'Nyagatare'),
    ('Nyagatare Clinic B', 'clinic', 18, ARRAY['basic_consultation'], 'POINT(30.32 -1.78)', 'Nyagatare'),
    
    ('Ngoma District Hospital', 'hospital', 120, ARRAY['surgery', 'maternity'], 'POINT(30.15 -1.75)', 'Ngoma'),
    ('Ngoma Health Center I', 'health_center', 35, ARRAY['primary_care'], 'POINT(30.10 -1.72)', 'Ngoma'),
    ('Ngoma Health Center II', 'health_center', 30, ARRAY['primary_care'], 'POINT(30.20 -1.78)', 'Ngoma'),
    ('Ngoma Clinic A', 'clinic', 15, ARRAY['basic_consultation'], 'POINT(30.08 -1.70)', 'Ngoma')
) f(name, type, capacity, services, geom_text, district_name)
JOIN districts d ON d.name = f.district_name
ON CONFLICT DO NOTHING;

INSERT INTO population_cells (geom, pop_estimate, avg_travel_min, district_id)
SELECT
  ST_GeomFromText(p.geom_text, 4326),
  p.pop_estimate,
  p.avg_travel_min,
  d.id
FROM (
  VALUES
    ('POLYGON((30.05 -2.05, 30.10 -2.05, 30.10 -2.00, 30.05 -2.00, 30.05 -2.05))', 50000, 35, 'Kayonza'),
    ('POLYGON((30.10 -2.05, 30.15 -2.05, 30.15 -2.00, 30.10 -2.00, 30.10 -2.05))', 45000, 42, 'Kayonza'),
    ('POLYGON((30.05 -2.00, 30.10 -2.00, 30.10 -1.95, 30.05 -1.95, 30.05 -2.00))', 55000, 38, 'Kayonza'),
    ('POLYGON((30.10 -2.00, 30.15 -2.00, 30.15 -1.95, 30.10 -1.95, 30.10 -2.00))', 40000, 45, 'Kayonza'),
    
    ('POLYGON((29.85 -2.15, 29.95 -2.15, 29.95 -2.10, 29.85 -2.10, 29.85 -2.15))', 60000, 32, 'Rwamagana'),
    ('POLYGON((29.95 -2.15, 30.05 -2.15, 30.05 -2.10, 29.95 -2.10, 29.95 -2.15))', 50000, 40, 'Rwamagana'),
    ('POLYGON((29.85 -2.10, 29.95 -2.10, 29.95 -2.05, 29.85 -2.05, 29.85 -2.10))', 55000, 36, 'Rwamagana'),
    ('POLYGON((29.95 -2.10, 30.05 -2.10, 30.05 -2.05, 29.95 -2.05, 29.95 -2.10))', 48000, 44, 'Rwamagana'),
    
    ('POLYGON((30.25 -1.95, 30.35 -1.95, 30.35 -1.85, 30.25 -1.85, 30.25 -1.95))', 70000, 38, 'Nyagatare'),
    ('POLYGON((30.35 -1.95, 30.45 -1.95, 30.45 -1.85, 30.35 -1.85, 30.35 -1.95))', 65000, 48, 'Nyagatare'),
    ('POLYGON((30.25 -1.85, 30.35 -1.85, 30.35 -1.75, 30.25 -1.75, 30.25 -1.85))', 55000, 42, 'Nyagatare'),
    
    ('POLYGON((30.05 -1.85, 30.15 -1.85, 30.15 -1.75, 30.05 -1.75, 30.05 -1.85))', 40000, 40, 'Ngoma'),
    ('POLYGON((30.15 -1.85, 30.25 -1.85, 30.25 -1.75, 30.15 -1.75, 30.15 -1.85))', 35000, 50, 'Ngoma')
) p(geom_text, pop_estimate, avg_travel_min, district_name)
JOIN districts d ON d.name = p.district_name
ON CONFLICT DO NOTHING;
