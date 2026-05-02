from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    token = data.get('idToken')
    
    print(f"User authenticated! Token received: {token[:10]}...")

    return jsonify({
        "status": "success", 
        "message": "Login acknowledged by Backend"
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)