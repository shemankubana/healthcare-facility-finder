import express from "express";
import { supabase } from "../lib/supabase.js";
import { getRecommendation } from "../services/llm.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { analysis } = req.body;

    if (!analysis) {
      return res.status(400).json({ error: "Analysis data required" });
    }

    const llmResponse = await getRecommendation(analysis);

    const { error: storageError } = await supabase.from("recommendations").insert({
      district_id: analysis.districtId,
      target_travel_min: analysis.target,
      analysis_input: analysis,
      recommendation_output: llmResponse,
    });

    if (storageError) {
      console.error("Storage error:", storageError);
    }

    res.json({
      success: true,
      analysis,
      recommendation: llmResponse,
    });
  } catch (error) {
    console.error("Error generating recommendation:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/history/:districtId", async (req, res) => {
  try {
    const { districtId } = req.params;

    const { data, error } = await supabase
      .from("recommendations")
      .select("*")
      .eq("district_id", districtId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
