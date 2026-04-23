# How to Access Your MongoDB Database

## Quick Connection Info
- **Database Name:** `mydb`
- **Collections:** `users`, `products`, `orders`
- **Connection String:** 
  ```
  mongodb+srv://patelsaiban9:saiban123@cluster0.sljcskb.mongodb.net/mydb
  ```

---

## Option 1: MongoDB Atlas Web Interface ⭐ (Easiest)

1. Go to: https://cloud.mongodb.com
2. Login with your MongoDB Atlas account
3. Select your cluster: `Cluster0`
4. Click **"Browse Collections"**
5. Select database: `mydb`
6. View collections: `users`, `products`, `orders`

---

## Option 2: MongoDB Compass (Desktop App)

1. Download: https://www.mongodb.com/try/download/compass
2. Install and open Compass
3. Paste connection string:
   ```
   mongodb+srv://patelsaiban9:saiban123@cluster0.sljcskb.mongodb.net/mydb
   ```
4. Click **"Connect"**
5. Browse your collections!

---

## Option 3: MongoDB Shell (Command Line)

1. Install MongoDB Shell if not installed:
   ```bash
   brew install mongosh  # macOS
   ```

2. Connect:
   ```bash
   mongosh "mongodb+srv://patelsaiban9:saiban123@cluster0.sljcskb.mongodb.net/mydb"
   ```

3. Use commands:
   ```javascript
   show collections              // List all collections
   db.users.find()              // View all users
   db.products.find()           // View all products
   db.orders.find()             // View all orders
   ```

---

## Option 4: Using Node.js Script

Create a file `view-db.js`:

```javascript
const mongoose = require('mongoose');

const uri = "mongodb+srv://patelsaiban9:saiban123@cluster0.sljcskb.mongodb.net/mydb?retryWrites=true&w=majority&appName=Cluster0";

(async () => {
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");
    
    // View Users
    const User = require('./models/user');
    const users = await User.find().select('-password');
    console.log("\n📊 USERS:", JSON.stringify(users, null, 2));
    
    // View Products
    const Product = require('./models/product');
    const products = await Product.find();
    console.log("\n📦 PRODUCTS:", JSON.stringify(products, null, 2));
    
    // View Orders
    const Order = require('./models/order');
    const orders = await Order.find().populate('productId');
    console.log("\n🛒 ORDERS:", JSON.stringify(orders, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
})();
```

Run: `node view-db.js`

---

## Option 5: Through Your API Endpoints

Your backend already provides API endpoints:

```bash
# Get all products
curl http://localhost:5000/api/products

# Get all orders (needs authentication)
curl http://localhost:5000/api/orders

# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

---

## Collections in Your Database

### `users` Collection
- `_id` (ObjectId)
- `email` (String, unique)
- `phone` (String)
- `password` (String, hashed)
- `role` (String: "user" or "admin")

### `products` Collection
- `_id` (ObjectId)
- `name` (String)
- `description` (String)
- `price` (Number)
- `image` (String - path/URL)

### `orders` Collection
- `_id` (ObjectId)
- `name` (String)
- `address` (String)
- `phone` (String)
- `pincode` (String)
- `productId` (ObjectId - references Product)
- `createdAt` (Date)

---

## 🔒 Security Note

⚠️ **IMPORTANT:** Your database credentials are hardcoded in the code. This is a security risk!

For production, move them to `.env` file:
```env
MONGODB_URI=mongodb+srv://patelsaiban9:saiban123@cluster0.sljcskb.mongodb.net/mydb
```

