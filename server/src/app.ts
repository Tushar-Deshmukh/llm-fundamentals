import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "LLM Playground API is running",
  });
});

app.use("/api/chat", chatRoutes);

export default app;
