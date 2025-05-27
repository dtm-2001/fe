import json
import os
from flask import Flask, jsonify, send_from_directory, Response
from flask_cors import CORS
# ---------------------------------------------------------------#
# mode selection
# ---------------------------------------------------------------#
import pyodbc
import os
import pandas as pd
 
# Reconnect to the DB
server = os.environ.get("SQL_SERVER")
database = os.environ.get("SQL_DATABASE")
username = os.environ.get("SQL_USERNAME")
password = os.environ.get("SQL_PASSWORD")
 
server = "ccs-octave-metadatastore.database.windows.net"
database = "metadatadb"
username = "octave_admin"
password = "Oct#2022_ccs"
 
conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}"
conn = pyodbc.connect(conn_str)
 
# Read all rows from the table
query = "SELECT * FROM case_table"
df = pd.read_sql(query, conn)
 
# Convert to JSON
json_result = df.to_json(orient='records', indent=4)
# ---------------------------------------------------------------#

app = Flask(__name__)

# 1) CORS — allow everything (for dev)
CORS(app, resources={r"/*": {"origins": "*"}})

# 2) CSP middleware — allow images from self, data: URIs, and github.dev
@app.after_request
def add_csp(response):
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; img-src 'self' https://github.dev data:;"
    )
    return response

# 3) Path constants
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODE1_JSON = os.path.join(BASE_DIR, "mode1.json")
MODE2_JSON = os.path.join(BASE_DIR, "mode2.json")
MODE3_JSON = os.path.join(BASE_DIR, "mode3.json")
MODE4_JSON = os.path.join(BASE_DIR, "mode4.json")
# MODE_SELECTION_JSON = os.path.join(BASE_DIR, "modeSelectionData.json")
ENTRIES_TABLE_JSON = os.path.join(BASE_DIR, "entries_table.json")

def load_json(path: str):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        app.logger.warning(f"[load_json] File not found: {path}")
    except json.JSONDecodeError as e:
        app.logger.warning(f"[load_json] Invalid JSON in {path}: {e}")
    return None

@app.route("/mode1/data", methods=["GET"])
def mode1_data():
    data = load_json(MODE1_JSON)
    if data is None:
        return jsonify({"detail": "mode1.json not found or invalid"}), 404
    return jsonify(data)

@app.route("/mode2/data", methods=["GET"])
def mode2_data():
    data = load_json(MODE2_JSON)
    if data is None:
        return jsonify({"detail": "mode2.json not found or invalid"}), 404
    return jsonify(data)

@app.route("/mode3/data", methods=["GET"])
def mode3_data():
    data = load_json(MODE3_JSON)
    if data is None:
        return jsonify({"detail": "mode3.json not found or invalid"}), 404
    # optional: warn if keys missing
    for key in ("drift_state", "metrics", "confusion_matrices"):
        if key not in data:
            app.logger.warning(f"[mode3_data] Warning: missing key '{key}'")
    return jsonify(data)

@app.route("/mode4/data", methods=["GET"])
def mode4_data():
    data = load_json(MODE4_JSON)
    if data is None:
        return jsonify({"detail": "mode4.json not found or invalid"}), 404
    return jsonify(data)

@app.route("/mode-selection-data", methods=["GET"])
def mode_selection_data():
    data = json_result
    if data is None:
        return jsonify({"detail": "modeSelectionData.json not found or invalid"}), 404
    return jsonify(data)

@app.route("/entries-table", methods=["GET"])
def entries_table():
    data = load_json(ENTRIES_TABLE_JSON)
    if data is None:
        return jsonify({"detail": "entries_table.json not found or invalid"}), 404
    return jsonify(data)

@app.route("/favicon.ico", methods=["GET"])
def favicon():
    static_dir = os.path.join(BASE_DIR, "static")
    ico_path = os.path.join(static_dir, "favicon.ico")
    if os.path.isfile(ico_path):
        # serve the actual favicon file
        return send_from_directory(static_dir, "favicon.ico", mimetype="image/vnd.microsoft.icon")
    # no content if missing
    return Response(status=204)

@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "message": "Welcome to the backend API!",
        "endpoints": [
            "/mode1/data",
            "/mode2/data",
            "/mode3/data",
            "/mode4/data",
            "/mode-selection-data",
            "/entries-table"
        ],
    })

if __name__ == "__main__":
    # adjust host/port or debug as needed
    app.run(host="0.0.0.0", port=5000, debug=True)
