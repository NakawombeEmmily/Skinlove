from flask import Blueprint, request, jsonify
import jwt
import os
from database import get_db

usage_bp = Blueprint('usage', __name__, url_prefix='/api/usage')
JWT_SECRET = os.getenv('JWT_SECRET', 'your_jwt_secret_key_change_in_production')

def get_user_from_token():
    token = request.headers.get('Authorization', '').split(' ')[-1]
    data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    return data

@usage_bp.route('/track', methods=['POST'])
def track_usage():
    try:
        data = get_user_from_token()
        user_id = data['userId']
        
        body = request.get_json()
        feature = body.get('feature')
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if usage record exists
        cursor.execute('SELECT * FROM usage WHERE userId = ? AND feature = ?', (user_id, feature))
        existing = cursor.fetchone()
        
        if existing:
            cursor.execute('UPDATE usage SET usageCount = usageCount + 1, lastUsed = CURRENT_TIMESTAMP WHERE userId = ? AND feature = ?',
                          (user_id, feature))
        else:
            cursor.execute('INSERT INTO usage (userId, feature, usageCount, lastUsed) VALUES (?, ?, 1, CURRENT_TIMESTAMP)',
                          (user_id, feature))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Usage tracked'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@usage_bp.route('/user', methods=['GET'])
def get_user_usage():
    try:
        data = get_user_from_token()
        user_id = data['userId']
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM usage WHERE userId = ? ORDER BY createdAt DESC', (user_id,))
        stats = cursor.fetchall()
        conn.close()
        
        return jsonify([dict(s) for s in stats]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
