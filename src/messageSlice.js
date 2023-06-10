import { createSlice } from '@reduxjs/toolkit';

export const messageSlice = createSlice({
  name: 'messages',
  initialState: [],
  reducers: {
    setMessages: (state, action) => {
      return action.payload;
    },
    updateMessage: (state, action) => {
      const { index, text } = action.payload;
      state.length <= index ? state[index] = text : state[index] = state[index] + text;
      return state;
    },
  },
});

export const { setMessages, updateMessage } = messageSlice.actions;

export default messageSlice.reducer;
