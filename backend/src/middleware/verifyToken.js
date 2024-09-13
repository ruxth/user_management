const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "DS8W284729EDHWQ29D9CWD82DX";

exports.verifyToken = catchAsyncErrors(async (req, res, next) => {
  const token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).json({ message: "No token provided!" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Failed to authenticate token." });
    }

    req.username = decoded.username;
    next();
  });
});
