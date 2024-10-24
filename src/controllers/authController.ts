import { NextFunction, Request, Response } from "express";
import oauth2client from "../utils/googleConfig";
import axios from "axios";
import UserModel from "../models/userModel";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../types";
require("dotenv").config();

// Issue tokens
export const issueTokens = (user: User, authMethod: string) => {
  const accessToken = jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      authMethod: authMethod,
    },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { _id: user._id, name: user.name, email: user.email },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "7d" }
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
    let user = await UserModel.findOne({ email });

    if (!user) {
      user = await UserModel.create({
        name,
        email,
        image: picture,
        authMethods: "google",
        googleId: email,
        password: null, // OAuth case: password will be null
      });
    }

    const { _id } = user;

    const User: User = {
      _id: _id.toString()!,
      email,
      name,
    };
    const tokens = issueTokens(User, "google");

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
    const { email, password } = req.body;
    let user = await UserModel.findOne({ email });

    // user does not exist
    if (!user) {
      return res.status(400).json({ message: "Username does not exist" });
    }

    // Check if password does not matches
    if (!(await bcrypt.compare(password, user.password!))) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    const { _id, name, email: userEmail } = user;

    const User: User = {
      _id: _id.toString()!,
      email: userEmail,
      name: name!,
    };
    const tokens = issueTokens(User, "local");

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true, // Prevent JavaScript from accessing it
      secure: true, // Use in HTTPS environments
      sameSite: "strict",
    });

    res.status(200).json({
      status: "success",
      message: "Login successful",
      accessToken: tokens.accessToken,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
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

    let user = await UserModel.findOne({ email });
    if (!user) {
      const hash = await bcrypt.hash(password, saltRounds);
      user = await UserModel.create({
        name,
        email,
        image: null,
        password: hash,
        authMethods: ["local"],
        googleId: null,
      });
    }
    // no need of sending access token or refresh token as user should login again
    return res.status(200).json({
      message: "Success",
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.log("Error registering the user : ", err);
  }
};

export const logout = async (req: Request, res: Response) => {
  console.log("loggedout ");
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    sameSite: "strict",
    path: "/",
  });
  res.status(200).send("Logged out successfully");
};
