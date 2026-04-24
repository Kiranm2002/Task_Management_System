import { useState } from 'react';
import { 
  Box, Typography, Button, Accordion, AccordionSummary, AccordionDetails, 
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Chip, 
  Paper, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { ExpandMore, Add, Folder, GroupAdd, Settings } from '@mui/icons-material';
import { useGetTeamsQuery, useCreateTeamMutation, useCreateProjectMutation } from '../teamsApi';

const TeamManager = () => {
  const { data: teams, isLoading } = useGetTeamsQuery();
  const [createTeam] = useCreateTeamMutation();
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    await createTeam({ name: newTeamName });
    setNewTeamName('');
    setIsTeamModalOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Organization Architecture</Typography>
          <Typography variant="body1" color="text.secondary">Define teams and manage cross-functional projects.</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => setIsTeamModalOpen(true)}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Create Team
        </Button>
      </Box>

      {teams?.map((team) => (
        <Accordion key={team.id} sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant="subtitle1" fontWeight={700}>{team.name}</Typography>
              <Chip label={`${team.memberCount} Members`} size="small" variant="outlined" />
              <Chip label={`${team.projectCount} Projects`} size="small" color="primary" variant="outlined" />
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>ACTIVE PROJECTS</Typography>
              <Button size="small" startIcon={<Folder />}>Add Project</Button>
            </Box>
            <Grid container spacing={2}>
              {team.projects?.map((project) => (
                <Grid item xs={12} md={4} key={project.id}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fcfcfc' }}>
                    <Typography variant="body1" fontWeight={600}>{project.name}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      {project.description || 'No description provided'}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" fontWeight={700} color="primary">{project.taskCount} Tasks</Typography>
                      <IconButton size="small"><Settings fontSize="inherit" /></IconButton>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      <Dialog open={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)}>
        <DialogTitle>Create New Department</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            variant="standard"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTeamModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTeam} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamManager;