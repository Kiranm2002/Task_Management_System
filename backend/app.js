const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/auth.routes");
const taskRoutes = require("./src/routes/task.routes");
const dashboardRoutes = require("./src/routes/dashboard.routes");
const userRoutes = require("./src/routes/user.routes")
const aiRoutes = require("./src/routes/ai.routes")

const app = express();

app.use(cors({
  origin:["https://task-management-system-lilac-six.vercel.app","http://localhost:5173"],
  credentials:true,
  methods:["GET","POST","PUT","PATCH","DELETE"],
  allowedHeaders:["Content-Type", "Authorization"]
}));
app.use(express.json());



app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users",userRoutes)
app.use("/api/ai",aiRoutes)


module.exports =  app;