# Skincare Recommender - Full Stack Web Application

A comprehensive web application that helps users identify their skin type and get personalized skincare product recommendations with nearby store locations.

## Features

✨ **Key Features:**
- **Skin Type Detection**: Quiz-based analysis and AI image recognition
- **Product Recommendations**: Personalized skincare products based on skin type
- **Location-Based Store Finder**: Find nearby stores where you can purchase products
- **Smart Chatbot**: Rule-based assistant for skincare guidance
- **Admin Dashboard**: Monitor usage statistics and user data
- **Usage Tracking**: Track feature usage over time

## Technology Stack

**Backend:**
- Node.js + Express.js
- MongoDB
- JWT Authentication
- Multer for file uploads

**Frontend:**
- HTML5
- CSS3 (with animations and gradients)
- Vanilla JavaScript
- Responsive Design

## Project Structure

```
skincare-recommender/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Store.js
│   │   ├── SkinAnalysis.js
│   │   └── Usage.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── stores.js
│   │   ├── skinAnalysis.js
│   │   ├── admin.js
│   │   ├── chatbot.js
│   │   └── usage.js
│   ├── middleware/
│   │   └── auth.js
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd skincare-recommender/backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables** (`.env`):
```
MONGODB_URI=mongodb://localhost:27017/skincare-recommender
JWT_SECRET=your_jwt_secret_key_change_in_production
PORT=5000
NODE_ENV=development
```

4. **Start the backend server:**
```bash
npm start
```
Or for development with hot reload:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd skincare-recommender/frontend
```

2. **Serve the frontend** (using Python or any HTTP server):
```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js http-server
npx http-server
```

The frontend will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Products
- `GET /api/products` - Get all products (optional: ?skinType=oily)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Skin Analysis
- `POST /api/skin/quiz` - Quiz-based skin analysis
- `POST /api/skin/image` - Image-based skin analysis
- `GET /api/skin/history` - Get analysis history

### Stores
- `GET /api/stores` - Get all stores
- `GET /api/stores/nearby` - Get nearby stores (requires user location)
- `POST /api/stores` - Create store (admin only)

### Chat
- `POST /api/chat/message` - Send message to chatbot

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/usage` - Get usage statistics

### Usage Tracking
- `POST /api/usage/track` - Track feature usage
- `GET /api/usage/user` - Get user usage stats

## Usage Guide

### For Users

1. **Register/Login**
   - Create an account or login with existing credentials

2. **Analyze Your Skin**
   - Take the skin quiz OR upload a photo
   - Get instant recommendations based on your skin type

3. **Browse Products**
   - View personalized product recommendations
   - Filter by skin type
   - See ratings and descriptions

4. **Find Nearby Stores**
   - Enable location access
   - View stores near you that sell the products
   - See store details and distances

5. **Chat Support**
   - Ask questions to the chatbot
   - Get skincare tips and guidance

### For Admins

1. **Access Admin Dashboard**
   - View total users and analyses
   - Monitor feature usage statistics
   - Track user activity over time

2. **Add Products**
   - Create new skincare products
   - Specify applicable skin types
   - Set pricing and details

3. **Add Stores**
   - Add new store locations
   - Include store details and coordinates
   - Specify available products

## Skin Types Supported

- **Oily** - High oil production, enlarged pores
- **Dry** - Flaking, tightness, low hydration
- **Combination** - Mix of oily and dry areas
- **Sensitive** - Reactive, prone to irritation
- **Normal** - Balanced, minimal issues

## Design Features

🎨 **Beautiful UI Design:**
- Girlish color scheme (pink/magenta theme)
- Floating background animations
- Smooth transitions and hover effects
- Professional padding and spacing
- Responsive design for all devices
- Light theme for easy readability

## Future Enhancements

- [ ] Real image analysis with ML models
- [ ] Google Maps API integration
- [ ] Advanced filtering and sorting
- [ ] User reviews and ratings system
- [ ] Push notifications
- [ ] Mobile app version
- [ ] Social features (referrals, sharing)
- [ ] E-commerce integration

## Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check connection string in `.env`

**CORS Errors:**
- Backend must allow frontend origin
- Frontend must send correct Authorization headers

**Image Upload Issues:**
- Check file size limits (50MB max)
- Ensure uploads folder has write permissions

**Geolocation Not Working:**
- Must use HTTPS in production
- Allow browser location permissions
- Check browser console for errors

## Database Seeding (Optional)

Create sample data by running database queries:

```javascript
// Sample products
db.products.insertMany([
  {
    name: "Hydrating Cleanser",
    price: 15.99,
    skinTypes: ["dry", "sensitive"],
    brand: "SkinCare Co",
    category: "Cleanser",
    benefits: ["Hydrating", "Gentle"]
  },
  // ... more products
]);
```

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please create an issue in the repository or contact support.

---

**Happy skincare shopping! ✨💄**
