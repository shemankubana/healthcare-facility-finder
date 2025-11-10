"""
Healthcare Facility Finder - ML Prediction Service

FastAPI microservice for Random Forest predictions on satellite imagery.
Detects healthcare facilities and built-up areas from Sentinel-2 data.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import numpy as np
import logging
from datetime import datetime
import os

from app.model_loader import ModelLoader
from app.feature_extractor import FeatureExtractor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Healthcare Facility Finder ML Service",
    description="ML prediction service for healthcare facility detection from satellite imagery",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model loader (singleton)
model_loader = None
feature_extractor = None


# Pydantic models for request/response validation
class PredictionRequest(BaseModel):
    """Request model for single prediction"""
    features: List[float] = Field(
        ...,
        description="12-dimensional feature vector [R_mean, R_std, G_mean, G_std, B_mean, B_std, NDVI_mean, NDVI_std, Built_mean, Built_std, Brightness_mean, Brightness_std]",
        min_items=12,
        max_items=12
    )


class ImagePatchRequest(BaseModel):
    """Request model for prediction from raw image patch"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    patch_size: int = Field(default=256, ge=64, le=512)
    date_start: Optional[str] = Field(default="2025-01-01", description="ISO date format")
    date_end: Optional[str] = Field(default="2025-09-30", description="ISO date format")


class PredictionResponse(BaseModel):
    """Response model for predictions"""
    prediction: int = Field(..., description="Binary prediction: 0 (non-built) or 1 (built-up/healthcare)")
    probability: float = Field(..., description="Probability of positive class (built-up)")
    confidence: str = Field(..., description="Confidence level: low, medium, high")
    features_used: Optional[Dict[str, float]] = None
    timestamp: str


