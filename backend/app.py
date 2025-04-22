from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from pathlib import Path
import pyodbc
from werkzeug.exceptions import NotFound
import json
import random
from datetime import datetime, timedelta
from functools import wraps
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Configuration
MOCK_MODE = True  # Set to False to use real database

app = Flask(__name__)
CORS(app)

# Initialize rate limiter with more generous defaults
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["1000 per day", "200 per hour"],
    headers_enabled=True  # Enable rate limit headers for frontend
)

# Error handler decorator
def handle_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except pyodbc.Error as e:
            app.logger.error(f"Database error: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': 'Database operation failed',
                'details': str(e)
            }), 500
        except ValueError as e:
            return jsonify({
                'status': 'error', 
                'message': 'Invalid request data',
                'details': str(e)
            }), 400
        except Exception as e:
            app.logger.error(f"Unexpected error: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': 'An unexpected error occurred',
                'details': str(e)
            }), 500
    return wrapper

# Business unit validator
def validate_business_unit(f):
    @wraps(f)
    def wrapper(business_unit=None, *args, **kwargs):
        valid_units = ['CCS', 'JMSL']
        if business_unit and business_unit not in valid_units:
            return jsonify({
                'status': 'error',
                'message': 'Invalid business unit',
                'valid_units': valid_units
            }), 400
        return f(business_unit, *args, **kwargs)
    return wrapper

def get_db():
    try:
        # Try different connection string formats
        try:
            return pyodbc.connect(
                'DRIVER={ODBC Driver 17 for SQL Server};'
                'SERVER=localhost;'
                'DATABASE=DummyAzureDB;'
                'UID=sa;'
                'PWD=yourStrong(!)Password;'
            )
        except pyodbc.Error:
            # Fallback to SQL Server Native Client if ODBC 17 fails
            return pyodbc.connect(
                'DRIVER={SQL Server Native Client 11.0};'
                'SERVER=localhost;'
                'DATABASE=DummyAzureDB;'
                'UID=sa;'
                'PWD=yourStrong(!)Password;'
            )
    except pyodbc.Error as e:
        print(f"Database connection failed: {e}")
        return None

def generate_alphanum_id():
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return ''.join(random.choice(chars) for _ in range(6))

@app.route('/api/businessUnits')
@limiter.limit("5 per minute")
def get_business_units():
    conn = get_db()
    if not conn:
        print("Using mock business units data: DB connection failed")
        mock_units = [
            "Retail Banking",
            "Wealth Management", 
            "Commercial Banking",
            "Investment Banking"
        ]
        return jsonify({
            'units': mock_units,
            'status': 'success',
            'message': 'Using mock business units data',
            'hyperparameters': f"Refresh Interval: {random.choice([5, 10, 15])} minutes, Max Units: {random.choice([50, 100, 200])} minutes"
        })
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT name FROM BusinessUnits')
        units = [row[0] for row in cursor.fetchall()]
        return jsonify({
            'units': units,
            'status': 'success',
            'message': 'Business units retrieved successfully',
            'hyperparameters': f"Refresh Interval: {random.choice([5, 10, 15])} minutes, Max Units: {random.choice([50, 100, 200])} minutes"
        })
    except Exception as e:
        return jsonify({
            'units': [],
            'status': 'error',
            'message': str(e),
            'hyperparameters': ''
        }), 500
    finally:
        conn.close()

