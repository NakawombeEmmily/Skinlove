from flask import Blueprint, request, jsonify
import jwt
import bcrypt
import os
import json
from database import get_db
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
JWT_SECRET = os.getenv('JWT_SECRET', 'your_jwt_secret_key_change_in_production')

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not username or not email or not password:
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute('SELECT * FROM users WHERE email = ? OR username = ?', (email, username))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Email or username already exists'}), 400
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(10))
        
        # Insert user
        cursor.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                      (username, email, hashed_password.decode('utf-8')))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'User created successfully'}), 201
    except Exception as e:
        print(f'Registration error: {str(e)}')
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Check password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Create JWT token
        token = jwt.encode({
            'userId': user['id'],
            'isAdmin': user['isAdmin'],
            'exp': datetime.utcnow() + timedelta(days=7)
        }, JWT_SECRET, algorithm='HS256')
        
        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'isAdmin': bool(user['isAdmin'])
            }
        }), 200
    except Exception as e:
        print(f'Login error: {str(e)}')
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    try:
        # Token verification should be done by middleware
        token = request.headers.get('Authorization', '').split(' ')[-1]
        data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = data['userId']
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT id, username, email, skinType, location, lat, lng, isAdmin, createdAt FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(dict(user)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    try:
        token = request.headers.get('Authorization', '').split(' ')[-1]
        data_token = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = data_token['userId']
        
        data = request.get_json()
        skin_type = data.get('skinType')
        location = data.get('location')
        coordinates = data.get('coordinates', {})
        lat = coordinates.get('lat')
        lng = coordinates.get('lng')
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('UPDATE users SET skinType = ?, location = ?, lat = ?, lng = ? WHERE id = ?',
                      (skin_type, location, lat, lng, user_id))
        conn.commit()
        
        cursor.execute('SELECT id, username, email, skinType, location, lat, lng, isAdmin FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        return jsonify(dict(user)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
