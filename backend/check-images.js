// Quick script to check where images are saved
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/product');

const uri = process.env.MONGODB_URI || "mongodb+srv://patelsaiban9:saiban123@cluster0.sljcskb.mongodb.net/mydb?retryWrites=true&w=majority&appName=Cluster0";

(async () => {
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB\n");
    
    const products = await Product.find().select('name image');
    
    console.log("📦 Products and their image locations:\n");
    console.log("=" .repeat(80));
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. Product: ${product.name}`);
      
      if (product.image) {
        if (product.image.startsWith('https://res.cloudinary.com')) {
          console.log(`   ✅ Location: Cloudinary (Cloud Storage)`);
          console.log(`   🔗 URL: ${product.image}`);
        } else if (product.image.startsWith('http://') || product.image.startsWith('https://')) {
          console.log(`   ⚠️  Location: External URL (Old deployment)`);
          console.log(`   🔗 URL: ${product.image}`);
        } else {
          console.log(`   ❌ Location: Local filesystem (May be missing!)`);
          console.log(`   📁 Path: ${product.image}`);
        }
      } else {
        console.log(`   ❌ No image`);
      }
    });
    
    console.log("\n" + "=".repeat(80));
    console.log(`\n📊 Total products: ${products.length}`);
    
    const cloudinaryImages = products.filter(p => p.image && p.image.includes('res.cloudinary.com')).length;
    const localImages = products.filter(p => p.image && !p.image.startsWith('http')).length;
    
    console.log(`✅ Cloudinary images: ${cloudinaryImages}`);
    console.log(`📁 Local/old images: ${localImages}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
})();

