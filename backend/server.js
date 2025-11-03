import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analyzeRouter from "./routes/analyze.js";
import recommendRouter from "./routes/recommend.js";
import districtsRouter from "./routes/districts.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/districts", districtsRouter);
app.use("/api/analyze", analyzeRouter);
app.use("/api/recommend", recommendRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Healthcare Facility API running on http://localhost:${PORT}`);
});
