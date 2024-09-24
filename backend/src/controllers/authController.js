const db = require("../config/database");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

exports.authenticateUser = catchAsyncErrors(async (req, res, next) => {
  const { username, password } = req.body;

  const ipAddress =
    req.ip || req.header["x-forwarded-for"] || req.db.remoteAddress;
  const browserType = req.headers["user-agent"];

  if (username && password) {
    try {
      const [rows] = await db.query(
        "SELECT * FROM accounts WHERE LOWER(username) = LOWER(?)",
        [username]
      );
      if (rows.length > 0) {
        const user = rows[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
            return res
              .status(500)
              .json({ message: "Error comparing passwords!" });
          }

          if (isMatch) {
            if (user.isActive !== "active") {
              return res.status(400).json({ message: "Disabled user!" });
            }

            const token = jwt.sign(
              {
                id: user.username,
                ip: ipAddress,
                browser: browserType,
              },
              process.env.JWT_SECRET,
              { expiresIn: "1h" }
            );

            res.cookie("token", token, {
              httpOnly: true,
              sameSite: "Strict",
              maxAge: 3600000,
            });

            res.json({
              message: "Login successful!",
              token: token,
            });
          } else {
            res.status(400).json({ message: "Invalid credentials!" });
          }
        });
      } else {
        res.status(400).json({ message: "Invalid credentials!" });
      }
    } catch (error) {
      console.log(`error here :${error}`);
    }
  } else {
    res.status(401).json({ message: "Please enter Username and Password!" });
  }
});

exports.userInfo = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  username = req.user.id;

  const [rows] = await db.query("SELECT * FROM accounts WHERE username = ?", [
    username,
  ]);

  if (rows.length > 0) {
    const user = rows[0];

    const [usergroup] = await db.query(
      "SELECT * FROM usergroup WHERE username = ? ",
      [username]
    );

    res.json({
      username: user.username,
      email: user.email,
      usergroup,
    });
  } else {
    res.status(404).json({ message: "User not found!" });
  }
});

exports.logoutUser = catchAsyncErrors(async (req, res, next) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });
  res.status(200).send("Logged out successfully");
});
