# Quick Start Guide

## Step-by-Step Setup

### 1. MongoDB Setup
- Install MongoDB Community Edition
- Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas
- Make sure MongoDB is running

### 2. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Make sure .env file exists with correct MongoDB URI
# The file should contain:
# MONGODB_URI=mongodb://localhost:27017/skincare-recommender
# JWT_SECRET=your_jwt_secret_key_change_in_production

# Start the server
npm start

# You should see: "Server running on port 5000"
# and "Connected to MongoDB"
```

### 3. Frontend Setup (in a new terminal)

```bash
# Navigate to frontend folder
cd frontend

# Start a simple HTTP server
# Option A - Using Python 3
python -m http.server 8000

# Option B - Using Python 2
python -m SimpleHTTPServer 8000

# Option C - Using Node.js
npx http-server
```

### 4. Access the Application

Open your browser and go to:
- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:5000/api

### 5. First Time Use

1. **Register an account** - Click "Register" tab
2. **Login** with your credentials
3. **Take the Skin Quiz** - Answer questions about your skin
4. **View Products** - See recommendations
5. **Find Stores** - Enable location to find nearby stores

## Sample Test Data

### Create Test Account
- Email: test@example.com
- Password: test123
- Username: testuser

### Add Sample Products (via Admin)

If you need to add products to database:

```bash
# Use MongoDB Compass or mongo CLI

db.products.insertOne({
  name: "Moisturizing Lotion",
  price: 22.99,
  skinTypes: ["dry"],
  brand: "SkinCare Pro",
  category: "Moisturizer",
  description: "Deeply hydrating moisturizer",
  benefits: ["Hydrating", "Nourishing"],
  rating: 4.5,
  reviews: 120
})
```

### Add Sample Stores

```bash
db.stores.insertOne({
  name: "Beauty Plus",
  address: "123 Main St, City",
  coordinates: { lat: 40.7128, lng: -74.0060 },
  phone: "(555) 123-4567",
  hours: "9AM - 9PM",
  rating: 4.8
})
```

## Common Commands

### Development Mode (Hot Reload)
```bash
cd backend
npm run dev
```

### Check if ports are in use
```bash
# Windows
netstat -ano | findstr :5000
netstat -ano | findstr :8000

# Mac/Linux
lsof -i :5000
lsof -i :8000
```

### Kill process on port
```bash
# Windows
taskkill /PID <PID> /F

# Mac/Linux
kill -9 <PID>
```

## Troubleshooting

### Issue: "Cannot find module"
**Solution:** Run `npm install` in the backend directory

### Issue: MongoDB connection failed
**Solution:** 
- Check if MongoDB is running
- Verify connection string in `.env`
- Ensure database exists

### Issue: CORS errors
**Solution:** The backend already has CORS enabled for all origins

### Issue: "Port 5000 already in use"
**Solution:** 
- Find and kill the process using port 5000
- Or change PORT in `.env`

### Issue: Skin quiz not working
**Solution:**
- Check browser console for errors
- Verify backend is running
- Check network tab in DevTools

## Features Walkthrough

### 🧴 Skin Analysis
1. Go to "Skin Quiz" tab
2. Answer questions about your skin
3. Get instant skin type classification
4. View personalized product recommendations

### 💄 Products Page
1. View all recommended products
2. Filter by skin type
3. See product details, price, and ratings

### 📍 Find Stores
1. Click "Get My Location & Find Stores"
2. Allow browser location access
3. See nearby stores selling your products
4. Check store hours and contact info

### 💬 Chatbot
1. Click chatbot in bottom-right corner
2. Ask skincare questions
3. Get instant responses

### 📊 Admin Dashboard (Admins Only)
1. View total users and analyses
2. Check feature usage statistics
3. Monitor platform activity

## Next Steps

After setup, you can:

1. **Customize Design**
   - Edit colors in `frontend/styles.css`
   - Modify layout in `frontend/index.html`

2. **Add More Products**
   - Use MongoDB Compass
   - Or create admin panel features

3. **Improve Chatbot**
   - Add more responses in `backend/routes/chatbot.js`
   - Integrate with real AI API

4. **Deploy**
   - Use Heroku for backend
   - Use Netlify/Vercel for frontend
   - Use MongoDB Atlas for database

## Support Files

- **Backend Error Logs**: Check terminal output
- **Frontend Errors**: Check browser Console (F12)
- **Database Issues**: Use MongoDB Compass

---

**You're all set! Enjoy building! 🚀✨**
