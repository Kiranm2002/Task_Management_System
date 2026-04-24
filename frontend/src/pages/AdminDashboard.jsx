import { useState } from 'react';
import { 
  Grid, Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Skeleton, 
  SpeedDial, SpeedDialAction, SpeedDialIcon, Button, Stack 
} from '@mui/material';
import { 
  Group, AssignmentTurnedIn, WarningAmber, Assessment, 
  Person, Add, FolderSpecial, GroupAdd, PlaylistAdd 
} from '@mui/icons-material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import StatsCard from '../features/dashboard/components/StatsCard';
import { useGetAdminStatsQuery, useGetTeamPerformanceQuery } from '../features/analytics/analyticsApi';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { data: statsData, isLoading: statsLoading } = useGetAdminStatsQuery();
  const { data: performanceData, isLoading: teamsLoading } = useGetTeamPerformanceQuery();

  const stats = statsData?.data?.summary;
  const teams = performanceData?.data;
  const isBaseDashboard = location.pathname === '/admin-dashboard' || location.pathname === '/admin-dashboard/';

  const actions = [
    { 
      icon: <PlaylistAdd />, 
      name: 'New Task (Assign to Project)', 
      onClick: () => navigate('/admin-dashboard/kanban?open=true&mode=create') 
    },
    { 
      icon: <GroupAdd />, 
      name: 'New Team (Add Members)', 
      onClick: () => navigate('/admin-dashboard/teams?open=true') 
    },
    { 
      icon: <FolderSpecial />, 
      name: 'New Project (Assign Team)', 
      onClick: () => navigate('/admin-dashboard/projects?open=true') 
    },
    { 
      icon: <Assessment />, 
      name: 'View Deep Analytics', 
      onClick: () => navigate('/admin-dashboard/analytics') 
    }
  ];

  if (!isBaseDashboard) {
    return <Outlet />;
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '80vh' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
            Task Management Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage teams, projects, and cross-departmental tasks.
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
          <Button 
            variant="outlined" 
            startIcon={<GroupAdd sx={{ fontSize: '1.2rem !important' }} />} 
            onClick={() => navigate('/admin-dashboard/teams')}
            sx={{ 
              px: 1.5, 
              py: 0.3, 
              fontSize: '0.75rem', 
              height: '32px', 
              textTransform: 'none', 
              fontWeight: 600,
              borderRadius: '6px' 
            }}
          >
            Setup Team
          </Button>
          <Button 
            variant="contained" 
            startIcon={<FolderSpecial sx={{ fontSize: '1.2rem !important' }} />} 
            onClick={() => navigate('/admin-dashboard/projects')}
            sx={{ 
              px: 1.5, 
              py: 0.3, 
              fontSize: '0.75rem', 
              height: '32px', 
              textTransform: 'none', 
              fontWeight: 600,
              borderRadius: '6px',
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' }
            }}
          >
            Launch Project
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4} md={2.4}>
          {statsLoading ? <Skeleton variant="rounded" height={120} /> : (
            <StatsCard 
              title="Total Users" 
              value={stats?.totalUsers || 0} 
              icon={<Person />} 
              color="info" 
            />
          )}
        </Grid>
        <Grid item xs={12} sm={4} md={2.4}>
          {statsLoading ? <Skeleton variant="rounded" height={120} /> : (
            <StatsCard 
              title="Active Teams" 
              value={stats?.totalTeams || 0} 
              icon={<Group />} 
              color="primary" 
            />
          )}
        </Grid>
        <Grid item xs={12} sm={4} md={2.4}>
          {statsLoading ? <Skeleton variant="rounded" height={120} /> : (
            <StatsCard 
              title="Global Projects" 
              value={stats?.totalProjects || 0} 
              icon={<Assessment />} 
              color="secondary" 
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          {statsLoading ? <Skeleton variant="rounded" height={120} /> : (
            <StatsCard 
              title="Overdue (All)" 
              value={stats?.totalOverdue || 0} 
              icon={<WarningAmber />} 
              color="error" 
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          {statsLoading ? <Skeleton variant="rounded" height={120} /> : (
            <StatsCard 
              title="Critical Tasks" 
              value={statsData?.data?.taskDistribution?.find(d => d._id === 'high')?.count || 0} 
              icon={<AssignmentTurnedIn />} 
              color="success" 
            />
          )}
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e0e0e0' }} elevation={0}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
              Team-to-Project Performance
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Team / Department</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Active Projects</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Completion Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamsLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={3}><Skeleton /></TableCell></TableRow>
                    ))
                  ) : (
                    Array.isArray(teams) && teams.map((team) => (
                      team.projects?.map((project, index) => (
                        <TableRow key={`${team._id}-${project._id}`} hover>
                          <TableCell sx={{ fontWeight: 600, borderBottom: index === team.projects.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                            {index === 0 ? team.name : ""}
                          </TableCell>
                          <TableCell>{project.name}</TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Box sx={{ width: '100%', mr: 1 }}>
                                <Box sx={{ height: 6, borderRadius: 3, bgcolor: '#eee', overflow: 'hidden' }}>
                                  <Box 
                                    sx={{ 
                                      width: `${project.completionRate}%`, 
                                      height: '100%', 
                                      bgcolor: project.completionRate > 80 ? 'success.main' : 'primary.main' 
                                    }} 
                                  />
                                </Box>
                              </Box>
                              <Typography variant="body2" fontWeight={600}>{project.completionRate}%</Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        
      </Grid>

      <SpeedDial
        ariaLabel="Admin Creator"
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
        icon={<SpeedDialIcon openIcon={<Add />} />}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.onClick}
          />
        ))}
      </SpeedDial>
    </Box>
  );
};

export default AdminDashboard;