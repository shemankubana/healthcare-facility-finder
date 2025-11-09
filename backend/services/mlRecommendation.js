import fetch from "node-fetch";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";
const ML_ENABLED = process.env.ML_ENABLED === "true";

/**
 * ML-Enhanced Recommendation Service
 *
 * This service integrates ML predictions with LLM recommendations
 * to provide data-driven facility placement suggestions.
 */

/**
 * Check if ML service is available and model is loaded
 */
async function checkMLAvailability() {
  if (!ML_ENABLED) {
    throw new Error("ML service is disabled. Set ML_ENABLED=true in environment.");
  }

  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`, {
      method: "GET",
      timeout: 5000,
    });

    if (!response.ok) {
      throw new Error("ML service health check failed");
    }

    const data = await response.json();

    if (!data.model_loaded) {
      throw new Error("ML model not loaded. Please train and export a model first.");
    }

    return true;
  } catch (error) {
    throw new Error(`ML service unavailable: ${error.message}`);
  }
}

/**
 * Generate candidate locations within district bounds
 * Creates a grid of potential facility locations
 */
function generateCandidateLocations(bounds, numCandidates = 20) {
  const { minLat, maxLat, minLon, maxLon } = bounds;
  const candidates = [];

  // Create a grid of candidate locations
  const gridSize = Math.ceil(Math.sqrt(numCandidates));
  const latStep = (maxLat - minLat) / (gridSize + 1);
  const lonStep = (maxLon - minLon) / (gridSize + 1);

  for (let i = 1; i <= gridSize; i++) {
    for (let j = 1; j <= gridSize; j++) {
      candidates.push({
        latitude: minLat + i * latStep,
        longitude: minLon + j * lonStep,
      });
    }
  }

  return candidates;
}

/**
 * Get ML predictions for candidate locations
 * Uses the ML service to predict built-up areas (suitable for facilities)
 */
async function predictCandidateLocations(candidates) {
  const predictions = [];

  // Batch predictions for efficiency
  for (const candidate of candidates) {
    try {
      const response = await fetch(`${ML_SERVICE_URL}/api/predict-from-location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: candidate.latitude,
          longitude: candidate.longitude,
          patch_size: 256,
          date_start: "2025-01-01",
          date_end: "2025-09-30",
        }),
        timeout: 30000,
      });

      if (!response.ok) {
        console.warn(`Prediction failed for location (${candidate.latitude}, ${candidate.longitude})`);
        continue;
      }

      const data = await response.json();

      predictions.push({
        ...candidate,
        prediction: data.prediction,
        probability: data.probability,
        confidence: data.confidence,
        suitable: data.prediction === 1 && data.probability > 0.6, // Built-up and high confidence
      });
    } catch (error) {
      console.warn(`Error predicting location: ${error.message}`);
    }
  }

  return predictions;
}

/**
 * Select top locations based on ML predictions
 * Prioritizes locations with high probability of built-up areas
 */
function selectTopLocations(predictions, numLocations = 3) {
  // Filter suitable locations
  const suitableLocations = predictions.filter(p => p.suitable);

  if (suitableLocations.length === 0) {
    throw new Error(
      "No suitable locations found. The ML model did not identify any built-up areas " +
      "suitable for healthcare facilities in this district."
    );
  }

  // Sort by probability (highest first)
  const sorted = suitableLocations.sort((a, b) => b.probability - a.probability);

  // Return top N locations
  return sorted.slice(0, numLocations);
}

/**
 * Format recommendations with ML predictions
 */
function formatMLRecommendations(topLocations, analysis) {
  const recommendations = topLocations.map((location, index) => {
    const zones = ["North", "Central", "South", "East", "West"];
    const zone = zones[index % zones.length];

    const types = ["health_center", "clinic", "clinic"];
    const type = types[index] || "clinic";

    return {
      name: `${analysis.district} ${type === "health_center" ? "Health Center" : "Clinic"} (${zone})`,
      lat: location.latitude,
      lon: location.longitude,
      type: type,
      justification: `ML-identified built-up area with ${(location.probability * 100).toFixed(1)}% confidence. ` +
                     `Suitable for facility placement based on satellite imagery analysis.`,
      estimated_impact: `Reduces avg travel time by ~${Math.round((analysis.avgTravel - analysis.target) / topLocations.length)} minutes`,
      ml_confidence: location.confidence,
      ml_probability: location.probability.toFixed(3),
    };
  });

  return {
    recommendations,
    summary: `Identified ${recommendations.length} optimal locations using ML analysis of satellite imagery. ` +
             `These locations are in built-up areas suitable for healthcare facility placement, ` +
             `targeting to reduce average travel time from ${analysis.avgTravel} to approximately ${analysis.target} minutes.`,
    ml_enhanced: true,
    model_version: "1.0.0",
  };
}

/**
 * Main ML-enhanced recommendation function
 *
 * This replaces the LLM-only recommendation approach with ML-based predictions
 */
export async function getMLRecommendation(analysis) {
  console.log("Generating ML-enhanced recommendations...");

  try {
    // 1. Check ML service availability
    await checkMLAvailability();
    console.log("✓ ML service available");

    // 2. Generate candidate locations
    const candidates = generateCandidateLocations(analysis.bounds, 20);
    console.log(`✓ Generated ${candidates.length} candidate locations`);

    // 3. Get ML predictions for candidates
    console.log("Running ML predictions (this may take a minute)...");
    const predictions = await predictCandidateLocations(candidates);
    console.log(`✓ Received ${predictions.length} predictions`);

    if (predictions.length === 0) {
      throw new Error(
        "Could not get ML predictions for any candidate locations. " +
        "Check that the ML service is running and has access to satellite data."
      );
    }

    // 4. Select top locations
    const topLocations = selectTopLocations(predictions, 3);
    console.log(`✓ Selected ${topLocations.length} top locations`);

    // 5. Format recommendations
    const recommendations = formatMLRecommendations(topLocations, analysis);
    console.log("✓ ML-enhanced recommendations generated");

    return recommendations;

  } catch (error) {
    console.error("ML Recommendation Error:", error);
    throw error; // Don't fall back to dummy data - fail explicitly
  }
}

/**
 * Validate a proposed location using ML
 * Can be used to check if LLM-suggested locations are suitable
 */
export async function validateLocationWithML(latitude, longitude) {
  try {
    await checkMLAvailability();

    const response = await fetch(`${ML_SERVICE_URL}/api/predict-from-location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude,
        longitude,
        patch_size: 256,
        date_start: "2025-01-01",
        date_end: "2025-09-30",
      }),
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error("ML validation request failed");
    }

    const data = await response.json();

    return {
      valid: data.prediction === 1 && data.probability > 0.5,
      probability: data.probability,
      confidence: data.confidence,
      message: data.prediction === 1
        ? `Location validated: ${(data.probability * 100).toFixed(1)}% probability of built-up area`
        : `Location not suitable: ${((1 - data.probability) * 100).toFixed(1)}% probability of non-built area`,
    };

  } catch (error) {
    console.error("ML Validation Error:", error);
    throw error;
  }
}
