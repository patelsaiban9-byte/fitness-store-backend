# 🌐 Cloudinary Setup Guide

## ✅ Cloudinary Integration Complete!

Your images are now stored in **Cloudinary** (cloud storage) instead of the local filesystem. This means:
- ✅ Images will **never disappear** (permanent storage)
- ✅ Automatic image optimization
- ✅ Fast CDN delivery
- ✅ Free tier: 25GB storage, 25GB bandwidth/month

---

## 📋 Setup Steps

### Step 1: Create Cloudinary Account (Free)

1. Go to: https://cloudinary.com/users/register/free
2. Sign up with email (or use Google/GitHub)
3. Verify your email

### Step 2: Get Your Cloudinary Credentials

1. After logging in, go to **Dashboard**
2. You'll see your **Cloudinary Account Details**:
   - **Cloud Name** (e.g., `dxyz123abc`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz`)

### Step 3: Set Environment Variables

Create a `.env` file in the `backend/` folder:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Other environment variables
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mydb
JWT_SECRET_KEY=your_jwt_secret_key
BACKEND_URL=https://fitness-store-backend.onrender.com
```

**For Production (Render/Vercel/etc.):**
- Add these same environment variables in your hosting platform's dashboard
- Go to Settings → Environment Variables
- Add all three Cloudinary variables

---

## 🚀 How It Works Now

### Before (Local Filesystem):
```
Image → Saved to: backend/upload/image.jpg
URL in DB: /upload/image.jpg (❌ breaks on server restart)
```

### After (Cloudinary):
```
Image → Uploaded to: Cloudinary cloud storage
URL in DB: https://res.cloudinary.com/your-cloud/image/upload/... (✅ permanent!)
```

---

## 📝 Features Included

✅ **Automatic Image Optimization**
- Images are automatically optimized for web
- Format conversion (WebP when supported)
- Quality optimization

✅ **Size Limits**
- Max dimensions: 1000x1000px (maintains aspect ratio)
- Allowed formats: JPG, JPEG, PNG, GIF, WebP

✅ **Organization**
- All images stored in `fitness-store/` folder in Cloudinary
- Easy to manage from Cloudinary dashboard

✅ **Backward Compatibility**
- Old images with local paths still work
- Automatically converts to full URLs when fetched

---

## 🔍 Verify It's Working

1. **Start your backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Upload an image** through your admin panel

3. **Check the console** - you should see:
   ```
   ✅ Image uploaded to Cloudinary: https://res.cloudinary.com/...
   ```

4. **Check Cloudinary Dashboard:**
   - Go to https://console.cloudinary.com
   - Click **Media Library**
   - You should see your uploaded images in `fitness-store/` folder!

---

## 🆘 Troubleshooting

### Error: "Invalid Cloudinary configuration"
- Make sure `.env` file exists with all three Cloudinary variables
- Check that values don't have quotes around them
- Restart your server after adding `.env` file

### Error: "Unauthorized"
- Double-check your API Key and API Secret
- Make sure there are no extra spaces in the `.env` file

### Images not uploading?
- Check browser console for errors
- Check backend console for Cloudinary errors
- Verify your Cloudinary account is active

---

## 📊 Monitor Usage

1. Go to: https://console.cloudinary.com/console
2. Check your usage in **Dashboard**
3. Free tier includes:
   - 25GB storage
   - 25GB bandwidth/month
   - Transformations: 25,000/month

---

## 🎉 Done!

Your images are now stored permanently in the cloud. They won't disappear anymore!

