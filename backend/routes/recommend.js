import express from "express";
import { supabase } from "../lib/supabase.js";
import { getRecommendation } from "../services/llm.js";
import { getMLRecommendation } from "../services/mlRecommendation.js";

const router = express.Router();

// Check if ML is enabled
const ML_ENABLED = process.env.ML_ENABLED === "true";
const USE_ML_FOR_RECOMMENDATIONS = process.env.USE_ML_FOR_RECOMMENDATIONS !== "false"; // Default to true if ML is enabled

router.post("/", async (req, res) => {
  try {
    const { analysis } = req.body;

    if (!analysis) {
      return res.status(400).json({ error: "Analysis data required" });
    }

    // Validate district_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!analysis.districtId || !uuidRegex.test(analysis.districtId)) {
      return res.status(400).json({
        error: "Invalid district ID",
        message: "The district ID must be a valid UUID. Please use the analyze endpoint first to get a valid district ID."
      });
    }

    let recommendationResponse;
    let recommendationMethod = "llm";

    // Try ML-based recommendations first if enabled
    if (ML_ENABLED && USE_ML_FOR_RECOMMENDATIONS) {
      try {
        console.log("Using ML-based recommendations...");
        recommendationResponse = await getMLRecommendation(analysis);
        recommendationMethod = "ml";
        console.log("✓ ML recommendations generated successfully");
      } catch (mlError) {
        console.error("ML recommendation failed:", mlError.message);
        console.log("Falling back to LLM recommendations...");

        // Fall back to LLM if ML fails
        try {
          recommendationResponse = await getRecommendation(analysis);
          recommendationMethod = "llm-fallback";
        } catch (llmError) {
          // Both failed - return error
          return res.status(503).json({
            error: "Failed to generate recommendations",
            details: {
              ml_error: mlError.message,
              llm_error: llmError.message,
            },
            message: "Both ML and LLM recommendation services failed. Please ensure services are running.",
          });
        }
      }
    } else {
      // ML disabled or not preferred - use LLM only
      console.log("Using LLM-based recommendations...");
      recommendationResponse = await getRecommendation(analysis);
      recommendationMethod = "llm";
    }

    // Store recommendation in database
    const { error: storageError } = await supabase.from("recommendations").insert({
      district_id: analysis.districtId,
      target_travel_min: analysis.target,
      analysis_input: analysis,
      recommendation_output: recommendationResponse,
      recommendation_method: recommendationMethod,
    });

    if (storageError) {
      console.error("Storage error:", storageError);
    }

    res.json({
      success: true,
      analysis,
      recommendation: recommendationResponse,
      method: recommendationMethod,
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
