import { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  TextField, Box, Typography, IconButton, Chip, Grid, 
  List, ListItem, ListItemText, Checkbox, CircularProgress, Tooltip
} from '@mui/material';
import { Close, AutoAwesome, AddCircleOutline, AttachFile } from '@mui/icons-material';
import { useCreateTaskMutation, useGenerateTaskDetailsMutation } from '../taskApi';

const TaskModal = ({ open, handleClose, projectId }) => {
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium', subtasks: [] });
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [generateAI, { isLoading: isAIProcessing }] = useGenerateTaskDetailsMutation();

  const handleAIEnhance = async () => {
    if (!form.title) return;
    try {
      const result = await generateAI(form.title).unwrap();
      setForm(prev => ({
        ...prev,
        description: result.description,
        subtasks: result.subtasks.map(s => ({ text: s, completed: false })),
        priority: result.suggestedPriority || prev.priority
      }));
    } catch (err) {
      console.error("AI Generation failed", err);
    }
  };

  const handleSubmit = async () => {
    await createTask({ ...form, projectId });
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>Create New Task</Typography>
        <IconButton onClick={handleClose}><Close /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 2 }}>
              <TextField
                fullWidth
                label="Task Title"
                variant="outlined"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Build Auth System"
              />
              <Tooltip title="AI Auto-complete description and subtasks">
                <Button 
                  variant="contained" 
                  color="secondary" 
                  onClick={handleAIEnhance}
                  disabled={isAIProcessing || !form.title}
                  sx={{ height: 56, minWidth: 56, borderRadius: 2 }}
                >
                  {isAIProcessing ? <CircularProgress size={24} color="inherit" /> : <AutoAwesome />}
                </Button>
              </Tooltip>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={6}
              label="Description"
              variant="outlined"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle2" fontWeight={700} gutterBottom>AI Suggested Subtasks</Typography>
            <List sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
              {form.subtasks.map((st, i) => (
                <ListItem key={i} dense>
                  <Checkbox size="small" checked={st.completed} />
                  <ListItemText primary={st.text} />
                </ListItem>
              ))}
              <ListItemButton>
                <AddCircleOutline fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2" color="primary">Add subtask</Typography>
              </ListItemButton>
            </List>
          </Grid>

          <Grid item xs={12} md={5}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Task Settings</Typography>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, mb: 3 }}>
              <Typography variant="caption" color="text.secondary">Priority Level</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
                {['Low', 'Medium', 'High'].map(p => (
                  <Chip 
                    key={p} 
                    label={p} 
                    clickable 
                    color={form.priority === p ? (p === 'High' ? 'error' : 'primary') : 'default'}
                    onClick={() => setForm({ ...form, priority: p })}
                  />
                ))}
              </Box>

              <Typography variant="caption" color="text.secondary">Estimated Hours</Typography>
              <TextField fullWidth type="number" size="small" sx={{ mt: 1 }} />
            </Box>

            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Attachments</Typography>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<AttachFile />}
              sx={{ borderStyle: 'dashed', py: 2 }}
            >
              Upload Files
            </Button>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} color="inherit">Cancel</Button>
        <Button 
          variant="contained" 
          size="large" 
          onClick={handleSubmit}
          disabled={isCreating}
          sx={{ px: 4, borderRadius: 2 }}
        >
          {isCreating ? 'Creating...' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskModal;