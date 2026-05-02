from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Allows your React frontend to communicate with this Python server
CORS(app)

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    # This is where your React app sends the Firebase token
    token = data.get('idToken')
    
    print(f"User authenticated! Token received: {token[:10]}...")

    return jsonify({
        "status": "success", 
        "message": "Login acknowledged by Backend"
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)