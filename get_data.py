import requests
from pymongo.mongo_client import MongoClient
from dotenv import load_dotenv
import os
from pymongo.server_api import ServerApi
from datetime import datetime
import pandas as pd

# Get .env keys
load_dotenv('./my-app/.env')
user = os.getenv('DB_USER')
password = os.getenv('DB_PASSWORD')

uri = os.getenv('DB_URL')
client = MongoClient(uri, server_api=ServerApi('1'))

db = client['shelter']
collection = db['shelterdata']

base_url = "https://ckan0.cf.opendata.inter.prod-toronto.ca"
url = base_url + "/api/3/action/package_show"
params = {"id": "daily-shelter-overnight-service-occupancy-capacity"}
package = requests.get(url, params=params).json()

data_to_insert = {
    "date": datetime.utcnow(),
    "data": []
}

for resource in package["result"]["resources"]:
    if resource["datastore_active"]:
        url = base_url + "/api/3/action/datastore_search"
        
        # Step 1: Get the maximum (latest) occupancy date
        p_max = {"id": resource["id"], "sort": "OCCUPANCY_DATE desc", "limit": 1}
        max_res = requests.get(url, params=p_max).json().get("result", {})
        if not max_res.get("records"):
            continue
        max_date = max_res["records"][0]["OCCUPANCY_DATE"]
        
        # Step 2: Fetch all records for the latest date
        p = {"id": resource["id"], "filters": f'{{"OCCUPANCY_DATE": "{max_date}"}}', "limit": 32000}
        resource_search_data = requests.get(url, params=p).json()["result"]
        
        resource_data = [
            {   
                "id": item["_id"],
                "org_name": item["ORGANIZATION_NAME"],
                "name": item["LOCATION_NAME"],
                "address": item['LOCATION_ADDRESS'],
                "postal_code": item["LOCATION_POSTAL_CODE"],
                "occupancy_rooms": item["OCCUPANCY_RATE_ROOMS"],
                "occupancy_beds": item["OCCUPANCY_RATE_BEDS"],
                "occupied_beds": item["OCCUPIED_ROOMS"],
                "unoccupied_beds": item["UNOCCUPIED_ROOMS"],
                "unavailable_beds": item["UNAVAILABLE_BEDS"],
                "program": item["PROGRAM_NAME"],
                "sector": item["SECTOR"]
            } for item in resource_search_data["records"]
        ]
        
        data_to_insert['data'].extend(resource_data)

print("length:", len(data_to_insert['data']))

# Drop duplicate addresses
data_df = pd.DataFrame(data_to_insert['data'])
data_df.dropna(subset=['address'], inplace=True) # Remove entries with no addresses

# Replace all None values with "" in the unoccupied_beds column
data_df['unoccupied_beds'] =  data_df['unoccupied_beds'].fillna("")

# Replace all other missing values with unknown
data_df = data_df.fillna("No Data")

# Remove duplicate rows
data_df = data_df.drop_duplicates(subset=['org_name', 'name', 'address', 'unoccupied_beds'], keep='last')

# Convert to JSON form
json_data = data_df.to_dict(orient='records')
data_to_insert['data'] = json_data
# print(data_df.loc[data_df['name'] == "CONC Men's Shelter Lansdowne Ave"]) this was a test

# Insert Data
result = collection.insert_one(data_to_insert)
print(f"Inserted document with ID: {result.inserted_id}")
client.close()
