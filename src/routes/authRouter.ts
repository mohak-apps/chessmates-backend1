import { Request, Response } from "express";
import express from "express";
import {
  googleLogin,
  logout,
  registerUser,
  signinUser,
} from "../controllers/authController";
import { refreshToken } from "../controllers/refreshTokenController";
const router = express.Router();

router.get("/test", (req: Request, res: Response) => {
  res.send("test pass");
});

router.post("/register", registerUser);
router.post("/signin", signinUser);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

///oauth
router.get("/google", googleLogin);

export default router;
