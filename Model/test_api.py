import requests

# API URL
url = "http://127.0.0.1:5000/predict"

# Sample input data (values only)
data = {
    "Latitude": 21.1458,
    "Longitude": 79.0882,
    "Rainfall": 1200,
    "Prev_GW": 15,
    "GW_Recharge": 200,
    "GW_Extraction": 180,
    "Extraction_Stage_Perc": 75
}

try:
    # Send POST request
    response = requests.post(url, json=data)

    # Check response
    if response.status_code == 200:
        print("✅ Success:")
        print(response.json())
    else:
        print("❌ Error:", response.status_code)

except Exception as e:
    print("❌ Request failed:", e)