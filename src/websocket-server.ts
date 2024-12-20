import { WebSocketServer } from "ws";
import { GameManager } from "./GameManager";

export function startWebSocketServer(port: any) {
  
  const wss = new WebSocketServer({ port: port });
  const gameManager = new GameManager();

  wss.on("listening", () => {
    console.log(`WebSocket server is listening on port ${port}`);
  });

  wss.on("connection", function connection(ws) {
    console.log("connection successful");
    gameManager.addUser(ws);
  });

  wss.on("disconnect", (ws) => {
    console.log("connection successful");
    gameManager.removeUser(ws);
  });

  console.log(`WebSocket server is running on port ${port}`);
}
