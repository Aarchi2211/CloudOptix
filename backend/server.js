const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const databaseName = process.env.DB_NAME || "clouddb";
const port = process.env.PORT || 5000;

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

app.use("/api", require("./routes"));
