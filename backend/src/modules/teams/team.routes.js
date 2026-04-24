const express = require("express");
const router = express.Router();
const teamController = require("./team.controller");
const authMiddleware = require("../../shared/middleware/auth.middleware");
const authorizeRoles = require("../../shared/middleware/role.middleware");

router.use(authMiddleware);

router.post("/", authorizeRoles("admin"), teamController.createTeam);
router.get("/all-teams", authorizeRoles("admin"), teamController.getTeams);
router.put("/:teamId/members", authorizeRoles("admin"), teamController.addMember);
router.patch("/:id", authorizeRoles("admin"),teamController.updateTeam);
router.delete("/:id",authorizeRoles("admin"), teamController.deleteTeam);

module.exports = router;