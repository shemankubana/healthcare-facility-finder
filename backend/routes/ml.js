import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// Get ML service URL from environment
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";
const ML_ENABLED = process.env.ML_ENABLED === "true";

/**
 * Check if ML service is available
 */
async function checkMLService() {
  if (!ML_ENABLED) {
    return { available: false, reason: "ML service disabled in configuration" };
  }

  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`, {
      method: "GET",
      timeout: 5000,
    });

    if (!response.ok) {
      return { available: false, reason: "ML service health check failed" };
    }

    const data = await response.json();
    return {
      available: data.model_loaded,
      gee_available: data.gee_available,
      status: data.status,
    };
  } catch (error) {
    return { available: false, reason: error.message };
  }
}

/**
 * Proxy request to ML service
 */
async function proxyToMLService(path, method = "GET", body = null) {
  const url = `${ML_SERVICE_URL}${path}`;

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30000, // 30 second timeout
  };

  if (body && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || "ML service error");
    }

    return { success: true, data };
  } catch (error) {
    console.error(`ML service error (${path}):`, error);
    return { success: false, error: error.message };
  }
}

/**
 * GET /api/ml/health
 * Check ML service health
 */
router.get("/health", async (req, res) => {
  try {
    const status = await checkMLService();

    res.json({
      enabled: ML_ENABLED,
      ...status,
    });
  } catch (error) {
    res.status(500).json({
      enabled: ML_ENABLED,
      available: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/ml/model/info
 * Get information about the ML model
 */
router.get("/model/info", async (req, res) => {
  try {
    if (!ML_ENABLED) {
      return res.status(503).json({
        error: "ML service is not enabled. Set ML_ENABLED=true in environment.",
      });
    }

    const result = await proxyToMLService("/api/model/info", "GET");

    if (!result.success) {
      return res.status(503).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error("Error fetching model info:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ml/predict
 * Make prediction from feature vector
 */
router.post("/predict", async (req, res) => {
  try {
    if (!ML_ENABLED) {
      return res.status(503).json({
        error: "ML service is not enabled. Set ML_ENABLED=true in environment.",
      });
    }

    const { features } = req.body;

    if (!features || !Array.isArray(features) || features.length !== 12) {
      return res.status(400).json({
        error: "Invalid request. Provide 'features' array with exactly 12 values.",
      });
    }

    const result = await proxyToMLService("/api/predict", "POST", { features });

    if (!result.success) {
      return res.status(503).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error("Error making prediction:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ml/predict-location
 * Make prediction from geographic coordinates
 */
router.post("/predict-location", async (req, res) => {
  try {
    if (!ML_ENABLED) {
      return res.status(503).json({
        error: "ML service is not enabled. Set ML_ENABLED=true in environment.",
      });
    }

    const { latitude, longitude, patch_size, date_start, date_end } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "Invalid request. Provide 'latitude' and 'longitude'.",
      });
    }

    const requestBody = {
      latitude,
      longitude,
      patch_size: patch_size || 256,
      date_start: date_start || "2025-01-01",
      date_end: date_end || "2025-09-30",
    };

    const result = await proxyToMLService("/api/predict-from-location", "POST", requestBody);

    if (!result.success) {
      return res.status(503).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error("Error making location prediction:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ml/predict-batch
 * Make batch predictions
 */
router.post("/predict-batch", async (req, res) => {
  try {
    if (!ML_ENABLED) {
      return res.status(503).json({
        error: "ML service is not enabled. Set ML_ENABLED=true in environment.",
      });
    }

    const { requests: predictionRequests } = req.body;

    if (!predictionRequests || !Array.isArray(predictionRequests)) {
      return res.status(400).json({
        error: "Invalid request. Provide 'requests' array of feature vectors.",
      });
    }

    if (predictionRequests.length > 100) {
      return res.status(400).json({
        error: "Batch size too large. Maximum 100 predictions per request.",
      });
    }

    const result = await proxyToMLService("/api/predict-batch", "POST", predictionRequests);

    if (!result.success) {
      return res.status(503).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error("Error making batch prediction:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
