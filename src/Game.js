"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
var chess_js_1 = require("chess.js");
var messages_1 = require("./messages");
var Game = /** @class */ (function () {
    function Game(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.moveCount = 0;
        this.board = new chess_js_1.Chess();
        this.startTime = new Date();
        this.player1.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            payload: {
                color: "white",
            },
        }));
        this.player2.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            payload: {
                color: "black",
            },
        }));
    }
    Game.prototype.makeMove = function (socket, move) {
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
        }
        catch (err) {
            console.log(err);
        }
        if (this.board.isGameOver()) {
            // send game over message to both the parties
            this.player1.send(JSON.stringify({
                type: messages_1.GAME_OVER,
                payload: {
                    winner: this.board.turn() === "w" ? "black" : "white",
                },
            }));
            this.player2.send(JSON.stringify({
                type: messages_1.GAME_OVER,
                payload: {
                    winner: this.board.turn() === "w" ? "black" : "white",
                },
            }));
            return;
        }
        if (this.moveCount % 2 === 0) {
            // if player 1 plays, send that move to player 2
            console.log("player 1 played");
            this.player2.send(JSON.stringify({
                type: messages_1.MOVE,
                payload: move,
            }));
        }
        else {
            console.log("player 2 played");
            this.player1.send(JSON.stringify({
                type: messages_1.MOVE,
                payload: move,
            }));
        }
        this.moveCount = this.moveCount + 1;
    };
    return Game;
}());
exports.Game = Game;
