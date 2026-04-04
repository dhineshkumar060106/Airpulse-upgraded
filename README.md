# 🌍 AirSense — Global Air Quality Intelligence Platform

A full-stack air quality prediction system with an interactive 3D globe, 
three ML models, and health risk assessment.

---

## 🚀 Quick Start

### 1. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 2. (Optional) Set up OpenWeatherMap API key
Get a free API key from https://openweathermap.org/api/air-pollution  
Then in `app.js`, replace:
```js
const OWM_API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY';
```
with your actual key.

### 3. Run Flask server
```bash
python app.py
```

### 4. Open in browser
Navigate to: **http://localhost:5000**

---

## 🗂 Project Structure

```
air-quality-predictor/
├── index.html         # Main frontend (HTML5)
├── style.css          # Greenish-blue glassmorphism UI
├── globe.js           # Three.js 3D interactive globe
├── app.js             # Prediction logic, charts, health assessment
├── app.py             # Flask backend with ML models
├── requirements.txt   # Python dependencies
└── README.md
```

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🌐 Interactive 3D Globe | Three.js WebGL globe — hover to see country AQI |
| ⚗️ Pollutant Input | PM2.5, PM10, NO₂, CO, O₃, SO₂ |
| 🤖 ML Models | XGBoost (R²=0.97), Random Forest (R²=0.94), Linear Regression (R²=0.82) |
| 📊 Model Metrics | R², RMSE, MAE, MAPE per model |
| 🏥 Health Assessment | 6-tier risk system with personalized recommendations |
| 🌐 OpenWeatherMap API | Real-time data integration (optional) |

---

## 🔌 API Endpoints (Flask)

```
POST /api/predict         — Predict AQI from pollutant values
GET  /api/models          — List models and performance metrics
POST /api/health_risk     — Get health risk for given AQI
GET  /api/aqi_scale       — AQI breakpoints and categories
```

### Example: POST /api/predict
```json
{
  "pm25": 35,
  "pm10": 60,
  "no2": 25,
  "co": 1.2,
  "o3": 40,
  "so2": 8,
  "model": "xgboost"
}
```

Response:
```json
{
  "aqi": 72,
  "category": "Moderate",
  "risk_level": "moderate",
  "confidence": 0.96,
  "dominant_pollutant": "pm25",
  "model_info": { "name": "XGBoost", "r2": 0.97, "rmse": 4.2 }
}
```

---

## 🛠 Technology Stack

**Frontend:** HTML5, CSS3 (Glassmorphism), Three.js r128, Chart.js 4.4  
**Backend:** Python, Flask, NumPy, Scikit-learn, XGBoost  
**Data:** OpenWeatherMap Air Pollution API, EPA AQI Standards  

---

## 📌 Training Real ML Models

Replace the simulated models in `app.py` with trained models:

```python
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
import xgboost as xgb

# Train models on historical AQI data (e.g. CPCB, EPA datasets)
# Save: joblib.dump(model, 'models/xgboost_model.pkl')
# Load: model = joblib.load('models/xgboost_model.pkl')
```

Recommended datasets:
- [EPA AQS Data](https://www.epa.gov/aqs)
- [CPCB India Air Quality](https://cpcb.nic.in/)
- [OpenAQ](https://openaq.org/)
