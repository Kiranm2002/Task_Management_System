import { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, TextField, IconButton, Avatar, List, ListItem, CircularProgress, Fab, Zoom } from '@mui/material';
import { Send, SmartToy, Close, KeyboardArrowDown } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { toggleAssistant, addMessage } from '../aiSlice';
import { useAskAssistantMutation } from '../aiApi';

const ChatAssistant = () => {
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  const { isAssistantOpen, chatHistory } = useSelector((state) => state.ai);
  const [input, setInput] = useState('');
  const [askAssistant, { isLoading }] = useAskAssistantMutation();

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isAssistantOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
    dispatch(addMessage(userMessage));
    setInput('');

    try {
      const response = await askAssistant(input).unwrap();
      const fullText = response.data.text;
      const cleanContent = fullText.includes('\n\n{') 
        ? fullText.split('\n\n{')[0] 
        : fullText;

      dispatch(addMessage({ 
        role: 'assistant', content:cleanContent , 
        timestamp: response.data.timestamp || new Date().toISOString()}));
    } catch (err) {
      dispatch(addMessage({ 
        role: 'assistant', content: "I'm having trouble connecting to my brain right now. Try again?", 
        error: true,timestamp: new Date().toISOString() }));
    }
  };

  return (
    <>
      <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 2000 }}>
        <Zoom in={!isAssistantOpen}>
          <Fab color="primary" onClick={() => dispatch(toggleAssistant())} sx={{ boxShadow: '0 8px 24px rgba(25, 118, 210, 0.4)' }}>
            <SmartToy />
          </Fab>
        </Zoom>
      </Box>

      <Zoom in={isAssistantOpen}>
        <Paper
          elevation={12}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            width: { xs: 'calc(100% - 64px)', sm: 400 },
            height: 600,
            maxHeight: '80vh',
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 2001,
            overflow: 'hidden',
            border: '1px solid #e0e0e0'
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 32, height: 32 }}><SmartToy fontSize="small" /></Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} lineHeight={1}>Core AI</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Project Intelligence</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => dispatch(toggleAssistant())} sx={{ color: 'white' }}><Close /></IconButton>
          </Box>

          <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: '#f8f9fa' }}>
            <List disablePadding>
              {chatHistory.map((msg, i) => (
                <ListItem key={i} sx={{ flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', mb: 2, px: 0 }}>
                  <Box
                    sx={{
                      maxWidth: '85%',
                      p: 1.5,
                      borderRadius: 3,
                      bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                      color: msg.role === 'user' ? 'white' : 'text.primary',
                      boxShadow: msg.role === 'user' ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                      border: msg.role === 'user' ? 'none' : '1px solid #e0e0e0'
                    }}
                  >
                    <Typography variant="body2">{msg.content}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, mx: 1 }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </ListItem>
              ))}
              <div ref={scrollRef} />
            </List>
          </Box>

          <Box 
            component="form" 
            onSubmit={handleSend} 
            sx={{ 
              p: 2, 
              bgcolor: 'white', 
              borderTop: '1px solid #e0e0e0',
              display: 'flex', 
              alignItems: 'center',
              gap: 1 
            }}
          >
            <TextField
              fullWidth
              placeholder="Ask about your tasks..."
              variant="outlined"
              size="small"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              sx={{ 
                flex: 1, 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: '#f0f2f5',
                  '& fieldset': { border: 'none' },
                  '&.Mui-focused fieldset': { border: '1px solid #1976d2' },
                }
              }}
            />
            
            <IconButton 
              type="submit" 
              disabled={!input.trim() || isLoading}
              sx={{ 
                bgcolor: input.trim() ? 'primary.main' : 'rgba(0,0,0,0.05)',
                color: input.trim() ? 'white' : 'text.disabled',
                width: 40,
                height: 40,
                '&:hover': {
                  bgcolor: input.trim() ? 'primary.dark' : 'rgba(0,0,0,0.1)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Send sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Box>
        </Paper>
      </Zoom>
    </>
  );
};

export default ChatAssistant;