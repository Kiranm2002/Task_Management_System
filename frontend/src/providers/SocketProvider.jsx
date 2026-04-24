import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socket from '../config/socket';
import { selectCurrentToken, selectCurrentUser } from '../features/auth/authSlice';
import { updateTaskFromSocket } from '../features/kanban/kanbanSlice';
import { taskApi } from '../features/tasks/taskApi';
import { addNotification } from '../features/notifications/notificationSlice';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const token = useSelector(selectCurrentToken);
  const user = useSelector(selectCurrentUser);

//   useEffect(() => {
//     if (token) {
//       socket.auth = { token };
//       socket.connect();

//       socket.on('TASK_MOVED', (data) => {
//         dispatch(updateTaskFromSocket({
//           taskId: data.taskId, 
//           updatedTask: { status: data.newStatus }
//         }));
//         dispatch(
//         taskApi.util.updateQueryData('getTasks', undefined, (draftTasks) => {
//             const task = draftTasks.find(t => t._id === data.taskId);
//             if (task) {
//                 task.status = data.newStatus;
//             }
//         })
//     );
//       });

// socket.on('TASK_UPDATED', (updatedTask) => {
//     dispatch(updateTaskFromSocket({
//         taskId: updatedTask._id, 
//         updatedTask: updatedTask 
//     }));

//     dispatch(
//         taskApi.util.updateQueryData('getTasks', undefined, (draftTasks) => {
//             const index = draftTasks.findIndex(t => t._id === updatedTask._id);
//             if (index !== -1) {
//                 draftTasks[index] = updatedTask;
//             }
//         })
//     );
// });

//       socket.on('notification_received', (notification) => {
//         dispatch(addNotification(notification));
//       });

//       return () => {
//         socket.off('task_moved');
//         socket.off('notification_received');
//         socket.disconnect();
//       };
//     }
//   }, [token, dispatch]);
    useEffect(() => {
        if (token && user?.id) {
            socket.auth = { token };
            socket.connect();

            socket.on('connect', () => {
                console.log("Socket connected, joining room:", user.id);
                socket.emit("join_room", user.id);
            });

            socket.on('TASK_MOVED', (data) => {
                dispatch(updateTaskFromSocket({
                    taskId: data.taskId,
                    updatedTask: { status: data.newStatus }
                }));

                dispatch(
                    taskApi.util.updateQueryData('getTasks', undefined, (draftTasks) => {
                        const task = draftTasks.find(t => t._id === data.taskId);
                        if (task) task.status = data.newStatus;
                    })
                );
            });

            socket.on('TASK_UPDATED', (updatedTask) => {
                dispatch(updateTaskFromSocket({
                    taskId: updatedTask._id,
                    updatedTask: updatedTask
                }));

                dispatch(
                    taskApi.util.updateQueryData('getTasks', undefined, (draftTasks) => {
                        const index = draftTasks.findIndex(t => t._id === updatedTask._id);
                        if (index !== -1) draftTasks[index] = updatedTask;
                    })
                );
            });

            socket.on('new_notification', (notification) => {
                console.log("Real-time notification received:", notification);
                dispatch(addNotification(notification));
            });

            return () => {
                socket.off('connect');
                socket.off('TASK_MOVED');
                socket.off('TASK_UPDATED');
                socket.off('new_notification');
                socket.disconnect();
            };
        }
    }, [token, user, dispatch]);
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};