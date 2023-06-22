import config from './Config';

const startConversation = async (text, callback, model) => {
  return invokeService("/streamed/conversations", text, callback, model);
}

const sendExpression = async (conversationId, text, callback, model) => {
  return invokeService(`/streamed/conversations/${conversationId}/expressions`, text, callback, model);
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

const invokeService = async (resourceUrl, inputValue, callback, model = "gpt-3") => {
  const response = await fetch(config.API_URL + resourceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({content: inputValue, model}),
  });

  if (response.status === 200 && response.headers.get('Content-Type') === 'application/x-ndjson') {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let conversationId = null;

    const textFragmentSink = {
      write: async (textString) => {
        let messageObject;
        try {
          messageObject = JSON.parse(textString);
        } catch (error) {
          const errorMessage = `Unable to parse received text string. textString=${textString}`;
          console.error(errorMessage, error);
          throw new Error(errorMessage, {cause: error});
        }
        if (typeof messageObject === "object" && messageObject.contentFragment !== null) {
          if (conversationId == null) {
            conversationId = messageObject.conversationId;
          }
          callback(messageObject);
        } else {
          throw new Error(`Response not an object or contentFragment missing from server response, serverResponse=${textString}`);
        }
      },
      close: () => {
        console.log('Stream closed');
      },
      abort: (err) => {
        console.error('Stream error:', err);
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