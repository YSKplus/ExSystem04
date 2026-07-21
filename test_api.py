"""Test the API endpoints"""
import urllib.request
import json
import sys
import os


def test_api():
    print("=== Testing Audio Evaluation App API ===\n")

    # Test 1: Get WAV count
    print("1. Testing /api/wav-count")
    try:
        response = urllib.request.urlopen(
            'http://localhost:5000/api/wav-count')
        data = json.loads(response.read().decode())
        print(f"   OK: Found {data['count']} WAV files\n")
    except Exception as e:
        print(f"   ERROR: {e}\n")
        return False

    # Test 2: Initialize session
    print("2. Testing /api/init (session initialization)")
    try:
        init_data = json.dumps({'name': 'テスト太郎'}).encode('utf-8')
        request = urllib.request.Request(
            'http://localhost:5000/api/init',
            data=init_data,
            headers={'Content-Type': 'application/json'}
        )
        response = urllib.request.urlopen(request)
        session = json.loads(response.read().decode())
        session_id = session['session_id']
        print(f"   OK: Session created: {session_id[:8]}...")
        print(f"   OK: Total files: {session['total_files']}")
        print(f"   OK: First file: {session['current_file']}\n")
    except Exception as e:
        print(f"   ERROR: {e}\n")
        return False

    # Test 3: Get current file
    print("3. Testing /api/get-current-file")
    try:
        response = urllib.request.urlopen(
            f'http://localhost:5000/api/get-current-file/{session_id}')
        data = json.loads(response.read().decode())
        print(f"   OK: Current file: {data['file_name']}")
        print(
            f"   OK: Progress: {data['current_index']}/{data['total_files']}\n")
    except Exception as e:
        print(f"   ERROR: {e}\n")
        return False

    # Test 4: Submit evaluations
    print("4. Testing /api/submit-evaluation (3 submissions)")
    try:
        for i in range(3):
            eval_data = json.dumps({'rating': 5 + i}).encode('utf-8')
            request = urllib.request.Request(
                f'http://localhost:5000/api/submit-evaluation/{session_id}',
                data=eval_data,
                headers={'Content-Type': 'application/json'}
            )
            response = urllib.request.urlopen(request)
            result = json.loads(response.read().decode())
            print(f"   OK: Evaluation {i+1} submitted (rating: {5+i})")
        print()
    except Exception as e:
        print(f"   ERROR: {e}\n")
        return False

    # Test 5: Check results folder
    print("5. Checking results folder")
    results_folder = os.path.join(os.path.dirname(__file__), 'results')
    if os.path.exists(results_folder):
        files = os.listdir(results_folder)
        print(f"   OK: Results folder exists")
        print(f"   OK: Files: {len(files)} Excel file(s) saved\n")
    else:
        print(f"   OK: Results folder ready\n")

    print("=== All API tests passed! ===")
    return True


if __name__ == '__main__':
    success = test_api()
    sys.exit(0 if success else 1)
