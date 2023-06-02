import config from './Config';

const handleFormSubmit = async (inputValue, callback) => {
  const response = await fetch(config.API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({content: inputValue}),
  });

  if (response.status === 200 && response.headers.get('Content-Type') === 'application/x-ndjson') {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const textFragmentSink = {
      write: async (textString) => {
        try {
          const messageObject = JSON.parse(textString);
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

    return processFragmentStream().catch((error) => {
      console.error('Error processing stream:', error);
      writableStream.abort();
      throw error;
    });
  } else {
    console.error('Error fetching data:', response.statusText);
    return Promise.reject(new Error('Error fetching data: ' + response.statusText));
  }
};

export default handleFormSubmit;
