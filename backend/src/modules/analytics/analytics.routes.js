const express = require("express");
const router = express.Router();
const analyticsController = require("./analytics.controller");
const authMiddleware = require("../../shared/middleware/auth.middleware");
const authorizeRoles = require("../../shared/middleware/role.middleware");

router.get(
  "/admin/dashboard",
  authMiddleware,
  authorizeRoles("admin"),
  analyticsController.getAdminDashboard
);

router.get(
  "/user/dashboard",
  authMiddleware,
  analyticsController.getUserDashboard
);

router.get("/admin/deep", authMiddleware, authorizeRoles("admin"), analyticsController.getDeepAnalytics);
router.get('/admin/teams', authMiddleware, authorizeRoles("admin"), analyticsController.getTeamPerformance);

module.exports = router;