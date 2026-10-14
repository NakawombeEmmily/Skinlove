-- ============================================================
-- SkinLove — Seed Data (run AFTER schema.sql in Neon SQL Editor)
-- Products use UGX prices and brands stocked in Uganda/Kenya.
-- Stores are real Kampala shopping locations.
-- ============================================================

-- ---------- USERS ----------
-- Admin login:    admin@skinlove.com / SkinLove2026
-- Demo login:     demo@skinlove.com  / demo1234
INSERT INTO users (name, email, password_hash, role, skin_type) VALUES
  ('SkinLove Admin', 'admin@skinlove.com', '$2a$12$Vw.hbPZirvfSqo/LMWKAI.iSyK.u07kOqWc1hBjPU4LCPTnB/lpA.', 'admin', 'normal'),
  ('Demo User', 'demo@skinlove.com', '$2a$12$aJEar9oiCLUanC1NZZScpeTxju0mO6r5y.eu2cHIWcRiPqDnFdHjK', 'user', 'combination')
ON CONFLICT (email) DO NOTHING;

-- ---------- PRODUCTS ----------
INSERT INTO products (name, brand, type, description, price, rating, skin_types) VALUES
  ('Vaseline Petroleum Jelly', 'Vaseline', 'Moisturizer', 'Seals in moisture overnight — a Uganda household staple for dry patches and elbows.', 'UGX 18,000', 4.6, ARRAY['dry','normal']),
  ('Beauty Bar', 'Dove', 'Cleanser', 'Gently cleanses without stripping — sulphate-free and kind to sensitive skin.', 'UGX 12,500', 4.7, ARRAY['dry','normal','sensitive']),
  ('Nivea Creme', 'Nivea', 'Moisturizer', 'Rich all-purpose cream for hands, face and body in hot, dry weather.', 'UGX 27,000', 4.5, ARRAY['dry','normal']),
  ('Oil-Free Acne Wash', 'Neutrogena', 'Cleanser', '2% salicylic acid gel wash that clears breakouts without over-drying oily skin.', 'UGX 45,000', 4.4, ARRAY['oily']),
  ('Hydrating Facial Cleanser', 'CeraVe', 'Cleanser', 'Ceramide-rich cream cleanser that protects the moisture barrier.', 'UGX 52,000', 4.8, ARRAY['dry','sensitive']),
  ('Kind to Skin Face Wash', 'Simple', 'Cleanser', 'No perfume, no parfum — a gentle foaming wash for reactive, sensitive skin.', 'UGX 32,000', 4.5, ARRAY['sensitive','combination']),
  ('Natural White Light Moisturiser', 'Olay', 'Moisturizer', 'Lightweight daily cream that evens tone and brightens melanin-rich skin.', 'UGX 38,000', 4.3, ARRAY['normal','combination']),
  ('Naturals Shower Milk', 'Palmolive', 'Body Care', 'Creamy body wash with natural extracts — leaves skin soft, never tight.', 'UGX 15,000', 4.2, ARRAY['normal','dry']),
  ('Flawless Radiance Derma+ Cleanser', 'Pond''s', 'Cleanser', 'Brightening foaming cleanser that targets dullness and uneven tone.', 'UGX 24,000', 4.4, ARRAY['normal','combination']),
  ('Advanced Multivitamin Cream', 'Glow & Lovely', 'Moisturizer', 'Affordable daily glow cream with multivitamins — popular across East Africa.', 'UGX 9,500', 4.1, ARRAY['normal','oily']),
  ('Sun Protect & Moisture SPF 50', 'Nivea', 'Sunscreen', 'Light, non-greasy daily SPF — essential for equatorial UV protection.', 'UGX 48,000', 4.7, ARRAY['oily','dry','normal','combination','sensitive']),
  ('Gluta-Hya Radiant Glow Serum Lotion', 'Vaseline', 'Body Care', 'Body lotion with glutahyaluronic complex for smooth, luminous skin.', 'UGX 33,000', 4.5, ARRAY['dry','normal']),
  ('Hydro Boost Water Gel', 'Neutrogena', 'Moisturizer', 'Oil-free gel hydration that keeps oily skin comfortable in humid weather.', 'UGX 78,000', 4.8, ARRAY['oily','combination']),
  ('SA Smoothing Cleanser', 'CeraVe', 'Treatment', 'Salicylic acid + ceramides for rough, bumpy skin and clogged pores.', 'UGX 55,000', 4.6, ARRAY['oily','combination']);

-- ---------- STORES (Kampala) ----------
INSERT INTO stores (name, latitude, longitude, hours, available_products) VALUES
  ('SkinLove Flagship — Kampala Road', 0.347600, 32.582500, 'Mon–Sat 8:30–19:00', ARRAY['Vaseline','Dove','Nivea','CeraVe','Neutrogena']),
  ('Shoprite Kisementi', 0.340600, 32.586200, 'Daily 8:00–21:00', ARRAY['Dove','Nivea','Simple','Palmolive','Pond''s']),
  ('Acacia Mall — Kololo', 0.320600, 32.593000, 'Daily 9:00–20:00', ARRAY['CeraVe','Neutrogena','Nivea','Olay']),
  ('Garden City Mall — Yusuf Lule Rd', 0.333700, 32.586600, 'Daily 9:00–20:00', ARRAY['Vaseline','Glow & Lovely','Pond''s','Dove']),
  ('Lugogo Mall — Lugogo Bypass', 0.327500, 32.601300, 'Daily 9:00–19:30', ARRAY['Nivea','Simple','Olay','Palmolive']),
  ('Ntinda Shopping Centre', 0.336500, 32.641000, 'Mon–Sat 8:00–19:00', ARRAY['Glow & Lovely','Vaseline','Dove','Palmolive']),
  ('Kabalagala Plaza', 0.307700, 32.634000, 'Daily 8:30–18:30', ARRAY['Glow & Lovely','Nivea','Vaseline']);
