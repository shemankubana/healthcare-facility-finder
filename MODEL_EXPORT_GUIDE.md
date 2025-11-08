# Model Export Guide

This guide explains how to export your trained ML model from the Jupyter notebook to the ML service.

## Quick Start (Easiest Method)

### Option 1: Use the Notebook Cell (Recommended)

1. **Open the notebook**: `capstoneNotebook.ipynb`

2. **Train your model**: Run all cells up to Cell 37 (Enhanced Random Forest)

3. **Export the model**: Run the new export cell (Cell 44)
   - This cell automatically packages the model, scaler, and metadata
   - Saves to `ml-service/models/healthcare_model.pkl`
   - Verifies the export by loading and testing

4. **Done!** The model is now ready for use by the ML service

### Expected Output

```
================================================================================
EXPORTING MODEL TO ML SERVICE
================================================================================

✅ MODEL EXPORTED SUCCESSFULLY!

📁 Location: /path/to/ml-service/models/healthcare_model.pkl
📊 File size: 24.53 MB

📈 Model Details:
   - Type: RandomForestClassifier
   - Accuracy: 0.9893 (98.93%)
   - Estimators: 200
   - Max depth: 10
   - Training samples: 2247
   - Test samples: 562
   - Features: 12

🔍 Verifying export...
✅ Model loads correctly
✅ Can make predictions
   Sample prediction: 0 (probability: 0.998)

================================================================================
NEXT STEPS:
================================================================================
1. Start ML service:
   cd ml-service
   uvicorn app.main:app --reload --port 5001

2. Enable ML in backend:
   Set ML_ENABLED=true in backend/.env

3. Test ML endpoint:
   curl http://localhost:8080/api/ml/health
================================================================================
```

## Alternative Methods

### Option 2: Use Standalone Script

If you prefer to export after closing the notebook:

```bash
# Generate the template
python export_model_from_notebook.py --save-template

# This creates notebook_export_cell.txt
# Copy its contents into a new notebook cell
```

### Option 3: Manual Export

Add this code to a notebook cell:

```python
import pickle
from pathlib import Path

# Package model and scaler
model_data = {
    'model': rf,
    'scaler': scaler,
    'version': '1.0.0',
    'accuracy': accuracy_score(y_test, y_pred),
    'feature_names': [
        'R_mean', 'R_std', 'G_mean', 'G_std',
        'B_mean', 'B_std', 'NDVI_mean', 'NDVI_std',
        'Built_mean', 'Built_std', 'Brightness_mean', 'Brightness_std'
    ]
}

# Save to ML service directory
output_path = Path('../ml-service/models')
output_path.mkdir(parents=True, exist_ok=True)

with open(output_path / 'healthcare_model.pkl', 'wb') as f:
    pickle.dump(model_data, f)

print("✅ Model exported!")
```

## Model File Format

The exported pickle file contains:

```python
{
    'model': <RandomForestClassifier>,
    'scaler': <StandardScaler>,
    'version': '1.0.0',
    'accuracy': 0.9893,
    'trained_on': '2025-11-08 12:30:45',
    'model_type': 'RandomForestClassifier',
    'n_estimators': 200,
    'max_depth': 10,
    'feature_names': [
        'R_mean', 'R_std', 'G_mean', 'G_std',
        'B_mean', 'B_std', 'NDVI_mean', 'NDVI_std',
        'Built_mean', 'Built_std', 'Brightness_mean', 'Brightness_std'
    ],
    'training_samples': 2247,
    'test_samples': 562,
    'classes': ['Non-built', 'Built-up']
}
```

## Feature Requirements

The model **must** use exactly **12 features** in this order:

1. **R_mean** - Mean of Red band (B4)
2. **R_std** - Std dev of Red band
3. **G_mean** - Mean of Green band (B3)
4. **G_std** - Std dev of Green band
5. **B_mean** - Mean of Blue band (B2)
6. **B_std** - Std dev of Blue band
7. **NDVI_mean** - Mean Vegetation Index
8. **NDVI_std** - Std dev Vegetation Index
9. **Built_mean** - Mean Built-up Index
10. **Built_std** - Std dev Built-up Index
11. **Brightness_mean** - Mean Brightness
12. **Brightness_std** - Std dev Brightness

