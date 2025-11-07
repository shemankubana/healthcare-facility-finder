import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analyzeRouter from "./routes/analyze.js";
import recommendRouter from "./routes/recommend.js";
import districtsRouter from "./routes/districts.js";
import usersRouter from "./routes/users.js";
import mlRouter from "./routes/ml.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/districts", districtsRouter);
app.use("/api/analyze", analyzeRouter);
app.use("/api/recommend", recommendRouter);
app.use("/api/users", usersRouter);
app.use("/api/ml", mlRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log("✅ Server running on port", PORT));

