const { connection } = require("../config/database");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const JWT_SECRET = "DS8W284729EDHWQ29D9CWD82DX";

exports.authenticateUser = catchAsyncErrors(async (req, res, next) => {
  const { username, password } = req.body;

  if (username && password) {
    connection.query(
      "SELECT * FROM accounts WHERE username = ?",
      [username],
      (error, results) => {
        if (error) throw error;

        if (results.length > 0) {
          const user = results[0];

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

              const token = jwt.sign({ username }, JWT_SECRET, {
                expiresIn: "1h",
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
      }
    );
  } else {
    res.status(401).json({ message: "Please enter Username and Password!" });
  }
});

exports.userInfo = catchAsyncErrors(async (req, res, next) => {
  const username = req.username;

  connection.query(
    "SELECT * FROM accounts WHERE username = ?",
    [username],
    (error, results) => {
      if (error) {
        return res.status(500).json({ message: "Database error!" });
      }

      if (results.length > 0) {
        const user = results[0];
        res.json({
          username: user.username,
          email: user.email,
        });
      } else {
        res.status(404).json({ message: "User not found!" });
      }
    }
  );
});
