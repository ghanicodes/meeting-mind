import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./src/models/User.js"; // adjust path if needed
import dns from 'node:dns'
dns.setServers(['1.1.1.1', '8.8.8.8']);

import dotenv from "dotenv";
dotenv.config();


const MONGO_URI = process.env.MONGO_URI;

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("DB connected");

    // check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@example.com" });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit();
    }

    // hash password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await User.create({
      name: "Admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      status: "joined", // IMPORTANT: so password is required
      // profilePicture will use default automatically
    });

    console.log("Admin created:", admin.email);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();