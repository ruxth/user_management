const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const db = require("./config/database");
const authRoutes = require("./routes/routes");
const demo = require("./routes/demo");

const app = express();

app.use(cookieParser());

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type", "x-access-token"],
    credentials: true,
  })
);

app.use("/api/", authRoutes);
app.use("/api/demo/", demo);

app.listen(3000);
