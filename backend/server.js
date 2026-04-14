const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow all origins in production (Vercel frontend + local dev)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight OPTIONS requests for all routes
app.options('*', cors());

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── JSON syntax error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload.' });
  }
  return next(err);
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", require("./routes"));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Database + Server start ───────────────────────────────────────────────────
const mongoUri    = process.env.MONGO_URI   || "mongodb://127.0.0.1:27017";
const databaseName = process.env.DB_NAME    || "clouddb";
const port        = process.env.PORT        || 5000;

mongoose
  .connect(mongoUri, { dbName: databaseName })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((error) => {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  });
