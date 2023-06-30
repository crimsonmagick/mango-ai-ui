import {createSlice} from '@reduxjs/toolkit';

export const messageSlice = createSlice({
  name: 'messages',
  initialState: [],
  reducers: {
    setMessages: (state, action) => {
      return action.payload;
    },
    updateMessage: (state, action) => {
      const {index, message} = action.payload;
      state[index] = state.length <= index ? {content: message.contentFragment} :
        {...state[index], content: state[index].content + message.contentFragment};
      return state;
    },
  },
});

export const {setMessages, updateMessage} = messageSlice.actions;

export default messageSlice.reducer;
