const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const userController = require("../controllers/user.controller");


router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  userController.getAllUsers
);


router.get(
  "/:id",
  authMiddleware,
  userController.getUserById
);


router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  userController.updateUser
);


router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  userController.deleteUser
);

module.exports = router;