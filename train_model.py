#!/usr/bin/env python3
"""
Healthcare Facility Finder - Model Training Script

This script trains a Random Forest model to classify healthcare facilities
and built-up areas from satellite imagery (Sentinel-2).

Usage:
    python train_model.py

Requirements:
    - sentinel.tif: Sentinel-2 imagery file in project root
    - labels.tif: Label data (ESA WorldCover or similar) in project root
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler
from sklearn.utils.class_weight import compute_class_weight
import pickle
from pathlib import Path
import sys
import warnings
from datetime import datetime

warnings.filterwarnings('ignore')


class ModelTrainer:
    """Handles the complete model training pipeline"""

    def __init__(self, sentinel_path='sentinel.tif', label_path='labels.tif'):
        self.sentinel_path = Path(sentinel_path)
        self.label_path = Path(label_path)
        self.model = None
        self.scaler = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None

    def load_data(self):
        """Load satellite imagery and label data"""
        try:
            import rasterio
        except ImportError:
            print("ERROR: rasterio not installed. Run: pip install rasterio")
            sys.exit(1)

        if not self.sentinel_path.exists():
            raise FileNotFoundError(
                f"Sentinel imagery not found at: {self.sentinel_path}\n"
                f"Please download the data first."
            )

        if not self.label_path.exists():
            raise FileNotFoundError(
                f"Label data not found at: {self.label_path}\n"
                f"Please download the data first."
            )

        print("Loading satellite imagery...")
        with rasterio.open(self.sentinel_path) as src:
            sentinel = src.read()
            self.sentinel_meta = src.meta

        print("Loading label data...")
        with rasterio.open(self.label_path) as src:
            labels = src.read()
            self.label_meta = src.meta

        print(f"✓ Sentinel shape: {sentinel.shape}")
        print(f"✓ Labels shape: {labels.shape}")

        return sentinel, labels

    def extract_features(self, image_patch):
        """
        Extract features from a satellite image patch

        Features extracted:
        - RGB statistics (mean, std)
        - NDVI statistics (mean, std)
        - Built-up index statistics (mean, std)
        - Brightness statistics (mean, std)
        """
        features = []

        # RGB bands
        red = image_patch[:, :, 0]
        green = image_patch[:, :, 1]
        blue = image_patch[:, :, 2]

        features.append(np.mean(red))
        features.append(np.std(red))
        features.append(np.mean(green))
        features.append(np.std(green))
        features.append(np.mean(blue))
        features.append(np.std(blue))

        # NIR band if available
        if image_patch.shape[2] >= 4:
            nir = image_patch[:, :, 3]

            # NDVI: Vegetation Index
            ndvi = (nir - red) / (nir + red + 0.0001)
            features.append(np.mean(ndvi))
            features.append(np.std(ndvi))

            # Built-up Index
            built_up = (red + green) / 2 - nir
            features.append(np.mean(built_up))
            features.append(np.std(built_up))
        else:
            # If no NIR band, add zeros
            features.extend([0, 0, 0, 0])

        # Overall brightness
        brightness = (red + green + blue) / 3
        features.append(np.mean(brightness))
        features.append(np.std(brightness))

        return np.array(features)

    def prepare_training_data(self, sentinel, labels, patch_size=256, stride=128):
        """
        Convert satellite imagery to training data (features and labels)

        Args:
            sentinel: Satellite imagery array
            labels: Label data array
            patch_size: Size of each patch (default: 256)
            stride: Step size between patches (default: 128 for 50% overlap)
        """
        print(f"\nPreparing training data (patch size: {patch_size}x{patch_size}, stride: {stride})...")

        # Convert sentinel to HWC format - USE ALL 4 BANDS (R, G, B, NIR)
        if sentinel.shape[0] < sentinel.shape[-1]:  # CHW format
            # Use first 4 bands: RGB + NIR (Sentinel-2 bands 4,3,2,8)
            sentinel = np.moveaxis(sentinel[:4], 0, -1)

        # Resize labels to match sentinel dimensions if needed
        if labels.shape[1:] != sentinel.shape[:2]:
            from skimage.transform import resize
            labels_resized = resize(
                labels[0],
                (sentinel.shape[0], sentinel.shape[1]),
                order=0,
                preserve_range=True,
                anti_aliasing=False
            ).astype(np.uint8)
        else:
            labels_resized = labels[0] if len(labels.shape) == 3 else labels

        # Calculate number of patches with stride (overlapping)
        height, width = sentinel.shape[0], sentinel.shape[1]
        num_patches_height = (height - patch_size) // stride + 1
        num_patches_width = (width - patch_size) // stride + 1

        total_patches = num_patches_height * num_patches_width
        print(f"Processing {total_patches} overlapping patches...")

        X = []
        y = []

        for i in range(num_patches_height):
            for j in range(num_patches_width):
                # Extract patch using stride
                row_start = i * stride
                row_end = row_start + patch_size
                col_start = j * stride
                col_end = col_start + patch_size

                # Ensure we don't go out of bounds
                if row_end > height or col_end > width:
                    continue

                patch = sentinel[row_start:row_end, col_start:col_end, :]

                # Extract features from this patch
                features = self.extract_features(patch)
                X.append(features)

                # Get label for patch (class 50 = built-up in WorldCover)
                patch_label = labels_resized[row_start:row_end, col_start:col_end]
                # If more than 20% of patch is built-up, mark as 1 (lowered threshold)
                built_up_pixels = np.sum(patch_label == 50)
                if built_up_pixels > (patch_size * patch_size * 0.2):
                    y.append(1)  # Built-up / Healthcare facility
                else:
                    y.append(0)  # Not built-up

        X = np.array(X)
        y = np.array(y)

        print(f"\n✓ Created {len(X)} training samples")
        print(f"  Features per sample: {X.shape[1]}")
        print(f"  Built-up samples: {np.sum(y)} ({np.sum(y)/len(y)*100:.1f}%)")
        print(f"  Non-built-up samples: {len(y) - np.sum(y)} ({(len(y)-np.sum(y))/len(y)*100:.1f}%)")

        return X, y

    def train_model(self, X, y, test_size=0.2):
        """Train the Random Forest model"""
        print("\n" + "="*70)
        print("TRAINING RANDOM FOREST MODEL")
        print("="*70)

        # Validate we have enough samples
        min_samples = 50
        if len(X) < min_samples:
            raise ValueError(
                f"Insufficient training data: {len(X)} samples found, need at least {min_samples}.\n"
                f"Try reducing patch_size or stride in prepare_training_data()."
            )

        # Check class balance
        unique, counts = np.unique(y, return_counts=True)
        print(f"\nClass distribution:")
        for cls, count in zip(unique, counts):
            print(f"  Class {cls}: {count} samples ({count/len(y)*100:.1f}%)")

        # Ensure both classes have at least 2 samples for stratified split
        if len(unique) < 2 or min(counts) < 2:
            print("\nWARNING: Insufficient samples for stratified split. Using random split.")
            stratify_param = None
        else:
            stratify_param = y

        # Split data
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=stratify_param
        )

        print(f"\nTraining samples: {len(self.X_train)}")
        print(f"Testing samples: {len(self.X_test)}")

        # Calculate class weights to handle imbalanced data
        class_weights = compute_class_weight(
            'balanced',
            classes=np.unique(self.y_train),
            y=self.y_train
        )
        class_weight_dict = {0: class_weights[0], 1: class_weights[1]}

        print(f"\nClass weights: {class_weight_dict}")

        # Normalize features
        print("\nNormalizing features...")
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(self.X_train)
        X_test_scaled = self.scaler.transform(self.X_test)

        # Create and train model
        print("\nTraining Random Forest (this may take a few minutes)...")
        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=10,
            min_samples_leaf=5,
            class_weight=class_weight_dict,
            random_state=42,
            n_jobs=-1,
            verbose=1
        )

        self.model.fit(X_train_scaled, self.y_train)

        # Make predictions
        print("\nEvaluating model...")
        y_pred = self.model.predict(X_test_scaled)
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]

        # Performance metrics
        accuracy = accuracy_score(self.y_test, y_pred)
        conf_matrix = confusion_matrix(self.y_test, y_pred)
        class_report = classification_report(
            self.y_test, y_pred, target_names=['Non-built', 'Built-up']
        )

        print("\n" + "="*70)
        print("MODEL PERFORMANCE")
        print("="*70)
        print(f"\nOverall Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
        print(f"\nClassification Report:\n{class_report}")

        # Confusion Matrix
        print("\nConfusion Matrix:")
        print(f"{'':>15} {'Predicted Non-built':>20} {'Predicted Built-up':>20}")
        print(f"{'Actual Non-built':<15} {conf_matrix[0,0]:>20} {conf_matrix[0,1]:>20}")
        print(f"{'Actual Built-up':<15} {conf_matrix[1,0]:>20} {conf_matrix[1,1]:>20}")

        return {
            'accuracy': accuracy,
            'confusion_matrix': conf_matrix,
            'y_test': self.y_test,
            'y_pred': y_pred,
            'y_pred_proba': y_pred_proba
        }

    def visualize_results(self, results):
        """Visualize model performance"""
        print("\nGenerating visualizations...")

        fig, axes = plt.subplots(1, 2, figsize=(15, 5))

        # Confusion Matrix
        sns.heatmap(
            results['confusion_matrix'],
            annot=True,
            fmt='d',
            cmap='Blues',
            xticklabels=['Non-built', 'Built-up'],
            yticklabels=['Non-built', 'Built-up'],
            ax=axes[0]
        )
        axes[0].set_title('Confusion Matrix')
        axes[0].set_ylabel('True Label')
        axes[0].set_xlabel('Predicted Label')

        # Feature Importance
        feature_names = [
            'R_mean', 'R_std',
            'G_mean', 'G_std',
            'B_mean', 'B_std',
            'NDVI_mean', 'NDVI_std',
            'Built_mean', 'Built_std',
            'Brightness_mean', 'Brightness_std'
        ]
        importance = self.model.feature_importances_

        axes[1].barh(feature_names, importance)
        axes[1].set_title('Feature Importance')
        axes[1].set_xlabel('Importance')

        plt.tight_layout()

        # Save figure
        output_dir = Path('outputs/figures')
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f'model_performance_{datetime.now().strftime("%Y%m%d_%H%M%S")}.png'
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        print(f"✓ Visualization saved to: {output_path}")

        plt.show()

    def save_model(self, output_path='ml-service/models/healthcare_model.pkl'):
        """Save the trained model"""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        print(f"\nSaving model to: {output_path}")

        # Package model and metadata
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'version': '1.0.0',
            'accuracy': accuracy_score(self.y_test, self.model.predict(self.scaler.transform(self.X_test))),
            'trained_on': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'model_type': 'RandomForestClassifier',
            'n_estimators': self.model.n_estimators,
            'max_depth': self.model.max_depth,
            'class_weight': self.model.class_weight,
            'feature_names': [
                'R_mean', 'R_std',
                'G_mean', 'G_std',
                'B_mean', 'B_std',
                'NDVI_mean', 'NDVI_std',
                'Built_mean', 'Built_std',
                'Brightness_mean', 'Brightness_std'
            ],
            'training_samples': len(self.X_train),
            'test_samples': len(self.X_test),
            'classes': ['Non-built', 'Built-up']
        }

        with open(output_path, 'wb') as f:
            pickle.dump(model_data, f)

        file_size_mb = output_path.stat().st_size / (1024 * 1024)

        print(f"\n{'='*70}")
        print("MODEL SAVED SUCCESSFULLY!")
        print(f"{'='*70}")
        print(f"📁 Location: {output_path.absolute()}")
        print(f"📊 File size: {file_size_mb:.2f} MB")
        print(f"🎯 Accuracy: {model_data['accuracy']:.4f}")
        print(f"📅 Trained on: {model_data['trained_on']}")
        print(f"{'='*70}\n")


def main():
    """Main training pipeline"""
    print("\n" + "="*70)
    print("HEALTHCARE FACILITY FINDER - MODEL TRAINING")
    print("="*70 + "\n")

    # Initialize trainer
    trainer = ModelTrainer(
        sentinel_path='sentinel.tif',
        label_path='labels.tif'
    )

    # Load data
    try:
        sentinel, labels = trainer.load_data()
    except FileNotFoundError as e:
        print(f"\nERROR: {e}")
        print("\nPlease ensure you have downloaded the required data files:")
        print("  1. sentinel.tif - Sentinel-2 satellite imagery")
        print("  2. labels.tif - Label data (ESA WorldCover)")
        print("\nYou can download these from Google Earth Engine or use the notebook export.")
        return 1
    except Exception as e:
        print(f"\nERROR loading data: {e}")
        return 1

    # Prepare training data with smaller stride for more samples
    try:
        X, y = trainer.prepare_training_data(sentinel, labels, patch_size=128, stride=64)
    except Exception as e:
        print(f"\nERROR preparing training data: {e}")
        return 1

    # Train model
    try:
        results = trainer.train_model(X, y)
    except Exception as e:
        print(f"\nERROR training model: {e}")
        return 1

    # Visualize results
    try:
        trainer.visualize_results(results)
    except Exception as e:
        print(f"\nWARNING: Could not generate visualizations: {e}")

    # Save model
    try:
        trainer.save_model()
    except Exception as e:
        print(f"\nERROR saving model: {e}")
        return 1

    print("✅ Training complete! Model is ready for use.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
