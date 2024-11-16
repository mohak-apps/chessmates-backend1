import { Request, Response } from "express";
import express from "express";
import {
  googleLogin,
  logout,
  confirmEmail,
  registerUser,
  signinUser,
  verifyEmailOtp,
  setPassword,
} from "../controllers/authController";
import { refreshToken } from "../controllers/refreshTokenController";
const router = express.Router();

router.get("/test", (req: Request, res: Response) => {
  res.send("test pass");
});

router.post("/confirmEmail", confirmEmail);
router.post("/verifyEmailOtp", verifyEmailOtp);

router.post("/registerUser", registerUser);

router.post("/signin", signinUser);

router.post("/refresh-token", refreshToken);

router.post("/logout", logout);

///oauth
router.get("/google", googleLogin);

//409 - email conflict - setPassword
router.post("/setPassword", setPassword);

export default router;
