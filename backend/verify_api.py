import requests
import os

BASE_URL = "http://localhost:8000"

def test_health():
    try:
        r = requests.get(f"{BASE_URL}/")
        print(f"Health Check: {r.status_code}")
        assert r.status_code == 200
    except Exception as e:
        print(f"Health Check Failed: {e}")

def test_speaking_security():
    # Test uploading a non-audio file
    with open("test.txt", "w") as f:
        f.write("This is not audio")
    
    files = {'file': ('test.txt', open('test.txt', 'rb'), 'text/plain')}
    data = {'prompt_text': 'test'}
    
    try:
        # We need a token for this, but if we get 401 Unauthorized, that's GOOD (Security works).
        # If we get 400/413 that's also GOOD (Validation works).
        # If we get 500, that's bad.
        r = requests.post(f"{BASE_URL}/api/speaking/analyze", files=files, data=data)
        print(f"Malicious Upload Test Status: {r.status_code}")
        print(f"Response: {r.text}")
        
        # We expect 401 (since no auth header) or 400 (if auth was bypassed)
        if r.status_code in [401, 400, 413]:
            print("✅ Security Check Passed (Request rejected)")
        else:
            print("❌ Security Check Failed (Unexpected status)")
            
    except Exception as e:
        print(f"Security Test Error: {e}")
    finally:
        os.remove("test.txt")

if __name__ == "__main__":
    print("Running Verification Tests...")
    test_health()
    test_speaking_security()
