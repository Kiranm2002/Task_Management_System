import { useState, useEffect } from 'react';
import { Badge, IconButton, Menu, MenuItem, Typography, Box, Divider, List, ListItem, ListItemText, Avatar, Button } from '@mui/material';
import { Notifications as NotificationsIcon, Assignment, Info } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { markAllAsRead } from '../notificationSlice';
import { useReadAllNotificationsMutation } from '../notificationApi';
import {useSocket} from "../../../providers/SocketProvider";
import { setNotifications, addNotification } from "../notificationSlice";
import { useGetNotificationsQuery } from "../notificationApi";
import {selectCurrentUser} from "../../auth/authSlice"

const NotificationBell = () => {
  const dispatch = useDispatch();
  const { data: initialNotifications } = useGetNotificationsQuery();
  const socket = useSocket();
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const [anchorEl, setAnchorEl] = useState(null);
  const [readAllApi] = useReadAllNotificationsMutation();

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleMarkAllRead = async () => {
    dispatch(markAllAsRead());
    await readAllApi();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNMENT': return <Assignment color="primary" sx={{ fontSize: 14 }} />;
      case 'AI_WARNING': return <Info color="error" sx={{ fontSize: 14 }} />; 
      case 'TASK_COMPLETED': return <Info color="success" sx={{ fontSize: 14 }} />;
      default: return <Info color="action" sx={{ fontSize: 14 }} />;
    }
  };

  useEffect(() => {
    if (initialNotifications) {
      dispatch(setNotifications(initialNotifications));
    }
  }, [initialNotifications, dispatch]);

  useEffect(() => {
    if (socket) {
      socket.on("new_notification", (notification) => {
        dispatch(addNotification(notification));
      });
    }
    return () => {
      if (socket) socket.off("new_notification");
    };
  }, [socket, dispatch]);

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} sx={{ p: 1.5, height:"48px",width:"48px" }}>
        <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 18, minWidth: 18 } }}>
          <NotificationsIcon sx={{ fontSize: 26 }} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        disableScrollLock
        PaperProps={{ 
          sx: { 
            width: 280, 
            maxHeight: 350, 
            borderRadius: '8px', 
            mt: 1, 
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            border: '1px solid #eee',
            '& .MuiList-root': { p: 0 }
          } 
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 1.5, py: 0.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.7rem', color: '#555' }}>
            NOTIFICATIONS
          </Typography>
          <Button 
            size="small" 
            onClick={handleMarkAllRead} 
            disabled={unreadCount === 0} 
            sx={{ fontSize: '0.6rem', minWidth: 'auto', p: 0, textTransform: 'none' }}
          >
            Mark all read
          </Button>
        </Box>
        <Divider />
        <List>
          {notifications.length === 0 ? (
            <Box sx={{ py: 2, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>No notifications</Typography>
            </Box>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <ListItem 
                key={n._id} 
                sx={{ 
                  bgcolor: n.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.04)',
                  px: 1.5,
                  py: 0.8,
                  borderBottom: '1px solid #f9f9f9',
                  alignItems: 'flex-start',
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                <Avatar sx={{ bgcolor: '#fff', border: '1px solid #efefef', mr: 1, width: 24, height: 24 }}>
                  {getIcon(n.type)}
                </Avatar>
                <ListItemText 
                  primary={n.message} 
                  secondary={new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                  primaryTypographyProps={{ 
                    sx: { 
                      fontSize: '0.7rem', 
                      fontWeight: n.isRead ? 400 : 600, 
                      lineHeight: 1.2,
                      color: '#333'
                    } 
                  }}
                  secondaryTypographyProps={{ sx: { fontSize: '0.6rem', mt: 0.2 } }}
                />
              </ListItem>
            ))
          )}
        </List>
        <Box sx={{ p: 0.5, textAlign: 'center' }}>
            <Button fullWidth size="small" onClick={handleClose} sx={{ fontSize: '0.65rem', color: 'primary.main', fontWeight: 700 }}>
                VIEW ALL
            </Button>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationBell;