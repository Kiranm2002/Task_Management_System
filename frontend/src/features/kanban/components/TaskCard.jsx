import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, Typography, Box, Chip, Avatar, AvatarGroup, Tooltip, LinearProgress } from '@mui/material';
import { AttachFile, WarningAmber } from '@mui/icons-material';

const TaskCard = ({ id, task, isOverlay }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: 'grab',
  };

  const getPriorityColor = (priority) => {
    const colors = { urgent: 'error', high: 'error', medium: 'warning', low: 'success' };
    return colors[priority?.toLowerCase()] || 'default';
  };
  const completedCount = task?.subtasks?.filter(st => st.isCompleted).length || 0;
  const totalSubtasks = task?.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 
  ? Math.round((completedCount / totalSubtasks) * 100) 
  : 0;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: 1.5,
        borderRadius: 2,
        boxShadow: isDragging || isOverlay ? '0 10px 25px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
        border: task?.isDelayed ? '1px solid #ef5350' : '1px solid #e0e0e0',
        backgroundColor: '#fff',
      }}
    >
      <CardContent sx={{ p: '12px !important' }}>
        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
          <Chip 
            label={task?.priority} 
            size="small" 
            color={getPriorityColor(task?.priority)} 
            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}
          />
          {task?.isDelayed && (
            <Tooltip title="AI Predicts Delay">
              <WarningAmber sx={{ fontSize: 16, color: 'error.main' }} />
            </Tooltip>
          )}
        </Box>

        <Typography variant="body2" fontWeight={600} sx={{ color: '#34495e', mb: 1 }}>
          {task?.title}
        </Typography>

        {task?.subtasks?.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">AI Subtasks</Typography>
              <Typography variant="caption" fontWeight={700}>
                {subtaskProgress}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={subtaskProgress} 
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: 'text.secondary' }}>
                <AttachFile sx={{ fontSize: 14 }} />
                <Typography variant="caption">{task?.attachments?.length || 0}</Typography>
             </Box>
          </Box>
          
          <AvatarGroup max={2} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.6rem' } }}>
            {task?.assignedTo && (
              <Tooltip title={task.assignedTo.name}>
                <Avatar 
                  alt={task.assignedTo.name} 
                  src={task.assignedTo.avatar || ''} 
                />
              </Tooltip>
            )}
          </AvatarGroup>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TaskCard;