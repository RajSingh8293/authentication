import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../middleware/sendEmail.js";

const OTP_EXPIRES_MINUTES = 15;

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    if (!users) {
      return res
        .status(400)
        .json({ success: false, message: "Users not found" });
    }
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while getting users ",
    });
  }
};

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    if (!username) {
      return res.status(422).json({ message: "Username is required" });
    }
    if (!email) {
      return res.status(422).json({ message: "Email is required" });
    }
    if (!password) {
      return res.status(422).json({ message: "Password is required" });
    }

    // exituser
    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({ message: "This email already used!" });
    }

    const hashedPassword = bcrypt.hashSync(password, 8); // user123
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = crypto.randomInt(100000, 999999).toString();
    const verifyEmailOtpExpire = Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000;

    const userData = new User({
      username,
      email,
      password: hashedPassword,
      verifyEmailOtp: otp,
      verifyEmailOtpExpire,
    });

    const user = await userData.save();
    const { password: pass, ...rest } = user._doc;

    const htmlMessage = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #4F46E5;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Verify Email </h2>
          <p>You requested to verify email .Copy and paste below  OTP for login:</p>

          <p>${otp}</p>

          <p>This otp will expire in 15 minutes for security reasons.</p>

          <div class="footer">
            <p>If you didn't request, please ignore this email.</p>
            <p>Your account security is important to us.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const data = {
      email: user?.email,
      subject: "Email Verification Request",
      message: `Please use the following OTP to verify your email : ${otp} `,
      html: htmlMessage,
    };
    try {
      await sendEmail(data);
    } catch (mailError) {
      await User.deleteOne({ _id: user?._id }).catch(() => {});
      console.log("Failed to send verification email : ", mailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again ",
        user: rest,
      });
    }

    res.status(201).json({
      success: true,
      message: "Register successfully. OTP has been sent to your email",
      needsVerification: true,
      user: rest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while registring",
    });
  }
};

export const emailVerify = async (req, res) => {
  const { otp } = req.body;
  console.log("req.body:", otp);

  try {
    if (!otp) {
      return res.status(422).json({ message: "OTP is required" });
    }

    // exituser
    const user = await User.findOne({ verifyEmailOtp: otp });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }
    if (user.verifyEmailOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP!" });
    }

    if (user.verifyEmailOtpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired! Please request a new one.",
      });
    }
    user.verifyEmailOtp = undefined;
    user.verifyEmailOtpExpire = undefined;
    user.isVerified = true;

    await user.save();

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const { password: pass, ...rest } = user._doc;
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };
    res.status(201).cookie("token", token, options).json({
      success: true,
      message: "Email verify successfylly!",
      user: rest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error with email verification",
    });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email) {
      return res.status(422).json({ message: "Email is required" });
    }
    if (!password) {
      return res.status(422).json({ message: "Password is required" });
    }

    // exituser
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials!",
      });
    }

    if (!user.isVerified) {
      const otp = crypto.randomInt(100000, 999999).toString();
      const verifyEmailOtpExpire = Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000;

      user.verifyEmailOtp = otp;
      user.verifyEmailOtpExpire = verifyEmailOtpExpire;
      await user.save();

      const htmlMessage = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #4F46E5;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Verify Email </h2>
          <p>You requested to verify email .Copy and paste below  OTP for login :</p>

          <p>${otp}</p>

          <p>This otp will expire in 15 minutes for security reasons.</p>

          <div class="footer">
            <p>If you didn't request, please ignore this email.</p>
            <p>Your account security is important to us.</p>
          </div>
        </div>
      </body>
      </html>
    `;

      const data = {
        email: user?.email,
        subject: "Email Verification Request",
        message: `Please use the following OTP to verify your email : ${otp} `,
        html: htmlMessage,
      };
      try {
        await sendEmail(data);
      } catch (error) {
        await User.deleteOne({ _id: user?._id }).catch(() => {});
        console.log("Failed to send verification email : ", error);
        return res.status(500).json({
          success: false,
          needsVerification: true,
          message:
            "Your account is not verified. Failed to send OTP email. Please try again",
          user: rest,
        });
      }

      return res.status(403).json({
        success: false,
        needsVerification: true,
        message: "Email not verified. OTP sent again",
      });
    }

    const token = jwt.sign({ _id: user?._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    const { password: pass, ...rest } = user._doc;
    res.status(200).cookie("token", token, options).json({
      success: true,
      message: "Login successfully!",
      user: rest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while login",
    });
  }
};
export const logoutUser = async (req, res) => {
  try {
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    res.status(200).clearCookie("token", options).json({
      success: true,
      message: "Logout successfully!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while logout",
    });
  }
};
export const profileUser = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while logout",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If the email exists, a password reset link has been sent",
      });
    }

    const generateToken = crypto.randomBytes(20).toString("hex");
    if (!generateToken) {
      return res.status(500).json({
        success: false,
        message: "An error occurred. Please try again later",
      });
    }

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(generateToken)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/login?token=${user.resetPasswordToken}`;

    console.log("resetPasswordUrl :", resetPasswordUrl);

    const htmlMessage = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #4F46E5; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to create a new password:</p>
          
          <a href="${resetPasswordUrl}" class="button">Reset Password</a>
          
          <p>Or copy and paste this link into your browser:</p>
          <p>${resetPasswordUrl}</p>
          
          <p>This link will expire in 15 minutes for security reasons.</p>
          
          <div class="footer">
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>Your account security is important to us.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const data = {
      email: user.email,
      subject: "Password Reset Request",
      message: `Please use the following link to reset your password: ${resetPasswordUrl}`,
      html: htmlMessage,
    };

    await sendEmail(data);

    return res.status(200).json({
      success: true,
      message: "If the email exists, a password reset link has been sent",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset password token is invalid or has been expired",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password does not match!",
      });
    }

    const hashPassword = bcrypt.hashSync(password, 8);

    user.password = hashPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Passsword reset successfully",
      user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Error with reseting password",
      error,
    });
  }
};
