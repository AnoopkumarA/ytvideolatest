# Deployment Guide

## Frontend (Vercel)

1. **Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

2. **Environment Variables:**
   ```
   VITE_API_BASE_URL=https://your-backend-domain.com
   ```

3. **Deploy:**
   - Connect your GitHub repo to Vercel
   - Vercel will auto-deploy on push

## Backend (Render/Railway/Fly/VPS)

### Option 1: Render (Recommended for beginners)

1. **Create new Web Service**
2. **Build Command:** `npm install`
3. **Start Command:** `node server.js`
4. **Environment Variables:**
   ```
   PORT=10000
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_S3_BUCKET=your-bucket-name
   AWS_REGION=us-east-1
   CLEANUP_LOCAL_FILES=false
   ```

### Option 2: Railway

1. **Deploy from GitHub**
2. **Add environment variables** (same as above)
3. **Railway auto-assigns PORT**

### Option 3: VPS/DigitalOcean

1. **Install Node.js 18+**
2. **Clone repo and run:**
   ```bash
   npm install
   npm start
   ```
3. **Use PM2 for production:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "ytvideo-api"
   pm2 startup
   ```

## S3 Setup (Optional but Recommended)

1. **Create S3 Bucket:**
   - Name: `your-bucket-name`
   - Region: `us-east-1` (or your choice)
   - Make it public (for direct downloads)

2. **Create IAM User:**
   - Policy: `AmazonS3FullAccess` (or custom policy for just your bucket)
   - Get Access Key ID and Secret Access Key

3. **Set Environment Variables** in your backend hosting platform

## What Happens Now

- **Dev**: Frontend proxies `/api/*` to `localhost:5174`
- **Prod**: Frontend calls `VITE_API_BASE_URL/api/*` directly
- **Storage**: Files go to S3 (if configured) or local disk (fallback)
- **Downloads**: Users get S3 URLs or local `/downloads/*` URLs

## Benefits

✅ **Frontend**: Fast, global CDN via Vercel  
✅ **Backend**: Persistent storage via S3  
✅ **Downloads**: Work even after server restarts  
✅ **Scalability**: Multiple backend instances can share S3 storage  
✅ **Fallback**: Works without S3 (local storage)
