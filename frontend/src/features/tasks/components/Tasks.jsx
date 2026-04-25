import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Grid, Card, CardContent, CardActions, 
  IconButton, Modal, TextField, MenuItem, Select, InputLabel, 
  FormControl, Chip, Stack, Skeleton, Avatar, CircularProgress, Tooltip, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import { 
  Add, Edit, Delete, Close, CheckCircle, Error, 
  CloudUpload, AttachFile, Timer, GetApp, Visibility, AutoAwesome, PlaylistAddCheck, Lightbulb
} from '@mui/icons-material';
import { 
  useGetTasksQuery, 
  useCreateTaskMutation, 
  useUpdateTaskMutation, 
  useDeleteTaskMutation 
} from '../taskApi'; 
import { useGetProjectsQuery } from '../../projects/projectsApi';
import { useGetAllUsersQuery } from '../../teams/teamsApi'; 
import { useSocket } from '../../../providers/SocketProvider';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../auth/authSlice';
import { useGenerateTaskDetailsMutation, useRecommendUserMutation, useLazyGetSmartSearchQuery } from '../../ai/aiApi';

const modalStyle = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: { xs: '95%', sm: 500 }, 
  maxHeight: '90vh', overflowY: 'auto',
  bgcolor: 'background.paper', borderRadius: 3, boxShadow: 24, p: 4,
};

const statusColors = {
  'backlog': '#9e9e9e', 'todo': '#2196f3', 'in-progress': '#ff9800',
  'in-review': '#9c27b0', 'blocked': '#f44336', 'completed': '#4caf50', 'archived': '#455a64'
};

const priorityColors = {
  'low': '#4caf50', 'medium': '#ff9800', 'high': '#f44336', 'urgent': '#b71c1c'
};

