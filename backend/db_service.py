from flask import Flask, jsonify, request
import pyodbc
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def get_db():
    return pyodbc.connect(
        'DRIVER={ODBC Driver 17 for SQL Server};'
        'SERVER=localhost;'
        'DATABASE=DummyAzureDB;'
        'Trusted_Connection=yes;'
    )

@app.route('/api/metrics/<mode>')
def get_metrics(mode):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT rowKey, value FROM Metrics WHERE mode=?", mode)
    rows = cursor.fetchall()
    conn.close()
    return jsonify([{'rowKey': r[0], 'value': r[1]} for r in rows])

if __name__ == '__main__':
    app.run(port=5000)
