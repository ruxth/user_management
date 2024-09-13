const express = require("express");
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const { connection, mysqlconnection } = require("./config/database");
const authRoutes = require("./routes/routes");
const { addUser } = require("./controllers/authController");

const app = express();

mysqlconnection();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type", "x-access-token"],
  })
);

app.use("/api/", authRoutes);

app.listen(3000);
