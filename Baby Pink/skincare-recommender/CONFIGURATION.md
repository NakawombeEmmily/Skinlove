# Configuration Guide

## Frontend Customization

### Color Scheme (CSS Variables)

Edit `frontend/styles.css` to change colors:

```css
:root {
    --primary-color: #ff69b4;      /* Main pink */
    --secondary-color: #ff1493;    /* Bright pink */
    --light-bg: #fff5f8;           /* Light background */
    --light-accent: #ffe0ec;       /* Light accent */
    --dark-text: #2c2c2c;          /* Text color */
    --light-text: #666;            /* Secondary text */
    --border-radius: 20px;         /* Button/card roundness */
    --padding-lg: 40px;            /* Large padding */
    --padding-md: 24px;            /* Medium padding */
    --padding-sm: 12px;            /* Small padding */
}
```

**Popular Color Schemes:**

```css
/* Lavender Theme */
--primary-color: #b19cd9;
--secondary-color: #8b7ba8;
--light-bg: #f3f0f7;
--light-accent: #e8dff5;

/* Coral Theme */
--primary-color: #ff6b6b;
--secondary-color: #ff5252;
--light-bg: #fff5f5;
--light-accent: #ffe0e0;

/* Mint Theme */
--primary-color: #64d5ca;
--secondary-color: #4ab8ad;
--light-bg: #f0fffe;
--light-accent: #d5f5f0;

/* Berry Theme */
--primary-color: #e91e63;
--secondary-color: #c2185b;
--light-bg: #fce4ec;
--light-accent: #f8bbd0;
```

### Font Customization

Update font in `styles.css`:

```css
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Or use Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

body {
    font-family: 'Poppins', sans-serif;
}
```

### Logo & Branding

Update in `index.html`:

```html
<div class="logo">✨ Skincare Pro</div>
```

Replace with your logo:

```html
<div class="logo">
    <img src="path/to/logo.png" alt="Logo" style="height: 40px;">
</div>
```

## Backend Customization

### Environment Variables

Create `.env` file in backend:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/skincare-recommender

# Server
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=7d

# Email Service (Optional)
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@yoursite.com

# Google Maps (Optional)
GOOGLE_MAPS_API_KEY=your-api-key

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads

# CORS
ALLOWED_ORIGINS=http://localhost:8000,https://yourdomain.com

# Logging
LOG_LEVEL=info
```

### Skin Types

Customize skin types in `backend/routes/skinAnalysis.js`:

```javascript
function determineSkinType(answers) {
    let scores = {
        oily: 0,
        dry: 0,
        sensitive: 0
    };

    // Add your custom logic
    if (answers.oiliness > 7) scores.oily += 2;
    if (answers.moisture < 3) scores.dry += 2;
    if (answers.sensitivity > 7) scores.sensitive += 2;

    // Return highest score
    return Object.keys(scores).reduce((a, b) => 
        scores[a] > scores[b] ? a : b
    );
}
```

### Product Categories

Add new product categories:

```javascript
// In models/Product.js
const productSchema = new mongoose.Schema({
    // ... existing fields
    category: {
        type: String,
        enum: ['Cleanser', 'Toner', 'Serum', 'Moisturizer', 'Mask', 'Sunscreen', 'Treatment']
    }
});
```

### Chatbot Responses

Customize chatbot in `backend/routes/chatbot.js`:

```javascript
const chatResponses = {
    greeting: [
        'Hello! Welcome to Skincare Pro 👋',
        'Hi! What can I help with? 😊'
    ],
    skintype: [
        'Let\'s identify your skin type! 🧴',
        'Answer a few questions about your skin.'
    ],
    products: [
        'Browse our skincare collection 💄',
        'Find products for your skin type'
    ],
    // Add more categories and responses
};
```

### Email Notifications

Add email service (using SendGrid):

```javascript
// In routes/auth.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendWelcomeEmail(email, username) {
    await sgMail.send({
        to: email,
        from: process.env.EMAIL_FROM,
        subject: 'Welcome to Skincare Pro! 👋',
        html: `<h1>Welcome ${username}!</h1><p>Start your skincare journey today.</p>`
    });
}
```

## API Customization

### Add New Endpoints

Create new route file `backend/routes/reviews.js`:

```javascript
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Get reviews for product
router.get('/product/:id', async (req, res) => {
    // Implementation
});

// Post review
router.post('/product/:id', authMiddleware, async (req, res) => {
    // Implementation
});

module.exports = router;
```

Add to `server.js`:

```javascript
app.use('/api/reviews', require('./routes/reviews'));
```

### Authentication Customization

Add social login (Google, Facebook):

```javascript
// Install passport and strategies
npm install passport passport-google-oauth20 passport-facebook

// Configure in server.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
    // User authentication logic
}));
```

## Database Schema Customization

### Add Admin Features

Extend User model:

```javascript
const userSchema = new mongoose.Schema({
    // ... existing fields
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    permissions: [String],
    status: {
        type: String,
        enum: ['active', 'suspended', 'deleted'],
        default: 'active'
    },
    preferences: {
        newsletter: Boolean,
        notifications: Boolean
    }
});
```

### Add Product Reviews

```javascript
const reviewSchema = new mongoose.Schema({
    productId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    rating: { type: Number, min: 1, max: 5 },
    text: String,
    helpful: Number,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
```

## Performance Optimization

### Enable Caching

```javascript
// In server.js
const redis = require('redis');
const client = redis.createClient();

app.use(async (req, res, next) => {
    if (req.method === 'GET') {
        const key = req.originalUrl;
        const cachedData = await client.get(key);
        if (cachedData) return res.json(JSON.parse(cachedData));
    }
    next();
});
```

### Compression

```javascript
const compression = require('compression');
app.use(compression());
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Security Hardening

### Helmet.js for HTTP Headers

```javascript
const helmet = require('helmet');
app.use(helmet());
```

### Input Validation

```javascript
const { body, validationResult } = require('express-validator');

router.post('/register', [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('username').isAlphanumeric()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Proceed with registration
});
```

### SQL/Injection Prevention

```javascript
// Already protected with MongoDB and Mongoose
// Use parameterized queries
Product.find({ skinTypes: userInput }); // Safe
```

## Testing

### Setup Jest Testing

```javascript
// Install
npm install --save-dev jest supertest

// Create test file: __tests__/auth.test.js
const request = require('supertest');
const app = require('../server');

describe('Auth Routes', () => {
    test('POST /api/auth/register should create user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'test123456'
            });
        expect(res.statusCode).toBe(201);
    });
});
```

## Monitoring & Logging

### Winston Logger

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Use in routes
logger.info('User login successful', { userId: req.userId });
```

---

For more customization options, refer to:
- Express.js: https://expressjs.com
- MongoDB: https://docs.mongodb.com
- Mongoose: https://mongoosejs.com
- React (if converting frontend): https://reactjs.org
