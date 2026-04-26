import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logOut } from '../features/auth/authSlice';
import { Mutex } from 'async-mutex';

// Create a single instance of the mutex
const mutex = new Mutex();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 1. Setup the basic fetch logic
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    // Access token from your Redux auth state
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
  credentials: 'include', // Crucial for sending/receiving refresh cookies
});

// 2. Setup the custom wrapper logic
const baseQueryWithReauth = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();
  
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      
      try {
        // 1. Attempt to refresh the token
        const refreshResult = await baseQuery('/auth/refresh', api, extraOptions);

        if (refreshResult.data) {
          const { accessToken, user } = refreshResult.data;
          
          // 2. Update Redux store (this is for FUTURE requests)
          api.dispatch(setCredentials({ token: accessToken, user }));

          // 3. THE FIX: Force the retry to use the NEW token directly
          // We manually construct the arguments for the retry
          let retryArgs = typeof args === 'string' ? { url: args } : { ...args };
          
          // We inject the new token into the headers specifically for THIS call
          retryArgs.headers = {
            ...(retryArgs.headers || {}),
            authorization: `Bearer ${accessToken}`,
          };

          console.log("Retrying request with the newly generated token...");
          result = await baseQuery(retryArgs, api, extraOptions);
          
        } else {
          api.dispatch(logOut());
        }
      } finally {
        release();
      }
    } else {
      // If another request is refreshing, wait for it
      await mutex.waitForUnlock();
      // Retry normally - by now the first refresh should have updated the state
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

// 3. Define the API Slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Task', 'User', 'Project', 'Team', 'Notification', 'Board', 'Analytics'],
  endpoints: (builder) => ({
    // Your endpoints go here or are injected from other files
  }),
});