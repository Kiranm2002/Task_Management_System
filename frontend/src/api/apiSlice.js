import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logOut } from '../features/auth/authSlice';
import { Mutex } from 'async-mutex';

const mutex = new Mutex();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
  credentials: 'include', 
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();
  
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const isAuthEndpoint = args.url?.includes('/auth/login') || args.url?.includes('/auth/verify-2fa');
    
    if (isAuthEndpoint) return result;
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      
      try {
        const refreshResult = await baseQuery('/auth/refresh', api, extraOptions);

        if (refreshResult.data) {
          const { accessToken, user } = refreshResult.data;
          api.dispatch(setCredentials({ token: accessToken, user }));
          
          result = await baseQuery(args, api, extraOptions);
        } else {
          api.dispatch(logOut());
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Task', 'User', 'Project', 'Team', 'Notification', 'Board', 'Analytics'],
  endpoints: (builder) => ({
  }),
});