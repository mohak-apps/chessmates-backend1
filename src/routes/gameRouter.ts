import express from "express";
import { addGame, addMove } from "../controllers/gameController";
const router = express.Router();

// add game
router.post("/addGame", addGame);

// add moves
router.post("/addMoves", addMove);

export default router;
