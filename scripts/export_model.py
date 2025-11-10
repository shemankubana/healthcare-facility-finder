#!/usr/bin/env python3
"""
Export trained ML model from Jupyter notebook to ML service

This script extracts the trained Random Forest model and StandardScaler
from the capstoneNotebook.ipynb and exports them to the ML service models directory.
"""

import pickle
import sys
import subprocess
import json
from pathlib import Path
import numpy as np

def extract_model_from_notebook():
    """
    Extract the trained model by executing the notebook cells that train it.
    This requires the notebook to have been run and the model variables to be available.
    """
    print("=" * 80)
    print("EXPORTING ML MODEL FROM NOTEBOOK")
    print("=" * 80)
    print()

    # Try to load from a previously saved model in the notebook
    potential_paths = [
        Path("models/healthcare_model.pkl"),
        Path("../ml-service/models/healthcare_model.pkl"),
        Path("ml-service/models/healthcare_model.pkl"),
    ]

    print("🔍 Checking for existing model exports...")
    for path in potential_paths:
        if path.exists():
            print(f"✅ Found existing model at: {path}")
            return path

    print("⚠️  No pre-exported model found.")
    print()
    print("=" * 80)
    print("INSTRUCTIONS TO EXPORT MODEL")
    print("=" * 80)
    print()
    print("To export your trained model, add this cell to your notebook AFTER training:")
    print()
    print("```python")
    print("# ============================================================================")
    print("# EXPORT MODEL TO ML SERVICE")
    print("# ============================================================================")
    print("import pickle")
    print("from pathlib import Path")
    print("from datetime import datetime")
    print()
    print("# Ensure you have these variables from training:")
    print("# - rf: your trained RandomForestClassifier")
    print("# - scaler: your fitted StandardScaler (if used)")
    print("# - X_train, X_test, y_train, y_test: your train/test data")
    print()
    print("# Package model and metadata")
    print("model_data = {")
    print("    'model': rf,  # Your trained Random Forest")
    print("    'scaler': StandardScaler().fit(X_train),  # Create scaler if not exists")
    print("    'version': '1.0.0',")
    print("    'accuracy': rf.score(X_test, y_test),")
    print("    'trained_on': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),")
    print("    'model_type': 'RandomForestClassifier',")
    print("    'n_estimators': rf.n_estimators,")
    print("    'max_depth': rf.max_depth,")
    print("    'class_weight': rf.class_weight,")
    print("    'feature_names': [")
    print("        'R_mean', 'R_std',")
    print("        'G_mean', 'G_std',")
    print("        'B_mean', 'B_std',")
    print("        'NDVI_mean', 'NDVI_std',")
    print("        'Built_mean', 'Built_std',")
    print("        'Brightness_mean', 'Brightness_std'")
    print("    ],")
    print("    'training_samples': len(X_train),")
    print("    'test_samples': len(X_test),")
    print("    'classes': ['Non-built', 'Built-up']")
    print("}")
    print()
    print("# Create output directory")
    print("output_path = Path('../ml-service/models')")
    print("output_path.mkdir(parents=True, exist_ok=True)")
    print()
    print("# Save model")
    print("model_file = output_path / 'healthcare_model.pkl'")
    print("with open(model_file, 'wb') as f:")
    print("    pickle.dump(model_data, f)")
    print()
    print("# Verify export")
    print("file_size_mb = model_file.stat().st_size / (1024 * 1024)")
    print("print(f'\\n✅ MODEL EXPORTED SUCCESSFULLY!')")
    print("print(f'📁 Location: {model_file.absolute()}')")
    print("print(f'📊 File size: {file_size_mb:.2f} MB')")
    print("print(f'🎯 Accuracy: {model_data[\"accuracy\"]:.4f}')")
    print("```")
    print()
    print("=" * 80)
    print()
    print("After running that cell in your notebook, the model will be exported to:")
    print("  ml-service/models/healthcare_model.pkl")
    print()
    return None


# Dummy model creation removed - use train_model.py instead


def main():
    """Main export process"""
    print("\n🤖 Healthcare Facility Finder - Model Export Tool\n")

    # Try to find existing model
    existing_model = extract_model_from_notebook()

    if existing_model:
        print(f"\n✅ Model ready at: {existing_model}")
        return 0

    print("\n" + "=" * 80)
    print("NO MODEL FOUND")
    print("=" * 80)
    print()
    print("To train a model, use one of these methods:")
    print()
    print("1. Run the training script (RECOMMENDED):")
    print("   python train_model.py")
    print()
    print("2. Run the export cell in your Jupyter notebook:")
    print("   Open the notebook and run the model export cell shown above")
    print()
    print("❌ No dummy/fallback models available - you must train a real model.")
    print()
    return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nCancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