⚠️ **Important**: The ML service expects features in this exact order!

## Verification

### Verify Export Succeeded

```bash
# Check file exists
ls -lh ml-service/models/healthcare_model.pkl

# Should show file size (~20-50 MB)
```

### Test Loading

```python
import pickle

with open('ml-service/models/healthcare_model.pkl', 'rb') as f:
    data = pickle.load(f)

model = data['model']
scaler = data['scaler']

print(f"Model: {model.__class__.__name__}")
print(f"Features: {len(data['feature_names'])}")
print(f"Accuracy: {data['accuracy']}")
```

### Test ML Service

```bash
# Start ML service
cd ml-service
uvicorn app.main:app --reload --port 5001

# In another terminal, test
curl http://localhost:5001/health

# Should return:
# {"status": "healthy", "model_loaded": true, ...}
```

## Troubleshooting

### Error: "model variable not found"

**Cause**: The export cell ran before the model was trained

**Solution**: Run Cell 37 (train model) before running the export cell

### Error: "No module named 'sklearn'"

**Cause**: scikit-learn not installed

**Solution**:
```bash
pip install scikit-learn==1.3.0
```

### Error: "Path does not exist: ml-service/models"

**Cause**: Running from wrong directory or path issue

**Solution**: The notebook automatically creates the directory. If it fails:
```bash
mkdir -p ml-service/models
```

### File size too large (>100 MB)

**Cause**: Too many estimators or max_depth too high

**Solution**: Reduce model complexity in Cell 37:
```python
rf = RandomForestClassifier(
    n_estimators=100,  # Reduce from 200
    max_depth=8,       # Reduce from 10
    ...
)
```

### Model loads but predictions fail

**Cause**: Feature mismatch or scaler not applied

**Solution**: Ensure all 12 features are provided in correct order and scaler is used

## Integration with ML Service

Once exported, the model is automatically used by the ML service:

1. **ML Service loads model on startup**
   - Reads from `ml-service/models/healthcare_model.pkl`
   - Initializes model and scaler

2. **Predictions via API**
   ```bash
   curl -X POST http://localhost:5001/api/predict \
     -H "Content-Type: application/json" \
     -d '{"features": [120,15,110,13,95,11,0.45,0.12,0.67,0.15,108,13]}'
   ```

3. **Backend integration**
   - Express backend proxies to ML service
   - Available at `http://localhost:8080/api/ml/*`

## Model Versioning

For production, consider versioning your models:

```python
# Add version to filename
version = '1.0.0'
model_file = output_path / f'healthcare_model_v{version}.pkl'
```

Or use MLflow for experiment tracking:

```bash
pip install mlflow
```

## Security Notes

- ⚠️ Model files are **gitignored** (they're large and contain training artifacts)
- ✅ Share models via cloud storage (S3, GCS, etc.) for production
- ✅ Use model registries (MLflow, Weights & Biases) for team collaboration

## Related Documentation

- **ML_INTEGRATION_GUIDE.md** - Complete ML service setup
- **ML_INTEGRATION_COMPLETE.md** - Implementation details
- **ml-service/README.md** - ML service API documentation
- **ml-service/models/README.md** - Model requirements

## Need Help?

1. Check the notebook output for detailed error messages
2. Verify all training cells completed successfully
3. Ensure you're using compatible scikit-learn version (1.3.0)
4. Review ML service logs: `docker-compose logs ml-service`

---

**Quick Reference**

```bash
# Export model (in notebook)
# Run Cell 44 after training

# Start ML service
cd ml-service && uvicorn app.main:app --reload --port 5001

# Test ML service
curl http://localhost:5001/health
curl http://localhost:8080/api/ml/health

# Enable ML in backend
echo "ML_ENABLED=true" >> backend/.env
```
