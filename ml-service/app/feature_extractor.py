"""
Feature Extractor for Sentinel-2 Satellite Imagery

Extracts 12-dimensional feature vectors from satellite imagery using Google Earth Engine.
"""

import numpy as np
from typing import Optional, List
import logging
import os

logger = logging.getLogger(__name__)

# Try to import Google Earth Engine
try:
    import ee
    GEE_AVAILABLE = True
except ImportError:
    GEE_AVAILABLE = False
    logger.warning("Google Earth Engine not available. Install with: pip install earthengine-api")


class FeatureExtractor:
    """Extracts features from Sentinel-2 satellite imagery"""

    def __init__(self):
        """Initialize feature extractor and authenticate with GEE if available"""
        self.gee_initialized = False

        if GEE_AVAILABLE:
            try:
                self._initialize_gee()
            except Exception as e:
                logger.warning(f"Failed to initialize Google Earth Engine: {e}")
                self.gee_initialized = False

    def _initialize_gee(self) -> None:
        """Initialize and authenticate Google Earth Engine"""
        try:
            # Try to initialize with existing credentials
            ee.Initialize()
            self.gee_initialized = True
            logger.info("✅ Google Earth Engine initialized successfully")
        except Exception as e:
            # Try to authenticate
            logger.info("Attempting GEE authentication...")
            try:
                # Check for service account credentials
                credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
                if credentials_path and os.path.exists(credentials_path):
                    credentials = ee.ServiceAccountCredentials(
                        email=None,  # Will be read from credentials file
                        key_file=credentials_path
                    )
                    ee.Initialize(credentials)
                    self.gee_initialized = True
                    logger.info("✅ Google Earth Engine initialized with service account")
                else:
                    # Try regular authentication
                    ee.Authenticate()
                    ee.Initialize()
                    self.gee_initialized = True
                    logger.info("✅ Google Earth Engine initialized with user authentication")
            except Exception as auth_error:
                logger.error(f"Failed to authenticate with Google Earth Engine: {auth_error}")
                self.gee_initialized = False

    def check_gee_connection(self) -> bool:
        """Check if Google Earth Engine is available and initialized"""
        return GEE_AVAILABLE and self.gee_initialized

    def extract_features_from_coordinates(
        self,
        latitude: float,
        longitude: float,
        patch_size: int = 256,
        date_start: str = "2025-01-01",
        date_end: str = "2025-09-30"
    ) -> Optional[List[float]]:
        """
        Extract 12-dimensional feature vector from satellite imagery at given coordinates.

        Args:
            latitude: Latitude in decimal degrees
            longitude: Longitude in decimal degrees
            patch_size: Size of image patch in pixels (default: 256)
            date_start: Start date for imagery (ISO format)
            date_end: End date for imagery (ISO format)

        Returns:
            List of 12 features: [R_mean, R_std, G_mean, G_std, B_mean, B_std,
                                  NDVI_mean, NDVI_std, Built_mean, Built_std,
                                  Brightness_mean, Brightness_std]
            Returns None if imagery not available or extraction fails.
        """
        if not self.check_gee_connection():
            raise RuntimeError("Google Earth Engine not available")

        try:
            # Create point geometry
            point = ee.Geometry.Point([longitude, latitude])

            # Create region around point (approximate square in meters)
            # 256 pixels at 10m resolution = 2560m
            buffer_meters = (patch_size * 10) / 2
            region = point.buffer(buffer_meters).bounds()

            # Get Sentinel-2 imagery
            sentinel2 = (
                ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                .filterBounds(point)
                .filterDate(date_start, date_end)
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
            )

            # Check if any images available
            count = sentinel2.size().getInfo()
            if count == 0:
                logger.warning(f"No Sentinel-2 imagery available for location ({latitude}, {longitude})")
                return None

            # Create median composite
            composite = sentinel2.median()

            # Select bands: B4=Red, B3=Green, B2=Blue, B8=NIR
            image = composite.select(['B4', 'B3', 'B2', 'B8'])

            # Calculate indices
            # NDVI = (NIR - Red) / (NIR + Red)
            ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')

            # Built-up Index = (Red + Green)/2 - NIR
            built_index = (
                image.select('B4').add(image.select('B3')).divide(2)
                .subtract(image.select('B8'))
                .rename('Built')
            )

            # Brightness = (Red + Green + Blue)/3
            brightness = (
                image.select('B4').add(image.select('B3')).add(image.select('B2'))
                .divide(3)
                .rename('Brightness')
            )

            # Combine all bands
            feature_image = image.addBands([ndvi, built_index, brightness])

            # Calculate statistics over region
            stats = feature_image.reduceRegion(
                reducer=ee.Reducer.mean().combine(
                    reducer2=ee.Reducer.stdDev(),
                    sharedInputs=True
                ),
                geometry=region,
                scale=10,  # 10m resolution
                maxPixels=1e9
            ).getInfo()

            # Extract features in correct order
            features = [
                stats.get('B4_mean', 0),      # R_mean
                stats.get('B4_stdDev', 0),    # R_std
                stats.get('B3_mean', 0),      # G_mean
                stats.get('B3_stdDev', 0),    # G_std
                stats.get('B2_mean', 0),      # B_mean
                stats.get('B2_stdDev', 0),    # B_std
                stats.get('NDVI_mean', 0),    # NDVI_mean
                stats.get('NDVI_stdDev', 0),  # NDVI_std
                stats.get('Built_mean', 0),   # Built_mean
                stats.get('Built_stdDev', 0), # Built_std
                stats.get('Brightness_mean', 0),    # Brightness_mean
                stats.get('Brightness_stdDev', 0),  # Brightness_std
            ]

            # Validate features (check for None or NaN)
            if any(f is None or np.isnan(f) for f in features):
                logger.warning(f"Invalid features extracted for location ({latitude}, {longitude})")
                return None

            return features

        except Exception as e:
            logger.error(f"Failed to extract features: {e}")
            return None

    def extract_features_from_image_patch(self, image_patch: np.ndarray) -> List[float]:
        """
        Extract features from a pre-loaded image patch array.

        Args:
            image_patch: numpy array of shape (height, width, bands) where bands are [R, G, B, NIR]

        Returns:
            List of 12 features
        """
        if image_patch.ndim != 3 or image_patch.shape[2] < 4:
            raise ValueError("Image patch must have shape (height, width, 4) with R, G, B, NIR bands")

        # Extract bands
        red = image_patch[:, :, 0].astype(float)
        green = image_patch[:, :, 1].astype(float)
        blue = image_patch[:, :, 2].astype(float)
        nir = image_patch[:, :, 3].astype(float)

        # Calculate NDVI
        ndvi = (nir - red) / (nir + red + 0.0001)

        # Calculate built-up index
        built_index = (red + green) / 2 - nir

        # Calculate brightness
        brightness = (red + green + blue) / 3

        # Extract statistics
        features = [
            np.mean(red), np.std(red),
            np.mean(green), np.std(green),
            np.mean(blue), np.std(blue),
            np.mean(ndvi), np.std(ndvi),
            np.mean(built_index), np.std(built_index),
            np.mean(brightness), np.std(brightness)
        ]

        return features
