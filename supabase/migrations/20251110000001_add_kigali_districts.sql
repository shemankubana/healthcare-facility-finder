/*
  # Add Kigali City Districts

  Adds the three main districts of Kigali:
  - Gasabo
  - Kicukiro
  - Nyarugenge

  These are referenced in the frontend and needed for testing ML recommendations.
*/

INSERT INTO districts (name, geom, population, area_km2) VALUES
  ('Gasabo', ST_GeomFromText('MULTIPOLYGON(((30.05 -1.90, 30.15 -1.90, 30.15 -1.80, 30.05 -1.80, 30.05 -1.90)))', 4326), 530000, 430),
  ('Kicukiro', ST_GeomFromText('MULTIPOLYGON(((30.00 -2.00, 30.10 -2.00, 30.10 -1.90, 30.00 -1.90, 30.00 -2.00)))', 4326), 318000, 166),
  ('Nyarugenge', ST_GeomFromText('MULTIPOLYGON(((29.95 -1.95, 30.05 -1.95, 30.05 -1.85, 29.95 -1.85, 29.95 -1.95)))', 4326), 284000, 134)
ON CONFLICT (name) DO NOTHING;

-- Add some health facilities for these districts
INSERT INTO health_facilities (name, type, capacity, services, geom, district_id)
SELECT
  f.name, f.type, f.capacity, f.services,
  ST_GeomFromText(f.geom_text, 4326),
  d.id
FROM (
  VALUES
    ('Kigali University Teaching Hospital', 'hospital', 500, ARRAY['surgery', 'maternity', 'pediatrics', 'radiology', 'emergency'], 'POINT(30.07 -1.95)', 'Gasabo'),
    ('Gasabo District Hospital', 'hospital', 200, ARRAY['surgery', 'maternity', 'pediatrics'], 'POINT(30.10 -1.85)', 'Gasabo'),
    ('Gasabo Health Center I', 'health_center', 50, ARRAY['primary_care', 'antenatal'], 'POINT(30.08 -1.88)', 'Gasabo'),
    ('Gasabo Health Center II', 'health_center', 45, ARRAY['primary_care', 'vaccination'], 'POINT(30.12 -1.82)', 'Gasabo'),
    ('Gasabo Clinic A', 'clinic', 25, ARRAY['basic_consultation'], 'POINT(30.06 -1.87)', 'Gasabo'),

    ('Kicukiro Hospital', 'hospital', 180, ARRAY['surgery', 'maternity', 'pediatrics'], 'POINT(30.05 -1.95)', 'Kicukiro'),
    ('Kicukiro Health Center I', 'health_center', 40, ARRAY['primary_care', 'antenatal'], 'POINT(30.03 -1.93)', 'Kicukiro'),
    ('Kicukiro Health Center II', 'health_center', 35, ARRAY['primary_care'], 'POINT(30.08 -1.97)', 'Kicukiro'),
    ('Kicukiro Clinic A', 'clinic', 20, ARRAY['basic_consultation'], 'POINT(30.02 -1.98)', 'Kicukiro'),

    ('Nyarugenge District Hospital', 'hospital', 220, ARRAY['surgery', 'maternity', 'pediatrics', 'radiology'], 'POINT(30.00 -1.90)', 'Nyarugenge'),
    ('Nyarugenge Health Center I', 'health_center', 45, ARRAY['primary_care', 'vaccination'], 'POINT(29.98 -1.88)', 'Nyarugenge'),
    ('Nyarugenge Health Center II', 'health_center', 40, ARRAY['primary_care'], 'POINT(30.02 -1.92)', 'Nyarugenge'),
    ('Nyarugenge Clinic A', 'clinic', 22, ARRAY['basic_consultation'], 'POINT(29.97 -1.89)', 'Nyarugenge')
) f(name, type, capacity, services, geom_text, district_name)
JOIN districts d ON d.name = f.district_name
ON CONFLICT DO NOTHING;

-- Add population cells for these districts
INSERT INTO population_cells (geom, pop_estimate, avg_travel_min, district_id)
SELECT
  ST_GeomFromText(p.geom_text, 4326),
  p.pop_estimate,
  p.avg_travel_min,
  d.id
FROM (
  VALUES
    -- Gasabo cells
    ('POLYGON((30.05 -1.90, 30.10 -1.90, 30.10 -1.85, 30.05 -1.85, 30.05 -1.90))', 100000, 28, 'Gasabo'),
    ('POLYGON((30.10 -1.90, 30.15 -1.90, 30.15 -1.85, 30.10 -1.85, 30.10 -1.90))', 90000, 35, 'Gasabo'),
    ('POLYGON((30.05 -1.85, 30.10 -1.85, 30.10 -1.80, 30.05 -1.80, 30.05 -1.85))', 95000, 32, 'Gasabo'),
    ('POLYGON((30.10 -1.85, 30.15 -1.85, 30.15 -1.80, 30.10 -1.80, 30.10 -1.85))', 85000, 38, 'Gasabo'),

    -- Kicukiro cells
    ('POLYGON((30.00 -2.00, 30.05 -2.00, 30.05 -1.95, 30.00 -1.95, 30.00 -2.00))', 75000, 30, 'Kicukiro'),
    ('POLYGON((30.05 -2.00, 30.10 -2.00, 30.10 -1.95, 30.05 -1.95, 30.05 -2.00))', 70000, 36, 'Kicukiro'),
    ('POLYGON((30.00 -1.95, 30.05 -1.95, 30.05 -1.90, 30.00 -1.90, 30.00 -1.95))', 68000, 33, 'Kicukiro'),
    ('POLYGON((30.05 -1.95, 30.10 -1.95, 30.10 -1.90, 30.05 -1.90, 30.05 -1.95))', 65000, 40, 'Kicukiro'),

    -- Nyarugenge cells
    ('POLYGON((29.95 -1.95, 30.00 -1.95, 30.00 -1.90, 29.95 -1.90, 29.95 -1.95))', 80000, 25, 'Nyarugenge'),
    ('POLYGON((30.00 -1.95, 30.05 -1.95, 30.05 -1.90, 30.00 -1.90, 30.00 -1.95))', 75000, 29, 'Nyarugenge'),
    ('POLYGON((29.95 -1.90, 30.00 -1.90, 30.00 -1.85, 29.95 -1.85, 29.95 -1.90))', 70000, 27, 'Nyarugenge'),
    ('POLYGON((30.00 -1.90, 30.05 -1.90, 30.05 -1.85, 30.00 -1.85, 30.00 -1.90))', 72000, 32, 'Nyarugenge')
) p(geom_text, pop_estimate, avg_travel_min, district_name)
JOIN districts d ON d.name = p.district_name
ON CONFLICT DO NOTHING;
