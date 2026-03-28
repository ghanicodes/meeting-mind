import express from "express";
import {
  signup,
  login,
  logout,
  profile,
  updateProfile,
  forgetPassword,
  resetPassword,
  isLogin,
  getAllUsers,
  changePassword
} from "../controllers/authController.js";

import checkAuth from "../middleware/checkAuth.js";
import checkAdmin from "../middleware/checkAdmin.js";
import upload from "../middleware/upload.js"; // Added upload middleware

const router = express.Router();

// ✅ Auth Routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// ✅ Password Routes
router.post("/forgetPassword", forgetPassword);
router.post("/resetPassword/:token", resetPassword);

// ✅ Profile Routes
router.get("/profile", checkAuth, profile);
router.put("/updateProfile", checkAuth, upload.single("profilePicture"), updateProfile);

// ✅ Auth Check
router.get("/isLogin", checkAuth, isLogin);

// ✅ Admin Routes
router.get("/users", checkAuth , getAllUsers);

// change password route
router.post("/changePassword", checkAuth, changePassword);

export default router;