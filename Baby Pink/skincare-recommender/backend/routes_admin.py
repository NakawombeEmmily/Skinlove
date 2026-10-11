from flask import Blueprint, request, jsonify
import jwt
import os
from database import get_db

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')
JWT_SECRET = os.getenv('JWT_SECRET', 'your_jwt_secret_key_change_in_production')

def get_user_from_token():
    token = request.headers.get('Authorization', '').split(' ')[-1]
    data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    return data

@admin_bp.route('/stats', methods=['GET'])
def get_stats():
    try:
        data = get_user_from_token()
        if not data.get('isAdmin'):
            return jsonify({'error': 'Admin access required'}), 403
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Total users
        cursor.execute('SELECT COUNT(*) as count FROM users')
        total_users = cursor.fetchone()['count']
        
        # Total analyses
        cursor.execute('SELECT COUNT(*) as count FROM skinAnalyses')
        total_analyses = cursor.fetchone()['count']
        
        # Usage stats
        cursor.execute('SELECT feature, SUM(usageCount) as count FROM usage GROUP BY feature')
        usage_stats = cursor.fetchall()
        
        conn.close()
        
        return jsonify({
            'totalUsers': total_users,
            'totalAnalyses': total_analyses,
            'usageStats': [dict(u) for u in usage_stats]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@admin_bp.route('/users', methods=['GET'])
def get_users():
    try:
        data = get_user_from_token()
        if not data.get('isAdmin'):
            return jsonify({'error': 'Admin access required'}), 403
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT id, username, email, skinType, location, createdAt FROM users')
        users = cursor.fetchall()
        conn.close()
        
        return jsonify([dict(u) for u in users]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@admin_bp.route('/usage', methods=['GET'])
def get_usage():
    try:
        data = get_user_from_token()
        if not data.get('isAdmin'):
            return jsonify({'error': 'Admin access required'}), 403
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT feature, SUM(usageCount) as total, MAX(lastUsed) as lastUsed
            FROM usage
            GROUP BY feature
            ORDER BY total DESC
        ''')
        usage = cursor.fetchall()
        conn.close()
        
        return jsonify([dict(u) for u in usage]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@admin_bp.route('/usage/<int:user_id>', methods=['GET'])
def get_user_usage(user_id):
    try:
        data = get_user_from_token()
        if not data.get('isAdmin'):
            return jsonify({'error': 'Admin access required'}), 403
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM usage WHERE userId = ? ORDER BY createdAt DESC', (user_id,))
        usage = cursor.fetchall()
        conn.close()
        
        return jsonify([dict(u) for u in usage]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
