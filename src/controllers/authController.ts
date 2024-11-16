import { NextFunction, Request, Response } from "express";
import oauth2client from "../utils/googleConfig";
import axios from "axios";
// import UserModel from "../models/userModel";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User, AuthMethods } from "../types";
import sendOtpEmail from "../services/emailService";
import { PrismaClient } from "@prisma/client";
import { validateEmail } from "../utils/validationUtils";
require("dotenv").config();
const prisma = new PrismaClient();

// Issue tokens
export const issueTokens = (user: User) => {
  const accessToken = jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
    },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: process.env.ACCESS_TOKEN_TIMEOUT! }
  );

  const refreshToken = jwt.sign(
    { _id: user._id, name: user.name, email: user.email },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: process.env.REFRESH_TOKEN_TIMEOUT! }
  );

  return { accessToken, refreshToken };
};

export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.query;
    const googleRes = await oauth2client.getToken(code as string);
    await oauth2client.setCredentials(googleRes.tokens);

    const userRes = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${oauth2client.credentials.access_token}`
    );

    const { email, name, picture } = userRes.data;
    let user = await prisma.user.findUnique({ where: { email: email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          image: picture,
          authMethods: [AuthMethods.google],
          googleId: email,
          password: null, // OAuth case: password will be null
        },
      });
    }

    const { id } = user;

    const User: User = {
      _id: id.toString()!,
      email,
      name,
    };
    const tokens = issueTokens(User);

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true, // Prevent JavaScript from accessing it
      secure: true, // Use in HTTPS environments
      sameSite: "strict",
    });

    res.status(200).json({
      message: "Success",
      accessToken: tokens.accessToken,
      user: User,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const signinUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, rememberMe } = req.body;
    let user = await prisma.user.findUnique({ where: { email: email } });

    // user does not exist
    if (!user) {
      return res.status(400).json({ message: "Username does not exist" });
    }

    if (user?.authMethods.includes(AuthMethods.google) && !user.password) {
      // notify that you have an account created through google
      // 1. login through google
      // 2. validate google using otp and continue login and merge account by providing password
      return res.status(409).json({
        status: "conflict",
        message: "Login conflict",
        user: {},
      });
    }

    // Check if password does not matches
    if (!(await bcrypt.compare(password, user.password!))) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    const { id, name, email: userEmail } = user;

    const User: User = {
      _id: id.toString()!,
      email: userEmail,
      name: name!,
    };
    const tokens = issueTokens(User);

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true, // Prevent JavaScript from accessing it
      secure: true, // Use in HTTPS environments
      sameSite: "strict",
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : undefined, // 7 days or session cookie
    });

    res.status(200).json({
      status: "success",
      message: "Login successful",
      accessToken: tokens.accessToken,
      user: {
        _id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const otpStore: { [key: string]: { otp: number; expiresAt: number } } = {};

export const confirmEmail = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    let user = await prisma.user.findUnique({ where: { email: email } });

    if (user && user.authMethods.includes("local")) {
      return res.status(400).json({ message: "Username already exist" });
    }

    //generate email OTP for email confirmation and proceed
    const generatedOtp = Math.floor(1000 + Math.random() * 9000);
    console.log(generatedOtp);
    const expiresAt = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes

    otpStore[email] = { otp: generatedOtp, expiresAt };

    await sendOtpEmail(email, generatedOtp);
    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Error in confirmEmail:", error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const verifyEmailOtp = async (req: Request, res: Response) => {
  const { otpv, email } = req.body;

  if (!email || !otpv) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    // Check if OTP exists and is valid
    const storedData = otpStore[email];

    if (!storedData) {
      return res.status(400).json({ message: "No OTP found or expired" });
    }

    // Check if OTP is expired
    if (Date.now() > storedData.expiresAt) {
      delete otpStore[email]; // Remove expired OTP
      return res.status(410).json({ message: "OTP has expired" });
    }

    // Compare the provided OTP with the stored one
    if (Number(otpv) === storedData.otp) {
      delete otpStore[email]; // Clear the stored OTP upon successful verification
      return res.status(200).json({ message: "Email verified successfully" });
    } else {
      return res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error in verifyEmailOtp:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while verifying the OTP" });
  }
};

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;
    const saltRounds = 10;

    let user = await prisma.user.findUnique({ where: { email: email } });
    if (!user) {
      const hash = await bcrypt.hash(password, saltRounds);
      user = await prisma.user.create({
        data: {
          name,
          email,
          image: null,
          password: hash,
          authMethods: [AuthMethods.local],
          googleId: null,
        },
      });
    }

    // no need of sending access token or refresh token as user should login again
    return res.status(200).json({
      message: "Success",
      user: {
        _id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.log("Error registering the user : ", err);
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    sameSite: "strict",
    path: "/",
  });
  res.status(200).send("Logged out successfully");
};

export const setPassword = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    let user = await prisma.user.findUnique({ where: { email: email } });

    // user does not exist
    if (!user) {
      return res.status(400).json({ message: "Username does not exist" });
    }

    const saltRounds = 10;
    if (user && user.authMethods.includes(AuthMethods.google)) {
      const hash = await bcrypt.hash(password, saltRounds);
      user = await prisma.user.update({
        where: {
          email: email,
        },
        data: {
          password: hash,
          authMethods: [AuthMethods.google, AuthMethods.local],
        },
      });

      return res.status(200).json({
        message: "Password Updated",
        user: {
          _id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    }
  } catch (err) {
    console.log("Error setting password for the user : ", err);
    return res
      .status(500)
      .json({ message: "Error setting password for the user" });
  }
};
