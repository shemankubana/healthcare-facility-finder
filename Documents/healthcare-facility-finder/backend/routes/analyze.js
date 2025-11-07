import express from "express";
import { supabase } from "../lib/supabase.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { district, targetTravel } = req.query;

    const { data: districtData, error: districtError } = await supabase
      .from("districts")
      .select("id, name, population, area_km2")
      .eq("name", district)
      .single();

    if (districtError) throw districtError;

    const { data: facilities, error: facilitiesError } = await supabase
      .from("health_facilities")
      .select("id, name, type, capacity, geom")
      .eq("district_id", districtData.id);

    if (facilitiesError) throw facilitiesError;

    const { data: populationCells, error: populationError } = await supabase
      .from("population_cells")
      .select("pop_estimate, avg_travel_min")
      .eq("district_id", districtData.id);

    if (populationError) throw populationError;

    const totalPopulation = populationCells.reduce((sum, cell) => sum + (cell.pop_estimate || 0), 0);
    const avgTravelTime =
      populationCells.length > 0
        ? populationCells.reduce((sum, cell) => sum + cell.avg_travel_min, 0) / populationCells.length
        : 0;

    const facilityBreakdown = {
      hospitals: facilities.filter((f) => f.type === "hospital").length,
      health_centers: facilities.filter((f) => f.type === "health_center").length,
      clinics: facilities.filter((f) => f.type === "clinic").length,
    };

    const analysis = {
      district: districtData.name,
      districtId: districtData.id,
      population: totalPopulation,
      area_km2: districtData.area_km2,
      population_density: (totalPopulation / districtData.area_km2).toFixed(1),
      currentFacilities: facilities.length,
      facilityBreakdown,
      totalCapacity: facilities.reduce((sum, f) => sum + (f.capacity || 0), 0),
      avgTravel: Math.round(avgTravelTime),
      target: parseInt(targetTravel) || 30,
      populationPerFacility: Math.round(totalPopulation / facilities.length),
      gap_status: avgTravelTime > parseInt(targetTravel) ? "UNDERSERVED" : "ADEQUATE",
      bounds: {
        minLat: -2.2,
        maxLat: -1.6,
        minLon: 29.8,
        maxLon: 30.5,
      },
    };

    res.json(analysis);
  } catch (error) {
    console.error("Error analyzing district:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
