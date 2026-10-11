# Architecture & System Design

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SKINCARE RECOMMENDER APP                       │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND LAYER                                │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Browser                                                           │  │
│  │  ┌──────────────┬─────────────┬──────────────┬────────────────┐   │  │
│  │  │   Home Page  │ Quiz Page   │ Products Page│ Stores Page   │   │  │
│  │  └──────────────┴─────────────┴──────────────┴────────────────┘   │  │
│  │  ┌──────────────┬──────────────────────────────────────────────┐   │  │
│  │  │   Admin      │            Chatbot Widget                   │   │  │
│  │  │  Dashboard   │     (Floating in bottom-right)              │   │  │
│  │  └──────────────┴──────────────────────────────────────────────┘   │  │
│  │                                                                    │  │
│  │  Technologies: HTML5, CSS3, Vanilla JavaScript                    │  │
│  │  ├─ index.html (15KB) - Page structure                            │  │
│  │  ├─ styles.css (30KB) - Beautiful styling                         │  │
│  │  └─ script.js (25KB) - Logic & API calls                          │  │
│  │                                                                    │  │
│  │  Design: Pink/Magenta theme, Floating background, Responsive     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
              (HTTP Requests)   (WebSockets ready)    │
                  │                 │                 │
                  ▼                 ▼                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY / SERVER                            │
│                                                                           │
│  Node.js + Express.js (Port 5000)                                        │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Routes / Endpoints (20 Total)                                     │  │
│  │ ┌──────────────┬──────────────┬──────────────┬─────────────────┐  │  │
│  │ │   Auth       │  Products    │   Stores     │  Skin Analysis  │  │  │
│  │ │  /register   │  /products   │  /stores     │  /skin/quiz     │  │  │
│  │ │  /login      │  /products/:id│/stores/near │  /skin/image    │  │  │
│  │ │  /profile    │ POST/PUT/DEL  │            │  /skin/history  │  │  │
│  │ └──────────────┴──────────────┴──────────────┴─────────────────┘  │  │
│  │ ┌──────────────┬──────────────┬──────────────┐                   │  │
│  │ │   Chatbot    │   Admin      │   Usage      │                   │  │
│  │ │  /chat       │  /admin/stats│  /track      │                   │  │
│  │ │  /message    │  /users      │  /user       │                   │  │
│  │ └──────────────┴──────────────┴──────────────┘                   │  │
│  │                                                                    │  │
│  │ Middleware:                                                      │  │
│  │ ├─ CORS (Cross-Origin Resource Sharing)                          │  │
│  │ ├─ Authentication (JWT verification)                             │  │
│  │ ├─ Error Handling                                                │  │
│  │ └─ Rate Limiting (ready to implement)                            │  │
│  │                                                                    │  │
│  │ File Upload: Multer (for images, max 50MB)                       │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
        │   MongoDB        │  │   File       │  │  Environment │
        │   Database       │  │   System     │  │  Variables   │
        │                  │  │              │  │              │
        │  Collections:    │  │ uploads/     │  │  .env file   │
        │  ├─ Users        │  │  (images)    │  │              │
        │  ├─ Products     │  │              │  │ - MONGO_URI  │
        │  ├─ Stores       │  │ 50MB max     │  │ - JWT_SECRET │
        │  ├─ Analyses     │  │              │  │ - PORT       │
        │  └─ Usage        │  │              │  │ - NODE_ENV   │
        │                  │  │              │  │              │
        └──────────────────┘  └──────────────┘  └──────────────┘
```

---

## Data Flow Diagrams

### 1. Authentication Flow
```
User Registers
    │
    ├─→ frontend/index.html (Register Form)
    │
    ├─→ frontend/script.js (handleRegister)
    │
    ├─→ HTTP POST /api/auth/register
    │     └─→ {username, email, password}
    │
    ├─→ backend/routes/auth.js
    │     └─→ Create User in MongoDB
    │
    ├─→ backend/models/User.js
    │     └─→ Hash password (bcryptjs)
    │     └─→ Save to MongoDB
    │
    ├─→ Response: Success/Error
    │
    └─→ User can now login