class ModelInfoResponse(BaseModel):
    """Response model for model information"""
    model_type: str
    version: str
    accuracy: Optional[float]
    n_estimators: int
    max_depth: Optional[int]
    input_features: int
    feature_names: List[str]
    last_loaded: str
    status: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    gee_available: bool
    timestamp: str


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize model and feature extractor on startup"""
    global model_loader, feature_extractor

    logger.info("🚀 Starting ML service...")

    try:
        # Initialize model loader
        model_path = os.getenv("MODEL_PATH", "./models/healthcare_model.pkl")
        model_loader = ModelLoader(model_path)
        model_loader.load_model()
        logger.info("✅ Model loaded successfully")

        # Initialize feature extractor
        feature_extractor = FeatureExtractor()
        logger.info("✅ Feature extractor initialized")

    except Exception as e:
        logger.error(f"❌ Failed to initialize ML service: {e}")
        # Continue startup but mark as degraded
        model_loader = None
        feature_extractor = None


# Dependency to check if model is loaded
def get_model_loader() -> ModelLoader:
    """Dependency to ensure model is loaded"""
    if model_loader is None or not model_loader.is_loaded():
        raise HTTPException(
            status_code=503,
            detail="ML model not loaded. Service unavailable."
        )
    return model_loader


def get_feature_extractor() -> FeatureExtractor:
    """Dependency to ensure feature extractor is available"""
    if feature_extractor is None:
        raise HTTPException(
            status_code=503,
            detail="Feature extractor not initialized. Service unavailable."
        )
    return feature_extractor


# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    gee_available = feature_extractor.check_gee_connection() if feature_extractor else False

    return HealthResponse(
        status="healthy" if (model_loader and model_loader.is_loaded()) else "degraded",
        model_loaded=model_loader.is_loaded() if model_loader else False,
        gee_available=gee_available,
        timestamp=datetime.utcnow().isoformat()
    )


# Model info endpoint
@app.get("/api/model/info", response_model=ModelInfoResponse)
async def get_model_info(loader: ModelLoader = Depends(get_model_loader)):
    """Get information about the loaded ML model"""
    info = loader.get_model_info()

    return ModelInfoResponse(
        model_type=info["model_type"],
        version=info["version"],
        accuracy=info.get("accuracy"),
        n_estimators=info["n_estimators"],
        max_depth=info["max_depth"],
        input_features=info["input_features"],
        feature_names=info["feature_names"],
        last_loaded=info["last_loaded"],
        status="active"
    )


# Prediction from features endpoint
@app.post("/api/predict", response_model=PredictionResponse)
async def predict_from_features(
    request: PredictionRequest,
    loader: ModelLoader = Depends(get_model_loader)
):
    """
    Make prediction from pre-extracted features.

    Features should be in order:
    [R_mean, R_std, G_mean, G_std, B_mean, B_std,
     NDVI_mean, NDVI_std, Built_mean, Built_std,
     Brightness_mean, Brightness_std]
    """
    try:
        # Convert to numpy array
        features_array = np.array(request.features).reshape(1, -1)

        # Make prediction
        prediction, probability = loader.predict(features_array)

        # Determine confidence level
        confidence = "high" if probability > 0.8 else "medium" if probability > 0.5 else "low"

        # Create feature dictionary for response
        feature_names = [
            "R_mean", "R_std", "G_mean", "G_std", "B_mean", "B_std",
            "NDVI_mean", "NDVI_std", "Built_mean", "Built_std",
            "Brightness_mean", "Brightness_std"
        ]
        features_dict = {name: float(val) for name, val in zip(feature_names, request.features)}

        return PredictionResponse(
            prediction=int(prediction[0]),
            probability=float(probability[0]),
            confidence=confidence,
            features_used=features_dict,
            timestamp=datetime.utcnow().isoformat()
        )

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# Prediction from coordinates endpoint (requires GEE)
@app.post("/api/predict-from-location", response_model=PredictionResponse)
async def predict_from_location(
    request: ImagePatchRequest,
    loader: ModelLoader = Depends(get_model_loader),
    extractor: FeatureExtractor = Depends(get_feature_extractor)
):
    """
    Make prediction from geographic coordinates by fetching Sentinel-2 imagery.

    This endpoint requires Google Earth Engine credentials to be configured.
    """
    try:
        # Check if GEE is available
        if not extractor.check_gee_connection():
            raise HTTPException(
                status_code=503,
                detail="Google Earth Engine not available. Use /api/predict with pre-extracted features instead."
            )

        # Fetch satellite imagery and extract features
        features = extractor.extract_features_from_coordinates(
            latitude=request.latitude,
            longitude=request.longitude,
            patch_size=request.patch_size,
            date_start=request.date_start,
            date_end=request.date_end
        )

        if features is None:
            raise HTTPException(
                status_code=404,
                detail="No satellite imagery available for the requested location and date range."
            )

        # Make prediction
        features_array = np.array(features).reshape(1, -1)
        prediction, probability = loader.predict(features_array)

        # Determine confidence level
        confidence = "high" if probability > 0.8 else "medium" if probability > 0.5 else "low"

        return PredictionResponse(
            prediction=int(prediction[0]),
            probability=float(probability[0]),
            confidence=confidence,
            features_used=None,  # Don't send raw features for this endpoint
            timestamp=datetime.utcnow().isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Location-based prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# Batch prediction endpoint
@app.post("/api/predict-batch")
async def predict_batch(
    requests: List[PredictionRequest],
    loader: ModelLoader = Depends(get_model_loader)
):
    """
    Make batch predictions for multiple feature vectors.

    More efficient than calling /api/predict multiple times.
    """
    try:
        if len(requests) > 100:
            raise HTTPException(
                status_code=400,
                detail="Batch size too large. Maximum 100 predictions per request."
            )

        # Convert all feature vectors to numpy array
        features_array = np.array([req.features for req in requests])

        # Make batch prediction
        predictions, probabilities = loader.predict(features_array)

        # Format results
        results = []
        for i, (pred, prob) in enumerate(zip(predictions, probabilities)):
            confidence = "high" if prob > 0.8 else "medium" if prob > 0.5 else "low"
            results.append({
                "index": i,
                "prediction": int(pred),
                "probability": float(prob),
                "confidence": confidence
            })

        return {
            "total_predictions": len(results),
            "results": results,
            "timestamp": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Healthcare Facility Finder ML Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "model_info": "/api/model/info",
            "predict": "/api/predict",
            "predict_from_location": "/api/predict-from-location",
            "predict_batch": "/api/predict-batch"
        }
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("ML_SERVICE_PORT", 5001))
    uvicorn.run(app, host="0.0.0.0", port=port)
