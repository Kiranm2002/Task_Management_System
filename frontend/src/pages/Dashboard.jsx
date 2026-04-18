import { useEffect, useState } from "react";
import axios from "../api/axios";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Stack,
  CircularProgress,
  Avatar,
} from "@mui/material";

import AssignmentIcon from "@mui/icons-material/Assignment";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {socket} from "../api/socket"

import Navbar from "../components/Navbar";
export default function UserDashboard() {
  const user  = JSON.parse(localStorage.getItem("user"))


  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("accessToken");

  const fetchData = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        axios.get("/dashboard/user", {
          headers: { Authorization: `Bearer ${token}` },
        }),

        axios.get("/tasks/my-tasks", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats(statsRes.data.data || statsRes.data);
      setTasks(tasksRes.data || []);
    } catch (err) {
      console.log("Dashboard error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); 
    socket.on("connect", () => {
    console.log("Connected to socket server with ID:", socket.id);
  });
    
    const handleUpdate = (data) => {
   
      fetchData();
    };

    socket.on("taskCreated", handleUpdate);
    socket.on("taskUpdated", handleUpdate);
    socket.on("taskDeleted", handleUpdate);

    
    return () => {
        socket.off("connect")
      socket.off("taskCreated", handleUpdate);
      socket.off("taskUpdated", handleUpdate);
      socket.off("taskDeleted", handleUpdate);
    };
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `/tasks/${id}`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchData(); 
    } catch (err) {
      console.log("Status update error:", err.message);
    }
  };

  const safe = (val) => val || 0;

  const cards = [
    {
      title: "Total Tasks",
      value: safe(stats?.totalTasks),
      icon: <AssignmentIcon />,
      color: "#1976d2",
    },
    {
      title: "In Progress",
      value: safe(stats?.inProgress),
      icon: <PendingActionsIcon />,
      color: "#ed6c02",
    },
    {
      title: "Pending",
      value: safe(stats?.pending),
      icon: <HourglassTopIcon />,
      color: "#9c27b0",
    },
    {
      title: "Completed",
      value: safe(stats?.completed),
      icon: <CheckCircleIcon />,
      color: "#2e7d32",
    },
  ];

  return (
    <>
      <Navbar />

      <Box sx={{ p: 3 }}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5">
              Welcome, {user?.name || "User"}
            </Typography>
            <Typography variant="body2">
              {user?.email}
            </Typography>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {cards.map((card, i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Card sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: card.color }}>
                        {card.icon}
                      </Avatar>

                      <Box>
                        <Typography variant="body2">
                          {card.title}
                        </Typography>
                        <Typography variant="h5">
                          {card.value}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 5 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                My Tasks
              </Typography>

              {tasks.length === 0 ? (
                <Typography>No tasks assigned</Typography>
              ) : (
                tasks.map((task) => (
                  <Card key={task._id} sx={{ mb: 2, p: 2 }}>
                    <Typography variant="h6">
                      {task.title}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {task.description}
                    </Typography>

                    <Typography sx={{ mb: 1 }}>
                      Status: <b>{task.status}</b>
                    </Typography>

                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        color="warning"
                        onClick={() =>
                          updateStatus(task._id, "in-progress")
                        }
                      >
                        In Progress
                      </Button>

                      <Button
                        variant="contained"
                        color="success"
                        onClick={() =>
                          updateStatus(task._id, "completed")
                        }
                      >
                        Completed
                      </Button>
                    </Stack>
                  </Card>
                ))
              )}
            </Box>
          </>
        )}
      </Box>
    </>
  );
}