import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tasks: {},
  columns: {
    'backlog': { id: 'backlog', title: 'Backlog', taskIds: [] },
    'todo': { id: 'todo', title: 'To Do', taskIds: [] },
    'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
    'in-review': { id: 'in-review', title: 'Code Review', taskIds: [] },
    'blocked': { id: 'blocked', title: 'Blocked', taskIds: [] },
    'completed': { id: 'completed', title: 'Completed', taskIds: [] },
    'archived': { id: 'archived', title: 'Archived', taskIds: [] },
  },
  columnOrder: ['backlog', 'todo', 'in-progress', 'in-review', 'blocked', 'completed', 'archived'],
};

const kanbanSlice = createSlice({
  name: 'kanban',
  initialState,
  reducers: {
    setBoardData: (state, action) => {
      state.tasks = action.payload.tasks;
      state.columns = action.payload.columns;
      state.columnOrder = action.payload.columnOrder;
    },
    
    moveTask: (state, action) => {
      const { taskId, newStatus } = action.payload;
      const task = state.tasks[taskId];
      if (!task) return;

      const oldStatus = task.status;
      
      state.columns[oldStatus].taskIds = state.columns[oldStatus].taskIds.filter(id => id !== taskId);
      
      state.tasks[taskId].status = newStatus;
      
      if (!state.columns[newStatus].taskIds.includes(taskId)) {
        state.columns[newStatus].taskIds.push(taskId);
      }
    },
  


    updateTaskFromSocket: (state, action) => {
      const { taskId, updatedTask } = action.payload;
      const oldStatus = state.tasks[taskId]?.status;
      const newStatus = updatedTask.status;

      state.tasks[taskId] = { ...state.tasks[taskId], ...updatedTask };

      if (oldStatus && oldStatus !== newStatus) {
        state.columns[oldStatus].taskIds = state.columns[oldStatus].taskIds.filter(id => id !== taskId);
        if (!state.columns[newStatus].taskIds.includes(taskId)) {
          state.columns[newStatus].taskIds.push(taskId);
        }
      }
    }
  },
});

export const { setBoardData, moveTask, updateTaskFromSocket } = kanbanSlice.actions;
export default kanbanSlice.reducer;