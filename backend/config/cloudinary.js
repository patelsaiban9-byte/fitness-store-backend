const cloudinary = require('cloudinary');

// Configure Cloudinary
const config = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

// Log configuration status (without exposing secrets)
console.log('☁️  Cloudinary Config:');
console.log(`   Cloud Name: ${config.cloud_name || 'NOT SET'}`);
console.log(`   API Key: ${config.api_key ? 'SET ✓' : 'NOT SET ✗'}`);
console.log(`   API Secret: ${config.api_secret ? 'SET ✓' : 'NOT SET ✗'}`);

if (!config.cloud_name || !config.api_key || !config.api_secret) {
  console.error('❌ Cloudinary configuration incomplete! Check your .env file.');
} else {
  console.log('✅ Cloudinary configured successfully!');
}

cloudinary.v2.config(config);

module.exports = cloudinary;

