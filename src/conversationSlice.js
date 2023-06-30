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
      const {conversationId, index, message} = action.payload;
      const contentFragment = message.contentFragment;
      const targetConversation = state[conversationId]
      if (targetConversation) {
        const targetMessages = targetConversation.messages;
        targetMessages[index] = targetMessages.length <= index ? {content: contentFragment} :
          {...targetMessages[index], content: targetMessages[index].content + contentFragment};
      } else {
        console.warn(`Could not find conversation with conversationId=${conversationId} in selected conversation.`);
      }
    }
  }
});

export const {addConversation, selectConversation, addMessageToConversation, createConversation, updateMessageInConversation} = conversationSlice.actions;

export default conversationSlice.reducer;
