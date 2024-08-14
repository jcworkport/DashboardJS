from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import requests
import json
import schedule
import time
from datetime import datetime as dt
import openpyxl
from pymongo.mongo_client import MongoClient
from pymongo import MongoClient, errors
from pymongo.server_api import ServerApi
import requests
from datetime import datetime as dt, timedelta

app = Flask(__name__)
CORS(app)

class MongoDBConnector:
    def __init__(self, connection_string):
        self.connection_string = connection_string
        self.client = None
    
    def connect(self):
        try:
            # Create a new client and connect to the server
            self.client = MongoClient(self.connection_string)
            self.client.admin.command('ping')  # Send a ping to confirm a successful connection
            print("Pinged your deployment. You successfully connected to MongoDB!")
            return True
        except Exception as e:
            print(f"Connection failed: {e}")
            self.client = None
            return False
    
    def retrieve_data_as_dataframe(self, database_name, collection_name):
        try:
            db = self.client[database_name]
            collection = db[collection_name]
            mongo_data = list(collection.find())
            
            # Optionally remove '_id' field
            for document in mongo_data:
                document.pop('_id', None)
            
            # Convert to DataFrame
            df_mongoData = pd.DataFrame(mongo_data)
            return df_mongoData
        except Exception as e:
            print('Failed to retrieve Mongo DATA', e)
            return None
    
    def initial_data_insertion(self, database_name, collection_name, json_scanlog):
        db = self.client[database_name]
        collection = db[collection_name]
        data = json.loads(json_scanlog)
        print("Data inserted successfully") # Parse JSON data

        # Insert data into the collection
        try:
            if isinstance(data, list):
                collection.insert_many(data)
            else:
                collection.insert_one(data)
        except errors.BulkWriteError as e:
            print("Bulk write error occurred:", e.details)
            for error in e.details['writeErrors']:
                print("Error at document index:", error['index'])
                print("Error message:", error['errmsg'])

    def update_data(self, database_name, collection_name, json_scanlog):
        db = self.client[database_name]
        collection = db[collection_name]
        try:
            if not json_scanlog:
                print("No data to update.")
                return
            
            # Convert JSON string back to list of dictionaries (records)
            new_data = json.loads(json_scanlog)
            
            for item in new_data:
                # Update or insert document based on 'id' field
                collection.update_one({'id': item['id']}, {'$set': item}, upsert=True)
            
            print("Mongo Data updated successfully")
        except Exception as e:
            print("An error occurred while updating data:", e)

    def get_latest_date_from_mongo(self, database_name, collection_name):
        db = self.client[database_name]
        collection = db[collection_name]
        print('Getting Latest database entry')
        latest_entry = collection.find_one(sort=[("createDate", -1)])
        if latest_entry and "createDate" in latest_entry:
            return latest_entry["createDate"][:10]
        else:
            return None

class ScanDataFetcher:
    def __init__(self, ident, username, password, criteria1, criteria2):
        self.auth_url = "REDACTED"
        self.api_url = "REDACTED"
        self.auth_headers = {"Content-Type": "application/json"}
        self.auth_request_body = {"ident": ident, "username": username, "password": password}
        self.access_token = self.authenticate()
        self.criteria1 = criteria1
        self.criteria2 = criteria2

    def authenticate(self):
        try:
            response = requests.post(self.auth_url, headers=self.auth_headers, json=self.auth_request_body)
            response.raise_for_status()
            return response.json()["accessToken"]
        except requests.exceptions.RequestException as e:
            print(f"Error during authentication: {e}")
            return None

    def call_api(self, headers, request_body):
        try:
            response = requests.post(self.api_url, headers=headers, json=request_body)
            response.raise_for_status()
            return response.content
        except requests.exceptions.RequestException as e:
            print(f"Error during API call: {e}")
            return None

    def scan_data(self):
        if not self.access_token:
            print("Authentication failed!")
            return None

        headers = {"Authorization": f"Bearer {self.access_token}", "Content-Type": "application/json"}
        request_body = {
            "PageNumber": 0,
            "SortField": "createDate",
            "SortAscending": True,
            "GroupSortField": "",
            "GroupSortAscending": True,
            "DisplayedProperties": [
                "barcode",
                "productName",
                "quantity",
                "direction",
                "fullName",
                "refCode",
                "createDate",
                "createTime",
                "warehouseName"
            ],
            "FilterItems": [
                {
                    "FieldId": "create_date",
                    "Negate": False,
                    "Condition": 2,
                    "Criteria1": self.criteria1,
                    "Criteria2": self.criteria2
                },
                {
                    "FieldId": "direction",
                    "Negate": False,
                    "Condition": 1,
                    "Criteria1": "Outgoing"
                },
                {
                    "FieldId": "warehouse_id",
                    "Negate": False,
                    "Condition": 0,
                    "Criteria1": [REDACTED] 
                }
            ]
        }
        response_content = self.call_api(headers, request_body)

        if not response_content:
            return None

        try:
            json_response = json.loads(response_content)
            items = json_response["items"]
            df_scanlog = pd.DataFrame(items).drop(columns=['productId', 'itemId', 'transportId'])
            print("Scan data fetched successfully:", dt.now())
            return df_scanlog
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Error parsing response: {e}")
            return None

