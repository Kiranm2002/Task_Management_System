import { useEffect, useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCorners, DragOverlay } from '@dnd-kit/core';
import { Box, Typography, Skeleton, TextField, InputAdornment, Chip, Modal, Button } from '@mui/material';
import { Search, AssignmentInd, WarningAmber } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { moveTask, setBoardData } from '../features/kanban/kanbanSlice';
import { useUpdateTaskStatusMutation } from '../features/kanban/kanbanApi';
import { useGetUserKanbanTasksQuery } from '../features/tasks/taskApi';
import SortableColumn from '../features/kanban/components/SortableColumn';
import TaskCard from '../features/kanban/components/TaskCard';
import { useSocket } from "../providers/SocketProvider";
import { selectCurrentUser } from '../features/auth/authSlice';

const UserKanban = () => {
  const dispatch = useDispatch();
  const socket = useSocket();
  const user = useSelector(selectCurrentUser);
  const board = useSelector((state) => state.kanban);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTask, setActiveTask] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: '' });

  const { data: rawTasks, isLoading: boardLoading, isFetching } = useGetUserKanbanTasksQuery();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const formatData = (tasksList) => {
    const formattedBoardData = {
      tasks: {},
      columns: {
        'backlog': { id: 'backlog', title: 'Backlog', taskIds: [] },
        'todo': { id: 'todo', title: 'To Do', taskIds: [] },
        'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
        'in-review': { id: 'in-review', title: 'In Review', taskIds: [] },
        'blocked': { id: 'blocked', title: 'Blocked', taskIds: [] },
        'completed': { id: 'completed', title: 'Completed', taskIds: [] },
        'archived': { id: 'archived', title: 'Archived', taskIds: [] }
      },
      columnOrder: ["backlog", "todo", "in-progress", "in-review", "blocked", "completed", "archived"]
    };

    tasksList.forEach(task => {
      const taskId = task._id;
      formattedBoardData.tasks[taskId] = { ...task, id: taskId };
      if (formattedBoardData.columns[task.status]) {
        formattedBoardData.columns[task.status].taskIds.push(taskId);
      } else {
        formattedBoardData.columns['todo'].taskIds.push(taskId);
      }
    });
    return formattedBoardData;
  };

  useEffect(() => {
    if (rawTasks && Array.isArray(rawTasks)) {
      dispatch(setBoardData(formatData(rawTasks)));
    }
  }, [rawTasks, dispatch]);

  const handleDragStart = (event) => {
    setActiveTask(board.tasks[event.active.id]);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const newStatus = board.columns[overId] ? overId : board.tasks[overId]?.status;

    if (newStatus && activeId !== overId) {
      const originalStatus = board.tasks[activeId].status;
      if (originalStatus === newStatus) return;

      dispatch(moveTask({ taskId: activeId, newStatus }));

      try {
        await updateTaskStatus({ taskId: activeId, status: newStatus }).unwrap();
      } catch (error) {
        dispatch(setBoardData(formatData(rawTasks)));
        setErrorModal({
          open: true,
          message: error?.data?.message || "Dependency requirement failed"
        });
      }
    }
  };

  useEffect(() => {
    if (socket && user?._id) {
      socket.emit("join_room", user._id);
      const handleUpdate = () => {
        dispatch(useGetUserKanbanTasksQuery.util.invalidateTags(['Task']));
      };
      socket.on("TASK_UPDATED", handleUpdate);
      return () => {
        socket.off("TASK_UPDATED", handleUpdate);
      };
    }
  }, [socket, user?._id, dispatch]);

  if (boardLoading || isFetching) {
    return <Skeleton variant="rectangular" height="70vh" sx={{ borderRadius: 3, m: 3 }} />;
  }

  return (
    <Box sx={{ p: 3, height: '85vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" fontWeight={900} letterSpacing={-1} color="primary.main">
            My Task Board
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
            <Chip icon={<AssignmentInd fontSize="small" />} label="Personal Workspace" size="small" variant="outlined" />
            <Typography variant="body2" color="text.secondary">Drag tasks to update status</Typography>
          </Box>
        </Box>

        <TextField
          size="small"
          placeholder="Filter my tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
          }}
          sx={{ bgcolor: 'white', borderRadius: 1, width: 300 }}
        />
      </Box>

      {(!board.columnOrder || board.columnOrder.length === 0) ? (
        <Box sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No tasks assigned to you yet.
          </Typography>
        </Box>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Box sx={{ display: 'flex', overflowX: 'auto', flexGrow: 1, gap: 2, pb: 3 }}>
            {board.columnOrder.map((columnId) => {
              const column = board.columns[columnId];
              const tasks = column.taskIds
                .map((id) => board.tasks[id])
                .filter(Boolean)
                .filter(task => task.title.toLowerCase().includes(searchQuery.toLowerCase()));

              return (
                <SortableColumn
                  key={columnId}
                  id={columnId}
                  title={column.title}
                  tasks={tasks}
                  onAddTask={null}
                />
              );
            })}
          </Box>
          <DragOverlay>
            {activeTask ? <TaskCard id={activeTask.id} task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <Modal
        open={errorModal.open}
        onClose={() => setErrorModal({ open: false, message: '' })}
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          textAlign: 'center'
        }}>
          <WarningAmber color="error" sx={{ fontSize: 50, mb: 2 }} />
          <Typography variant="h6" component="h2" gutterBottom fontWeight="bold">
            Action Restricted
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {errorModal.message}
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setErrorModal({ open: false, message: '' })}
            sx={{ borderRadius: 1.5, py: 1 }}
          >
            OK
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default UserKanban;