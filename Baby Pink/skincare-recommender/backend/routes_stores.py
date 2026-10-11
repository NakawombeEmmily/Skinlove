from flask import Blueprint, request, jsonify
import jwt
import os
import math
from database import get_db

stores_bp = Blueprint('stores', __name__, url_prefix='/api/stores')
JWT_SECRET = os.getenv('JWT_SECRET', 'your_jwt_secret_key_change_in_production')

def get_user_from_token():
    token = request.headers.get('Authorization', '').split(' ')[-1]
    data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    return data

def calculate_distance(lat1, lng1, lat2, lng2):
    """Haversine formula to calculate distance between two coordinates"""
    R = 6371  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

@stores_bp.route('/nearby', methods=['GET'])
def get_nearby_stores():
    try:
        data = get_user_from_token()
        user_id = data['userId']
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT lat, lng FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        if not user or not user['lat'] or not user['lng']:
            conn.close()
            return jsonify({'message': 'User location not set'}), 400
        
        cursor.execute('SELECT * FROM stores LIMIT 10')
        stores = cursor.fetchall()
        conn.close()
        
        # Calculate distances
        stores_list = []
        for store in stores:
            distance = calculate_distance(user['lat'], user['lng'], store['lat'], store['lng'])
            store_dict = dict(store)
            store_dict['distance'] = distance
            stores_list.append(store_dict)
        
        # Sort by distance
        stores_list.sort(key=lambda x: x['distance'])
        
        return jsonify(stores_list), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@stores_bp.route('/', methods=['GET'])
def get_all_stores():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM stores')
        stores = cursor.fetchall()
        conn.close()
        
        return jsonify([dict(s) for s in stores]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@stores_bp.route('/', methods=['POST'])
def create_store():
    try:
        data = get_user_from_token()
        if not data.get('isAdmin'):
            return jsonify({'error': 'Admin access required'}), 403
        
        body = request.get_json()
        name = body.get('name')
        address = body.get('address')
        lat = body.get('lat')
        lng = body.get('lng')
        phone = body.get('phone')
        hours = body.get('hours')
        rating = body.get('rating', 0)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO stores (name, address, lat, lng, phone, hours, rating)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (name, address, lat, lng, phone, hours, rating))
        
        store_id = cursor.lastrowid
        conn.commit()
        
        cursor.execute('SELECT * FROM stores WHERE id = ?', (store_id,))
        store = cursor.fetchone()
        conn.close()
        
        return jsonify(dict(store)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400
