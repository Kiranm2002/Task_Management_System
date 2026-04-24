import { createSlice } from '@reduxjs/toolkit';

const aiSlice = createSlice({
  name: 'ai',
  initialState: {
    chatHistory: [],
    isAssistantOpen: false,
    lastSearchQuery: '',
  },
  reducers: {
    toggleAssistant: (state) => {
      state.isAssistantOpen = !state.isAssistantOpen;
    },
    addMessage: (state, action) => {
      state.chatHistory.push(action.payload);
    },
    setSearchQuery: (state, action) => {
      state.lastSearchQuery = action.payload;
    },
    clearHistory: (state) => {
      state.chatHistory = [];
    }
  },
});

export const { toggleAssistant, addMessage, setSearchQuery, clearHistory } = aiSlice.actions;
export default aiSlice.reducer;