def cleanScanData(df_scanlog):
    # Cleaning/Transforming dataframe
    df_scanlog['refCode'].astype(str)
    df_scanlog['jobType'] = df_scanlog['refCode'].str[:3]
    df_scanlog['refCode'] = df_scanlog['refCode'].str.slice(start=5)
    df_scanlog['createTime'] = pd.to_datetime(df_scanlog['createTime'], format='mixed') #Converting the 'createTime' column to DateTime format using infer
    df_scanlog['refCode'] = pd.to_numeric(df_scanlog['refCode'])# Conversion to integer
    df_scanlog['fullName'] = df_scanlog['fullName'].astype("string")
    df_scanlog['refCode'] = df_scanlog['refCode'].fillna('')
    df_scanlog = df_scanlog[df_scanlog["jobType"] == 'Job']
    df_scanlog = df_scanlog[df_scanlog["status"] == 'Inserted']
    names_to_find = ['REDACTED']
    df_scanlog = df_scanlog[df_scanlog["fullName"].isin(names_to_find)]
    df_scanlog['barcode'] = pd.to_numeric(df_scanlog['barcode'], errors='coerce')
    df_scanlog['createTime'] = pd.to_datetime(df_scanlog['createTime'])

    return df_scanlog.to_json(orient="records")  

def fetch_and_update_data():
    mongo_connector = MongoDBConnector("REDACTED")
    if mongo_connector.connect():
        database_name = "scan_log"
        collection_name = "scans"
        latest_date = mongo_connector.get_latest_date_from_mongo(database_name, collection_name)
        if latest_date is not None:
            if isinstance(latest_date, str):
                latest_date = dt.strptime(latest_date, "%Y-%m-%d")
            criteria1 = latest_date.strftime("%Y-%m-%d")
            criteria2 = (latest_date + timedelta(days=60)).strftime("%Y-%m-%d")
        else:
            criteria1 = "2024-01-01"
            criteria2 = dt.now().date().strftime("%Y-%m-%d")

        # Run initial Intelli API fetch if the MongoDB collection is empty, else update MongoDB data
        db = mongo_connector.client[database_name]
        collection = db[collection_name]
        if collection.count_documents({}) == 0:
            fetcher = ScanDataFetcher(ident="REDACTED", username="REDACTED", password="REDACTED", criteria1=criteria1, criteria2=criteria2)
            df_scanlog = fetcher.scan_data()
            if df_scanlog is not None:
                json_scanlog = cleanScanData(df_scanlog)
                if json_scanlog:
                    mongo_connector.initial_data_insertion(database_name, collection_name, json_scanlog)  # Insert initial data into MongoDB
        else:
            today = dt.now().date()
            if latest_date.date() != today:
                fetcher = ScanDataFetcher(ident="REDACTED", username="REDACTED", password="REDACTED", criteria1=criteria1, criteria2=criteria2)
                df_scanlog = fetcher.scan_data()
                if df_scanlog is not None:
                    json_scanlog = cleanScanData(df_scanlog)
                    if json_scanlog:
                        mongo_connector.update_data(database_name, collection_name, json_scanlog)  # Update existing data in MongoDB
            else:
                print('Mongo Data already up-to-date!')
        df_mongoData = mongo_connector.retrieve_data_as_dataframe(database_name, collection_name)
        return df_mongoData 
    else:
        df_mongoData = None

    
