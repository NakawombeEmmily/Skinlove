from flask import Blueprint, request, jsonify
import jwt
import os
import json
from database import get_db

skinanalysis_bp = Blueprint('skinanalysis', __name__, url_prefix='/api/skinanalysis')
JWT_SECRET = os.getenv('JWT_SECRET', 'your_jwt_secret_key_change_in_production')

def get_user_from_token():
    token = request.headers.get('Authorization', '').split(' ')[-1]
    data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    return data

def determine_skin_type(answers):
    """Determine skin type from quiz answers"""
    oil_score = 0
    dry_score = 0
    
    if answers.get('oiliness', 0) > 5:
        oil_score += 2
    if answers.get('pores') == 'large':
        oil_score += 1
    if answers.get('texture') == 'bumpy':
        oil_score += 1
    
    if answers.get('moisture', 0) < 3:
        dry_score += 2
    if answers.get('flaking') == 'yes':
        dry_score += 2
    if answers.get('tightness') == 'yes':
        dry_score += 1
    
    if oil_score > dry_score:
        return 'oily'
    elif dry_score > oil_score:
        return 'dry'
    else:
        return 'combination'

@skinanalysis_bp.route('/quiz', methods=['POST'])
def quiz():
    try:
        data = get_user_from_token()
        user_id = data['userId']
        
        body = request.get_json()
        answers = body.get('answers', {})
        
        # Determine skin type
        skin_type = determine_skin_type(answers)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO skinAnalyses (userId, skinType, quizAnswers, oilLevel, sensitivity, hydration)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, skin_type, json.dumps(answers), answers.get('oiliness', 0), 
              answers.get('sensitivity', 0), answers.get('moisture', 0)))
        conn.commit()
        
        # Get recommendations
        cursor.execute('SELECT * FROM products WHERE skinTypes LIKE ? LIMIT 5', (f'%{skin_type}%',))
        recommendations = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'skinType': skin_type,
            'recommendations': [dict(r) for r in recommendations]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@skinanalysis_bp.route('/image', methods=['POST'])
def image_analysis():
    try:
        data = get_user_from_token()
        user_id = data['userId']
        
        # Mock image analysis
        skin_type = 'oily'
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO skinAnalyses (userId, skinType, imageUrl, oilLevel, sensitivity, hydration)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, skin_type, '/uploads/mock-image.jpg', 75, 40, 30))
        
        # Update user's skin type
        cursor.execute('UPDATE users SET skinType = ? WHERE id = ?', (skin_type, user_id))
        conn.commit()
        
        # Get recommendations
        cursor.execute('SELECT * FROM products WHERE skinTypes LIKE ? LIMIT 5', (f'%{skin_type}%',))
        recommendations = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'skinType': skin_type,
            'recommendations': [dict(r) for r in recommendations],
            'imageUrl': '/uploads/mock-image.jpg'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@skinanalysis_bp.route('/history', methods=['GET'])
def get_history():
    try:
        data = get_user_from_token()
        user_id = data['userId']
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM skinAnalyses WHERE userId = ? ORDER BY createdAt DESC', (user_id,))
        analyses = cursor.fetchall()
        conn.close()
        
        return jsonify([dict(a) for a in analyses]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
