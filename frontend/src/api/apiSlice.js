import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

 export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
    credentials: 'include',
  }),
  tagTypes: ['Task', 'User', 'Project', 'Team', 'Notification','Board','Analytics'],
  endpoints: (builder) => ({}),
});

