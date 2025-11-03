import express from "express";
import { supabase } from "../lib/supabase.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("districts")
      .select("id, name, population, area_km2, geom");

    if (error) throw error;

    const districts = data.map((d) => ({
      id: d.id,
      name: d.name,
      population: d.population,
      area_km2: d.area_km2,
    }));

    res.json(districts);
  } catch (error) {
    console.error("Error fetching districts:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("districts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error fetching district:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
