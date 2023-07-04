export function Sidebar({conversationSummaries, newConversationHandler, conversationSelectHandler}) {

  const summaries = conversationSummaries || [];

  return (<div className="sidebar">
      <button onClick={newConversationHandler}>Start New Conversation</button>
      {summaries.map((summary) => (<button key={summary.conversationId} onClick={() => conversationSelectHandler(summary.conversationId)}>
        {summary.conversationId}
      </button>))}
    </div>

  );
}
