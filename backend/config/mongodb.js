import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on('connected', () => {
      console.log("DB Connected");
    });

    mongoose.connection.on('error', (err) => {
      console.error("DB Connection Error:", err.message);
    });

    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4, // IPv4 — avoids Windows DNS/IPv6 SRV failures
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectDB;