import express from "express";
import authRouter from "./routes/authRouter";
import cors from "cors";
import cookieParser from "cookie-parser";
import gameRouter from "./routes/gameRouter";

export function startHttpServer(port: any) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser()); // Use cookie-parser middleware

  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );

  app.listen(port, () => {
    console.log(`HTTP server is running on port ${port}`);
  });

  app.get("/", (req, res) => {
    res.send("Hello from HTTP server!");
  });

  app.use("/auth", authRouter);
  app.use("/game", gameRouter);
}