User Logs In
    │
    ├─→ HTTP POST /api/auth/login
    │     └─→ {email, password}
    │
    ├─→ backend/routes/auth.js
    │     ├─→ Find user by email
    │     ├─→ Compare passwords
    │     └─→ Generate JWT token
    │
    ├─→ Return {token, user}
    │
    ├─→ localStorage.setItem('token', token)
    │
    └─→ Show main app
```

### 2. Skin Analysis Flow
```
User Takes Quiz
    │
    ├─→ frontend/index.html (Quiz Form)
    │     Questions: oiliness, pores, texture, moisture, flaking, sensitivity
    │
    ├─→ frontend/script.js (submitQuiz)
    │
    ├─→ HTTP POST /api/skin/quiz
    │     └─→ {answers: {...}}
    │
    ├─→ backend/routes/skinAnalysis.js
    │     ├─→ Call determineSkinType(answers)
    │     ├─→ Create SkinAnalysis record
    │     └─→ Query matching products
    │
    ├─→ backend/models/SkinAnalysis.js
    │     └─→ Save analysis to MongoDB
    │
    ├─→ backend/models/Product.js
    │     └─→ Find products for skin type
    │
    ├─→ Return {skinType, recommendations}
    │
    ├─→ frontend/script.js (displayQuizResults)
    │
    └─→ Display results in UI
```

### 3. Store Finder Flow
```
User Clicks "Find Nearby Stores"
    │
    ├─→ frontend/script.js (findNearbyStores)
    │
    ├─→ navigator.geolocation.getCurrentPosition()
    │     └─→ Get user's latitude & longitude
    │
    ├─→ HTTP PUT /api/auth/profile
    │     └─→ Save coordinates to user
    │
    ├─→ HTTP GET /api/stores/nearby
    │
    ├─→ backend/routes/stores.js
    │     ├─→ Get all stores from database
    │     ├─→ For each store:
    │     │   └─→ calculateDistance(userCoords, storeCoords)
    │     │       └─→ Haversine formula
    │     └─→ Sort by distance, return top 10
    │
    ├─→ backend/models/Store.js
    │     └─→ Query stores collection
    │
    ├─→ Return sorted stores with distances
    │
    ├─→ frontend/script.js (displayStores)
    │
    └─→ Show on map/list in UI
```

### 4. Chatbot Conversation Flow
```
User Types Message
    │
    ├─→ frontend/script.js (sendMessage)
    │
    ├─→ Display user message in chat
    │
    ├─→ HTTP POST /api/chat/message
    │     └─→ {message: "user input"}
    │
    ├─→ backend/routes/chatbot.js
    │     ├─→ toLowerCase() message
    │     ├─→ Check keywords:
    │     │   ├─→ "hello" → chatResponses.greeting
    │     │   ├─→ "quiz" → chatResponses.skintype
    │     │   ├─→ "product" → chatResponses.products
    │     │   ├─→ "store" → chatResponses.stores
    │     │   ├─→ "help" → chatResponses.help
    │     │   └─→ default → chatResponses.default
    │     └─→ Select random response from category
    │
    ├─→ Return {message: response, timestamp}
    │
    ├─→ frontend/script.js (display bot message)
    │
    └─→ Animate message in chat box
```

---

## Database Schema Relationships

```
User (1) ──────┬────────── (Many) SkinAnalysis
               │
               ├────────── (Many) Usage
               │
               └────────── (1 or 0) Profile

Product (0 or Many) ────── Store (1)

SkinAnalysis ────────────┬─ (Many) Product (recommendations)
                         │
                         └─ (1) User

