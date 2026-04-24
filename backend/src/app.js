const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { setupCSRF } = require("./shared/middleware/crsf.middleware")

const authRoutes = require("./modules/auth/auth.routes");
const taskRoutes = require("./modules/tasks/task.routes");
const analyticRoutes = require("./modules/analytics/analytics.routes");
const userRoutes = require("./modules/users/user.routes")
const aiRoutes = require("./modules/ai/ai.routes")
const projectRoutes = require("./modules/projects/project.routes");
const teamRoutes = require("./modules/teams/team.routes");
const notificationRoutes = require("./modules/notifications/notification.routes");
const collaborationRoutes = require("./modules/collaboration/collaboration.routes")

const app = express();

app.use(cookieParser());
app.use(helmet());
app.use(cors({
  origin:process.env.FRONTEND_URL,
  credentials:true,
  methods:["GET","POST","PUT","PATCH","DELETE"],
  allowedHeaders:["Content-Type", "Authorization"]
}));

app.use(setupCSRF);
app.use(express.json());
app.set('trust proxy', 1);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/analytics", analyticRoutes);
app.use("/api/users",userRoutes);
app.use("/api/ai",aiRoutes);
app.use("/api/projects",projectRoutes);
app.use("/api/teams",teamRoutes);
app.use("/api/notifications",notificationRoutes);
app.use("/api/collaboration",collaborationRoutes);


module.exports =  app;