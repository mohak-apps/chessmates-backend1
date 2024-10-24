import { startWebSocketServer } from "./websocket-server";
import { startHttpServer } from "./http-server";

require("dotenv").config();

const WS_PORT = process.env.WS_PORT || 8080;
const HTTP_PORT = process.env.HTTP_PORT || 3000;

startWebSocketServer(WS_PORT);
startHttpServer(HTTP_PORT);
