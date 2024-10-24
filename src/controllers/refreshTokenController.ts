import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { User } from "../types";
import { issueTokens } from "./authController";
require("dotenv").config();

export const refreshToken = (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken; // Extract from cookie

  console.log("refreshToken");
  console.log(refreshToken);
  
  if (!refreshToken) {
    return res.status(403).json({ message: "No refresh token provided" });
  }

  // Verify refresh token
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET!,
    (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      const User: User = {
        _id: decoded._id.toString()!,
        email: decoded.email,
        name: decoded.name,
      };

      const tokens = issueTokens(User, "refresh");

      // Set new refresh token in cookie
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

      res.json({
        status: "success",
        message: "Login successful",
        accessToken: tokens.accessToken,
        user: User,
      });
    }
  );
};
