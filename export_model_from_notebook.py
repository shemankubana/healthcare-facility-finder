#!/usr/bin/env python3
"""
Export trained ML model from notebook to ML service directory

This script should be run after training the model in capstoneNotebook.ipynb.
It extracts the model and scaler and saves them in the format expected by the ML service.

Usage:
    # Option 1: Add as final cell in notebook
    # Option 2: Run standalone after training
    python export_model_from_notebook.py
"""

import pickle
from pathlib import Path
from datetime import datetime
import sys

def export_model_from_globals(model, scaler, accuracy=None, output_dir='ml-service/models'):
    """
    Export model and scaler to pickle file for ML service

    Args:
        model: Trained RandomForestClassifier
        scaler: Fitted StandardScaler
        accuracy: Model accuracy score (optional)
        output_dir: Directory to save model (default: ml-service/models)

    Returns:
        Path to saved model file
    """
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Get model metadata
    model_type = model.__class__.__name__
    n_estimators = getattr(model, 'n_estimators', None)
    max_depth = getattr(model, 'max_depth', None)

    # Package model data
    model_data = {
        'model': model,
        'scaler': scaler,
        'version': '1.0.0',
        'accuracy': accuracy if accuracy is not None else 'unknown',
        'trained_on': datetime.now().strftime('%Y-%m-%d'),
        'model_type': model_type,
        'n_estimators': n_estimators,
        'max_depth': max_depth,
        'feature_names': [
            'R_mean', 'R_std',
            'G_mean', 'G_std',
            'B_mean', 'B_std',
            'NDVI_mean', 'NDVI_std',
            'Built_mean', 'Built_std',
            'Brightness_mean', 'Brightness_std'
        ]
    }

    # Save model
    model_file = output_path / 'healthcare_model.pkl'
    with open(model_file, 'wb') as f:
        pickle.dump(model_data, f)

    file_size = model_file.stat().st_size / (1024 * 1024)  # MB

    print("=" * 70)
    print("MODEL EXPORT SUCCESSFUL")
    print("=" * 70)
    print(f"✅ Model exported to: {model_file}")
    print(f"   File size: {file_size:.2f} MB")
    print(f"   Model type: {model_type}")
    if n_estimators:
        print(f"   Estimators: {n_estimators}")
    if max_depth:
        print(f"   Max depth: {max_depth}")
    print(f"   Accuracy: {accuracy if accuracy else 'Not provided'}")
    print(f"   Trained: {model_data['trained_on']}")
    print()
    print("Next steps:")
    print("1. Verify model file exists: ls -lh ml-service/models/")
    print("2. Test ML service: cd ml-service && uvicorn app.main:app --reload --port 5001")
    print("3. Enable in backend: Set ML_ENABLED=true in backend/.env")
    print("=" * 70)

    return model_file


def export_from_notebook_variables():
    """
    For use when running as standalone script with notebook variables in scope
    This requires running from within a notebook environment
    """
    try:
        # Try to get model and scaler from global scope
        # This works when run as a cell in the notebook
        import __main__

        if not hasattr(__main__, 'model'):
            print("❌ Error: 'model' variable not found in notebook scope")
            print()
            print("Please ensure you have:")
            print("1. Run the training cells in capstoneNotebook.ipynb")
            print("2. Variables 'model' and 'scaler' exist in notebook scope")
            print()
            print("Or use this code directly in a notebook cell:")
            print("""
# Add this cell to your notebook after training:
import pickle
from pathlib import Path

model_data = {
    'model': model,
    'scaler': scaler,
    'version': '1.0.0',
    'accuracy': accuracy,  # or your accuracy variable
    'trained_on': '2025-11-08',
    'feature_names': [
        'R_mean', 'R_std', 'G_mean', 'G_std',
        'B_mean', 'B_std', 'NDVI_mean', 'NDVI_std',
        'Built_mean', 'Built_std', 'Brightness_mean', 'Brightness_std'
    ]
}

output_path = Path('ml-service/models')
output_path.mkdir(parents=True, exist_ok=True)

with open(output_path / 'healthcare_model.pkl', 'wb') as f:
    pickle.dump(model_data, f)

print("✅ Model exported to ml-service/models/healthcare_model.pkl")
            """)
            return None

        model = __main__.model
        scaler = __main__.scaler
        accuracy = getattr(__main__, 'accuracy', None)

        return export_model_from_globals(model, scaler, accuracy)

    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        print("This script must be run from within a notebook environment")
        print("or after the model and scaler variables are defined.")
        return None


