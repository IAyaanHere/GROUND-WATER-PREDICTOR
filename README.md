# AquaStatAI 🌊

**Smart Groundwater Level Prediction System**

[![Live Frontend](https://img.shields.io/badge/Frontend-Live-brightgreen?logo=vercel)](https://aquastatai.vercel.app)
[![Live Backend API](https://img.shields.io/badge/Backend%20API-Live-blue?logo=render)](https://aquastatai-api.onrender.com)

## 📋 Project Overview

AquaStatAI is an AI-powered groundwater level prediction system that uses machine learning to forecast groundwater depths (in MBGL - Meters Below Ground Level). The system analyzes spatial and environmental factors to provide accurate predictions for groundwater management and agricultural planning.

**Live Demo:** [https://aquastat.vercel.app](https://aquastat.vercel.app)

## 🛠 Tech Stack

### Backend
- **Framework:** Flask (Python web framework)
- **Machine Learning:** scikit-learn (RandomForestRegressor)
- **Data Processing:** Pandas, NumPy
- **Model Serialization:** Joblib
- **Production Server:** Gunicorn
- **Deployment:** Render (Production Backend)

### Frontend
- **Deployment:** Vercel (Production Frontend)

### Data & ML Pipeline
- **Dataset:** Spatial Groundwater Dataset 2015 (Enhanced)
- **Model Type:** Random Forest Regressor (200 estimators, max depth 10)
- **Feature Scaling:** StandardScaler
- **Train/Test Split:** 80/20

## 📁 Project Structure

```
GROUND WATER PREDICTOR/
├── api.py                              # Main Flask API application
├── model.py                            # ML model training & evaluation
├── test_api.py                         # API endpoint testing script
├── requirements.txt                    # Python dependencies
├── gw_model.pkl                        # Trained RandomForest model
├── scaler.pkl                          # StandardScaler for feature normalization
├── Spatial_GW_Dataset_2015_Enhanced.csv # Dataset (7 features)
└── GW_Project/                         # Production-ready API folder
    ├── api.py                          # Production API clone
    ├── requirements.txt                # Dependencies
    ├── gw_model.pkl                    # Model for production
    └── scaler.pkl                      # Scaler for production
```

## 📊 Input Features

The model accepts the following 7 features for prediction:

| Feature | Unit | Type | Description |
|---------|------|------|-------------|
| **Latitude** | Degrees | Spatial | Geographic latitude coordinate |
| **Longitude** | Degrees | Spatial | Geographic longitude coordinate |
| **Rainfall** | mm | Environmental | Annual rainfall at location |
| **GW_Recharge** | mm | Hydrological | Groundwater recharge amount |
| **GW_Extraction** | mm | Hydrological | Groundwater extraction amount |
| **Extraction_Stage_Perc** | % | Hydrological | Extraction stage percentage |
| **Prev_GW** | MBGL | Historical | Previous groundwater level |

## 📤 API Endpoints

### 1. Health Check
```
GET http://aquastatai-api.onrender.com/
```
**Response:**
```json
{
  "status": "Groundwater Prediction API is running"
}
```

### 2. Groundwater Prediction
```
POST http://aquastatai-api.onrender.com/predict
Content-Type: application/json
```

**Request Body:**
```json
{
  "Latitude": 21.1458,
  "Longitude": 79.0882,
  "Rainfall": 1200,
  "Prev_GW": 15,
  "GW_Recharge": 200,
  "GW_Extraction": 180,
  "Extraction_Stage_Perc": 75
}
```

**Response:**
```json
{
  "prediction": 14.5,
  "unit": "MBGL"
}
```

## 🤖 Machine Learning Model

### Model Architecture
- **Algorithm:** Random Forest Regressor
- **Estimators:** 200 trees
- **Max Depth:** 10 levels
- **Random State:** 42 (for reproducibility)

### Model Performance
- **Training Data:** 80% of dataset
- **Test Data:** 20% of dataset
- **Feature Scaling:** StandardScaler (zero mean, unit variance)
- **Metrics Tracked:** MSE (Mean Squared Error), R² Score

### Model Training Pipeline
1. Load dataset from CSV
2. Handle missing values (median imputation)
3. Feature extraction (drop target column)
4. Train-test split (80/20)
5. Feature scaling with StandardScaler
6. Model training on scaled features
7. Model evaluation on test set
8. Model persistence (joblib serialization)

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip or conda

### Local Setup

1. **Clone & Navigate:**
```bash
cd "GROUND WATER PREDICTOR"
```

2. **Install Dependencies:**
```bash
pip install -r requirements.txt
```

3. **Train Model (if needed):**
```bash
python model.py
```

4. **Run Local API:**
```bash
python api.py
```
The API will be available at `http://127.0.0.1:5000`

### Testing

Run the test script to verify API functionality:
```bash
python test_api.py
```

## 📦 Dependencies

```
flask              # Web framework
pandas             # Data manipulation
scikit-learn       # ML library
joblib             # Model serialization
gunicorn           # WSGI HTTP server
```

## 🔧 File Descriptions

### `api.py` (Main API)
- Flask application with 2 endpoints
- Loads pre-trained model and scaler
- Handles JSON requests for predictions
- Error handling for invalid inputs

### `model.py` (Model Training)
- Data loading and cleaning
- Feature engineering
- Train-test split
- Random Forest model training
- Model evaluation and metrics
- Model and scaler serialization

### `test_api.py` (Testing)
- Sample API test with example data
- Tests `/predict` endpoint
- Validates response format

### `Spatial_GW_Dataset_2015_Enhanced.csv`
- Training dataset with 7 features
- Target: GW_Level (MBGL)
- Pre-processed spatial groundwater data

## 🌐 Deployment

### Backend (Render)
- **URL:** https://aquastatai-api.onrender.com
- **Server:** Gunicorn WSGI
- **Environment:** Production

### Frontend (Vercel)
- **URL:** https://aquastat.vercel.app
- **Framework:** React/Next.js
- **Deployment:** Vercel hosting

## 📈 Usage Example

### Using cURL:
```bash
curl -X POST http://aquastatai-api.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Latitude": 21.1458,
    "Longitude": 79.0882,
    "Rainfall": 1200,
    "Prev_GW": 15,
    "GW_Recharge": 200,
    "GW_Extraction": 180,
    "Extraction_Stage_Perc": 75
  }'
```

### Using Python (requests):
```python
import requests

url = "http://aquastatai-api.onrender.com/predict"
data = {
    "Latitude": 21.1458,
    "Longitude": 79.0882,
    "Rainfall": 1200,
    "Prev_GW": 15,
    "GW_Recharge": 200,
    "GW_Extraction": 180,
    "Extraction_Stage_Perc": 75
}

response = requests.post(url, json=data)
print(response.json())  # Output: {"prediction": 14.5, "unit": "MBGL"}
```

## 🎯 Key Features

✅ **Real-time Predictions** - Get groundwater forecasts instantly  
✅ **Spatial Analysis** - Location-based prediction accuracy  
✅ **ML-Powered** - 200-tree Random Forest for robust predictions  
✅ **Scalable API** - RESTful endpoints for easy integration  
✅ **Production Ready** - Deployed on Render with Gunicorn  
✅ **Responsive Frontend** - User-friendly interface on Vercel  
✅ **Error Handling** - Graceful error responses  

## 📝 Data Processing

### Cleaning Pipeline
- Detect missing values
- Median imputation for numeric features
- Feature scaling normalization

### Feature Engineering
- 7 key spatial and hydrological features
- Normalized using StandardScaler
- Optimized for Random Forest regression

## 🔐 Security & Performance

- Input validation on API endpoints
- Error handling for invalid data
- Pre-loaded model and scaler (fast predictions)
- Optimized Random Forest configuration
- Gunicorn multi-worker deployment on production

## 📞 Support & Contact

For issues, questions, or feature requests, please refer to the project repository or contact the development team.

iayaanhere@gmail.com
---

**Last Updated:** April 2026  
**Status:** ✅ Live & Production Ready  
**Version:** 1.0.0
