const express = require("express");
const {
  verifyToken,
  verifyTokenWithRoles,
} = require("../middleware/verifyToken");
const {
  authenticateUser,
  userInfo,
  logoutUser,
} = require("../controllers/authController");
const {
  addUser,
  getAllAccounts,
  getAllUserGroups,
  updateUser,
  addGroup,
  editUser,
} = require("../controllers/userController");
const {
  addApplication,
  getAllApplications,
  getApplication,
  editApplication,
} = require("../controllers/applicationController");

const router = express.Router();

router.post("/auth", authenticateUser);
router.post("/adduser", verifyTokenWithRoles(["Admin"]), addUser);
router.post("/addGroup", verifyTokenWithRoles(["Admin"]), addGroup);
router.post("/logout", logoutUser);

router.get("/accounts", verifyTokenWithRoles(["Admin"]), getAllAccounts);
router.get("/usergroups", verifyToken, getAllUserGroups);

router.put("/updateUser/:username", verifyToken, updateUser);
router.put("/editUser/:username", verifyTokenWithRoles(["Admin"]), editUser);

router.get("/user_management", verifyTokenWithRoles(["Admin"]), userInfo);
router.get("/applications", verifyToken, userInfo);

router.post("/newApplication", verifyToken, addApplication);
router.post("/editApplication", verifyToken, editApplication);

router.get("/getAllApplications", verifyToken, getAllApplications);
router.get("/applications/:App_Acronym", verifyToken, getApplication);

module.exports = router;
