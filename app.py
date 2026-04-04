"""
AirSense — Flask Backend
Air Quality Predictor with XGBoost, Random Forest, Linear Regression

Folder Structure:
  airsense/
  ├── app.py                  ← YOU ARE HERE (run this)
  ├── requirements.txt
  ├── templates/
  │   └── index.html
  └── static/
      ├── css/
      │   └── style.css
      └── js/
          ├── globe.js
          └── app.js
"""

from flask import Flask, request, jsonify, render_template
import numpy as np
import os

# Flask automatically looks for:
#   templates/  → for render_template()
#   static/     → for url_for('static', filename='...')
app = Flask(__name__)

# ─────────────────────────────────────────────────────────────────
#  AQI CALCULATION (EPA Standard Breakpoints)
# ─────────────────────────────────────────────────────────────────

AQI_BREAKPOINTS = {
    'pm25': [
        (0.0,  12.0,  0,  50),
        (12.1, 35.4,  51, 100),
        (35.5, 55.4,  101, 150),
        (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400),
        (350.5, 500.0, 401, 500),
    ],
    'pm10': [
        (0,   54,  0,  50),
        (55,  154, 51, 100),
        (155, 254, 101, 150),
        (255, 354, 151, 200),
        (355, 424, 201, 300),
        (425, 504, 301, 400),
        (505, 604, 401, 500),
    ],
    'no2': [
        (0,   53,   0,  50),
        (54,  100,  51, 100),
        (101, 360,  101, 150),
        (361, 649,  151, 200),
        (650, 1249, 201, 300),
        (1250,1649, 301, 400),
        (1650,2049, 401, 500),
    ],
    'co': [
        (0.0, 4.4,  0,  50),
        (4.5, 9.4,  51, 100),
        (9.5, 12.4, 101, 150),
        (12.5,15.4, 151, 200),
        (15.5,30.4, 201, 300),
        (30.5,40.4, 301, 400),
        (40.5,50.4, 401, 500),
    ],
    'o3': [
        (0,   54,  0,  50),
        (55,  70,  51, 100),
        (71,  85,  101, 150),
        (86,  105, 151, 200),
        (106, 200, 201, 300),
        (201, 404, 301, 400),
        (405, 604, 401, 500),
    ],
    'so2': [
        (0,   35,  0,  50),
        (36,  75,  51, 100),
        (76,  185, 101, 150),
        (186, 304, 151, 200),
        (305, 604, 201, 300),
        (605, 804, 301, 400),
        (805, 1004,401, 500),
    ],
}


def sub_index(Cp, breakpoints):
    """Calculate individual pollutant sub-index using linear interpolation."""
    Cp = max(0.0, float(Cp))
    for bp_lo, bp_hi, aqi_lo, aqi_hi in breakpoints:
        if bp_lo <= Cp <= bp_hi:
            return ((aqi_hi - aqi_lo) / (bp_hi - bp_lo)) * (Cp - bp_lo) + aqi_lo
    return 500.0  # exceeds highest breakpoint


def calculate_aqi(pm25, pm10, no2_ppb, co_ppm, o3_ppb, so2_ppb):
    """
    Calculate AQI using EPA breakpoints.
    Returns (aqi_value, dominant_pollutant, sub_indices_dict)
    """
    sub_indices = {
        'pm25': sub_index(pm25,     AQI_BREAKPOINTS['pm25']),
        'pm10': sub_index(pm10,     AQI_BREAKPOINTS['pm10']),
        'no2':  sub_index(no2_ppb,  AQI_BREAKPOINTS['no2']),
        'co':   sub_index(co_ppm,   AQI_BREAKPOINTS['co']),
        'o3':   sub_index(o3_ppb,   AQI_BREAKPOINTS['o3']),
        'so2':  sub_index(so2_ppb,  AQI_BREAKPOINTS['so2']),
    }
    dominant = max(sub_indices, key=sub_indices.get)
    aqi_value = round(max(sub_indices.values()))
    return aqi_value, dominant, sub_indices


# ─────────────────────────────────────────────────────────────────
#  ML MODEL SIMULATORS
#  Replace these with real trained models using joblib:
#
#  import joblib
#  xgb_model = joblib.load('models/xgboost_aqi.pkl')
#  rf_model  = joblib.load('models/random_forest_aqi.pkl')
#  lr_model  = joblib.load('models/linear_regression_aqi.pkl')
# ─────────────────────────────────────────────────────────────────

class XGBoostSimulator:
    name = "XGBoost"
    r2 = 0.97; rmse = 4.2; mae = 3.1; mape = 5.8

    def predict(self, features):
        base, _, _ = calculate_aqi(*features)
        noise = np.random.normal(0, base * 0.02)
        return max(1, round(base + noise)), round(0.94 + np.random.random() * 0.05, 3)


class RandomForestSimulator:
    name = "Random Forest"
    r2 = 0.94; rmse = 5.8; mae = 4.3; mape = 7.2

    def predict(self, features):
        base, _, _ = calculate_aqi(*features)
        noise = np.random.normal(0, base * 0.05)
        return max(1, round(base + noise)), round(0.88 + np.random.random() * 0.06, 3)


