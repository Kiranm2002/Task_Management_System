const express = require("express");
const router = express.Router();
const projectController = require("./project.controller");
const authMiddleware = require("../../shared/middleware/auth.middleware");
const authorizeRoles = require("../../shared/middleware/role.middleware")

router.use(authMiddleware);

router.post("/", authorizeRoles("admin"), projectController.createProject);
router.get("/",  projectController.getProjects);

router.get("/:id", projectController.getProjectById);
router.get("/:id/board", projectController.getProjectBoard);
router.patch("/:id", authorizeRoles("admin"),projectController.updateProject);
router.delete("/:id",authorizeRoles("admin"), projectController.deleteProject);

router.get("/team/:teamId", projectController.getTeamProjects);

module.exports = router;