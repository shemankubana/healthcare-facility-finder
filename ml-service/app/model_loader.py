"""
Model Loader for Random Forest Healthcare Facility Detection

Handles loading and managing the trained Random Forest model and StandardScaler.
"""

import pickle
import numpy as np
from pathlib import Path
from datetime import datetime
import logging
from typing import Tuple, Dict, Any, Optional

logger = logging.getLogger(__name__)


class ModelLoader:
    """Loads and manages ML model and scaler for predictions"""

    def __init__(self, model_path: str):
        """
        Initialize model loader.

        Args:
            model_path: Path to pickled model file containing {'model': rf_model, 'scaler': scaler}
        """
        self.model_path = Path(model_path)
        self.model = None
        self.scaler = None
        self.loaded_at = None
        self.model_info = {}

    def load_model(self) -> None:
        """
        Load the trained model and scaler from pickle file.

        Raises:
            FileNotFoundError: If model file doesn't exist
            Exception: If model loading fails
        """
        if not self.model_path.exists():
            error_msg = f"Model file not found at {self.model_path}"
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)

        try:
            logger.info(f"Loading model from {self.model_path}")

            with open(self.model_path, 'rb') as f:
                model_data = pickle.load(f)

            # Extract model and scaler
            self.model = model_data.get('model')
            self.scaler = model_data.get('scaler')

            if self.model is None:
                raise ValueError("No 'model' key found in pickle file")
            if self.scaler is None:
                raise ValueError("No 'scaler' key found in pickle file")

            # Extract model metadata
            self._extract_model_info(model_data)

            self.loaded_at = datetime.utcnow().isoformat()
            logger.info(f"✅ Model loaded successfully: {self.model.__class__.__name__}")

        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def _extract_model_info(self, model_data: Dict[str, Any]) -> None:
        """Extract metadata about the model"""
        self.model_info = {
            "model_type": self.model.__class__.__name__,
            "version": model_data.get("version", "1.0.0"),
            "accuracy": model_data.get("accuracy"),
            "n_estimators": getattr(self.model, 'n_estimators', None),
            "max_depth": getattr(self.model, 'max_depth', None),
            "input_features": 12,  # Fixed for this model
            "feature_names": [
                "R_mean", "R_std",
                "G_mean", "G_std",
                "B_mean", "B_std",
                "NDVI_mean", "NDVI_std",
                "Built_mean", "Built_std",
                "Brightness_mean", "Brightness_std"
            ],
            "last_loaded": self.loaded_at
        }

    def predict(self, features: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Make predictions on feature array.

        Args:
            features: numpy array of shape (n_samples, 12) with feature values

        Returns:
            Tuple of (predictions, probabilities)
            - predictions: array of shape (n_samples,) with class predictions (0 or 1)
            - probabilities: array of shape (n_samples,) with probability of positive class

        Raises:
            ValueError: If model not loaded or features have wrong shape
        """
        if not self.is_loaded():
            raise ValueError("Model not loaded. Call load_model() first.")

        if features.shape[1] != 12:
            raise ValueError(f"Expected 12 features, got {features.shape[1]}")

        try:
            # Normalize features using scaler
            features_scaled = self.scaler.transform(features)

            # Make predictions
            predictions = self.model.predict(features_scaled)

            # Get probability estimates (probability of class 1)
            probabilities = self.model.predict_proba(features_scaled)[:, 1]

            return predictions, probabilities

        except Exception as e:
            logger.error(f"Prediction error: {e}")
            raise

    def is_loaded(self) -> bool:
        """Check if model is loaded and ready"""
        return self.model is not None and self.scaler is not None

    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model"""
        if not self.is_loaded():
            raise ValueError("Model not loaded")

        return {
            **self.model_info,
            "last_loaded": self.loaded_at
        }

    def reload_model(self) -> None:
        """Reload the model from disk"""
        logger.info("Reloading model...")
        self.model = None
        self.scaler = None
        self.load_model()