Usage ─────────────────── (1) User
```

---

## Component Hierarchy

```
App
├── Navigation Bar
│   ├── Logo
│   ├── Menu Items
│   └── Auth Links
│
├── Main Content
│   ├── Home Page
│   │   ├── Hero Section
│   │   └── Features Grid
│   │
│   ├── Skin Quiz Page
│   │   ├── Tab Navigation
│   │   ├── Quiz Form
│   │   │   ├── Range Sliders
│   │   │   └── Select Dropdowns
│   │   ├── Image Upload
│   │   └── Results Section
│   │
│   ├── Products Page
│   │   ├── Filter Section
│   │   └── Products Grid
│   │       └── Product Cards (x8+)
│   │
│   ├── Stores Page
│   │   ├── Location Button
│   │   └── Stores Grid
│   │       └── Store Cards (x6+)
│   │
│   └── Admin Dashboard
│       ├── Statistics Cards
│       └── Usage Charts
│
├── Chatbot Widget
│   ├── Header
│   ├── Messages Area
│   └── Input Area
│
├── Auth Modal
│   ├── Tab Navigation
│   ├── Login Form
│   └── Register Form
│
└── Floating Background
    └── 5 Animated Circles
```

---

## API Rate Limiting (Ready to Implement)

```
/api/auth/login       - 5 attempts per 15 minutes per IP
/api/auth/register    - 3 new users per hour per IP
/api/skin/image       - 10 uploads per hour per user
/api/stores/nearby    - 20 requests per 10 minutes per user
/api/ (general)       - 100 requests per 15 minutes per IP
```

---

## Security Layers

```
Request → CORS Check
           ↓
        Express Middleware (compression, helmet)
           ↓
        Rate Limiting
           ↓
        JWT Verification (if protected route)
           ↓
        Input Validation (Mongoose schema)
           ↓
        Database Query
           ↓
        Response Encryption (HTTPS in production)
           ↓
        Client
```

---

## Deployment Architecture

### Development
```
Laptop
├── Frontend (http://localhost:8000)
├── Backend (http://localhost:5000)
└── MongoDB (local)
```

### Production (Recommended)
```
┌─────────────────────────────────────────┐
│          Cloudflare / CDN               │ ← SSL/Cache
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌───────────┐
│Frontend│  │Backend │  │ MongoDB   │
│(Netlify)  │(Heroku)│  │(Atlas)    │
│or S3      │or AWS  │  │(Cloud)    │
└────────┘  └────────┘  └───────────┘
    │            │            │
    └────────────┴────────────┘
           ↓
       User Devices
```

---

## Performance Optimization Points

```
Frontend
├─ CSS Minification
├─ Image Optimization
├─ JavaScript Bundling
└─ Caching Strategy

Backend
├─ Database Indexing
├─ Query Optimization
├─ Response Compression
├─ Caching (Redis)
└─ CDN for static files

Database
├─ Connection Pooling
├─ Query Indexing
└─ Data Backup
```

---

## Monitoring & Logging

```
Frontend Monitoring
├─ Browser console errors
├─ Network requests
├─ Page performance
└─ User interactions

Backend Monitoring
├─ Server logs
├─ Database performance
├─ API response times
├─ Error rates
└─ User authentication logs

Production Monitoring Tools
├─ Sentry (error tracking)
├─ New Relic (performance)
├─ DataDog (infrastructure)
└─ CloudWatch (AWS logs)
```

---

## Scalability Plan

### Stage 1: Current (0-100 Users)
- Single backend instance
- Single MongoDB instance
- Simple server

### Stage 2: Growth (100-1000 Users)
- Load balancer
- Multiple backend instances
- MongoDB sharding
- Redis caching

### Stage 3: Scale (1000+ Users)
- Kubernetes orchestration
- Microservices
- Advanced caching
- Database replication
- CDN distribution

---

This architecture is designed for:
- ✅ **Security** - Authentication, validation, HTTPS
- ✅ **Performance** - Fast responses, caching, CDN-ready
- ✅ **Scalability** - Ready for growth
- ✅ **Maintainability** - Clear structure, documented
- ✅ **User Experience** - Beautiful design, responsive

---

For more details, see other documentation files!
