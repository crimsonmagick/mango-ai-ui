export function Sidebar({conversationSummaries, newConversationHandler, conversationSelectHandler}) {

  const summaries = (conversationSummaries || []).sort((a, b) => b.updatedAt - a.updatedAt);

  return (<div className="sidebar">
      <button onClick={newConversationHandler}>Start New Conversation</button>
      {summaries.map(conversationSummary => (<button key={conversationSummary.conversationId} onClick={() => conversationSelectHandler(conversationSummary.conversationId)}>
        {conversationSummary.summary}
      </button>))}
    </div>

  );
}
