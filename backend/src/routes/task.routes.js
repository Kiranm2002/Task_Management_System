const express = require("express");
const router = express.Router();

const taskController = require("../controllers/task.controller");
const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

router.use(authMiddleware);

router.post("/", authorizeRoles("admin"), taskController.createTask);
router.delete("/:id", authorizeRoles("admin"), taskController.deleteTask);


router.get("/", taskController.getTasks);
router.get("/my-tasks", taskController.getMyTasks);
router.get("/:id", taskController.getTaskById);
router.put("/:id", taskController.updateTask);

module.exports = router;