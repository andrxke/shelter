import requests
import pandas as pd
from datetime import datetime

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
        
        # Step 1: Get the maximum date
        p_max = {"id": resource["id"], "sort": "OCCUPANCY_DATE desc", "limit": 1}
        max_res = requests.get(url, params=p_max).json().get("result", {})
        if not max_res.get("records"):
            continue
        max_date = max_res["records"][0]["OCCUPANCY_DATE"]
        print(f"Targeting data from date: {max_date}")
        
        # Step 2: Fetch all records for this date
        p_all = {"id": resource["id"], "filters": f'{{"OCCUPANCY_DATE": "{max_date}"}}', "limit": 32000}
        resource_search_data = requests.get(url, params=p_all).json()["result"]
        
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

print(f"Total raw records fetched: {len(data_to_insert['data'])}")

# Clean Data with Pandas
data_df = pd.DataFrame(data_to_insert['data'])
data_df.dropna(subset=['address'], inplace=True)
data_df['unoccupied_beds'] =  data_df['unoccupied_beds'].fillna("")
data_df = data_df.fillna("No Data")
data_df = data_df.drop_duplicates(subset=['org_name', 'name', 'address', 'unoccupied_beds'], keep='last')

print(f"Total cleaned records: {len(data_df)}")
print("\nSample Cleaned Data:")
print(data_df[['org_name', 'name', 'occupancy_beds']].head())
