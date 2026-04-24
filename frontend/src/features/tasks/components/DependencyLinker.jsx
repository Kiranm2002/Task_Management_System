import { useState } from 'react';
import { Box, Typography, Autocomplete, TextField, Chip, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Link, LinkOff, ErrorOutline } from '@mui/icons-material';

const DependencyLinker = ({ currentTaskId, projectTasks, dependencies, onLink, onUnlink }) => {
  const availableTasks = projectTasks.filter(t => t.id !== currentTaskId);

  return (
    <Box sx={{ mt: 3, p: 2, bgcolor: '#fff9f9', borderRadius: 2, border: '1px solid #ffcdd2' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Link color="error" />
        <Typography variant="subtitle2" fontWeight={700} color="error.main">
          Task Dependencies (Blocking)
        </Typography>
      </Box>

      <Autocomplete
        options={availableTasks}
        getOptionLabel={(option) => option.title}
        onChange={(e, value) => value && onLink(value.id)}
        renderInput={(params) => (
          <TextField {...params} label="Search for a prerequisite task..." size="small" variant="outlined" />
        )}
        sx={{ mb: 2 }}
      />

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        Linked Prerequisites:
      </Typography>
      
      <List dense disablePadding>
        {dependencies.map((depId) => {
          const depTask = projectTasks.find(t => t.id === depId);
          const isDone = depTask?.status === 'completed';

          return (
            <ListItem 
              key={depId} 
              sx={{ 
                bgcolor: 'white', mb: 0.5, borderRadius: 1, border: '1px solid #e0e0e0',
                opacity: isDone ? 0.6 : 1 
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {isDone ? <CheckCircle color="success" fontSize="small" /> : <ErrorOutline color="warning" fontSize="small" />}
              </ListItemIcon>
              <ListItemText 
                primary={depTask?.title || 'Unknown Task'} 
                secondary={isDone ? "Completed" : "Blocking your progress"}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
              />
              <IconButton size="small" onClick={() => onUnlink(depId)}>
                <LinkOff fontSize="inherit" />
              </IconButton>
            </ListItem>
          );
        })}
        {dependencies.length === 0 && (
          <Typography variant="caption" sx={{ fontStyle: 'italic' }}>No dependencies linked.</Typography>
        )}
      </List>
    </Box>
  );
};

export default DependencyLinker;