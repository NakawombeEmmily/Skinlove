// Sample Data for MongoDB
// Copy and paste these in MongoDB Compass or mongo CLI

// Sample Products
db.products.insertMany([
  {
    name: "Oil Control Gel Cleanser",
    description: "Deep cleansing gel for oily skin",
    price: 14.99,
    skinTypes: ["oily"],
    category: "Cleanser",
    brand: "ClearSkin",
    benefits: ["Oil control", "Pore cleansing", "Bacteria fighting"],
    rating: 4.5,
    reviews: 245,
    createdAt: new Date()
  },
  {
    name: "Hydrating Cream Cleanser",
    description: "Gentle cream cleanser for dry skin",
    price: 16.99,
    skinTypes: ["dry"],
    category: "Cleanser",
    brand: "HydraGlow",
    benefits: ["Hydrating", "Gentle", "Nourishing"],
    rating: 4.7,
    reviews: 189,
    createdAt: new Date()
  },
  {
    name: "Balancing Toner",
    description: "Balanced toner for combination skin",
    price: 12.99,
    skinTypes: ["combination"],
    category: "Toner",
    brand: "BalanceFirst",
    benefits: ["pH balancing", "Pore minimizing"],
    rating: 4.3,
    reviews: 156,
    createdAt: new Date()
  },
  {
    name: "Sensitive Skin Serum",
    description: "Ultra-gentle serum for sensitive skin",
    price: 24.99,
    skinTypes: ["sensitive"],
    category: "Serum",
    brand: "SensitiveCare",
    benefits: ["Anti-inflammatory", "Soothing", "Hypoallergenic"],
    rating: 4.8,
    reviews: 312,
    createdAt: new Date()
  },
  {
    name: "Multi-Purpose Moisturizer",
    description: "Perfect for all skin types",
    price: 18.99,
    skinTypes: ["oily", "dry", "combination", "normal", "sensitive"],
    category: "Moisturizer",
    brand: "UniversalCare",
    benefits: ["Lightweight", "Non-comedogenic", "Versatile"],
    rating: 4.6,
    reviews: 401,
    createdAt: new Date()
  },
  {
    name: "Anti-Acne Spot Treatment",
    description: "Targeted acne treatment",
    price: 11.99,
    skinTypes: ["oily"],
    category: "Spot Treatment",
    brand: "ClearSpot",
    benefits: ["Fast acting", "Reduces redness", "Prevents blemishes"],
    rating: 4.4,
    reviews: 278,
    createdAt: new Date()
  },
  {
    name: "Deep Hydrating Mask",
    description: "Weekly hydration boost",
    price: 22.99,
    skinTypes: ["dry", "sensitive"],
    category: "Mask",
    brand: "HydraGlow",
    benefits: ["Deep hydration", "Intensive care"],
    rating: 4.9,
    reviews: 234,
    createdAt: new Date()
  },
  {
    name: "Oil Control Night Cream",
    description: "Overnight oil regulation",
    price: 19.99,
    skinTypes: ["oily", "combination"],
    category: "Night Cream",
    brand: "ClearSkin",
    benefits: ["Oil control", "Night restoration"],
    rating: 4.5,
    reviews: 167,
    createdAt: new Date()
  }
]);

// Sample Stores
db.stores.insertMany([
  {
    name: "Beauty Plus - Downtown",
    address: "123 Main Street, Downtown",
    coordinates: { lat: 40.7128, lng: -74.0060 },
    phone: "(555) 123-4567",
    hours: "9:00 AM - 9:00 PM",
    rating: 4.7,
    createdAt: new Date()
  },
  {
    name: "SkinCare Heaven",
    address: "456 Fashion Ave, Shopping District",
    coordinates: { lat: 40.7505, lng: -73.9972 },
    phone: "(555) 234-5678",
    hours: "10:00 AM - 8:00 PM",
    rating: 4.6,
    createdAt: new Date()
  },
  {
    name: "Glow & Radiance",
    address: "789 Park Lane, Midtown",
    coordinates: { lat: 40.7614, lng: -73.9776 },
    phone: "(555) 345-6789",
    hours: "9:00 AM - 10:00 PM",
    rating: 4.8,
    createdAt: new Date()
  },
  {
    name: "Pure Skin Boutique",
    address: "321 Garden Road, Uptown",
    coordinates: { lat: 40.7849, lng: -73.9681 },
    phone: "(555) 456-7890",
    hours: "10:00 AM - 7:00 PM",
    rating: 4.5,
    createdAt: new Date()
  },
  {
    name: "The Beauty Corner",
    address: "654 Oak Street, Westside",
    coordinates: { lat: 40.7282, lng: -74.0076 },
    phone: "(555) 567-8901",
    hours: "9:00 AM - 6:00 PM (Closed Sundays)",
    rating: 4.4,
    createdAt: new Date()
  },
  {
    name: "Cosmetics & Wellness",
    address: "987 Elm Boulevard, Riverside",
    coordinates: { lat: 40.7489, lng: -73.9680 },
    phone: "(555) 678-9012",
    hours: "11:00 AM - 9:00 PM",
    rating: 4.9,
    createdAt: new Date()
  }
]);

// Sample Users (for testing)
// Password: test123 (bcrypt hashed)
db.users.insertMany([
  {
    username: "beautylover",
    email: "beauty@example.com",
    password: "$2a$10$...", // bcrypt hashed password
    skinType: "oily",
    location: "Downtown",
    coordinates: { lat: 40.7128, lng: -74.0060 },
    isAdmin: false,
    createdAt: new Date()
  },
  {
    username: "admin",
    email: "admin@example.com",
    password: "$2a$10$...", // bcrypt hashed password
    skinType: "normal",
    location: "Central Office",
    coordinates: { lat: 40.7580, lng: -73.9855 },
    isAdmin: true,
    createdAt: new Date()
  }
]);

// Instructions:
// 1. Open MongoDB Compass
// 2. Connect to your database
// 3. Create a database called "skincare-recommender"
// 4. Open the database in the Compass console
// 5. Copy and paste the above data insertion commands one by one
// 6. Or copy the entire content and paste in mongo CLI

// If using mongo CLI:
// mongo
// use skincare-recommender
// Then paste the above commands

// Verify data was inserted:
db.products.find().count()  // Should show 8
db.stores.find().count()    // Should show 6
db.users.find().count()     // Should show 2
