import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, TextField, MenuItem,
  Select, InputLabel, FormControl, Chip, Stack, Skeleton,
  Paper, Divider, IconButton, Tooltip, List, ListItem, ListItemText, Popover,
  CircularProgress
} from '@mui/material';
import {
  Assignment, Timer, Flag, FilterListOff, AttachFile, GetApp, Visibility, Send, ChatBubbleOutlined,
  AutoAwesome, AutoAwesomeMotion
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useGetUserKanbanTasksQuery, taskApi, useAddCommentMutation, useGetAllUsersQuery } from '../../tasks/taskApi';
import { useLazyGetSmartSearchQuery } from '../../ai/aiApi';
import { useSocket } from '../../../providers/SocketProvider';
import { selectCurrentUser } from '../../auth/authSlice';

const statusColors = {
  'backlog': '#9e9e9e', 'todo': '#2196f3', 'in-progress': '#ff9800',
  'in-review': '#9c27b0', 'blocked': '#f44336', 'completed': '#4caf50', 'archived': '#455a64'
};

const priorityColors = {
  'low': '#4caf50', 'medium': '#ff9800', 'high': '#f44336', 'urgent': '#b71c1c'
};

const CommentInput = ({ taskId, onSend, users }) => {
  const [text, setText] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);
    const lastWord = val.split(/[\s\n]/).pop();
    if (lastWord && lastWord.startsWith('@')) {
      const query = lastWord.slice(1).toLowerCase();
      const matches = users.filter(u => u.display.toLowerCase().includes(query));
      setFilteredUsers(matches);
      setAnchorEl(e.target);
    } else {
      setAnchorEl(null);
    }
  };

  const handleSelectUser = (user) => {
    const words = text.split(/\s/);
    words.pop(); 
    const newText = words.join(' ') + ` @${user.display} `; 
    setText(newText.trimStart()); 
    setAnchorEl(null);
  };

  return (
    <Box sx={{ position: 'relative', mt: 1 }}>
      <TextField
        fullWidth
        multiline
        rows={2}
        variant="outlined"
        placeholder="Type @ to mention..."
        value={text}
        onChange={handleInputChange}
        sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.8rem' } }}
      />
      <Popover
        open={Boolean(anchorEl) && filteredUsers.length > 0}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        disableAutoFocus
      >
        <List sx={{ width: 200, maxHeight: 200, overflow: 'auto' }}>
          {filteredUsers.map((u) => (
            <ListItem button key={u.id} onClick={() => handleSelectUser(u)}>
              <ListItemText primary={u.display} />
            </ListItem>
          ))}
        </List>
      </Popover>
      <IconButton 
        onClick={() => { onSend(taskId, text); setText(''); }}
        disabled={!text.trim()}
        sx={{ position: 'absolute', bottom: 4, right: 4 }}
      >
        <Send fontSize="small" color="primary" />
      </IconButton>
    </Box>
  );
};

