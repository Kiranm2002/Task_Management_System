import { useEffect, useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCorners, DragOverlay } from '@dnd-kit/core';
import { 
  Box, Typography, Skeleton, FormControl, InputLabel, 
  Select, MenuItem, Paper, TextField, InputAdornment, Modal, Button 
} from '@mui/material';
import { Search, WarningAmber } from '@mui/icons-material';
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
  const socket = useSocket();
  const dispatch = useDispatch();
  const board = useSelector((state) => state.kanban);
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    team: 'all',
    assignee: 'all',
    priority: 'all'
  });
  const [activeTask, setActiveTask] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, message: '' });

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
  }, [socket, selectedProjectId, dispatch]);

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
        await updateStatus({ taskId: activeId, status: newStatus }).unwrap();
      } catch (error) {
        if (boardData) dispatch(setBoardData(boardData));
        setErrorModal({ open: true, message: error?.data?.message || "Dependency requirement failed" });
      }
    }
  };

  if (projectsLoading) return <Skeleton variant="rectangular" height="80vh" />;

  const availableTeams = projects ? [...new Set(projects.map(p => p.teamId?.name).filter(Boolean))] : [];
  const availableAssignees = [...new Set(Object.values(board.tasks).map(t => t.assignedTo?.name).filter(Boolean))];

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8f9fa' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={900} letterSpacing={-1} color="primary.main">Project Workspace</Typography>
        <Typography variant="body2" color="text.secondary">Management Portal • Version 2.0</Typography>
      </Box>

      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          sx={{ bgcolor: 'white', borderRadius: 1, width: 200 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Select Project</InputLabel>
          <Select
            value={selectedProjectId}
            label="Select Project"
            onChange={(e) => setSelectedProjectId(e.target.value)}
            sx={{ bgcolor: 'white' }}
          >
            {projects?.map((project) => (
              <MenuItem key={project._id} value={project._id}>{project.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Team</InputLabel>
          <Select
            value={filters.team}
            label="Team"
            onChange={(e) => setFilters({ ...filters, team: e.target.value })}
            sx={{ bgcolor: 'white' }}
          >
            <MenuItem value="all">All Teams</MenuItem>
            {availableTeams.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Assignee</InputLabel>
          <Select
            value={filters.assignee}
            label="Assignee"
            onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
            sx={{ bgcolor: 'white' }}
          >
            <MenuItem value="all">All Assignees</MenuItem>
            {availableAssignees.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={filters.priority}
            label="Priority"
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            sx={{ bgcolor: 'white' }}
          >
            <MenuItem value="all">All Priorities</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>
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
                .filter(task => {
                  const currentProject = projects?.find(p => p._id === selectedProjectId);
                  const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase());
                  const matchesTeam = filters.team === 'all' || currentProject?.teamId?.name === filters.team;
                  const matchesAssignee = filters.assignee === 'all' || task.assignedTo?.name === filters.assignee;
                  const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
                  return matchesSearch && matchesTeam && matchesAssignee && matchesPriority;
                });

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

      <Modal open={errorModal.open} onClose={() => setErrorModal({ open: false, message: '' })}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2, textAlign: 'center' }}>
          <WarningAmber color="error" sx={{ fontSize: 50, mb: 2 }} />
          <Typography variant="h6" component="h2" gutterBottom fontWeight="bold">Action Restricted</Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>{errorModal.message}</Typography>
          <Button variant="contained" fullWidth onClick={() => setErrorModal({ open: false, message: '' })} sx={{ borderRadius: 1.5, py: 1 }}>OK</Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default KanbanPage;