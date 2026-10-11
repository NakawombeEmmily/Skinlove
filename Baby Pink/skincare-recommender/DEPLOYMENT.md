# Deployment Guide

## Production Deployment Options

### Option 1: Heroku (Backend) + Netlify (Frontend)

#### Backend Deployment to Heroku

1. **Install Heroku CLI**
```bash
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

2. **Create Heroku App**
```bash
heroku login
cd backend
heroku create your-skincare-app
```

3. **Add MongoDB Atlas**
```bash
# Create free MongoDB Atlas database at https://www.mongodb.com/cloud/atlas
# Copy connection string
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/skincare-recommender"
heroku config:set JWT_SECRET="your-production-secret-key"
```

4. **Deploy**
```bash
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

5. **View Logs**
```bash
heroku logs --tail
```

#### Frontend Deployment to Netlify

1. **Build Frontend** (if using build tools)
```bash
cd frontend
npm run build  # if you set up build tools
```

2. **Deploy to Netlify**
   - Drag and drop `frontend` folder to Netlify
   - Or connect GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist` or `frontend`

3. **Update API URL in script.js**
```javascript
const API_BASE_URL = 'https://your-skincare-app.herokuapp.com/api';
```

---

### Option 2: AWS (Recommended for Production)

#### Backend on AWS EC2

1. **Launch EC2 Instance**
   - AMI: Ubuntu 20.04 LTS
   - Instance type: t2.micro (free tier)
   - Security group: Allow ports 80, 443, 5000

2. **SSH into Instance**
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

3. **Install Node.js and MongoDB**
```bash
sudo apt update
sudo apt install nodejs npm
# Or use NodeSource for latest Node:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# Install MongoDB
sudo apt install mongodb
sudo systemctl start mongodb
```

4. **Upload Backend Files**
```bash
scp -i your-key.pem -r backend ubuntu@your-instance-ip:~/
```

5. **Setup Backend**
```bash
cd backend
npm install
sudo nano .env  # Add production variables
npm start  # or use PM2
```

6. **Use PM2 for Process Management**
```bash
sudo npm install -g pm2
pm2 start server.js --name "skincare-backend"
pm2 startup
pm2 save
```

7. **Setup Nginx Reverse Proxy**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/default
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

8. **Get SSL Certificate (Let's Encrypt)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### Frontend on AWS S3 + CloudFront

1. **Create S3 Bucket**
   - Enable Static website hosting
   - Block all public access OFF
   - Add bucket policy for public read access

2. **Upload Frontend Files**
```bash
aws s3 sync frontend s3://your-bucket-name --delete
```

3. **Create CloudFront Distribution**
   - Origin: S3 bucket
   - Viewer protocol: HTTPS
   - Create distribution

4. **Update DNS**
   - Point domain to CloudFront distribution

---

### Option 3: DigitalOcean (Budget-Friendly)

1. **Create Droplet**
   - Size: $5/month
   - OS: Ubuntu 20.04
   - Add SSH key

2. **SSH and Setup**
```bash
ssh root@your-droplet-ip
apt update && apt upgrade -y
apt install nodejs npm mongodb nginx -y
```

3. **Follow AWS EC2 steps above**

---

### Option 4: Docker Deployment

1. **Create Dockerfile for Backend**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

2. **Create docker-compose.yml**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://mongodb:27017/skincare-recommender
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - mongodb

  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./frontend:/usr/share/nginx/html

volumes:
  mongodb_data:
```

3. **Deploy**
```bash
docker-compose up -d
```

---

## Environment Variables for Production

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skincare-recommender

# Security
JWT_SECRET=your-strong-secret-key-min-32-chars
NODE_ENV=production

# Server
PORT=5000

# Optional: Email Service
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@skincare-recommender.com

# Optional: File Upload
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=your-bucket

# Optional: Image Analysis
ML_API_KEY=your-ml-api-key
```

---

## Pre-Deployment Checklist

- [ ] Update JWT_SECRET to strong random string
- [ ] Use production MongoDB URI (MongoDB Atlas)
- [ ] Set NODE_ENV=production
- [ ] Update API_BASE_URL in frontend
- [ ] Enable HTTPS
- [ ] Setup SSL certificates
- [ ] Configure CORS properly
- [ ] Setup automated backups
- [ ] Test all features in staging
- [ ] Setup monitoring and logging
- [ ] Configure error tracking (Sentry)
- [ ] Setup CDN for static files
- [ ] Configure rate limiting
- [ ] Setup admin credentials

---

## Monitoring & Maintenance

### Using PM2 for Monitoring
```bash
pm2 monit
pm2 logs
pm2 save
pm2 startup
```

### Backup MongoDB
```bash
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/db"
```

### Update Dependencies
```bash
npm update
npm audit fix
```

### Monitor Performance
- Use New Relic
- Use Datadog
- Use CloudWatch

---

## Scaling Considerations

- Use MongoDB Atlas auto-scaling
- Enable CDN for static files
- Implement caching (Redis)
- Use load balancing
- Optimize database queries
- Implement image optimization
- Use API rate limiting

---

## Troubleshooting Deployment

**502 Bad Gateway**
- Check if backend service is running
- Verify proxy settings

**CORS Errors**
- Update CORS configuration in server.js
- Check frontend API URL

**Database Connection**
- Verify connection string
- Check MongoDB Atlas IP whitelist
- Test connection locally

**Slow Performance**
- Optimize database queries
- Enable caching
- Reduce file sizes
- Use CDN

---

## Cost Estimation (Monthly)

- Heroku: $7-50
- Netlify: Free-$19
- AWS: $1-20
- DigitalOcean: $5-50
- MongoDB Atlas: Free-100+

**Recommended Budget Setup:**
- DigitalOcean Droplet: $5
- MongoDB Atlas: Free
- CloudFlare: Free
- **Total: ~$5/month**

---

For detailed guides:
- Heroku: https://devcenter.heroku.com
- AWS: https://aws.amazon.com/getting-started
- DigitalOcean: https://docs.digitalocean.com
- Docker: https://docs.docker.com
