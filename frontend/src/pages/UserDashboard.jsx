import { Grid, Typography, Box, Paper, List, ListItem, ListItemText, ListItemIcon, LinearProgress, Chip } from '@mui/material';
import { Schedule, CheckCircleOutlined, ErrorOutlined, Speed, ArrowForwardIos } from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import StatsCard from '../features/dashboard/components/StatsCard';
import { useGetUserStatsQuery } from '../features/analytics/analyticsApi'; 
import { useGetUpcomingTasksQuery } from '../features/tasks/taskApi';

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: response, isLoading: statsLoading } = useGetUserStatsQuery();
  const stats = response?.data;
  const { data: tasks, isLoading: tasksLoading } = useGetUpcomingTasksQuery();

  const isBaseDashboard = location.pathname === '/user-dashboard' || location.pathname === '/user-dashboard/';

  
  if (!isBaseDashboard) {
    return <Outlet />;
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>
          My Workspace
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your daily objectives and track your productivity.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard 
            title="Assigned Tasks" 
            value={stats?.assignedCount || 0} 
            icon={<Schedule />} 
            color="primary" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard 
            title="Completed" 
            value={stats?.completedCount || 0} 
            icon={<CheckCircleOutlined />} 
            color="success" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard 
            title="Overdue" 
            value={stats?.overdueCount || 0} 
            icon={<ErrorOutlined />} 
            color="error" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard 
            title="Current Velocity" 
            value={`${stats?.velocity || 0}%`} 
            icon={<Speed />} 
            color="secondary" 
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e0e0e0' }} elevation={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>
                Priority Tasks
              </Typography>
              <Chip 
                label="Go to Kanban Board" 
                onClick={() => navigate('/user-dashboard/kanban')} 
                deleteIcon={<ArrowForwardIos sx={{ fontSize: '12px !important' }} />}
                sx={{ cursor: 'pointer', borderRadius: 2 }}
                color="primary"
                variant="outlined"
              />
            </Box>

            <List disablePadding>
              {tasks?.map((task, index) => (
                <ListItem 
                  key={task._id} 
                  divider={index !== tasks.length - 1}
                  sx={{ px: 0, py: 2 }}
                >
                  <ListItemIcon>
                    <Box sx={{ 
                      width: 12, height: 12, borderRadius: '50%', 
                      bgcolor: task.priority === 'High' ? 'error.main' : 'warning.main' 
                    }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={task.title} 
                    secondary={`Project: ${task.projectId?.name || 'N/A'} • Due: ${new Date(task.dueDate).toLocaleDateString()}`} 
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  <Box sx={{ width: '150px', textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">Progress</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={task.progress || (task.actualHours / task.estimatedHours) * 100 || 0}
                      sx={{ height: 6, borderRadius: 3, mt: 0.5 }} 
                    />
                  </Box>
                </ListItem>
              ))}
              {(!tasks || tasks.length === 0) && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No high-priority tasks assigned today.
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e0e0e0', height: '100%' }} elevation={0}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
              Estimated Workload
            </Typography>
            <Box sx={{ py: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Hours scheduled: <strong>{stats?.weeklyHours || 0}h</strong></Typography>
              <LinearProgress 
                variant="determinate" 
                value={(stats?.weeklyHours / 40) * 100} 
                color={stats?.weeklyHours > 35 ? "error" : "primary"}
                sx={{ height: 10, borderRadius: 5, mb: 3 }} 
              />
              
              <Box sx={{ p: 2, bgcolor: '#f0f4f8', borderRadius: 2, borderLeft: '4px solid #1976d2' }}>
                <Typography variant="caption" fontWeight={700} color="primary" display="block" gutterBottom>
                  AI INSIGHT
                </Typography>
                <Typography variant="body2">
                  You are at 85% capacity. Focus on finishing your active tasks before taking on new tickets.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDashboard;