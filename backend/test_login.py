import requests
import json

# Test admin login endpoint
url = 'http://127.0.0.1:8000/api/admin/login'
data = {
    'email': 'admin@ufa.uz',
    'password': 'Admin1234!'
}

try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Login successful!")
        print(f"Access token: {result['access'][:50]}...")
        print(f"User: {result['user']}")
    else:
        print(f"❌ Login failed!")
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"❌ Request failed: {e}")
