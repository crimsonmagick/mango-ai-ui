import {createSlice} from "@reduxjs/toolkit";

const conversationSlice = createSlice({
  name: "conversations",
  initialState: {},
  reducers: {
    addConversation: (state, action) => {
      const {conversationId, messages} = action.payload;
      state[conversationId] = {
        id: conversationId,
        messages: messages,
      };
    },
    createConversation: (state, action) => {
      const {conversationId} = action.payload;
      state[conversationId] = {
        id: conversationId,
        messages: [],
      };
    },
    selectConversation: (state, action) => {
      const {conversationId} = action.payload;
      // set the currentConversationId in Redux state
      state.currentConversationId = conversationId;
    },
    addMessageToConversation: (state, action) => {
      const {conversationId, message} = action.payload;
      state[conversationId].messages.push({content: message.contentFragment});
    },
    updateMessageInConversation: (state, action) => {
      const {conversationId, messageIndex, contentFragment} = action.payload;
      const targetConversation = state[conversationId];

      const targetMessage = targetConversation.messages[messageIndex];

      if (targetMessage) {
        targetMessage.content += contentFragment;
      } else {
        console.warn(`Could not find message with index=${messageIndex} in selected conversation.`);
      }

    }
  }
});

export const {addConversation, selectConversation, addMessageToConversation, createConversation, updateMessageInConversation} = conversationSlice.actions;


export default conversationSlice.reducer;