class LinearRegressionSimulator:
    name = "Linear Regression"
    r2 = 0.82; rmse = 11.4; mae = 8.9; mape = 14.1

    def predict(self, features):
        pm25, pm10, no2, co, o3, so2 = features
        pred = 0.65*pm25 + 0.25*pm10 + 0.35*no2 + 12*co + 0.28*o3 + 0.42*so2
        noise = np.random.normal(0, pred * 0.12)
        return max(1, round(pred + noise)), round(0.72 + np.random.random() * 0.08, 3)


MODELS = {
    'xgboost':           XGBoostSimulator(),
    'random_forest':     RandomForestSimulator(),
    'linear_regression': LinearRegressionSimulator(),
}


def get_aqi_category(aqi):
    if aqi <= 50:  return 'Good',                       'low'
    if aqi <= 100: return 'Moderate',                   'moderate'
    if aqi <= 150: return 'Unhealthy for Sensitive',    'elevated'
    if aqi <= 200: return 'Unhealthy',                  'high'
    if aqi <= 300: return 'Very Unhealthy',             'very-high'
    return              'Hazardous',                    'extreme'


# ─────────────────────────────────────────────────────────────────
#  ROUTES
# ─────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    """Serve the main frontend page."""
    return render_template('index.html')


@app.route('/api/predict', methods=['POST'])
def predict():
    """
    POST /api/predict
    Body JSON: { pm25, pm10, no2, co, o3, so2, model }
    Returns:   { aqi, category, risk_level, confidence, dominant_pollutant, sub_indices, model_info }
    """
    try:
        data = request.get_json(force=True)

        pm25 = float(data.get('pm25', 0))
        pm10 = float(data.get('pm10', 0))
        no2  = float(data.get('no2',  0))
        co   = float(data.get('co',   0))
        o3   = float(data.get('o3',   0))
        so2  = float(data.get('so2',  0))
        model_key = data.get('model', 'xgboost')

        if model_key not in MODELS:
            return jsonify({'error': f'Unknown model "{model_key}". Choose: {list(MODELS.keys())}'}), 400

        model = MODELS[model_key]
        features = [pm25, pm10, no2, co, o3, so2]
        aqi_pred, confidence = model.predict(features)

        _, dominant, sub_indices = calculate_aqi(*features)
        category, risk = get_aqi_category(aqi_pred)

        return jsonify({
            'aqi': aqi_pred,
            'category': category,
            'risk_level': risk,
            'confidence': confidence,
            'dominant_pollutant': dominant,
            'sub_indices': {k: round(v, 1) for k, v in sub_indices.items()},
            'model_info': {
                'name':  model.name,
                'r2':    model.r2,
                'rmse':  model.rmse,
                'mae':   model.mae,
                'mape':  model.mape,
            },
            'input': {
                'pm25': pm25, 'pm10': pm10, 'no2': no2,
                'co': co, 'o3': o3, 'so2': so2
            }
        })

    except (KeyError, ValueError, TypeError) as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/models', methods=['GET'])
def get_models():
    """GET /api/models — List all available models and their metrics."""
    return jsonify({
        key: {
            'name': m.name,
            'r2':   m.r2,
            'rmse': m.rmse,
            'mae':  m.mae,
            'mape': m.mape,
        }
        for key, m in MODELS.items()
    })


@app.route('/api/health_risk', methods=['POST'])
def health_risk():
    """POST /api/health_risk — Detailed health risk for a given AQI value."""
    data = request.get_json(force=True)
    aqi = int(data.get('aqi', 0))
    category, risk = get_aqi_category(aqi)

    details_map = {
        'low':       {'symptoms': 'None expected', 'outdoor_limit': 'None', 'mask': False, 'purifier': False},
        'moderate':  {'symptoms': 'Mild irritation possible for sensitive individuals', 'outdoor_limit': 'Reduce prolonged exertion if sensitive', 'mask': False, 'purifier': False},
        'elevated':  {'symptoms': 'Aggravated respiratory conditions', 'outdoor_limit': 'Sensitive groups limit outdoor time', 'mask': True, 'purifier': True},
        'high':      {'symptoms': 'Everyone may experience health effects', 'outdoor_limit': 'Avoid prolonged outdoor exertion', 'mask': True, 'purifier': True},
        'very-high': {'symptoms': 'Serious risk — entire population', 'outdoor_limit': 'Avoid all outdoor activity', 'mask': True, 'purifier': True},
        'extreme':   {'symptoms': 'Emergency — dangerous for all', 'outdoor_limit': 'Do NOT go outside', 'mask': True, 'purifier': True},
    }

    return jsonify({
        'aqi': aqi,
        'category': category,
        'risk_level': risk,
        'details': details_map.get(risk, details_map['moderate'])
    })


@app.route('/api/aqi_scale', methods=['GET'])
def aqi_scale():
    """GET /api/aqi_scale — AQI categories and color codes."""
    return jsonify([
        {'range': '0–50',    'category': 'Good',                         'color': '#00e400'},
        {'range': '51–100',  'category': 'Moderate',                     'color': '#ffff00'},
        {'range': '101–150', 'category': 'Unhealthy for Sensitive Groups','color': '#ff7e00'},
        {'range': '151–200', 'category': 'Unhealthy',                    'color': '#ff0000'},
        {'range': '201–300', 'category': 'Very Unhealthy',               'color': '#8f3f97'},
        {'range': '300+',    'category': 'Hazardous',                    'color': '#7e0023'},
    ])


# ─────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("\n" + "="*55)
    print("  🌍  AirSense — Air Quality Intelligence Platform")
    print("  ➜   Open browser at: http://localhost:5000")
    print("="*55 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
