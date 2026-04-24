import React, { useState } from 'react';
import { 
  Box, Typography, Button, Grid, Card, CardContent, CardActions, 
  IconButton, Modal, TextField, MenuItem, Select, InputLabel, 
  FormControl, OutlinedInput, Chip, Stack, Divider, Skeleton,
  Tooltip
} from '@mui/material';
import { Add, Edit, Delete, Group, Close, CheckCircle, Error, } from '@mui/icons-material';
import { 
  useGetTeamsQuery, 
  useCreateTeamMutation, 
  useUpdateTeamMutation, 
  useDeleteTeamMutation,
  useGetAllUsersQuery 
} from '../teamsApi'; 

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

const Teams = () => {
  const [open, setOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', members: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectOpen, setSelectOpen] = useState(false);
  
  const [messageModal, setMessageModal] = useState({ open: false, type: '', text: '' });

  const { data: teams, isLoading: teamsLoading } = useGetTeamsQuery();
  const { data: users } = useGetAllUsersQuery();
  const [createTeam] = useCreateTeamMutation();
  const [updateTeam] = useUpdateTeamMutation();
  const [deleteTeam] = useDeleteTeamMutation();

  const handleOpen = () => setOpen(true);
  
  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setSelectedTeam(null);
    setFormData({ name: '', description: '', members: [] }); 
    setSelectOpen(false);
  };

  const showMsg = (type, text) => {
    setMessageModal({ open: true, type, text });
  };

  const handleEdit = (team) => {
    setEditMode(true);
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      description: team.description,
      members: team.members.map(m => typeof m === 'object' ? m._id : m) 
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        members: formData.members
      };

      if (editMode) {
        await updateTeam({ id: selectedTeam._id, ...payload }).unwrap();
        showMsg('success', 'Team updated successfully');
      } else {
        await createTeam(payload).unwrap();
        showMsg('success', 'Team created successfully');
      }
      handleClose();
    } catch (err) {
      showMsg('error', err?.data?.message || 'Failed to save team');
    }
  };

  const openDeleteModal = (id) => {
    setTeamToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (teamToDelete) {
      try {
        await deleteTeam(teamToDelete).unwrap();
        showMsg('success', 'Team deleted successfully');
        setDeleteModalOpen(false);
        setTeamToDelete(null);
      } catch (err) {
        showMsg('error', 'Failed to delete team');
      }
    }
  };

  const filteredTeams = teams?.filter(team => {
    const lowerSearch = searchTerm.toLowerCase();
    const matchesTeamName = team.name.toLowerCase().includes(lowerSearch);
    const matchesMemberName = team.members?.some(member => 
      (member.name || '').toLowerCase().includes(lowerSearch)
    );
    return matchesTeamName || matchesMemberName;
  });

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>Team Management</Typography>
        <Typography variant="body1" color="text.secondary">
          Create and manage departmental workgroups.
        </Typography>
        
        <Button 
          variant="contained" 
          size="small"
          startIcon={<Add />} 
          onClick={handleOpen}
          sx={{ mt: 3, borderRadius: 2, textTransform: 'none', px: 3 }}
        >
          Create Team
        </Button>
      </Box>

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by team or member name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: { xs: '100%', sm: '400px' } }}
        />
      </Box>

      <Grid container spacing={3} alignItems="stretch"> 
      {teamsLoading ? (
        [1, 2, 3].map(i => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Skeleton variant="rounded" height={220} />
          </Grid>
        ))
      ) : filteredTeams?.map((team) => (
        <Grid 
          item 
          xs={12} 
          sm={6} 
          md={4} 
          key={team._id} 
          sx={{ 
            display: 'flex',
            flexBasis: { md: '33.333%', sm: '50%', xs: '100%' },
            maxWidth: { md: '33.333%', sm: '50%', xs: '100%' }
          }} 
        >
          <Card 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              width: '100%', 
              minWidth: 0,   
              borderRadius: 3, 
              border: '1px solid #e0e0e0',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' } 
            }} 
            elevation={0}
          >
            <CardContent sx={{ flexGrow: 1, overflow: 'hidden',
              pt:1.5,pb:1,'&:last-child': { pb: 1.2 } }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                <Group color="primary" sx={{ fontSize: '1.1rem' }} />
                <Typography 
                  variant="h6" 
                  fontWeight={700} 
                  sx={{ 
                    fontSize: '1rem',
                    lineHeight:1.1,
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                  }}
                >
                  {team.name}
                </Typography>
              </Stack>

              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 2, 
                  minHeight: '40px', 
                  display: '-webkit-box', 
                  WebkitLineClamp: 2, 
                  WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden' 
                }}
              >
                {team.description || "No description provided."}
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1 }}>
                MEMBERS ({team.members?.length || 0})
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, minHeight: '32px' }}>
                {team.members?.slice(0, 3).map(member => (
                  <Chip key={member._id} label={member.name} size="small" variant="outlined" />
                ))}
                {team.members?.length > 3 && (
                  <Chip label={`+${team.members.length - 3}`} size="small" />
                )}
                {team.members?.length === 0 && (
                  <Typography variant="caption" color="text.disabled">No members assigned</Typography>
                )}
              </Box>
            </CardContent>

            <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
              <Tooltip title="Edit Team">
                <IconButton size="small" onClick={() => handleEdit(team)}><Edit fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title="Delete Team">
                <IconButton size="small" color="error" onClick={() => openDeleteModal(team._id)}><Delete fontSize="small" /></IconButton>
              </Tooltip>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>

      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <IconButton 
            onClick={handleClose} 
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
          
          <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
            {editMode ? 'Edit Team' : 'Create New Team'}
          </Typography>
          
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Team Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />

            <FormControl fullWidth>
              <InputLabel>Add Members</InputLabel>
              <Select
                multiple
                open={selectOpen}
                onOpen={() => setSelectOpen(true)}
                onClose={() => setSelectOpen(false)}
                value={formData.members}
                onChange={(e) => {
                  setFormData({...formData, members: e.target.value});
                }}
                input={<OutlinedInput label="Add Members" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const user = users?.find(u => u._id === value);
                      return <Chip key={value} label={user?.name || value} size="small" />;
                    })}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    sx: { maxHeight: 300 }
                  }
                }}
              >
                {users?.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name}
                  </MenuItem>
                ))}
                <Divider />
                <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                   <Button 
                    fullWidth 
                    size="small" 
                    variant="contained" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectOpen(false);
                    }}
                   >
                     Done Selecting
                   </Button>
                </Box>
              </Select>
            </FormControl>

            <Button 
              fullWidth 
              variant="contained" 
              onClick={handleSubmit}
              sx={{ borderRadius: 2, py: 1.2, fontWeight: 700 }}
            >
              {editMode ? 'Update Team' : 'Create Team'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <Box sx={{ ...modalStyle, width: 400, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700}>Confirm Deletion</Typography>
          <Typography variant="body2" sx={{ my: 2 }}>
            Do you want to delete this team? This action will delete the team from your workspace.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => setDeleteModalOpen(false)}>No</Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>Yes, Delete</Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={messageModal.open} onClose={() => setMessageModal({ ...messageModal, open: false })}>
        <Box sx={{ ...modalStyle, width: 350, textAlign: 'center' }}>
          {messageModal.type === 'success' ? (
            <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          ) : (
            <Error sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          )}
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {messageModal.type === 'success' ? 'Success' : 'Error'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            {messageModal.text}
          </Typography>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={() => setMessageModal({ ...messageModal, open: false })}
            sx={{ borderRadius: 2 }}
          >
            Okay
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default Teams;