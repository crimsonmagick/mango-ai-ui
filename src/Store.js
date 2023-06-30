import { configureStore } from '@reduxjs/toolkit';
import messageReducer from './messageSlice.js';
import conversationReducer from './conversationSlice.js'

const store = configureStore({
  reducer: {
    messages: messageReducer,
    conversations: conversationReducer
  },
});

export default store;
