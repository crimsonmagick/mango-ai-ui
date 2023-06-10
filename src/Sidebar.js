export function Sidebar({conversationIds, newConversationHandler, conversationSelectHandler}) {

  return (<div className="sidebar">
      <button onClick={newConversationHandler}>Start New Conversation</button>
      {conversationIds.map((conversationId) => (<button key={conversationId} onClick={() => conversationSelectHandler(conversationId)}>
        {conversationId}
      </button>))}
    </div>

  );
}
