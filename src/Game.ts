import { Chess } from "chess.js";
import { WebSocket } from "ws";
import { GAME_OVER, INIT_GAME, MOVE, TURN } from "./messages";
import { User } from "./types";

export class Game {
  public gameId: string;
  public player1: WebSocket;
  public player2: WebSocket;
  private board: Chess;
  private startTime: Date;
  private moveCount: number;

  constructor(
    gameId: string,
    player1: WebSocket,
    player2: WebSocket,
    p1: User,
    p2: User
  ) {
    this.gameId = gameId;
    this.player1 = player1;
    this.player2 = player2;
    this.moveCount = 0;
    this.board = new Chess();
    this.startTime = new Date();

    this.player1.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          gameId,
          color: "white",
          opponent: p2,
          turn: true,
        },
      })
    );
    this.player2.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          gameId,
          color: "black",
          opponent: p1,
          turn: false,
        },
      })
    );
  }

  makeMove(socket: WebSocket, move: { from: string; to: string }) {
    // check if it is a correct player's move
    if (this.moveCount % 2 === 0 && socket !== this.player1) {
      return;
    }
    if (this.moveCount % 2 === 1 && socket !== this.player2) {
      return;
    }

    // is it a valid move - validate using zod
    try {
      this.board.move(move);
    } catch (err) {
      console.log(err);
    }

    if (this.board.isGameOver()) {
      // send game over message to both the parties
      this.player1.send(
        JSON.stringify({
          type: GAME_OVER,
          payload: {
            winner: this.board.turn() === "w" ? "black" : "white",
          },
        })
      );
      this.player2.send(
        JSON.stringify({
          type: GAME_OVER,
          payload: {
            winner: this.board.turn() === "w" ? "black" : "white",
          },
        })
      );
      return;
    }

    if (this.moveCount % 2 === 0) {
      // if player 1 plays, send that move to player 2 and set turn
      console.log("player 1 played");
      this.player2.send(
        JSON.stringify({
          type: MOVE,
          payload: { move: move },
        })
      );
      this.player2.send(
        JSON.stringify({
          type: TURN,
          payload: { move: move, turn: true },
        })
      );
      this.player1.send(
        JSON.stringify({
          type: TURN,
          payload: { move: move, turn: false },
        })
      );
    } else {
      console.log("player 2 played");
      this.player1.send(
        JSON.stringify({
          type: MOVE,
          payload: { move: move },
        })
      );
      this.player1.send(
        JSON.stringify({
          type: TURN,
          payload: { move: move, turn: true },
        })
      );
      this.player2.send(
        JSON.stringify({
          type: TURN,
          payload: { move: move, turn: false },
        })
      );
    }
    this.moveCount = this.moveCount + 1;
  }
}