const Tasks = () => {
  const socket = useSocket();
  const dispatch = useDispatch(); 
  const user = useSelector(selectCurrentUser);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [homefocused, setHomeFocused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSmartSearching, setIsSmartSearching] = useState(false);
  const [smartResults, setSmartResults] = useState(null);

  const [filters, setFilters] = useState({
    search: '', status: 'all', priority: 'all', dueDate: ''
  });

  const initialForm = {
    title: '', description: '', projectId: '', assignedTo: '', 
    status: 'todo', priority: 'medium', dueDate: '', 
    estimatedHours: 0, actualHours: 0, subtasks: []
  };

  const [formData, setFormData] = useState(initialForm);
  const [messageModal, setMessageModal] = useState({ open: false, type: '', text: '' });

  const { data: tasks, isLoading: tasksLoading, refetch } = useGetTasksQuery();
  const { data: projects } = useGetProjectsQuery();
  const { data: users } = useGetAllUsersQuery();
  
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [generateTaskDetails] = useGenerateTaskDetailsMutation();
  const [recommendUser] = useRecommendUserMutation();
  const [triggerSmartSearch] = useLazyGetSmartSearchQuery();

  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setSelectedFiles([]);
    setFormData(initialForm); 
    setAiAdvice(null);
  };

  const handleFileChange = (e) => {
    setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  const handleSmartSearch = async () => {
    if (!filters.search || filters.search.length < 3) return;
    setIsSmartSearching(true);
    try {
      const response = await triggerSmartSearch(filters.search).unwrap();
      if (response.success) {
        setSmartResults(response.data);
      }
    } catch (err) {
      setMessageModal({ open: true, type: 'error', text: 'Smart search failed' });
    } finally {
      setIsSmartSearching(false);
    }
  };

  const handleAIGenerate = async () => {
  if (!formData.title || formData.title.length < 3) {
    setMessageModal({ open: true, type: 'error', text: 'Please enter a descriptive title first.' });
    return;
  }
  
  setIsGenerating(true);
  setAiAdvice(null);
  
  try {
    const response = await generateTaskDetails({ title: formData.title }).unwrap();
    
    setFormData(prev => ({
      ...prev,
      description: response.description,
      priority: response.priority,
      estimatedHours: response.estimatedHours || 0,
      subtasks: response.subtasks.map(st => ({ title: st, isCompleted: false }))
    }));

    const currentProject = projects?.find(p => String(p._id) === String(formData.projectId));
    
    if (currentProject) {
      const teamId = currentProject.teamId?._id || currentProject.team;

      if (teamId) {
        setIsRecommending(true);
        const recResponse = await recommendUser({ 
          title: formData.title, 
          teamId: teamId 
        }).unwrap();
        setAiAdvice(recResponse.advice);
        if (recResponse.advice?.recommendedUserId) {
          setFormData(prev => ({ ...prev, assignedTo: recResponse.advice.recommendedUserId }));
        }
      } else {
        console.warn("Recommendation skipped: No team found on this project.");
      }
    } else {
      console.warn("Recommendation skipped: No project matched the selected ID.");
    }

  } catch (err) {
    console.error("AI Error Catch:", err);
    setMessageModal({ open: true, type: 'error', text: 'AI enhancement failed' });
  } finally {
    setIsGenerating(false);
    setIsRecommending(false);
  }
};

  const handleSubmit = async () => {
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'subtasks') {
          data.append(key, JSON.stringify(formData[key]));
        } else {
          data.append(key, formData[key]);
        }
      });
      selectedFiles.forEach(file => data.append('attachments', file));

      if (editMode) {
        await updateTask({ id: selectedTask._id, data }).unwrap();
        setMessageModal({ open: true, type: 'success', text: 'Task updated!' });
      } else {
        await createTask(data).unwrap();
        setMessageModal({ open: true, type: 'success', text: 'Task created!' });
      }
      handleClose();
    } catch (err) {
      setMessageModal({ open: true, type: 'error', text: err?.data?.message || 'Operation failed' });
    }
  };

  const displayTasks = smartResults || tasks;

  const filteredTasks = displayTasks?.filter(task => {
    if (smartResults) return true;
    const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase()) || 
                          task.projectId?.name?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || task.status === filters.status;
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
    const matchesDate = !filters.dueDate || (task.dueDate && task.dueDate.split('T')[0] === filters.dueDate);
    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });

  useEffect(() => {
    if (socket) {
      const handleRefresh = () => refetch();
      socket.on("TASK_UPDATED", handleRefresh); 
      socket.on("TASK_MOVED", handleRefresh);
      socket.on("TASK_LIST_REFRESH", handleRefresh);
      return () => {
        socket.off("TASK_UPDATED", handleRefresh);
        socket.off("TASK_MOVED", handleRefresh);
        socket.off("TASK_LIST_REFRESH", handleRefresh);
      };
    }
  }, [socket, refetch]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom color="primary">Task Center</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage your project tasks and attachments efficiently.
        </Typography>
        <Button 
          variant="contained" startIcon={<Add />} onClick={() => setOpen(true)} 
          sx={{ borderRadius: 2, px: 5, py: 1.2, textTransform: 'none' }}
        >
          Create Task
        </Button>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }} alignItems="center">
        <Box sx={{ display: 'flex', flexGrow: 1, gap: 1, width: '100%' }}>
          <TextField
            size="small"
            label="Search Task or Project"
            fullWidth
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              if (!e.target.value) setSmartResults(null);
            }}
          />
          <Tooltip title="AI Smart Search">
            <IconButton 
              onClick={handleSmartSearch} 
              disabled={isSmartSearching} 
              color="secondary" 
              sx={{ 
                bgcolor: 'rgba(156, 39, 176, 0.1)', 
                '&:hover': { bgcolor: 'rgba(156, 39, 176, 0.2)' },
                borderRadius: 2
              }}
            >
              {isSmartSearching ? <CircularProgress size={24} color="inherit" /> : <AutoAwesome />}
            </IconButton>
          </Tooltip>
        </Box>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            disabled={!!smartResults}
          >
            <MenuItem value="all">All Status</MenuItem>
            {Object.keys(statusColors).map(s => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={filters.priority}
            label="Priority"
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            disabled={!!smartResults}
          >
            <MenuItem value="all">All Priority</MenuItem>
            {['low', 'medium', 'high', 'urgent'].map(p => <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          size="small"
          type={filters.dueDate || homefocused ? "date" : "text"}
          label="Due Date"
          disabled={!!smartResults}
          InputLabelProps={{ shrink: true }}
          onFocus={() => setHomeFocused(true)}
          onBlur={() => setHomeFocused(false)}
          value={filters.dueDate}
          onChange={(e) => setFilters({ ...filters, dueDate: e.target.value })}
        />
        {(filters.search || filters.status !== 'all' || filters.priority !== 'all' || filters.dueDate || smartResults) && (
          <Button onClick={() => { setFilters({ search: '', status: 'all', priority: 'all', dueDate: '' }); setSmartResults(null); }}>Clear</Button>
        )}
      </Stack>

      {smartResults && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip icon={<AutoAwesome size="small" />} label={`AI found ${filteredTasks?.length} matches`} color="secondary" variant="outlined" onDelete={() => setSmartResults(null)} />
        </Box>
      )}

      <Grid container spacing={3}>
        {tasksLoading ? [1,2,3].map(i => (
          <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rounded" height={180} /></Grid>
        )) : filteredTasks?.map((task) => (
          <Grid item xs={12} sm={6} md={4} key={task._id}>
            <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0', position: 'relative' }} elevation={0}>
              <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                <Chip 
                  label={task.priority} 
                  size="small" 
                  sx={{ 
                    bgcolor: priorityColors[task.priority], 
                    color: 'white', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' 
                  }} 
                />
              </Box>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5, pr: 8 }}>
                  <Chip label={task.status} size="small" sx={{ bgcolor: statusColors[task.status], color: 'white', textTransform: 'capitalize' }} />
                  {task.attachments?.length > 0 && <AttachFile fontSize="small" color="action" />}
                </Stack>
                <Typography variant="h6" fontWeight={700} noWrap>{task.title}</Typography>
                <Typography variant="caption" color="text.secondary">Project: {task.projectId?.name || 'No Project'}</Typography>
                
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {task.startDate ? `Start Date: ${task.startDate.split('T')[0]}` : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {task.completedAt ? `Completed Date: ${task.completedAt.split('T')[0]}` : ''}
                  </Typography>
                </Stack>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem' }}>{task.assignedTo?.name?.[0]}</Avatar>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Timer fontSize="inherit" /> {task.actualHours}/{task.estimatedHours}h
                    </Typography>
                </Box>
                {task.attachments && task.attachments.length > 0 && (
                  <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed #eee' }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">FILES ({task.attachments.length})</Typography>
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      {task.attachments.map((file, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f9f9f9', p: 0.5, borderRadius: 1 }}>
                          <Typography variant="caption" noWrap sx={{ maxWidth: '120px' }}>{file.filename}</Typography>
                          <Box>
                            <IconButton size="small" onClick={() => window.open(file.url, '_blank')}><Visibility sx={{ fontSize: 14 }} /></IconButton>
                            <IconButton size="small" onClick={() => { window.location.href = file.url.replace('/upload/', '/upload/fl_attachment/'); }}><GetApp sx={{ fontSize: 14 }} /></IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', borderTop: '1px solid #f5f5f5' }}>
                <IconButton size="small" onClick={() => { 
                    setEditMode(true); setSelectedTask(task); 
                    setFormData({...task, projectId: task.projectId?._id || task.projectId, assignedTo: task.assignedTo?._id || task.assignedTo, dueDate: task.dueDate ? task.dueDate.split('T')[0] : '', subtasks: task.subtasks || [] }); 
                    setOpen(true); 
                }}><Edit fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => { setTaskToDelete(task._id); setDeleteModalOpen(true); }}><Delete fontSize="small" /></IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 12, top: 12 }}><Close /></IconButton>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>{editMode ? 'Edit Task' : 'Task Details'}</Typography>
          <Stack spacing={2.5}>
            <TextField 
              fullWidth label="Title" value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
            />

            <FormControl fullWidth variant="outlined">
              <InputLabel>Select Project</InputLabel>
              <Select 
                fullWidth 
                value={formData.projectId} 
                label="Select Project" 
                onChange={(e) => setFormData({...formData, projectId: e.target.value})}
              >
                {projects?.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
              </Select>
            </FormControl>

            <Box>
              <Box 
                onClick={!isGenerating ? handleAIGenerate : null}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 1, 
                  bgcolor: 'secondary.main', 
                  color: 'white',
                  py: 0.8, 
                  borderRadius: 2,
                  cursor: isGenerating ? 'default' : 'pointer',
                  mb: 1,
                  transition: '0.3s',
                  '&:hover': { bgcolor: 'secondary.dark', transform: 'translateY(-2px)' }
                }}
              >
                {isGenerating ? <CircularProgress size={18} color="inherit" /> : <AutoAwesome sx={{ fontSize: 18 }} />}
                <Typography variant="caption" fontWeight={700}>GENERATE DESC WITH AI</Typography>
              </Box>
              <TextField 
                fullWidth multiline rows={3} 
                label="Description"
                placeholder="Enter task details..."
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
              />
            </Box>
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}><PlaylistAddCheck size="small"/> Subtasks</Typography>
              <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1, maxHeight: 150, overflowY: 'auto' }}>
                {formData.subtasks.length > 0 ? (
                  <List size="small">
                    {formData.subtasks.map((st, i) => (
                      <ListItem key={i} dense>
                        <ListItemText primary={st.title} primaryTypographyProps={{ variant: 'caption' }} />
                        <ListItemSecondaryAction>
                          <IconButton size="small" onClick={() => setFormData({...formData, subtasks: formData.subtasks.filter((_, idx) => idx !== i)})}><Delete fontSize="inherit"/></IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : <Typography variant="caption" color="text.secondary">No subtasks generated yet.</Typography>}
              </Box>
            </Box>

            <Grid container spacing={2}>
                <Grid item xs={6}><FormControl fullWidth><InputLabel>Status</InputLabel><Select value={formData.status} label="Status" onChange={(e) => setFormData({...formData, status: e.target.value})}>{Object.keys(statusColors).map(s => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}</Select></FormControl></Grid>
                <Grid item xs={6}><FormControl fullWidth><InputLabel>Priority</InputLabel><Select value={formData.priority} label="Priority" onChange={(e) => setFormData({...formData, priority: e.target.value})}>{['low', 'medium', 'high', 'urgent'].map(p => <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>)}</Select></FormControl></Grid>
            </Grid>

            <Box>
              {isRecommending && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 1 }}>
                  <CircularProgress size={12} color="secondary" />
                  <Typography variant="caption" color="secondary" fontWeight={600}>Finding best assignee...</Typography>
                </Box>
              )}
              {aiAdvice && (
                <Box sx={{ bgcolor: 'rgba(156, 39, 176, 0.05)', border: '1px solid rgba(156, 39, 176, 0.2)', borderRadius: 2, p: 1.5, mb: 1.5, mt: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Lightbulb sx={{ fontSize: 16, color: 'secondary.main', mt: 0.2 }} />
                    <Typography variant="caption" color="secondary.main" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                      AI Recommended: {
                        users?.find(u => u._id === aiAdvice.recommendedUserId)?.name || 'Recommended User'
                      } — {aiAdvice.reason}
                    </Typography>
                  </Stack>
                </Box>
              )}
              <FormControl fullWidth variant="outlined">
                  <InputLabel>Assign To User</InputLabel>
                  <Select fullWidth value={formData.assignedTo} label="Assign To User" onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}>
                      {users?.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
                  </Select>
              </FormControl>
            </Box>

            <Grid container spacing={2}>
                <Grid item xs={6}><TextField fullWidth type="number" label="Est. Hours" value={formData.estimatedHours} onChange={(e) => setFormData({...formData, estimatedHours: e.target.value})} /></Grid>
                <Grid item xs={6}><TextField fullWidth type="number" label="Actual Hours" value={formData.actualHours} onChange={(e) => setFormData({...formData, actualHours: e.target.value})} /></Grid>
            </Grid>

            <TextField fullWidth label="Due Date" type={formData.dueDate || focused ? "date" : "text"} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} InputLabelProps={{ shrink: true }} value={formData.dueDate ? formData.dueDate.split('T')[0] : ''} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} />

            <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 2, textAlign: 'center', bgcolor: '#fafafa' }}>
              <Button component="label" startIcon={<CloudUpload />} sx={{ textTransform: 'none' }}>Upload Attachments<input type="file" hidden multiple onChange={handleFileChange} /></Button>
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>{selectedFiles.map((f, i) => (<Chip key={i} label={f.name} size="small" onDelete={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))} />))}</Stack>
            </Box>

            <Button fullWidth variant="contained" size="large" onClick={handleSubmit} sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>Save Task</Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <Box sx={{ ...modalStyle, width: 350, textAlign: 'center' }}>
          <IconButton onClick={() => setDeleteModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><Close /></IconButton>
          <Typography variant="h6" fontWeight={700}>Confirm Deletion</Typography>
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => setDeleteModalOpen(false)}>No</Button>
            <Button variant="contained" color="error" onClick={async () => { await deleteTask(taskToDelete); setDeleteModalOpen(false); }}>Yes, Delete</Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={messageModal.open} onClose={() => setMessageModal({ ...messageModal, open: false })}>
        <Box sx={{ ...modalStyle, width: 320, textAlign: 'center' }}>
          <IconButton onClick={() => setMessageModal({ ...messageModal, open: false })} sx={{ position: 'absolute', right: 8, top: 8 }}><Close /></IconButton>
          {messageModal.type === 'success' ? <CheckCircle sx={{ fontSize: 50, color: 'success.main', mb: 2 }} /> : <Error sx={{ fontSize: 50, color: 'error.main', mb: 2 }} />}
          <Typography variant="h6" fontWeight={700}>{messageModal.type === 'success' ? 'Success' : 'Error'}</Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>{messageModal.text}</Typography>
          <Button fullWidth variant="contained" onClick={() => setMessageModal({ ...messageModal, open: false })}>Close</Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default Tasks;