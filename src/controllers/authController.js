import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import sendEmail from "../utils/sendEmail.js";
import Meeting from "../models/Meeting.js";
import Invitation from "../models/Invitation.js";
import cloudinaryUpload from "../utils/cloudinaryUpload.js";


// ✅ Check Login
export function isLogin(req, res) {
  res.status(200).json({
    success: true,
    message: "User is logged in",
    user: req.user,
    isUnAuthorized: false
  });
}


// ✅ Signup
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new Error("All fields are required");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User is not invited"
      });
    }

    if (user.status === "joined") {
      return res.status(400).json({
        success: false,
        message: "User already joined"
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    user.status = "joined";
    user.password = hashPassword;
    user.name = name;

    const newUser = await user.save();

    // ✅ Update Invitations
    const invitations = await Invitation.find({
      "invitedTo.email": email,
      "invitedTo.isRegistered": false
    });

    for (const invitation of invitations) {
      invitation.invitedTo.name = name;
      invitation.invitedTo.isRegistered = true;
      invitation.invitedTo.user = newUser._id;
      await invitation.save();
    }

    // ✅ Update Meetings
    const meetings = await Meeting.find({
      "attendees.emailForUnregisteredAttendee": email,
      "attendees.isRegistered": false
    });

    for (const meeting of meetings) {
      for (const attendee of meeting.attendees) {
        if (attendee.emailForUnregisteredAttendee === email) {
          attendee.isRegistered = true;
          attendee.user = newUser._id;
          attendee.nameForUnregisteredAttendee = name;
        }
      }
      await meeting.save();
    }

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: newUser
    });

  } catch (error) {
    res.status(400).json({
      message: "Signup Error",
      error: error.message
    });
  }
};


// ✅ Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const user = await User.findOne({ email, status: "joined" }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(400).json({
      message: "Login Error",
      error: error.message
    });
  }
};


// ✅ Forget Password
export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Password Reset",
      template: "forgotPassword",
      context: {
        name: user.name,
        url: resetUrl
      }
    });

    res.status(200).json({
      success: true,
      message: "Reset link sent"
    });

  } catch (error) {
    res.status(400).json({
      message: "Forget Password Error",
      error: error.message
    });
  }
};


// ✅ Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful"
    });

  } catch (error) {
    res.status(400).json({
      message: "Reset Error",
      error: error.message
    });
  }
};


// ✅ Logout
export const logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "Logged out"
  });
};


// ✅ Profile
export const profile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.status(200).json({ success: true, user });
};


// ✅ Update Profile (Dynamic)
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const allowedFields = [
      "name",
      "email",
      "role",
      "status"
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    if (req.file && req.file.buffer) {
      const result = await cloudinaryUpload(req.file.buffer);
      user.profilePicture = {
        url: result.secure_url,
        public_id: result.public_id
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated",
      user
    });

  } catch (error) {
    res.status(400).json({
      message: "Update Error",
      error: error.message
    });
  }
};


// ✅ Get All Users (Filter + Search + Pagination)
export const getAllUsers = async (req, res) => {
  try {
    let filter = {};

    if (req.query.role) {
      filter.role = req.query.role;
    } else {
      filter.role = { $ne: 'admin' };
    }
    if (req.query.status) filter.status = req.query.status;

    if (req.query.startDate) {
      filter.createdAt = { $gte: new Date(req.query.startDate) };
    }

    if (req.query.endDate) {
      filter.createdAt = {
        ...filter.createdAt,
        $lte: new Date(req.query.endDate)
      };
    }


    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } }
      ];
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const users = await User.find(filter)
      .select("-password")
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: users
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};






// Change Password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select("+password");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    res.status(400).json({
      message: "Change Password Error",
      error: error.message
    });
  }
};