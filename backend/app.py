import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth, firestore

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  # Vite dev server

# Initialize Firebase Admin SDK using your service account
cred = credentials.Certificate("service_account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()