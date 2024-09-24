const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const dotenv = require("dotenv");

dotenv.config();
async function checkGroup(username, groupNames) {
  try {
    const placeholders = groupNames.map(() => "?").join(", ");

    const query = `
      SELECT COUNT(*) as count
      FROM usergroup
      WHERE username = ? AND user_group IN (${placeholders})`;

    const params = [username, ...groupNames];

    const [rows] = await db.query(query, params);
    return rows[0].count > 0;
  } catch (error) {
    throw new Error(error.message);
  }
}

exports.verifyToken = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.token; // Get token from cookies

  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentIp = req.ip || req.connection.remoteAddress;
    const currentBrowser = req.headers["user-agent"];
    const username = decoded.id;
    const [rows] = await db.query(
      "SELECT isActive FROM accounts WHERE username = ?",
      [username]
    );
    const user = rows[0];

    if (
      decoded.ip !== currentIp ||
      decoded.browser !== currentBrowser ||
      user.isActive !== "active"
    ) {
      res.clearCookie("token");
      return res.status(403).send("Access denied");
    }

    // req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Access denied" });
  }
});

exports.checkIsActive = async (req, res, next) => {
  const token = req.cookies.token; // Get token from cookies

  console.log("Token:", token);

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const username = decoded.id;
    const [rows] = await db.query(
      "SELECT isActive FROM accounts WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      res.clearCookie("token"); // Clear token from cookies
      return res
        .status(401)
        .json({ message: "User not found, token removed." });
    }

    const user = rows[0];

    if (user.isActive !== "active") {
      res.clearCookie("token"); // Clear token from cookies
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (error) {
    res.clearCookie("token"); // Clear token from cookies
    return res.status(403).json({ message: "Access denied" });
  }
};

exports.verifyTokenWithRoles = (groupname) => async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    res.clearCookie("token");
    return res.status(403).send("Access denied");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentIp = req.ip || req.connection.remoteAddress;
    const currentBrowser = req.headers["user-agent"];
    const username = decoded.id;

    const userChecked = await checkGroup(username, groupname);
    const [rows] = await db.query(
      "SELECT isActive FROM accounts WHERE username = ?",
      [username]
    );
    const user = rows[0];

    if (
      decoded.ip == currentIp &&
      decoded.browser == currentBrowser &&
      userChecked &&
      user.isActive === "active"
    ) {
      next();
    } else {
      res.clearCookie("token"); // Clear token cookie if IP or browser don't match
      return res.status(403).send("Access denied");
    }
  } catch (error) {
    console.error("JWT Verification Error:", error);
    res.clearCookie("token");
    return res.status(403).send("Access denied");
  }
};

exports.checkGroup = checkGroup;
