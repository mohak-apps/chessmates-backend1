"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
var messages_1 = require("./messages");
var Game_1 = require("./Game");
var GameManager = /** @class */ (function () {
    function GameManager() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
    }
    GameManager.prototype.addUser = function (socket) {
        this.users.push(socket);
        this.addHandler(socket);
    };
    GameManager.prototype.removeUser = function (socket) {
        this.users = this.users.filter(function (user) { return user != socket; });
        // stop the game as user left
    };
    GameManager.prototype.addHandler = function (socket) {
        var _this = this;
        socket.on("message", function (data) {
            var message = JSON.parse(data.toString());
            if (message.type === messages_1.INIT_GAME) {
                if (_this.pendingUser) {
                    //start the game
                    var game = new Game_1.Game(_this.pendingUser, socket);
                    _this.games.push(game);
                    _this.pendingUser = null;
                }
                else {
                    _this.pendingUser = socket;
                    socket.send(JSON.stringify({
                        type: messages_1.INFO,
                        payload: "Pending user",
                    }));
                }
            }
            console.log("message.type");
            console.log(message.type);
            if (message.type === messages_1.MOVE) {
                var game = _this.games.find(function (game) { return game.player1 === socket || game.player2 === socket; });
                console.log("move made");
                console.log(message.payload);
                if (game) {
                    game.makeMove(socket, message.payload);
                }
            }
        });
    };
    GameManager.prototype.handleMessage = function () { };
    return GameManager;
}());
exports.GameManager = GameManager;
