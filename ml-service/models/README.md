# ML Models Directory

This directory should contain the trained machine learning models for healthcare facility detection.

## Required Model File

**File:** `healthcare_model.pkl`

This pickle file must contain:
```python
{
    'model': trained_random_forest_classifier,
    'scaler': fitted_standard_scaler,
    'version': '1.0.0',  # optional
    'accuracy': 0.99      # optional
}
```

## Exporting Model from Jupyter Notebook

To export your trained model from `capstoneNotebook.ipynb`:

### Method 1: Using Jupyter Notebook

Add this cell at the end of your training notebook:

```python
import pickle
from pathlib import Path

# Assuming you have:
# - model: your trained RandomForestClassifier
# - scaler: your fitted StandardScaler

# Create models directory if it doesn't exist
models_dir = Path("../ml-service/models")
models_dir.mkdir(parents=True, exist_ok=True)

# Package model and scaler
model_data = {
    'model': model,
    'scaler': scaler,
    'version': '1.0.0',
    'accuracy': 0.99,  # Replace with your actual test accuracy
    'trained_on': '2025-11-07',
    'features': [
        'R_mean', 'R_std',
        'G_mean', 'G_std',
        'B_mean', 'B_std',
        'NDVI_mean', 'NDVI_std',
        'Built_mean', 'Built_std',
        'Brightness_mean', 'Brightness_std'
    ]
}

# Save to file
model_path = models_dir / "healthcare_model.pkl"
with open(model_path, 'wb') as f:
    pickle.dump(model_data, f)

print(f"✅ Model exported successfully to {model_path}")
print(f"   Model type: {model.__class__.__name__}")
print(f"   File size: {model_path.stat().st_size / 1024 / 1024:.2f} MB")
```

### Method 2: Using Python Script

Create a script `export_model.py`:

```python
#!/usr/bin/env python3
"""Export trained model from notebook"""

import pickle
from pathlib import Path

def export_model(model, scaler, output_path="../ml-service/models/healthcare_model.pkl"):
    """Export model and scaler to pickle file"""

    model_data = {
        'model': model,
        'scaler': scaler,
        'version': '1.0.0',
        'accuracy': getattr(model, 'score_', None)
    }

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'wb') as f:
        pickle.dump(model_data, f)

    print(f"✅ Model exported to {output_path}")
    return output_path

if __name__ == "__main__":
    # Load your trained model here
    # Example:
    # from your_training_script import model, scaler
    # export_model(model, scaler)
    pass
```

## Model Requirements

### Model Type
- **RandomForestClassifier** from scikit-learn
- Trained for binary classification
- Input: 12 features
- Output: 0 (non-built) or 1 (built-up/healthcare)

### Required Components
1. **model**: Trained RandomForestClassifier instance
2. **scaler**: Fitted StandardScaler instance

The scaler is **critical** - it must be the same one used during training to normalize features.

### Feature Order (Must be exact)
1. R_mean - Mean of Red band
2. R_std - Std dev of Red band
3. G_mean - Mean of Green band
4. G_std - Std dev of Green band
5. B_mean - Mean of Blue band
6. B_std - Std dev of Blue band
7. NDVI_mean - Mean NDVI
8. NDVI_std - Std dev NDVI
9. Built_mean - Mean Built-up Index
10. Built_std - Std dev Built-up Index
11. Brightness_mean - Mean Brightness
12. Brightness_std - Std dev Brightness

## Testing the Exported Model

To verify your exported model works:

```python
import pickle
import numpy as np

# Load model
with open('healthcare_model.pkl', 'rb') as f:
    data = pickle.load(f)

model = data['model']
scaler = data['scaler']

# Test prediction with dummy features
test_features = np.random.rand(1, 12) * 100  # 12 random features
test_features_scaled = scaler.transform(test_features)
prediction = model.predict(test_features_scaled)
probability = model.predict_proba(test_features_scaled)

print(f"Prediction: {prediction[0]}")
print(f"Probability: {probability[0]}")
print("✅ Model loaded and tested successfully!")
```

## File Size

Expected model file size: **10-50 MB** depending on:
- Number of estimators (trees)
- Max depth
- Training data size

## Security

⚠️ **Important**: Model files are not committed to git (listed in .gitignore)

Reasons:
- Large file size
- May contain training data artifacts
- Should be versioned separately (MLflow, DVC, etc.)

## Deployment

When deploying to production:

1. **Local Development:**
   ```bash
   cp healthcare_model.pkl ml-service/models/
   ```

2. **Docker:**
   ```bash
   docker-compose up ml-service
   # Model will be mounted from ./ml-service/models
   ```

3. **Production:**
   - Upload model to cloud storage (S3, GCS, etc.)
   - Download on container startup
   - Or bake into Docker image (not recommended for large models)

## Versioning

Consider using a model registry:

- **MLflow**: Track experiments and versions
- **DVC**: Version control for ML models
- **Weights & Biases**: Experiment tracking
- **Cloud Storage**: S3/GCS with versioning enabled

Example versioning scheme:
```
healthcare_model_v1.0.0.pkl
healthcare_model_v1.1.0.pkl
healthcare_model_v2.0.0.pkl
```

## Troubleshooting

### Model file too large
- Reduce `n_estimators` in RandomForest
- Reduce `max_depth`
- Use `max_features` parameter
- Consider model compression

### Scaler missing
- Ensure you save the scaler used during training
- The scaler must be fit on training data, not test data

### Version mismatch
- Use same scikit-learn version for training and inference
- Check: `sklearn.__version__`

### Pickle errors
- Use protocol 4 or 5 for Python 3.8+
- Don't pickle across major Python versions

## Need Help?

See the main documentation:
- `/ML_INTEGRATION_PLAN.md` - Overall integration plan
- `/ml-service/README.md` - ML service documentation
- `/capstoneNotebook.ipynb` - Training notebook

---

**Status**: 🔴 No model file present
**Action**: Export model from training notebook using instructions above
