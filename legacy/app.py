from flask import Flask, jsonify, request
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Load the trained model
MODEL_PATH = Path(__file__).parent.parent / 'models' / 'healthcare_model.pkl'

try:
    with open(MODEL_PATH, 'rb') as f:
        model_data = pickle.load(f)
        model = model_data['model']
        scaler = model_data['scaler']
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"⚠️ Error loading model: {e}")
    model = None
    scaler = None

# Mock data (replace with actual database queries)
def get_accessibility_data():
    """Get accessibility analysis data"""
    # This should query your actual database or cached analysis results
    return {
        "districts": [
            {"name": "Kigali - Gasabo District", "accessibility_score": 0.89, "priority": "Low"},
            {"name": "Northern Province - Gicumbi", "accessibility_score": 0.35, "priority": "High"},
            {"name": "Western Province - Rusizi", "accessibility_score": 0.52, "priority": "Medium"},
            {"name": "Eastern Province - Rwamagana", "accessibility_score": 0.67, "priority": "Medium"},
            {"name": "Southern Province - Huye", "accessibility_score": 0.72, "priority": "Low"},
        ],
        "stats": {
            "total_facilities": 1247,
            "population_covered": 83,
            "avg_travel_time": 47,
            "underserved_areas": 342
        }
    }

def get_predictions_data():
    """Get ML predictions for building classification"""
    return {
        "healthcare_facilities": 156,
        "built_up_areas": 2341,
        "confidence_score": 0.87,
        "last_updated": "2025-10-20"
    }

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "model_loaded": model is not None})

@app.route('/api/accessibility', methods=['GET'])
def get_accessibility():
    """Get accessibility analysis data"""
    data = get_accessibility_data()
    return jsonify(data)

@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    """Get ML predictions"""
    data = get_predictions_data()
    return jsonify(data)

@app.route('/api/analyze-region', methods=['POST'])
def analyze_region():
    """Analyze a specific region"""
    try:
        data = request.get_json()
        region_name = data.get('region')
        
        # Here you would process satellite imagery for the region
        # and run ML predictions
        
        return jsonify({
            "region": region_name,
            "accessibility_score": 0.65,
            "healthcare_facilities": 12,
            "population": 145000,
            "recommendation": "2 new health centers needed"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    """Get AI-generated recommendations"""
    district = request.args.get('district', 'all')
    
    recommendations = {
        "immediate_actions": [
            "Conduct detailed field assessment in Northern Province",
            "Deploy mobile health units to remote areas",
            "Strengthen referral systems between districts"
        ],
        "strategic_planning": [
            "Develop 5-year healthcare infrastructure plan",
            "Implement telemedicine solutions for remote areas",
            "Improve transportation infrastructure"
        ],
        "resource_allocation": [
            "Prioritize funding for underserved districts",
            "Train healthcare workers in priority areas",
            "Upgrade existing facility equipment"
        ]
    }
    
    return jsonify(recommendations)

@app.route('/api/upload-satellite', methods=['POST'])
def upload_satellite():
    """Handle satellite imagery upload and processing"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        # Process the satellite imagery here
        # Run ML predictions
        
        return jsonify({
            "message": "Image processed successfully",
            "predictions": {
                "buildings_detected": 234,
                "healthcare_facilities": 3,
                "confidence": 0.85
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)