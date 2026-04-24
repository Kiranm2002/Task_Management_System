import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Paper, Typography, Box, IconButton } from '@mui/material';
import { Add } from '@mui/icons-material';
import TaskCard from './TaskCard';

const SortableColumn = ({ id, title, tasks, onAddTask }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Paper 
      ref={setNodeRef} 
      elevation={0} 
      sx={{ 
        width: 300, 
        minWidth: 300,
        minHeight: '500px', 
        bgcolor: isOver ? '#f0f4f8' : '#f4f5f7', 
        borderRadius: 2, 
        display: 'flex', 
        flexDirection: 'column',
        p: 1,
        mr: 2,
        border: isOver ? '2px solid #1976d2' : '2px solid transparent',
        transition: 'all 0.2s ease'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'uppercase', color: '#5e6c84' }}>
          {title} <Box component="span" sx={{ ml: 1, color: '#999' }}>{tasks?.length || 0}</Box>
        </Typography>
        <IconButton size="small" onClick={() => onAddTask(id)}><Add fontSize="small" /></IconButton>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0.5 }}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} id={task.id} task={task} />
          ))}
          {tasks.length === 0 && !isOver && (
            <Box sx={{ mt: 4, textAlign: 'center', opacity: 0.5 }}>
              <Typography variant="caption">No tasks here</Typography>
            </Box>
          )}
        </SortableContext>
      </Box>
    </Paper>
  );
};

export default SortableColumn;