const MyProjects = () => {
  const user = useSelector(selectCurrentUser);
  const socket = useSocket();
  const dispatch = useDispatch();
  const [focused, setFocused] = useState(false);
  const [smartResults, setSmartResults] = useState(null);
  const [filters, setFilters] = useState({
    search: '', status: 'all', priority: 'all', dueDate: ''
  });

  const { data: tasks, isLoading: tasksLoading } = useGetUserKanbanTasksQuery();
  const { data: usersList } = useGetAllUsersQuery();
  const [addComment] = useAddCommentMutation();
  const [triggerSmartSearch, { isLoading: isAiLoading }] = useLazyGetSmartSearchQuery();

  const usersForMentions = usersList?.map(u => ({ id: u._id, display: u.name })) || [];

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (socket && userId) {
      socket.emit("join_room", userId);
      const handleRefresh = () => {
        dispatch(taskApi.util.invalidateTags(['Task', 'Board']));
      };
      socket.on("TASK_UPDATED", handleRefresh);
      socket.on("TASK_LIST_REFRESH", handleRefresh);
      socket.on("new_notification", handleRefresh);
      return () => {
        socket.off("TASK_UPDATED", handleRefresh);
        socket.off("TASK_LIST_REFRESH", handleRefresh);
        socket.off("new_notification", handleRefresh);
      };
    }
  }, [socket, user, dispatch]);

  const handleSendComment = async (taskId, text) => {
    try {
      let mentionedUserIds = [];
      const mentionsFound = text.match(/@(\S+)/g) || [];
      if (usersList && usersList.length > 0) {
        mentionedUserIds = mentionsFound.map(m => {
          const typedName = m.substring(1).replace(/[^\w]/g, '').toLowerCase();
          const foundUser = usersList.find(u => {
            const dbName = u.name.replace(/\s+/g, '').toLowerCase();
            return dbName === typedName;
          });
          return foundUser?._id;
        }).filter(Boolean);
      }
      await addComment({ 
        taskId, 
        text: text, 
        mentionedUsers: mentionedUserIds 
      }).unwrap();
    } catch (err) {
      console.error("Failed to send comment:", err);
    }
  };

  const handleSmartSearch = async () => {
    if (!filters.search || filters.search.length < 3) return;
    try {
      const response = await triggerSmartSearch(filters.search).unwrap();
      if (response.success) {
        setSmartResults(response.data);
      }
    } catch (err) {
      console.error("Smart search failed", err);
    }
  };

  const displayTasks = smartResults || tasks || [];

  const filteredTasks = displayTasks.filter(task => {
    if (smartResults) return true;
    const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                          task.projectId?.name?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || task.status === filters.status;
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
    const matchesDate = !filters.dueDate || (task.dueDate && task.dueDate.split('T')[0] === filters.dueDate);
    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });

  const hasTasksAtAll = tasks && tasks.length > 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" fontWeight={900} letterSpacing={-1} color="primary.main">
          My Project Assignments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your progress across all active projects and maintain your delivery timeline.
        </Typography>
      </Box>

      {hasTasksAtAll && (
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
                disabled={isAiLoading} 
                color="secondary" 
                sx={{ 
                  bgcolor: 'rgba(156, 39, 176, 0.1)', 
                  '&:hover': { bgcolor: 'rgba(156, 39, 176, 0.2)' },
                  borderRadius: 2
                }}
              >
                {isAiLoading ? <CircularProgress size={24} color="inherit" /> : <AutoAwesome />}
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
            type={filters.dueDate || focused ? "date" : "text"}
            label="Due Date"
            disabled={!!smartResults}
            InputLabelProps={{ shrink: true }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            value={filters.dueDate}
            onChange={(e) => setFilters({ ...filters, dueDate: e.target.value })}
          />
          {(filters.search || filters.status !== 'all' || filters.priority !== 'all' || filters.dueDate || smartResults) && (
            <IconButton onClick={() => { setFilters({ search: '', status: 'all', priority: 'all', dueDate: '' }); setSmartResults(null); }}>
              <FilterListOff />
            </IconButton>
          )}
        </Stack>
      )}

      {smartResults && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip icon={<AutoAwesome size="small" />} label={`AI found ${filteredTasks?.length} matches`} color="secondary" variant="outlined" onDelete={() => setSmartResults(null)} />
        </Box>
      )}

      <Grid container spacing={3}>
        {tasksLoading ? (
          [1, 2, 3].map(i => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
            </Grid>
          ))
        ) : filteredTasks?.length > 0 ? (
          filteredTasks.map((task) => (
            <Grid item xs={12} sm={6} md={4} key={task._id}>
              <Card sx={{
                borderRadius: 4,
                border: '1px solid #e0e0e0',
                transition: '0.3s',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }
              }} elevation={0}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Chip
                      label={task.status}
                      size="small"
                      sx={{
                        bgcolor: statusColors[task.status],
                        color: 'white',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '0.65rem'
                      }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Flag sx={{ color: priorityColors[task.priority], fontSize: 18 }} />
                      <Typography variant="caption" fontWeight={700} sx={{ color: priorityColors[task.priority], textTransform: 'uppercase' }}>
                        {task.priority}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography variant="h6" fontWeight={700} gutterBottom noWrap>
                    {task.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '40px'
                  }}>
                    {task.description || "No description provided."}
                  </Typography>

                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Assignment fontSize="inherit" color="action" />
                      <Typography variant="caption" color="text.primary" fontWeight={600}>
                        {task.projectId?.name || 'Independent Task'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Timer fontSize="inherit" color="action" />
                      <Typography variant="caption" color="error.main" fontWeight={700}>
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Date'}
                      </Typography>
                    </Box>
                  </Stack>

                  {task.attachments && task.attachments.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        ATTACHMENTS ({task.attachments.length})
                      </Typography>
                      <Stack spacing={1}>
                        {task.attachments.map((file, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 1,
                              bgcolor: '#f5f5f5',
                              borderRadius: 2,
                              border: '1px solid #eee'
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ overflow: 'hidden' }}>
                              <AttachFile sx={{ fontSize: 16, color: 'primary.main' }} />
                              <Typography variant="caption" noWrap fontWeight={600}>
                                {file.filename}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.5}>
                              {file.fileType?.includes('image') && (
                                <Tooltip title="Preview">
                                  <IconButton
                                    size="small"
                                    onClick={() => window.open(file.url, '_blank')}
                                    sx={{ color: 'action.active' }}
                                  >
                                    <Visibility sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Download">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const downloadUrl = file.url.replace('/upload/', '/upload/fl_attachment/');
                                    window.location.href = downloadUrl;
                                  }}
                                  sx={{ color: 'primary.main' }}
                                >
                                  <GetApp sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </>
                  )}
                  
                  <Box sx={{ mt: 'auto' }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <ChatBubbleOutlined sx={{ fontSize: 14 }} /> ADD NOTE
                    </Typography>
                    <CommentInput 
                      taskId={task._id} 
                      onSend={handleSendComment} 
                      users={usersForMentions} 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <FilterListOff sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {hasTasksAtAll ? "No tasks match your current filters." : "You don't have any tasks assigned yet."}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default MyProjects;