def frontend_chartdata(df_mongoData):
   df_scanlog = df_mongoData
   #Load excel file discrepancies & positive feedback
   file_path_discrepancies = r'assets\discrepancy_excel.xlsx'
   df_excelDiscrepancies = pd.read_excel(file_path_discrepancies, engine='openpyxl')
   file_path_feedback = r'assets\positive_feedback.xlsx'
   df_positiveFeedback = pd.read_excel(file_path_feedback, engine='openpyxl')
   # Variables
   df_scanlog['month'] = pd.to_datetime(df_scanlog['createDate']).dt.month_name()
   drop_dupl_orders = df_scanlog[['refCode','month']].drop_duplicates(subset='refCode')
   unique_names = df_scanlog['fullName'].unique()
   names_to_exclude = ['REDACTED']
   unique_names_series = pd.Series(unique_names)
   filtered_names = unique_names_series[~unique_names_series.isin(names_to_exclude)].tolist()
   df_monthlyJobs = df_scanlog.groupby('month', sort=False)['refCode'].nunique().reset_index()
   # Tech Table Dataframe
   df_excelDiscrepanciesCopy = df_excelDiscrepancies.copy()
   tech_table = pd.DataFrame({'fullName': filtered_names})
   tech_table = tech_table.merge(df_scanlog.groupby('fullName')['refCode'].nunique().reset_index().rename(columns={'refCode': 'Orders'}), on='fullName', how='left')\
           .merge(df_excelDiscrepanciesCopy.groupby('tech_name')['Discrepancies'].count().rename('Discrepancies'), left_on='fullName', right_index=True, how='left')\
           .merge(df_positiveFeedback.groupby('tech_name')['positive_fb'].count().rename(r'Feedback'), left_on='fullName', right_index=True, how='left')\
           .sort_values(by=['fullName'], ascending=[False])\
           .rename(columns={'fullName': 'Technician'})
   tech_table['Technician'] = [name[:6] + "..." if len(name) > 6 else name for name in tech_table['Technician']]
   #total_scan_time = df_scanlog['createTime'].max() - df_scanlog['createTime'].min()
   # Bar Visual
   df_discrepancies = pd.merge(df_excelDiscrepanciesCopy, drop_dupl_orders, left_on='contract_number', right_on='refCode', how='left')
   bar_discrepanciesMonth = df_discrepancies.groupby('month', sort=True)['Discrepancies'].count()
   df_monthlyJobsDiscrepancies = pd.merge(df_monthlyJobs, bar_discrepanciesMonth, left_on='month', right_on='month', how='left')
   #Pie Chart
   df_pieChart = pd.DataFrame(df_excelDiscrepanciesCopy['Discrepancies'].value_counts().reset_index())
   #df_monthlyJobsDiscrepancies['month']= [name[:3] if len(name) > 3 else name for name in df_monthlyJobsDiscrepancies['month']]
   # Card mistake x days ago
   discrepancies_date = df_discrepancies.merge(df_scanlog.groupby('refCode')['createDate'].max().reset_index(), on='refCode', how='left')
   discrepancies_date['createDate'] = pd.to_datetime(discrepancies_date['createDate'])
   discrepancies_date = discrepancies_date.sort_values(by='createDate')
   discrepancies_date['days_diff'] =  discrepancies_date['createDate'].diff().dt.days
   last_entry_date = discrepancies_date['createDate'].max()
   current_date = pd.Timestamp.now()
   days_without_discrepancies = (current_date - last_entry_date).days
   # Card Data for 4 cards
   card_data = pd.DataFrame({'Orders': [df_scanlog["refCode"].nunique()]})
   card_data['Scans'] = len(df_scanlog["barcode"])
   card_data['Errors'] = df_monthlyJobsDiscrepancies['Discrepancies'].sum()
   card_data['LastError'] = days_without_discrepancies
   card_data['LastError'] = card_data['LastError'].fillna('')

   # Convert DataFrames to JSON strings with orient='records'
   tech_table_json = tech_table.to_json(orient='records')
   df_monthlyJobsDiscrepancies_json = df_monthlyJobsDiscrepancies.to_json(orient='records')
   df_pieChart_json = df_pieChart.to_json(orient='records')
   card_data_json = card_data.to_json(orient='records')
   bar_discrepanciesMonth = bar_discrepanciesMonth.to_json(orient='records')

   combined_json_data = {
   "tech_table": json.loads(tech_table_json),
   "monthlyJobsDiscrepancies": json.loads(df_monthlyJobsDiscrepancies_json),
   "pieChart": json.loads(df_pieChart_json),
   "cardData": json.loads(card_data_json)
   }
   
   return combined_json_data


@app.route('/combined_json_data')
def combined_json_endpoint():
    df_mongoData = fetch_and_update_data()
    combined_data = frontend_chartdata(df_mongoData)
    return jsonify(combined_data)
    
# schedule.every(5).minutes.do(combined_json_endpoint)


if __name__ == '__main__':
    app.run(debug=True,
            host='localhost',
            port='7000')
    
# while True:
#     schedule.run_pending()
#     time.sleep(1)