const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      console.log("MongoDB already connected");
      return;
    }

    // ✅ Correct connection string with your username + password + db name
    const uri =
      "mongodb+srv://patelsaiban9:saiban123@cluster0.sljcskb.mongodb.net/mydb?retryWrites=true&w=majority&appName=Cluster0";

    await mongoose.connect(uri);

    console.log("✅ MongoDB Atlas Connected -> mydb");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDb;