# Notebook cell template for easy copy-paste
NOTEBOOK_CELL_TEMPLATE = '''
# ============================================================================
# MODEL EXPORT CELL - Add this to your notebook after training
# ============================================================================

import pickle
from pathlib import Path
from datetime import datetime

# Package model and scaler
model_data = {
    'model': rf,  # or 'model' depending on your variable name
    'scaler': scaler,
    'version': '1.0.0',
    'accuracy': accuracy_score(y_test, y_pred),  # Use your actual accuracy
    'trained_on': datetime.now().strftime('%Y-%m-%d'),
    'model_type': 'RandomForestClassifier',
    'n_estimators': rf.n_estimators,
    'max_depth': rf.max_depth,
    'feature_names': [
        'R_mean', 'R_std',
        'G_mean', 'G_std',
        'B_mean', 'B_std',
        'NDVI_mean', 'NDVI_std',
        'Built_mean', 'Built_std',
        'Brightness_mean', 'Brightness_std'
    ]
}

# Create output directory
output_path = Path('../ml-service/models')  # Adjust path if needed
output_path.mkdir(parents=True, exist_ok=True)

# Save model
model_file = output_path / 'healthcare_model.pkl'
with open(model_file, 'wb') as f:
    pickle.dump(model_data, f)

# Confirmation
file_size = model_file.stat().st_size / (1024 * 1024)
print("=" * 70)
print("✅ MODEL EXPORTED SUCCESSFULLY")
print("=" * 70)
print(f"Location: {model_file}")
print(f"Size: {file_size:.2f} MB")
print(f"Accuracy: {model_data['accuracy']:.4f}")
print(f"Estimators: {model_data['n_estimators']}")
print(f"Max depth: {model_data['max_depth']}")
print("=" * 70)

# Verify export by loading
with open(model_file, 'rb') as f:
    loaded = pickle.load(f)
    print("✅ Verification: Model loads successfully")
    print(f"   Model type: {loaded['model'].__class__.__name__}")
    print(f"   Features: {len(loaded['feature_names'])}")
'''


def save_notebook_cell_template():
    """Save the notebook cell template to a file"""
    template_file = Path('notebook_export_cell.txt')
    with open(template_file, 'w') as f:
        f.write(NOTEBOOK_CELL_TEMPLATE)
    print(f"✅ Notebook cell template saved to: {template_file}")
    print()
    print("Copy the contents of this file and paste as a new cell in your notebook.")


if __name__ == '__main__':
    print()
    print("=" * 70)
    print("MODEL EXPORT UTILITY")
    print("=" * 70)
    print()
    print("This script helps export your trained model to the ML service.")
    print()
    print("Usage options:")
    print()
    print("1. RECOMMENDED: Add export cell to notebook")
    print("   Run: python export_model_from_notebook.py --save-template")
    print("   Then copy notebook_export_cell.txt contents into a new notebook cell")
    print()
    print("2. Run from notebook environment")
    print("   Add: %run export_model_from_notebook.py")
    print("   To a cell after training")
    print()
    print("=" * 70)

    if len(sys.argv) > 1 and sys.argv[1] == '--save-template':
        save_notebook_cell_template()
    else:
        print()
        print("Attempting to export from current environment...")
        print()
        export_from_notebook_variables()
