import React, { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, Modal, TextField, 
  Stack, Avatar, Chip, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { 
  Edit, Delete, Close, WarningAmber, CheckCircle, Error 
} from '@mui/icons-material';
import { 
  useGetUsersQuery, 
  useUpdateUserMutation, 
  useDeleteUserMutation 
} from '../userApi';
import { useGetTeamsQuery } from '../../teams/teamsApi'; 

const modalStyle = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 450 },
  maxHeight: '90vh', overflowY: 'auto',
  bgcolor: 'background.paper', borderRadius: 3, boxShadow: 24, p: 4,
};

const Users = () => {
  const { data: users, isLoading } = useGetUsersQuery();
  const { data: teams } = useGetTeamsQuery(); 
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [messageModal, setMessageModal] = useState({ open: false, type: '', text: '' });
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', teamId: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({ 
      name: user.name, 
      email: user.email, 
      teamId: user.teamId?._id || user.teamId || '' 
    });
    setEditModal(true);
  };

  const handleUpdate = async () => {
    try {
      await updateUser({ id: selectedUser._id, data: formData }).unwrap();
      setEditModal(false);
      setMessageModal({ open: true, type: 'success', text: 'User details updated successfully!' });
    } catch (err) {
      setMessageModal({ open: true, type: 'error', text: err?.data?.message || 'Update failed' });
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(selectedUser._id).unwrap();
      setDeleteModal(false);
      setMessageModal({ open: true, type: 'success', text: 'User has been deactivated.' });
    } catch (err) {
      setMessageModal({ open: true, type: 'error', text: err?.data?.message || 'Deletion failed' });
    }
  };

  const filteredAndSortedUsers = users ? [...users]
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name)) 
    : [];

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="primary">User Management</Typography>
        <Typography variant="body1" color="text.secondary">
          Review, edit, and manage active platform users and their team assignments.
        </Typography>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start' }}>
        <TextField
          size="small"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 300, bgcolor: 'white' }}
        />
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Team Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} align="center">Loading users...</TableCell></TableRow>
            ) : filteredAndSortedUsers.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 0.5 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                      {user.name[0]}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600} 
                    sx={{ lineHeight: 1, pt:1 }}>
                        {user.name}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.teamId?.name || user.teamId ? (
                    <Chip label={user.teamId?.name || 'Assigned'} size="small" color="info" variant="outlined" />
                  ) : (
                    <Typography variant="caption" color="text.disabled">No Team</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleEditClick(user)}><Edit fontSize="small" /></IconButton>
                  <IconButton color="error" onClick={() => { setSelectedUser(user); setDeleteModal(true); }}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={editModal} onClose={() => setEditModal(false)}>
        <Box sx={modalStyle}>
          <IconButton onClick={() => setEditModal(false)} sx={{ position: 'absolute', right: 12, top: 12 }}><Close /></IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Edit User Details</Typography>
          
          <Stack spacing={3}>
            <TextField 
              fullWidth label="Full Name" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
            <TextField 
              fullWidth label="Email Address" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
            />

            <FormControl fullWidth>
              <InputLabel>Assign Team</InputLabel>
              <Select
                value={formData.teamId || ''}
                label="Assign Team"
                onChange={(e) => setFormData({...formData, teamId: e.target.value})}
              >
                <MenuItem value=""><em>None (Remove from Team)</em></MenuItem>
                {teams?.map((team) => (
                  <MenuItem key={team._id} value={team._id}>{team.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button variant="contained" size="large" onClick={handleUpdate} sx={{ py: 1.5, fontWeight: 700 }}>
              Update User
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)}>
        <Box sx={{ ...modalStyle, textAlign: 'center', width: 350 }}>
          <WarningAmber sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" fontWeight={700}>Deactivate User?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please confirm to deactivate <strong>{selectedUser?.name}</strong>.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button fullWidth variant="outlined" onClick={() => setDeleteModal(false)}>No, Keep</Button>
            <Button fullWidth variant="contained" color="error" onClick={confirmDelete}>Yes, Deactivate</Button>
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

export default Users;