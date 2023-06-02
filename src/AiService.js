// AiService.js
const handleFormSubmit = async (inputValue, setReceiving, updateMessage, nextMessageIndex, setNextMessageIndex) => {
  setReceiving(true);

  const userMessageIndex = nextMessageIndex;
  const responseMessageIndex = nextMessageIndex + 1;

  updateMessage(inputValue, userMessageIndex);
  updateMessage('', responseMessageIndex);
  setNextMessageIndex(prevIndex => prevIndex + 2)

  const response = await fetch('http://localhost:8080/mango/melancholy/pal/streamed/conversations', {
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
            updateMessage(text, responseMessageIndex);
          }
        } catch (error) {
          const errorMessage = `Unable to parse received text string. textString=${textString}`;
          console.error(errorMessage, error);
          throw new Error(errorMessage, {cause: error});
        }
      },
      close: () =>  {
        console.log('Stream closed')
        setReceiving(false);
      },
      abort: (err) => {
        console.error('Stream error:', err)
        setReceiving(false);
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

      await writer.close();
    };

    processFragmentStream().catch((error) => {
      console.error('Error processing stream:', error);
      writableStream.abort();
      throw error;
    });
  } else {
    console.error('Error fetching data:', response.statusText);
    setReceiving(false);
    throw new Error('Error fetching data: ' + response.statusText);
  }
};

export default handleFormSubmit;
