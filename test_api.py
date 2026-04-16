import requests

response = requests.post("http://localhost:8000/api/v1/auth/login", data={"username": "admin@talentia.africa", "password": "admin123"})
if response.status_code == 200:
    token = response.json()["access_token"]
    print("Login successful. Token:", token)
    
    res2 = requests.get("http://localhost:8000/api/v1/hr/employees", headers={"Authorization": f"Bearer {token}"})
    print("HR Response:", res2.status_code, res2.text)
else:
    print("Login string failed", response.status_code, response.text)
