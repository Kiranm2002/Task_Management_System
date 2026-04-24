import { useState } from 'react';
import { 
  Box, Typography, Avatar, TextField, Button, List, ListItem, 
  ListItemAvatar, ListItemText, Divider, Paper, Chip 
} from '@mui/material';
import { Send, History, ChatBubbleOutline } from '@mui/icons-material';
import { useGetTaskActivityQuery, useAddCommentMutation } from '../collaborationApi';

const formatComment = (text) => {
  if (!text) return "";
  return text.split(/(@\w+)/g).map((part, i) => 
    part.startsWith('@') ? (
      <Box 
        component="span" 
        key={i} 
        sx={{ 
          color: 'primary.main', 
          fontWeight: 700, 
          bgcolor: 'rgba(25, 118, 210, 0.08)', 
          px: 0.5, 
          borderRadius: 0.5 
        }}
      >
        {part}
      </Box>
    ) : (
      part
    )
  );
};

const CollaborationFeed = ({ taskId }) => {
  const [comment, setComment] = useState('');
  const { data: activity } = useGetTaskActivityQuery(taskId);
  const [postComment, { isLoading }] = useAddCommentMutation();

  const handlePost = async () => {
    if (!comment.trim()) return;
    const mentions = comment.match(/@(\w+)/g) || [];
    await postComment({ taskId, text: comment, mentions });
    setComment('');
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ChatBubbleOutline fontSize="small" /> Discussion & Activity
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#fcfcfc', borderRadius: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Write a comment or use @mention..."
          variant="standard"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          InputProps={{ disableUnderline: true, sx: { fontSize: '0.875rem' } }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button 
            variant="contained" 
            size="small" 
            startIcon={<Send />} 
            onClick={handlePost}
            disabled={isLoading || !comment.trim()}
          >
            Comment
          </Button>
        </Box>
      </Paper>

      <List sx={{ position: 'relative' }}>
        {activity?.map((item, index) => (
          <ListItem key={item.id} alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
            <ListItemAvatar>
              <Avatar src={item.user?.avatarUrl} sx={{ width: 32, height: 32 }}>
                {item.user?.name?.charAt(0)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={700}>{item.user?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(item.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              }
              secondary={
                item.type === 'system' ? (
                  <Chip 
                    label={item.text} 
                    size="small" 
                    icon={<History sx={{ fontSize: '12px !important' }} />} 
                    sx={{ mt: 0.5, height: 22, fontSize: '0.75rem', bgcolor: '#f0f4f8' }} 
                  />
                ) : (
                  <Typography variant="body2" sx={{ mt: 0.5, color: 'text.primary', whiteSpace: 'pre-wrap' }}>
                    {item.text}
                  </Typography>
                )
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default CollaborationFeed;