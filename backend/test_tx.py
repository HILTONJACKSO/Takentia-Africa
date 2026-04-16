import requests

BASE_URL = "http://localhost:8001/api/v1"

def test_transactions():
    # Login to get token
    login_data = {
        "username": "admin@talentia.africa",
        "password": "admin123"
    }
    resp = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if resp.status_code != 200:
        print("Login failed", resp.text)
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("Fetching Petty Cash Transactions...")
    try:
        # We'll try without company_id first
        resp = requests.get(f"{BASE_URL}/operations/petty-cash/transactions", headers=headers, timeout=10)
        print("Status Code:", resp.status_code)
        if resp.status_code == 200:
            print("Successfully fetched transactions!")
            print(resp.json()[:2]) # Print first two
        else:
            print("Error:", resp.text)
    except Exception as e:
        print("Request failed:", e)

if __name__ == "__main__":
    test_transactions()
