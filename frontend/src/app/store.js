import { configureStore } from '@reduxjs/toolkit';
import  {apiSlice}  from '../api/apiSlice';
import authReducer from '../features/auth/authSlice';
import kanbanReducer from '../features/kanban/kanbanSlice';
import aiReducer from "../features/ai/aiSlice";
import notificationReducer from "../features/notifications/notificationSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    kanban: kanbanReducer,
    ai:aiReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: true,
});