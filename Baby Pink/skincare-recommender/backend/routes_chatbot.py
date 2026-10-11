from flask import Blueprint, request, jsonify
import jwt
import os
import random
from datetime import datetime

chatbot_bp = Blueprint('chatbot', __name__, url_prefix='/api/chatbot')
JWT_SECRET = os.getenv('JWT_SECRET', 'your_jwt_secret_key_change_in_production')

def get_user_from_token():
    token = request.headers.get('Authorization', '').split(' ')[-1]
    data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    return data

CHAT_RESPONSES = {
    'greeting': [
        'Hello! Welcome to Skincare Recommender. How can I help you today?',
        'Hi there! Looking for skincare advice?'
    ],
    'skintype': [
        'I can help! Would you like to take a quiz or upload an image to identify your skin type?',
        'Let me help you find your skin type. Choose quiz or image analysis.'
    ],
    'products': [
        'We have products for oily, dry, combination, sensitive, and normal skin types. What\'s your skin type?',
        'Tell me your skin type and I\'ll recommend the best products!'
    ],
    'stores': [
        'I can show you nearby stores where you can buy skincare products. Enable location access first!',
        'Ready to find stores near you? Just share your location.'
    ],
    'help': [
        'I can help with: 1. Skin Type Analysis 2. Product Recommendations 3. Find Nearby Stores 4. Chat Support',
        'What do you need? Skin analysis, product recommendations, or store locations?'
    ],
    'default': [
        'I didn\'t quite understand. Can you rephrase that?',
        'Sorry, could you say that differently? Try asking about skin type, products, or stores!'
    ]
}

@chatbot_bp.route('/message', methods=['POST'])
def send_message():
    try:
        data = get_user_from_token()
        
        body = request.get_json()
        message = body.get('message', '').lower()
        
        response = random.choice(CHAT_RESPONSES['default'])
        
        # Simple keyword matching
        if any(word in message for word in ['hello', 'hi', 'hey']):
            response = random.choice(CHAT_RESPONSES['greeting'])
        elif any(word in message for word in ['skin type', 'analyze', 'quiz']):
            response = random.choice(CHAT_RESPONSES['skintype'])
        elif any(word in message for word in ['product', 'recommend']):
            response = random.choice(CHAT_RESPONSES['products'])
        elif any(word in message for word in ['store', 'buy', 'location']):
            response = random.choice(CHAT_RESPONSES['stores'])
        elif any(word in message for word in ['help', 'what can']):
            response = random.choice(CHAT_RESPONSES['help'])
        
        return jsonify({
            'message': response,
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
