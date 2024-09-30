const express = require("express");
const {
  verifyToken,
  verifyTokenWithRoles,
  verifyTokenWithPermit,
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
  createPlan,
  getPlans,
  createTask,
  getTasks,
  editTask,
  updateTask,
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

router.post("/applications/app", verifyToken, getApplication);
router.post("/newApplication", verifyTokenWithRoles(["PL"]), addApplication);
router.post("/editApplication", verifyTokenWithRoles(["PL"]), editApplication);
router.post(
  "/applications/createPlan",
  verifyTokenWithRoles(["PM"]),
  createPlan
);
router.post(
  "/applications/createTask",
  verifyTokenWithRoles(["PL", "Admin"]),
  createTask
);
router.post("/applications/editTask", verifyTokenWithPermit(), editTask);
router.post("/applications/updateTask", verifyTokenWithPermit(), updateTask);

router.get("/getAllApplications", verifyToken, getAllApplications);
router.post("/applications/getPlans", verifyToken, getPlans);
router.post("/applications/getTasks", verifyToken, getTasks);

module.exports = router;
