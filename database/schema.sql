-- ============================================================
-- SkinLove — Neon PostgreSQL Schema (Deliverable 1)
-- Paste this whole file into the Neon SQL Editor and run it.
-- ============================================================

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(10) DEFAULT 'user',
  skin_type VARCHAR(20),
  -- Required by the Admin panel's "deactivate user" action
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  brand VARCHAR(100),
  type VARCHAR(50),
  description TEXT,
  price VARCHAR(30),
  rating DECIMAL(2,1),
  skin_types TEXT[],
  image_emoji VARCHAR(10),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wishlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  hours VARCHAR(50),
  distance_km DECIMAL(4,1),
  available_products TEXT[]
);

-- Customer ratings and comments on products (one review per user per product)
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

CREATE TABLE chat_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(10),
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  status VARCHAR(30) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Raised when a user asks the AI assistant to speak to a human / support
CREATE TABLE support_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Login activity (for the admin panel's real-time feed and audit)
CREATE TABLE login_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(150),
  ip VARCHAR(45),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX idx_products_skin_types ON products USING GIN (skin_types);
CREATE INDEX idx_chat_history_user ON chat_history (user_id, created_at);
CREATE INDEX idx_orders_user ON orders (user_id);
CREATE INDEX idx_wishlist_user ON wishlist (user_id);
CREATE INDEX idx_reviews_product ON reviews (product_id, created_at DESC);
CREATE INDEX idx_support_requests_status ON support_requests (status, created_at DESC);
CREATE INDEX idx_login_events_created ON login_events (created_at DESC);
