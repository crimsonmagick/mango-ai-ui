import config from './Config';

const startConversation = async (text, callback) => {
  return invokeService("/streamed/conversations", text, callback);
}

const sendExpression = async (conversationId, text, callback) => {
  return invokeService(`/streamed/conversations/${conversationId}/expressions`, text, callback);
}

const fetchConversationIds = () => {
  return getSingleton(`${config.API_URL}/singleton/conversations/ids`);
}

const fetchExpressions = (conversationId) => {
  return getSingleton(`${config.API_URL}/singleton/conversations/${conversationId}/expressions`);
}

const getSingleton = (url) => {
  return fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  }).then(response => response.json());
}

const invokeService = async (resourceUrl, inputValue, callback) => {
  const response = await fetch(config.API_URL + resourceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({content: inputValue}),
  });

  if (response.status === 200 && response.headers.get('Content-Type') === 'application/x-ndjson') {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let conversationId = null;

    const textFragmentSink = {
      write: async (textString) => {
        try {
          const messageObject = JSON.parse(textString);
          if (conversationId == null) {
            conversationId = messageObject.conversationId;
          }
          if (typeof messageObject === "object" && messageObject.contentFragment !== null) {
            const text = messageObject.contentFragment;
            callback(text);
          }
        } catch (error) {
          const errorMessage = `Unable to parse received text string. textString=${textString}`;
          console.error(errorMessage, error);
          throw new Error(errorMessage, {cause: error});
        }
      },
      close: () => {
        console.log('Stream closed')
      },
      abort: (err) => {
        console.error('Stream error:', err)
      }
    };

    const writableStream = new WritableStream(textFragmentSink);
    const writer = writableStream.getWriter();

    const processFragmentStream = async () => {
      let {done, value} = await reader.read();

      while (!done) {
        const textChunk = decoder.decode(value);
        const textStrings = textChunk.split('\n')
          .filter(text => text !== "" && text !== '\n');

        for (const textString of textStrings) {
          await writer.write(textString);
        }

        ({done, value} = await reader.read());
      }

      return writer.close();
    };

    await processFragmentStream().catch((error) => {
      console.error('Error processing stream:', error);
      writableStream.abort();
      throw error;
    });
    return {conversationId: conversationId};
  } else {
    console.error('Error fetching data:', response.statusText);
    return Promise.reject(new Error('Error fetching data: ' + response.statusText));
  }
};

export {startConversation, sendExpression, fetchConversationIds, fetchExpressions};