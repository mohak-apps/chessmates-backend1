"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const messages_1 = require("./messages");
const Game_1 = require("./Game");
class GameManager {
    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
    }
    addUser(socket) {
        this.users.push(socket);
        this.addHandler(socket);
    }
    removeUser(socket) {
        this.users = this.users.filter((user) => user != socket);
        // stop the game as user left
    }
    addHandler(socket) {
        socket.on("message", (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === messages_1.INIT_GAME) {
                if (this.pendingUser) {
                    //start the game
                    const game = new Game_1.Game(this.pendingUser, socket);
                    this.games.push(game);
                    this.pendingUser = null;
                }
                else {
                    this.pendingUser = socket;
                    socket.send(JSON.stringify({
                        type: messages_1.INFO,
                        payload: "Pending user",
                    }));
                }
            }
            console.log("message.type");
            console.log(message.type);
            if (message.type === messages_1.MOVE) {
                const game = this.games.find((game) => game.player1 === socket || game.player2 === socket);
                console.log("move made");
                console.log(message.payload);
                if (game) {
                    game.makeMove(socket, message.payload);
                }
            }
        });
    }
    handleMessage() { }
}
exports.GameManager = GameManager;
