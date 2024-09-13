const express = require("express");
const { authenticateUser, userInfo } = require("../controllers/authController");
const {
  addUser,
  getAllAccounts,
  getAllUserGroups,
  updateUser,
  addGroup,
  editUser,
} = require("../controllers/userController");
const { verifyToken } = require("../middleware/verifyToken");

const router = express.Router();

router.post("/auth", authenticateUser);
router.post("/adduser", addUser);
router.post("/addGroup", addGroup);

router.get("/user-info", verifyToken, userInfo);
router.get("/accounts", getAllAccounts);
router.get("/usergroups", getAllUserGroups);

router.put("/updateUser/:username", updateUser);
router.put("/editUser/:username", editUser);

module.exports = router;
