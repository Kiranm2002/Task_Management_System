const express = require("express");
const router = express.Router();
const taskController = require("./task.controller");
const  authMiddleware  = require("../../shared/middleware/auth.middleware");
const authorizeRoles = require("../../shared/middleware/role.middleware");
const upload = require("../../shared/middleware/upload.middleware")

router.use(authMiddleware);

router.post("/", authorizeRoles("admin"),upload.array("attachments", 10), taskController.createTask);
router.get("/", taskController.getAllTasks);
router.post("/:id/attachments",upload.array("attachments", 5),taskController.uploadAttachments);
router.get("/project/:projectId", taskController.getTasksByProject);
router.get("/my-tasks", taskController.getMyTasks);
router.patch("/:taskId/status", taskController.moveTask);
router.put("/:id", upload.array("attachments"),taskController.updateTask);
router.delete("/:id", authorizeRoles("admin"), taskController.deleteTask);
module.exports = router;