const express = require("express");
const router = express.Router();
const userController = require("./user.controller");
const authMiddleware = require("../../shared/middleware/auth.middleware")
const authorizeRoles = require("../../shared/middleware/role.middleware")


router.use(authMiddleware);

router.get("/me", userController.getProfile);
router.put("/me", userController.updateProfile);

router.get("/", userController.getUsers);
router.put("/:id", authorizeRoles("admin"), userController.updateUser);
router.patch("/:id", authorizeRoles("admin"), userController.deleteUser);

module.exports = router;