const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// connect DB
mongoose.connect("mongodb://127.0.0.1:27017/cloudoptix");

// routes
app.use("/api", require("./routes"));

app.listen(5000, () => console.log("Server running on port 5000"));