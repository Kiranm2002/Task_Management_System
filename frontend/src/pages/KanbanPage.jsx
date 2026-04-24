import { useEffect, useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCorners, DragOverlay } from '@dnd-kit/core';
import { 
  Box, Typography, Skeleton, FormControl, InputLabel, 
  Select, MenuItem, Paper, TextField, InputAdornment 
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { moveTask, setBoardData } from '../features/kanban/kanbanSlice';
import { 
  useGetBoardQuery, 
  useGetProjectsQuery, 
  useUpdateTaskStatusMutation 
} from '../features/kanban/kanbanApi';
import SortableColumn from '../features/kanban/components/SortableColumn';
import TaskCard from '../features/kanban/components/TaskCard';
import { useSocket } from '../providers/SocketProvider';
import { kanbanApi } from '../features/kanban/kanbanApi';

const KanbanPage = () => {
  const socket = useSocket()
  const dispatch = useDispatch();
  const board = useSelector((state) => state.kanban);
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTask, setActiveTask] = useState(null);

  const { data: projects, isLoading: projectsLoading } = useGetProjectsQuery();
  
  const { data: boardData, isLoading: boardLoading, isFetching } = useGetBoardQuery(selectedProjectId, {
    skip: !selectedProjectId,
  });
  
  const [updateStatus] = useUpdateTaskStatusMutation();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (boardData) {
      dispatch(setBoardData(boardData));
    }
  }, [boardData, dispatch]);

  const handleDragStart = (event) => {
    setActiveTask(board.tasks[event.active.id]);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id; 
    const newStatus = board.columns[overId] ? overId : board.tasks[overId]?.status;

    if (newStatus && activeId !== overId) {
      dispatch(moveTask({ taskId: activeId, newStatus }));
      updateStatus({ taskId: activeId, status: newStatus });
    }
  };

  useEffect(() => {
    if (socket && selectedProjectId) {
      socket.emit("JOIN_PROJECT", selectedProjectId);
      const handleUpdate = () => {
        dispatch(kanbanApi.util.invalidateTags(['Board']));
      };
      socket.on("TASK_UPDATED", handleUpdate);
      return () => {
        socket.off("TASK_UPDATED", handleUpdate);
        socket.emit("LEAVE_PROJECT", selectedProjectId);
      };
    }
  }, [socket, selectedProjectId,dispatch]);

  if (projectsLoading) return <Skeleton variant="rectangular" height="80vh" />;

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8f9fa' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={900} letterSpacing={-1} color="primary.main">Project Workspace</Typography>
          <Typography variant="body2" color="text.secondary">Management Portal • Version 2.0</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
            sx={{ bgcolor: 'white', borderRadius: 1, width: 250 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Select Project</InputLabel>
            <Select
              value={selectedProjectId}
              label="Select Project"
              onChange={(e) => setSelectedProjectId(e.target.value)}
              sx={{ bgcolor: 'white' }}
            >
              {projects?.map((project) => (
                <MenuItem key={project._id} value={project._id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {boardLoading || isFetching ? (
        <Skeleton variant="rectangular" height="70vh" sx={{ borderRadius: 3 }} />
      ) : !selectedProjectId ? (
        <Paper sx={{ p: 10, textAlign: 'center', border: '2px dashed #ccc', bgcolor: 'transparent' }} elevation={0}>
          <Typography variant="h6" color="text.secondary">Select a project to load the enterprise board</Typography>
        </Paper>
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
                  onAddTask={(id) => console.log('Add task to', id)} 
                />
              );
            })}
          </Box>
          <DragOverlay>
            {activeTask ? <TaskCard id={activeTask.id} task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </Box>
  );
};

export default KanbanPage;