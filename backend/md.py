import pyodbc
import os
import pandas as pd
 
# Reconnect to the DB
# server = os.environ.get("SQL_SERVER")
# database = os.environ.get("SQL_DATABASE")
# username = os.environ.get("SQL_USERNAME")
# password = os.environ.get("SQL_PASSWORD")
 
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
print(json_result)