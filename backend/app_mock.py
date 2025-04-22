from flask import Flask, jsonify
from flask_cors import CORS
from mock_responses import mock_metrics, mock_errors

app = Flask(__name__)
CORS(app)

@app.route('/api/metrics/<int:mode>', methods=['GET'])
@app.route('/api/metrics/<int:mode>/<business_unit>', methods=['GET'])
def get_metrics(mode, business_unit=None):
    return jsonify(mock_metrics(mode))

@app.route('/api/errors', methods=['GET'])
def get_errors():
    return jsonify(mock_errors())

if __name__ == '__main__':
    app.run(debug=True, port=5000)
