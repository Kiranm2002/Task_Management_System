const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

router.get(
  "/admin",
  authMiddleware,
  authorizeRoles("admin"),
  dashboardController.getAdminDashboard
);

router.get(
  "/user",
  authMiddleware,
  authorizeRoles("user"),
  dashboardController.getUserDashboard
);


module.exports = router;