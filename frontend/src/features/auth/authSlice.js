import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { 
    user: null, 
    token: null, 
    is2FARequired: false, 
    tempUserId: null      
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, token, accessToken, require2FA, userId } = action.payload;
      
      if (require2FA) {
        state.is2FARequired = true;
        state.tempUserId = userId;
      } else {
        if (user) state.user = user;
        const newToken = token || accessToken;
        if (newToken) {
          state.token = newToken;
        }
        state.is2FARequired = false;
        state.tempUserId = null;
      }
    },
    logOut: (state) => {
      state.user = null;
      state.token = null;
      state.is2FARequired = false;
      state.tempUserId = null;
    },
  },
});

export const { setCredentials, logOut } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectIs2FARequired = (state) => state.auth.is2FARequired;
export const selectTempUserId = (state) => state.auth.tempUserId;