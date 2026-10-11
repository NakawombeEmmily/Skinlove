from flask import Blueprint, request, jsonify
import jwt
import os
import json
from database import get_db
from middleware import token_required, admin_required

products_bp = Blueprint('products', __name__, url_prefix='/api/products')
JWT_SECRET = os.getenv('JWT_SECRET', 'your_jwt_secret_key_change_in_production')

def get_user_from_token():
    token = request.headers.get('Authorization', '').split(' ')[-1]
    data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    return data

@products_bp.route('/', methods=['GET'])
def get_products():
    try:
        skin_type = request.args.get('skinType')
        conn = get_db()
        cursor = conn.cursor()
        
        if skin_type:
            cursor.execute('SELECT * FROM products WHERE skinTypes LIKE ?', (f'%{skin_type}%',))
        else:
            cursor.execute('SELECT * FROM products')
        
        products = cursor.fetchall()
        conn.close()
        
        return jsonify([dict(p) for p in products]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
        product = cursor.fetchone()
        conn.close()
        
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        
        return jsonify(dict(product)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@products_bp.route('/', methods=['POST'])
@token_required
def create_product():
    try:
        data = get_user_from_token()
        if not data.get('isAdmin'):
            return jsonify({'error': 'Admin access required'}), 403
        
        body = request.get_json()
        name = body.get('name')
        description = body.get('description')
        price = body.get('price')
        skin_types = body.get('skinTypes')
        category = body.get('category')
        brand = body.get('brand')
        benefits = body.get('benefits')
        rating = body.get('rating', 0)
        reviews = body.get('reviews', 0)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO products (name, description, price, skinTypes, category, brand, benefits, rating, reviews)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (name, description, price, json.dumps(skin_types), category, brand, json.dumps(benefits), rating, reviews))
        
        product_id = cursor.lastrowid
        conn.commit()
        
        cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
        product = cursor.fetchone()
        conn.close()
        
        return jsonify(dict(product)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@products_bp.route('/<int:product_id>', methods=['PUT'])
@token_required
def update_product(product_id):
    try:
        data = get_user_from_token()
        if not data.get('isAdmin'):
            return jsonify({'error': 'Admin access required'}), 403
        
        body = request.get_json()
        name = body.get('name')
        description = body.get('description')
        price = body.get('price')
        skin_types = body.get('skinTypes')
        category = body.get('category')
        brand = body.get('brand')
        benefits = body.get('benefits')
        rating = body.get('rating')
        reviews = body.get('reviews')
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE products SET name = ?, description = ?, price = ?, skinTypes = ?, category = ?, brand = ?, benefits = ?, rating = ?, reviews = ?
            WHERE id = ?
        ''', (name, description, price, json.dumps(skin_types), category, brand, json.dumps(benefits), rating, reviews, product_id))
        conn.commit()
        
        cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
        product = cursor.fetchone()
        conn.close()
        
        return jsonify(dict(product)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@products_bp.route('/<int:product_id>', methods=['DELETE'])
@token_required
def delete_product(product_id):
    try:
        data = get_user_from_token()
        if not data.get('isAdmin'):
            return jsonify({'error': 'Admin access required'}), 403
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM products WHERE id = ?', (product_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Product deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
