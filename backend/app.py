from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
import sqlite3
from pathlib import Path

# Configuration
MOCK_MODE = True  # Set to False to use real database

# Mock responses
MOCK_DATA = {
    'metrics': {
        3: {
            'kpis': [
                {'rowKey': 'refTrueA', 'value': '120'},
                {'rowKey': 'refFalseB', 'value': '15'},
                {'rowKey': 'refFalseA', 'value': '8'}, 
                {'rowKey': 'refTrueB', 'value': '90'},
                {'rowKey': 'confusionMatrixRef', 'value': '[[120,15],[8,90]]'},
                {'rowKey': 'confusionMatrixCurr', 'value': '[[110,18],[12,85]]'},
                {'rowKey': 'refPrecision', 'value': '0.88'},
                {'rowKey': 'refRecall', 'value': '0.89'},
                {'rowKey': 'refF1', 'value': '0.88'},
                {'rowKey': 'refAccuracy', 'value': '0.92'},
                {'rowKey': 'currTrueA', 'value': '110'},
                {'rowKey': 'currFalseB', 'value': '18'},
                {'rowKey': 'currFalseA', 'value': '12'},
                {'rowKey': 'currTrueB', 'value': '85'},
                {'rowKey': 'currPrecision', 'value': '0.81'},
                {'rowKey': 'currRecall', 'value': '0.82'},
                {'rowKey': 'currF1', 'value': '0.81'},
                {'rowKey': 'currAccuracy', 'value': '0.87'},
                {'rowKey': 'jensenShannon', 'value': '0.75'},
                {'rowKey': 'psi', 'value': '0.65'},
                {'rowKey': 'xaiAnalysis', 'value': 'Significant performance degradation detected across all metrics'},
                {'rowKey': 'errorRate', 'value': '0.16'},
                {'rowKey': 'misclassificationRate', 'value': '0.12'},
                {'rowKey': 'worstCases', 'value': '2023-01-02:18%,2023-01-01:15%,2023-01-03:12%'},
                {'rowKey': 'recommendation', 'value': 'Immediate model retraining recommended'},
                {'rowKey': 'runtime', 'value': '2h 45m'},
                {'rowKey': 'alertTime', 'value': '2023-06-15 14:30:00'},
                {'rowKey': 'runtimeCount', 'value': '42'},
                {'rowKey': 'alertKeeper', 'value': 'AI Monitoring System'}
            ]
        },
        4: {
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
            ],
            'plotData': [
                {'x': 'Time 1', 'y': 0},
                {'x': 'Time 2', 'y': 1},
                {'x': 'Time 3', 'y': 2},
                {'x': 'Time 4', 'y': 1},
                {'x': 'Time 5', 'y': 0},
                {'x': 'Time 6', 'y': 2}
            ],  # Add this field for plotting states 0, 1, and 2
            'tableData': [
                {
                    'timePeriod': '2023-02-01',
                    'meanPrediction': 0.80,
                    'error': 0.20,
                    'exceedsThreshold': True,
                    'predicted': 'Class A',
                    'actual': 'Class B',
                    'percentageError': 20.0,
                    'yTrue': 0,
                    'yPred': 1
                },
                {
                    'timePeriod': '2023-02-02',
                    'meanPrediction': 0.84,
                    'error': 0.16,
                    'exceedsThreshold': True,
                    'predicted': 'Class B',
                    'actual': 'Class A',
                    'percentageError': 16.0,
                    'yTrue': 1,
                    'yPred': 0
                },
                {
                    'timePeriod': '2023-02-03',
                    'meanPrediction': 0.86,
                    'error': 0.14,
                    'exceedsThreshold': False,
                    'predicted': 'Class A',
                    'actual': 'Class B',
                    'percentageError': 14.0,
                    'yTrue': 0,
                    'yPred': 1
                }
            ],
            'summary': {
                'totalErrors': 3,
                'errorRate': 0.18,
                'misclassificationRate': 0.14,
                'status': 'Warning',
                'precisionImpact': -0.06,
                'recallImpact': -0.06,
                'f1Impact': -0.06
            }
        }
    },
    'errors': {
        'tableData': [
            {
                'timePeriod': '2023-01-01',
                'predicted': 'Class A',
                'actual': 'Class B',
                'meanPrediction': 0.85,
                'error': 0.15,
                'exceedsThreshold': True,
                'percentageError': 15.0
            },
            {
                'timePeriod': '2023-01-02',
                'predicted': 'Class B',
                'actual': 'Class A',
                'meanPrediction': 0.82,
                'error': 0.18,
                'exceedsThreshold': True,
                'percentageError': 18.0
            },
            {
                'timePeriod': '2023-01-03',
                'predicted': 'Class A',
                'actual': 'Class B',
                'meanPrediction': 0.88,
                'error': 0.12,
                'exceedsThreshold': False,
                'percentageError': 12.0
            }
        ],
        'summary': {
            'totalErrors': 3,
            'errorRate': 0.17,
            'misclassificationRate': 0.12,
            'status': 'Warning'
        }
    }
}

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Add OPTIONS method to all API routes
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

def get_db_connection():
    db_path = Path(__file__).parent / 'dummyAzureDB.sqlite'
    conn = sqlite3.connect(str(db_path))
    return conn

@app.route('/api/metrics/<int:mode>', methods=['GET'])
@app.route('/api/metrics', methods=['GET'])
def get_metrics(mode=None):
    # Handle query parameter format (/api/metrics?mode=3)
    if mode is None:
        mode = request.args.get('mode')
        if not mode:
            return jsonify({'error': 'Mode parameter is required'}), 400
        try:
            mode = int(mode)
        except ValueError:
            return jsonify({'error': 'Mode must be an integer'}), 400
    if MOCK_MODE:
        return jsonify(MOCK_DATA['metrics'].get(mode, {}))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT rowKey, value FROM Metrics WHERE mode = ?', (mode,))
        rows = cursor.fetchall()
        return jsonify({
            'kpis': [{'rowKey': row[0], 'value': row[1]} for row in rows]
        })
    finally:
        conn.close()

@app.route('/api/errors', methods=['GET'])
def get_errors():
    if MOCK_MODE:
        return jsonify(MOCK_DATA['errors'])
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT timePeriod, meanPrediction, error, exceedsThreshold FROM Errors')
        rows = cursor.fetchall()
        return jsonify({
            'tableData': [{
                'timePeriod': row[0],
                'meanPrediction': row[1],
                'error': row[2],
                'exceedsThreshold': bool(row[3])
            } for row in rows]
        })
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)