@app.route('/api/mode1/metrics')
@limiter.limit("10 per minute")
def get_mode1_metrics():
    conn = get_db()
    if not conn:
        print("Using mock data for mode1 metrics: DB connection failed")
        mock_data = [
            {'id': f"KPI-{generate_alphanum_id()}", 'rowKey': 'runtimeCount', 'value': str(random.randint(100, 200))},
            {'id': f"KPI-{generate_alphanum_id()}", 'rowKey': 'alertKeeper', 'value': 'System Admin'},
            {'id': f"KPI-{generate_alphanum_id()}", 'rowKey': 'kstest', 'value': f"{random.uniform(0.1, 0.5):.2f}"},
            {'id': f"KPI-{generate_alphanum_id()}", 'rowKey': 'wasserstein', 'value': f"{random.uniform(0.5, 2.0):.2f}"},
            {'id': f"KPI-{generate_alphanum_id()}", 'rowKey': 'mseRef', 'value': f"{random.uniform(0.1, 0.2):.2f}"},
            {'id': f"KPI-{generate_alphanum_id()}", 'rowKey': 'mseCurrent', 'value': f"{random.uniform(0.15, 0.3):.2f}"},
            {'id': f"KPI-{generate_alphanum_id()}", 'rowKey': 'status', 'value': random.choice(["Normal", "Warning", "Error"])}
        ]
        return jsonify({
            'kpis': mock_data,
            'status': 'success',
            'message': 'Using mock mode1 data'
        })
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT rowKey, value FROM Mode1Metrics")
        db_metrics = {row[0]: row[1] for row in cursor.fetchall()}
        metrics = [
            {'id': f"KPI-{generate_alphanum_id()}", 'rowKey': 'alertTime', 'value': db_metrics.get('alertTime', datetime.now().strftime("%Y-%m-%d %H:%M"))},
            {'id': f"KPI-{generate_alphanum_id()}", 'rowKey': 'runtimeCount', 'value': db_metrics.get('runtimeCount', str(random.randint(100, 200)))},
            {'id': f"KPI-{generate_alphanum_id()}", 'rowKey': 'alertKeeper', 'value': db_metrics.get('alertKeeper', 'System Admin')},
            {'id': f"KPI-{generate_alphanum_id()}", 'rowKey': 'kstest', 'value': db_metrics.get('kstest', f"{random.uniform(0.1, 0.5):.2f}")},
            {'id': f"KPI-{generate_alphanum_id()}", 'rowKey': 'wasserstein', 'value': db_metrics.get('wasserstein', f"{random.uniform(0.5, 2.0):.2f}")},
            {'id': f"KPI-{generate_alphanum_id()}", 'rowKey': 'mseRef', 'value': db_metrics.get('mseRef', f"{random.uniform(0.1, 0.2):.2f}")},
            {'id': f"KPI-{generate_alphanum_id()}", 'rowKey': 'mseCurrent', 'value': db_metrics.get('mseCurrent', f"{random.uniform(0.15, 0.3):.2f}")},
            {'id': f"KPI-{generate_alphanum_id()}", 'rowKey': 'status', 'value': db_metrics.get('status', random.choice(["Normal", "Warning", "Error"]))}
        ]
        return jsonify({
            'kpis': metrics,
            'status': 'success',
            'message': 'KPIs retrieved successfully',
            'hyperparameters': {
                'ksThreshold': round(random.uniform(0.05, 0.15), 2),
                'wassersteinThreshold': round(random.uniform(0.5, 1.5), 2),
                'mseThreshold': round(random.uniform(0.1, 0.3), 2),
                'monitoringWindow': random.choice([7, 14, 30]),
                'confidenceLevel': round(random.uniform(0.9, 0.99), 2)
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/errors')
@limiter.limit("5 per minute")
def get_errors():
    conn = get_db()
    if not conn:
        print("Using enhanced mock error data")
        mock_errors = {
            'plotData': [],
            'tableData': []
        }
        base_date = datetime.now() - timedelta(days=30)
        error_values = [random.uniform(5, 20) for _ in range(30)]
        mean_predictions = [random.uniform(800, 1200) for _ in range(30)]
        for i in range(30):
            date_str = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
            error_val = error_values[i]
            mean_pred = mean_predictions[i]
            exceeds_thresh = error_val > 15
            mock_errors['plotData'].append({
                'x': date_str,
                'y': round(error_val, 2),
                'exceedsThreshold': exceeds_thresh
            })
            mock_errors['tableData'].append({
                'predicted': random.choice(['Class A', 'Class B']),
                'actual': random.choice(['Class A', 'Class B']),
                'timePeriod': date_str,
                'meanPrediction': round(mean_pred, 2),
                'error': round(error_val, 2),
                'exceedsThreshold': exceeds_thresh,
                'percentageError': round((error_val / mean_pred) * 100, 2) if mean_pred else 0
            })
        return jsonify(mock_errors)
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT timePeriod, meanPrediction, error, exceedsThreshold FROM Errors')
        errors = {
            'plotData': [],
            'tableData': []
        }
        for row in cursor.fetchall():
            percentage_error = abs(float(row[2])/float(row[1])) * 100 if float(row[1]) != 0 else 0
            exceeds_thresh = bool(row[3])
            errors['plotData'].append({
                'timePeriod': row[0],
                'meanPrediction': float(row[1]),
                'error': float(row[2]),
                'exceedsThreshold': exceeds_thresh
            })
            errors['tableData'].append({
                'id': f"ERR-{generate_alphanum_id()}",
                'timePeriod': row[0],
                'meanPrediction': float(row[1]),
                'error': float(row[2]),
                'percentageError': round(percentage_error, 2),
                'exceedsThreshold': exceeds_thresh
            })
        return jsonify({
            **errors,
            'hyperparameters': f"Error Threshold: {random.choice([10, 15, 20])}, Learning Rate: {round(random.uniform(0.001, 0.01), 4)}, Batch Size: {random.choice([32, 64, 128])}"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/mode2/metrics')
@app.route('/api/mode2/metrics/<business_unit>')
@limiter.limit("30 per minute")
def get_mode2_metrics(business_unit=None):
    conn = get_db()
    if not conn:
        print("Using enhanced mock data: DB connection failed")
        conn = None
    print("FORCING MOCK DATA FOR MODE2 METRICS")
    def generate_alphanum_id():
        chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        return ''.join(random.choice(chars) for _ in range(6))
    base_drift = random.randint(0, 1)
    drift_trend = random.choice(['increasing', 'decreasing', 'stable'])
    business_context = {
        'CCS': {
            'alertKeeper': 'CCS Admin', 
            'status': random.choice(["Normal", "Warning"]),
            'useCases': ['CC-Di', 'CC-MT']
        },
        'JMSL': {
            'alertKeeper': 'JMSL Admin', 
            'status': random.choice(["Normal", "Error"]),
            'useCases': ['JM-Ch']
        }
    }
    if business_unit and business_unit in business_context:
        selected_context = business_context[business_unit]
    else:
        selected_context = business_context[random.choice(['CCS', 'JMSL'])]
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, rowKey, value FROM Mode2Metrics")
        mock_data = [{
            'id': row[0],
            'rowKey': row[1],
            'value': row[2],
            'status': 'Normal',
            'businessUnit': selected_context['alertKeeper'].split()[0],
            'useCase': random.choice(selected_context['useCases'])
        } for row in cursor.fetchall()]
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
    return jsonify({
        'kpis': mock_data,
        'status': 'success',
        'message': 'Using enhanced mock data',
        'hyperparameters': {
            'driftThreshold': round(random.uniform(0.1, 0.2), 2),
            'windowSize': random.choice([7, 14, 30]),
            'confidenceLevel': round(random.uniform(0.9, 0.99), 2),
            'minSamples': random.choice([1000, 5000, 10000]),
            'alertThreshold': random.choice([3, 5, 7])
        }
    })

@app.route('/api/mode2/xai')
@app.route('/api/mode2/xai/<business_unit>')
@limiter.limit("30 per minute")
def get_mode2_xai(business_unit=None):
    conn = get_db()
    if not conn:
        print("Using mock data for mode3 metrics: DB connection failed")
        explanations = {
            'CCS': [
                "CCS: Significant drift detected in transaction amount distributions (p<0.01)",
                "CCS: Top drifting features: 1) TXN_AMT (38%), 2) CUST_AGE (22%), 3) GEO_REGION (15%)",
                "CCS: Model maintains 85% precision for fraud detection despite drift",
                "CCS: Recommendation: Retrain if drift score >0.2 for 3+ days"
            ],
            'JMSL': [
                "JMSL: Moderate drift in customer segmentation features (p<0.05)",
                "JMSL: Key drifting dimensions: 1) INCOME_BRACKET (41%), 2) CREDIT_SCORE (19%)", 
                "JMSL: Model recall dropped 5% for premium segment",
                "JMSL: Recommendation: Monitor closely, retrain if precision drops below 80%"
            ],
            'default': [
                "The model shows moderate drift in feature distributions",
                "Feature importance analysis indicates top drifting features",
                "Drift detection alerts triggered due to distribution changes",
                "Recommendation: Consider retraining if drift persists"
            ]
        }
        if business_unit and business_unit in explanations:
            explanation = random.choice(explanations[business_unit])
        else:
            explanation = random.choice(explanations['default'])
        xai_results = {
            'id': f"XAI-{generate_alphanum_id()}",
            'text': explanation,
            'status': 'success',
            'timestamp': datetime.now().isoformat(),
            'businessUnit': business_unit if business_unit else 'All',
            'driftScore': round(random.uniform(0.1, 0.5), 2)
        }
        return jsonify(xai_results)
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT explanation FROM XAIResults WHERE mode=\'mode2\'')
        row = cursor.fetchone()
        if not row:
            return jsonify({
                'id': f"XAI-{generate_alphanum_id()}",
                'text': 'No XAI data available',
                'status': 'error'
            })
        return jsonify({
            'id': f"XAI-{generate_alphanum_id()}",
            'text': row[0],
            'status': 'success'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/metrics/3')
@app.route('/api/metrics', methods=['GET'])
@limiter.limit("10 per minute")
def get_mode3_metrics():
    if request.args.get('mode') != 'mode3' and not request.path.endswith('/3'):
        return jsonify({"error": "Invalid mode parameter"}), 400
    data = {
        "kpis": [
            {"rowKey": "alertTime", "value": datetime.now().strftime("%Y-%m-%d %H:%M")},
            {"rowKey": "runtimeCount", "value": str(random.randint(100, 200))},
            {"rowKey": "alertKeeper", "value": "System Admin"},
            {"rowKey": "jensenShannon", "value": f"{random.uniform(0.1, 0.3):.3f}"},
            {"rowKey": "psi", "value": f"{random.uniform(0.05, 0.2):.3f}"},
            {"rowKey": "status", "value": random.choice(["Normal", "Warning", "Error"])},
            {"rowKey": "refTrueA", "value": str(random.randint(800, 1200))},
            {"rowKey": "refFalseB", "value": str(random.randint(30, 100))},
            {"rowKey": "refTrueB", "value": str(random.randint(800, 1200))},
            {"rowKey": "refFalseA", "value": str(random.randint(30, 100))},
            {"rowKey": "refPrecision", "value": f"{random.uniform(0.85, 0.95):.3f}"},
            {"rowKey": "refRecall", "value": f"{random.uniform(0.8, 0.9):.3f}"},
            {"rowKey": "refF1", "value": f"{random.uniform(0.8, 0.9):.3f}"},
            {"rowKey": "refAccuracy", "value": f"{random.uniform(0.85, 0.95):.3f}"},
            {"rowKey": "currTrueA", "value": str(random.randint(800, 1200))},
            {"rowKey": "currFalseB", "value": str(random.randint(30, 100))},
            {"rowKey": "currTrueB", "value": str(random.randint(800, 1200))},
            {"rowKey": "currFalseA", "value": str(random.randint(30, 100))},
            {"rowKey": "currPrecision", "value": f"{random.uniform(0.85, 0.95):.3f}"},
            {"rowKey": "currRecall", "value": f"{random.uniform(0.8, 0.9):.3f}"},
            {"rowKey": "currF1", "value": f"{random.uniform(0.8, 0.9):.3f}"},
            {"rowKey": "currAccuracy", "value": f"{random.uniform(0.85, 0.95):.3f}"}
        ]
    }
    return jsonify(data)

@app.route('/api/mode4/metrics')
@limiter.limit("10 per minute")
def get_mode4_metrics():
    # Mock data for mode4 metrics
    mock_data = {
        'kpis': [
            {'rowKey': 'runtime', 'value': '00:12:34'},
            {'rowKey': 'currTrueA', 'value': '95'},
            {'rowKey': 'currFalseB', 'value': '22'},
            {'rowKey': 'currFalseA', 'value': '15'},
            {'rowKey': 'currTrueB', 'value': '78'},
            {'rowKey': 'currPrecision', 'value': '0.79'},
            {'rowKey': 'currRecall', 'value': '0.80'},
            {'rowKey': 'currF1', 'value': '0.79'},
            {'rowKey': 'currAccuracy', 'value': '0.85'},
            {'rowKey': 'refTrueA', 'value': '105'},
            {'rowKey': 'refFalseB', 'value': '18'},
            {'rowKey': 'refFalseA', 'value': '10'},
            {'rowKey': 'refTrueB', 'value': '85'},
            {'rowKey': 'refPrecision', 'value': '0.85'},
            {'rowKey': 'refRecall', 'value': '0.86'},
            {'rowKey': 'refF1', 'value': '0.85'},
            {'rowKey': 'refAccuracy', 'value': '0.90'},
            {'rowKey': 'confusionMatrixRef', 'value': '[[105,18],[10,85]]'},
            {'rowKey': 'confusionMatrixCurr', 'value': '[[95,22],[15,78]]'},
            {'rowKey': 'hyperparameter', 'value': 'Auto'},
            {'rowKey': 'psi', 'value': '0.72'},
            {'rowKey': 'xaiAnalysis', 'value': 'Moderate performance degradation detected in precision and recall'},
            {'rowKey': 'errorRate', 'value': '0.18'},
            {'rowKey': 'misclassificationRate', 'value': '0.14'},
            {'rowKey': 'worstCases', 'value': '2023-02-01:20%,2023-02-02:16%,2023-02-03:14%'},
            {'rowKey': 'recommendation', 'value': 'Monitor closely and consider retraining if trend continues'},
            {'rowKey': 'alertTime', 'value': '2023-07-10 10:45:00'},
            {'rowKey': 'runtimeCount', 'value': '45'},
            {'rowKey': 'alertKeeper', 'value': 'AI Monitoring System'}
        ]
    }
    return jsonify(mock_data)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
