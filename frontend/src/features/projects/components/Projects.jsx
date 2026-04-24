import React, { useState } from 'react';
import { 
  Box, Typography, Button, Grid, Card, CardContent, CardActions, 
  IconButton, Modal, TextField, MenuItem, Select, InputLabel, 
  FormControl, Chip, Stack, Divider, Skeleton, Tooltip
} from '@mui/material';
import { Add, Edit, Delete, Assignment, Close, CheckCircle, Error } from '@mui/icons-material';
import { 
  useGetProjectsQuery, 
  useCreateProjectMutation, 
  useUpdateProjectMutation, 
  useDeleteProjectMutation 
} from '../projectsApi'; 
import { useGetTeamsQuery } from "../../teams/teamsApi"

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 500 },
  bgcolor: 'background.paper',
  borderRadius: 3,
  boxShadow: 24,
  p: 4,
};

const Projects = () => {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [homefocused, setHomeFocused] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    date: ''
  });

  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    teamId: '', 
    status: 'active', 
    deadline: '' 
  });
  
  const [messageModal, setMessageModal] = useState({ open: false, type: '', text: '' });

  const { data: projects, isLoading: projectsLoading } = useGetProjectsQuery();
  const { data: teams } = useGetTeamsQuery();
  const [createProject] = useCreateProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();

  const handleOpen = () => setOpen(true);
  
  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setSelectedProject(null);
    setFormData({ name: '', description: '', teamId: '', status: 'active', deadline: '' }); 
  };

  const showMsg = (type, text) => {
    setMessageModal({ open: true, type, text });
  };

  const handleEdit = (project) => {
    setEditMode(true);
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      teamId: project.teamId?._id || project.teamId,
      status: project.status,
      deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : ''
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editMode) {
        await updateProject({ id: selectedProject._id, ...formData }).unwrap();
        showMsg('success', 'Project updated successfully');
      } else {
        await createProject(formData).unwrap();
        showMsg('success', 'Project created successfully');
      }
      handleClose();
    } catch (err) {
      showMsg('error', err?.data?.message || 'Failed to save project');
    }
  };

  const openDeleteModal = (id) => {
    setProjectToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      try {
        await deleteProject(projectToDelete).unwrap();
        showMsg('success', 'Project deleted successfully');
        setDeleteModalOpen(false);
        setProjectToDelete(null);
      } catch (err) {
        showMsg('error', 'Failed to delete project');
      }
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'primary';
      case 'completed': return 'success';
      case 'archived': return 'warning';
      default: return 'default';
    }
  };

  const filteredProjects = projects?.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                          (project.teamId?.name || "").toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || project.status === filters.status;
    const matchesDate = !filters.date || (project.deadline && project.deadline.split('T')[0] === filters.date);
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>Project Management</Typography>
        <Typography variant="body1" color="text.secondary">
          Organize and track your team projects and deadlines.
        </Typography>
        
        <Button 
          variant="contained" 
          size="small"
          startIcon={<Add />} 
          onClick={handleOpen}
          sx={{ mt: 3, borderRadius: 2, textTransform: 'none', px: 3 }}
        >
          Create Project
        </Button>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <TextField
          size="small"
          placeholder="Search Project or Team..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          sx={{ flexGrow: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          type={formData.deadline || homefocused ? "date" : "text"}
          onFocus={() => setHomeFocused(true)}
          onBlur={() => setHomeFocused(false)}
          label="Deadline"
          InputLabelProps={{ shrink: true }}
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
        />
        {(filters.search || filters.status !== 'all' || filters.date) && (
          <Button size="small" onClick={() => setFilters({ search: '', status: 'all', date: '' })}>Clear</Button>
        )}
      </Stack>

      <Grid container spacing={3} alignItems="stretch"> 
        {projectsLoading ? (
          [1, 2, 3].map(i => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={220} />
            </Grid>
          ))
        ) : filteredProjects?.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project._id} sx={{ display: 'flex' }}>
            <Card sx={{ 
              display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0,
              borderRadius: 3, border: '1px solid #e0e0e0', transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' } 
            }} elevation={0}>
              <CardContent sx={{ flexGrow: 1, overflow: 'hidden', pt:1.5, pb:1, '&:last-child': { pb: 1.2 } }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                  <Assignment color="primary" sx={{ fontSize: '1.1rem' }} />
                  <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem', lineHeight:1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.name}
                  </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: '40px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {project.description || "No description provided."}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Stack direction="row"  alignItems="center" sx={{ mb: 1,width:'100%' }}>
                   <Chip label={project.status} size="small" color={getStatusColor(project.status)} sx={{ textTransform: 'capitalize' }} />
                   <Box sx={{ flexGrow: 1 }} />
                   <Typography sx={{ fontSize: '0.9rem' }} color="text.secondary" fontWeight={600}>
                     Due: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No Date'}
                   </Typography>
                </Stack>
                
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  TEAM: {project.teamId?.name || "Unassigned"}
                </Typography>
              </CardContent>

              <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                <Tooltip title="Edit Project">
                  <IconButton size="small" onClick={() => handleEdit(project)}><Edit fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Delete Project">
                  <IconButton size="small" color="error" onClick={() => openDeleteModal(project._id)}><Delete fontSize="small" /></IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}><Close /></IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>{editMode ? 'Edit Project' : 'Create New Project'}</Typography>
          <Stack spacing={2.5}>
            <TextField fullWidth label="Project Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <TextField fullWidth label="Description" multiline rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            
            <FormControl fullWidth>
              <InputLabel>Assign Team</InputLabel>
              <Select label="Assign Team" value={formData.teamId} onChange={(e) => setFormData({...formData, teamId: e.target.value})}>
                {teams?.map((team) => (
                  <MenuItem key={team._id} value={team._id}>{team.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
              <TextField 
                fullWidth 
                label="Deadline" 
                type={formData.deadline || focused ? "date" : "text"}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                InputLabelProps={{ 
                    shrink: true 
                }} 
                value={formData.deadline} 
                onChange={(e) => setFormData({...formData, deadline: e.target.value})} 
                />
            </Stack>

            <Button fullWidth variant="contained" onClick={handleSubmit} sx={{ borderRadius: 2, py: 1.2, fontWeight: 700 }}>
              {editMode ? 'Update Project' : 'Create Project'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={messageModal.open} onClose={() => setMessageModal({ ...messageModal, open: false })}>
        <Box sx={{ ...modalStyle, width: 350, textAlign: 'center' }}>
          {messageModal.type === 'success' ? <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} /> : <Error sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />}
          <Typography variant="h6" fontWeight={700} gutterBottom>{messageModal.type === 'success' ? 'Success' : 'Error'}</Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>{messageModal.text}</Typography>
          <Button fullWidth variant="contained" onClick={() => setMessageModal({ ...messageModal, open: false })} sx={{ borderRadius: 2 }}>Okay</Button>
        </Box>
      </Modal>

      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <Box sx={{ ...modalStyle, width: 400, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700}>Confirm Deletion</Typography>
          <Typography variant="body2" sx={{ my: 2 }}>Do you want to delete this project? This action cannot be undone.</Typography>
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => setDeleteModalOpen(false)}>No</Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>Yes, Delete</Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
};

export default Projects;