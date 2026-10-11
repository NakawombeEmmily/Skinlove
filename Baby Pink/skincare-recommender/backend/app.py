from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
from database import init_db
from routes_auth import auth_bp
from routes_products import products_bp
from routes_stores import stores_bp
from routes_skinanalysis import skinanalysis_bp
from routes_admin import admin_bp
from routes_chatbot import chatbot_bp
from routes_usage import usage_bp

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Configure CORS with explicit settings
CORS(app, 
     origins=["*"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept"],
     support_credentials=True,
     max_age=3600)

# Initialize database
init_db()

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(products_bp)
app.register_blueprint(stores_bp)
app.register_blueprint(skinanalysis_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(chatbot_bp)
app.register_blueprint(usage_bp)

@app.route('/api/health', methods=['GET'])
def health():
    return {'status': 'ok'}, 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"✅ Server running on port {port}")
    app.run(debug=True, port=port)
