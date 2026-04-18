const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const taskRoutes = require("./routes/task.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const userRoutes = require("./routes/user.routes")
const aiRoutes = require("./routes/ai.routes")

const app = express();

app.use(cors({
  origin:["https://task-management-system-lilac-six.vercel.app/"],
  credentials:true
}));
app.use(express.json());



app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users",userRoutes)
app.use("/api/ai",aiRoutes)


module.exports =  app;