import { useEffect, useState } from "react";
import axios from "../api/axios";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Modal,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"; 
import { Snackbar, Alert } from "@mui/material";
import Navbar from "../components/Navbar";
import { socket } from "../api/socket";

export default function AdminDashboard() {
  const token = localStorage.getItem("accessToken");

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [userSearchTerm, setUserSearchTerm] = useState("");

  const [tabValue, setTabValue] = useState(0);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [userEditOpen, setUserEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [userDeleteModalOpen, setUserDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [naturalQuery, setNaturalQuery] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignedTo: "",
  });

  const fetchDashboard = async () => {
    const res = await axios.get("/dashboard/admin");
    setStats(res.data);
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`/tasks?_t=${Date.now()}`);
      const taskArray =
        res.data.data ||
        res.data.tasks ||
        (Array.isArray(res.data) ? res.data : []);
      setTasks(taskArray);
    } catch (error) {
      console.error("Fetch Tasks Error:", error);
    }
  };

  const fetchUsers = async () => {
    const res = await axios.get("/users");
    const result = Array.isArray(res.data) ? res.data : (res.data.users || res.data.data || []);
    const activeUsers = result.filter(
      (u) => u.role === "user" && u.isActive === true
    );
    setUsers(activeUsers);
  };

  useEffect(() => {
    fetchDashboard();
    fetchTasks();
    fetchUsers();
  }, []);

  useEffect(() => {
    const getRecommendation = async () => {
      if (form.title.length > 5 && open) {
        try {
          const res = await axios.post("/ai/recommend", { title: form.title });
          setAiAdvice(res.data.advice);
        } catch (err) {
          console.log("AI Recommend Error:", err);
        }
      } else {
        setAiAdvice("");
      }
    };
    getRecommendation();
  }, [form.title, open]);

  const handleAIDescription = async () => {
    if (!form.title) return setSnackbar({ open: true, message: "Please enter a title first" });
    setAiLoading(true);
    try {
      const res = await axios.post("/ai/generate-desc", { title: form.title });
      setForm({ ...form, description: res.data.desc });
    } catch (err) {
      setSnackbar({ open: true, message: "AI Description failed" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAISearch = async () => {
    if (!naturalQuery) return fetchTasks();
    setAiLoading(true);
    try {
      const res = await axios.post("/ai/search-parse", { text: naturalQuery });
      const tasksRes = await axios.get("/tasks", { params: res.data.query });
      setTasks(tasksRes.data.data || tasksRes.data);
      setSnackbar({ open: true, message: "AI filtered your tasks!" });
    } catch (err) {
      setSnackbar({ open: true, message: "AI Search failed to parse query" });
    } finally {
      setAiLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredUsers = users.filter((user) => 
    user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const topActiveUsers = [...users]
    .sort((a, b) => (b.completedTasksCount || 0) - (a.completedTasksCount || 0))
    .slice(0, 5);

  const createTask = async () => {
    await axios.post("/tasks", form);
    setOpen(false);
    setForm({
      title: "",
      description: "",
      priority: "medium",
      assignedTo: "",
    });
    await fetchDashboard();
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    await axios.delete(`/tasks/${taskToDelete._id}`);
    setDeleteModalOpen(false);
    setTaskToDelete(null);
    setSnackbar({ open: true, message: "Task deleted successfully" });
    setTimeout(async () => {
      await fetchTasks();
      await fetchDashboard();
    }, 500);
  };

  const confirmUserDelete = async () => {
    if (!userToDelete) return;
    await axios.put(`/users/${userToDelete._id}`, { isActive: false });
    setUserDeleteModalOpen(false);
    setUserToDelete(null);
    setSnackbar({ open: true, message: "User deactivated successfully" });
    await fetchUsers();
    await fetchDashboard();
  };

  const assignTask = async (taskId, userId) => {
    await axios.put(`/tasks/${taskId}`, { assignedTo: userId });
    await fetchTasks();
  };

  const openEdit = (task) => {
    setSelectedTask(task);
    setEditOpen(true);
  };

  const openUserEdit = (user) => {
    setSelectedUser(user);
    setUserEditOpen(true);
  };

  const updateTask = async () => {
    await axios.put(`/tasks/${selectedTask._id}`, selectedTask);
    setEditOpen(false);
    setTimeout(async () => {
      await fetchTasks();
      await fetchDashboard();
    }, 500);
  };

  const updateUser = async () => {
    if (!selectedUser) return;
    await axios.put(`/users/${selectedUser._id}`, selectedUser);
    setUserEditOpen(false);
    setSnackbar({ open: true, message: "User updated successfully" });
    await fetchUsers();
    await fetchDashboard();
  };

  useEffect(() => {
    socket.on("taskCreated", (newTask) => {
      setTasks((prevTasks) => [newTask, ...prevTasks]);
      setSnackbar({ open: true, message: `New Task Created: ${newTask.title}` });
      fetchDashboard(); 
    });

    socket.on("taskUpdated", (updatedTask) => {
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
      fetchDashboard();
    });

    socket.on("taskDeleted", ({ id }) => {
      setTasks((prevTasks) => prevTasks.filter((t) => t._id !== id));
      fetchDashboard();
    });

    return () => {
      socket.off("taskCreated");
      socket.off("taskUpdated");
      socket.off("taskDeleted");
    };
  }, []);

  return (
    <>
      <Navbar />

      <Box sx={{ p: 3 }}>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary">Total Users</Typography>
                <Typography variant="h4">{stats.totalUsers || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary">Total Tasks</Typography>
                <Typography variant="h4">{stats.totalTasks || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary">Completed Tasks</Typography>
                <Typography variant="h4">{stats.completedTasks || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', bgcolor: '#f5f5f5' }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Top 5 Active Users</Typography>
                {topActiveUsers.map((user, index) => (
                  <Typography key={user._id} variant="body2">{index + 1}. {user.name}</Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Manage Tasks" />
            <Tab label="Manage Users" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <>
            <Grid container spacing={2} mb={3} alignItems="center">
              <Grid item xs={12} sm="auto">
                <Button variant="contained" fullWidth onClick={() => setOpen(true)} sx={{ height: 40, whiteSpace: 'nowrap' }}>
                  Create Task
                </Button>
              </Grid>
              <Grid item xs={12} sm="auto">
                <TextField
                  placeholder="Search by title..."
                  size="small"
                  fullWidth
                  sx={{ width: { sm: 200 } }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Grid>
              <Grid item xs={6} sm="auto">
                <TextField
                  select
                  label="Status"
                  size="small"
                  fullWidth
                  sx={{ width: { sm: 130 } }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6} sm="auto">
                <TextField
                  select
                  label="Priority"
                  size="small"
                  fullWidth
                  sx={{ width: { sm: 130 } }}
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="all">All Priority</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md sx={{ display: 'flex', justifyContent: { md: 'flex-end' }, gap: 1 }}>
                <TextField 
                  placeholder="AI Prompt Search..."
                  size="small"
                  fullWidth
                  sx={{ maxWidth: { md: 250 } }}
                  value={naturalQuery}
                  onChange={(e) => setNaturalQuery(e.target.value)}
                />
                <Button 
                  variant="contained" 
                  color="secondary" 
                  startIcon={<AutoAwesomeIcon />}
                  onClick={handleAISearch}
                  disabled={aiLoading}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  {aiLoading ? "Parsing..." : "AI Search"}
                </Button>
              </Grid>
            </Grid>

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Assign To</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task._id}>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>{task.status}</TableCell>
                    <TableCell>{task.priority}</TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={task.assignedTo?._id || task.assignedTo || ""}
                        onChange={(e) => assignTask(task._id, e.target.value)}
                        sx={{ minWidth: 150 }}
                      >
                        <MenuItem value="">Unassigned</MenuItem>
                        {users.map((user) => <MenuItem key={user._id} value={user._id}>{user.name}</MenuItem>)}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => openEdit(task)}>Edit</Button>
                        <Button size="small" color="error" onClick={() => handleDeleteClick(task)}>Delete</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {tabValue === 1 && (
          <>
            <Box mb={2}>
              <TextField
                placeholder="Search user by name or email..."
                size="small"
                sx={{ width: 350 }}
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" onClick={() => openUserEdit(user)}>Edit User</Button>
                        <Button size="small" color="error" onClick={() => { setUserToDelete(user); setUserDeleteModalOpen(true); }}>Remove User</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        <Modal open={open} onClose={() => setOpen(false)}>
          <Box sx={modalStyle}>
            <IconButton onClick={() => setOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}><CloseIcon /></IconButton>
            <Typography variant="h6" mb={2}>Create Task</Typography>
            
            <TextField label="Title" fullWidth margin="normal" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            
            {aiAdvice && (
              <Alert severity="info" icon={<AutoAwesomeIcon />} sx={{ mt: 1, mb: 1, fontSize: '0.75rem' }}>
                {aiAdvice}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
              <TextField 
                label="Description" 
                fullWidth 
                multiline 
                rows={3} 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
              />
              <IconButton 
                color="secondary" 
                onClick={handleAIDescription} 
                disabled={aiLoading} 
                sx={{ 
                  bgcolor: '#f3e5f5',
                  width: 45, 
                  height: 45,
                  '&:hover': { bgcolor: '#e1bee7' }
                }}
              >
                {aiLoading ? <CircularProgress size={20} /> : <AutoAwesomeIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            </Box>

            <TextField select label="Priority"
            fullWidth value={form.priority} sx={{ mt: 2 }} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>
            <TextField select fullWidth label="Assign To" margin="normal" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} SelectProps={{ displayEmpty: true }}>
              <MenuItem value=""><em>Select User</em></MenuItem>
              {users.map((u) => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
            </TextField>
            <Button sx={{ mt: 2 }} fullWidth variant="contained" onClick={createTask}>Add Task</Button>
          </Box>
        </Modal>

        <Modal open={editOpen} onClose={() => setEditOpen(false)}>
          <Box sx={modalStyle}>
            <IconButton onClick={() => setEditOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}><CloseIcon /></IconButton>
            <Typography variant="h6" mb={2}>Edit Task</Typography>
            <TextField fullWidth label="Title" value={selectedTask?.title || ""} onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })} />
            <TextField fullWidth multiline rows={3} label="Description" sx={{ mt: 2 }} value={selectedTask?.description || ""} onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })} />
            <Button sx={{ mt: 2 }} fullWidth variant="contained" onClick={updateTask}>Update Task</Button>
          </Box>
        </Modal>

        <Modal open={userEditOpen} onClose={() => setUserEditOpen(false)}>
          <Box sx={modalStyle}>
            {selectedUser && (
              <>
                <IconButton onClick={() => setUserEditOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}><CloseIcon /></IconButton>
                <Typography variant="h6" mb={2}>Edit User</Typography>
                <TextField fullWidth label="Name" margin="normal" value={selectedUser.name || ""} onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} />
                <TextField fullWidth label="Email" margin="normal" value={selectedUser.email || ""} onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} />
                <TextField select fullWidth label="Role" margin="normal" value={selectedUser.role || "user"} onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </TextField>
                <Button sx={{ mt: 2 }} fullWidth variant="contained" onClick={updateUser}>Update User</Button>
              </>
            )}
          </Box>
        </Modal>

        <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
          <Box sx={modalStyle}>
            <Typography variant="h6" mb={2}>Confirm Delete Task</Typography>
            <Typography variant="body1" mb={3}>Are you sure you want to delete this task?</Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={() => setDeleteModalOpen(false)}>No</Button>
              <Button variant="contained" color="error" onClick={confirmDelete}>Yes</Button>
            </Stack>
          </Box>
        </Modal>

        <Modal open={userDeleteModalOpen} onClose={() => setUserDeleteModalOpen(false)}>
          <Box sx={modalStyle}>
            <Typography variant="h6" mb={2}>Confirm Remove User</Typography>
            <Typography variant="body1" mb={3}>Are you sure you want to remove <b>{userToDelete?.name}</b>?</Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={() => setUserDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="contained" color="error" onClick={confirmUserDelete}>Remove</Button>
            </Stack>
          </Box>
        </Modal>

      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" sx={{ width: "100%" }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: '90%', sm: 450 }, 
  bgcolor: "white",
  p: 3,
  borderRadius: 2,
  boxShadow: 24,
};