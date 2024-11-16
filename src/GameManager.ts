import { WebSocket } from "ws";
import { ERROR, INIT_GAME, MOVE, PENDING } from "./messages";
import { Game } from "./Game";
import { User } from "./types";
import { addGame, addMove } from "./controllers/gameController";

export class GameManager {
  private games: Game[];
  private pendingUser: WebSocket | null;
  private pendingUserObject: User | null;
  private users: WebSocket[];

  constructor() {
    this.games = [];
    this.pendingUser = null;
    this.pendingUserObject = null;
    this.users = [];
  }

  addUser(socket: WebSocket) {
    this.users.push(socket);
    this.addHandler(socket);
  }

  removeUser(socket: WebSocket) {
    this.users = this.users.filter((user) => user !== socket);
    // stop the game as user left
  }

  private addHandler(socket: WebSocket) {
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case INIT_GAME:
          this.handleInitGame(socket, message);
          break;
        case MOVE:
          this.handleMove(socket, message);
          break;
        default:
          console.warn(`Unhandled message type: ${message.type}`);
      }
    });
  }

  private handleInitGame(socket: WebSocket, message: any) {
    if (this.pendingUser) {
      // user 1 is waiting
      addGame(this.pendingUserObject!, message.user)
        .then((newGame) => {
          if (newGame) {
            const game = new Game(
              newGame.id,
              this.pendingUser!,
              socket,
              this.pendingUserObject!,
              message.user
            );
            this.games.push(game);
            this.pendingUser = null;
            this.pendingUserObject = null;
          } else {
            const errorMessage = JSON.stringify({
              type: ERROR,
              payload: "Invalid player data. Unable to start the game.",
            });
            this.pendingUser!.send(errorMessage);
            socket.send(errorMessage);
            // Reset pending state
            this.pendingUser = null;
            this.pendingUserObject = null;
          }
        })

        .catch((error) => {
          console.error("Error creating game:", error);
          // Handle error (e.g., notify players)
        });
    } else {
      this.pendingUser = socket;
      this.pendingUserObject = message.user;
      socket.send(
        JSON.stringify({
          type: PENDING,
          payload: "Waiting for opponent",
        })
      );
    }
  }

  private handleMove(socket: WebSocket, message: any) {
    const game = this.games.find(
      (game) => game.player1 === socket || game.player2 === socket
    );

    const { from, to, color } = message.payload.move;
    const gameId = message.payload.gameId;
    const isWhiteTurn = color === "w";
    if (game) {
      addMove(gameId, message.payload.move, isWhiteTurn)
        .then(() => game.makeMove(socket, { from, to }))
        .catch((error: any) => {
          console.error("Error adding a move to game:", error);
        });
    } else {
      console.warn("Move received for non-existent game");
      socket.send(
        JSON.stringify({
          type: ERROR,
          payload: "Game not found",
        })
      );
    }
  }
}
