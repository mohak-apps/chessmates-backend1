import { PrismaClient, GameSession, GameMove } from "@prisma/client";
import { GameResult, GameType, User } from "../types";
import { Move } from "chess.js";
require("dotenv").config();
const prisma = new PrismaClient();

export const addGame = async (
  player1: User,
  player2: User
): Promise<GameSession | null> => {
  try {
    // Validate input
    if (!player1?._id || !player2?._id) {
      console.error("Invalid player data");
      return null;
    }

    // Create the game
    const newGame = await prisma.gameSession.create({
      data: {
        whitePlayerId: player1._id,
        blackPlayerId: player2._id,
        startTime: new Date(),
        endTime: null,
        result: GameResult.InProgress,
        gameType: GameType.Practice,
      },
    });

    return newGame;
  } catch (err) {
    console.error("Error adding the game:", err);
    return null;
  }
};

export const addMove = async (
  gameId: string,
  move: Move,
  isWhiteTurn: boolean
): Promise<GameMove | null> => {
  try {
    // add the move
    const moveString =
      move.piece + move.from + (move.captured ? "x" : "") + move.to;
    const newMove = await prisma.gameMove.upsert({
      where: {
        gameSessionId: gameId,
      },
      update: {
        moveNumber: { increment: 1 },
        ...(isWhiteTurn
          ? { whiteMoves: { push: moveString } }
          : { blackMoves: { push: moveString } }),
      },
      create: {
        gameSessionId: gameId,
        moveNumber: 1,
        whiteMoves: isWhiteTurn ? [moveString] : [],
        blackMoves: isWhiteTurn ? [] : [moveString],
      },
    });
    return newMove;
  } catch (err) {
    console.error("Error saving the game move:", err);
    return null;
  }
};
