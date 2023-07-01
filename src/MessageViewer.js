import ReactMarkdown from 'react-markdown';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {materialDark} from 'react-syntax-highlighter/dist/cjs/styles/prism/index.js';
import {useEffect, useRef, useState} from 'react';

export function MessageViewer({messages}) {

  const [copyButtonText, setCopyButtonText] = useState('Copy');
  // const [shouldScroll, setShouldScroll] = useState(false);
  const [stickToBottom, setStickToBottom] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollRef = useRef();


  const handleScroll = element => {
    if (isFullyScrolled(element.target)) {
      console.log("Reached bottom!");
      setStickToBottom(true);
    } else {
      setStickToBottom(false);
    }
  }

  const isFullyScrolled = target => target.scrollHeight - target.scrollTop === target.clientHeight;

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  });


  useEffect(() => {
    if (stickToBottom) {
      messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
      // setShouldScroll(false);
    }
  }, [messages]);


  const handleCopyButtonPress = (codeString) => {
    navigator.clipboard.writeText(codeString)
      .then(() => {
        setCopyButtonText('Copied');
        setTimeout(() => setCopyButtonText('Copy'), 1500); // Reset after 1.5 seconds
      })
  };
  const renderCodeBlock = ({node, inline, className, children, ...props}) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');
    let language = match ? match[1] : '';
    return !inline ?
      <div className="codeContainer">
        <div className="codeHeader">
          <div>{language}</div>
          <button onClick={() => handleCopyButtonPress(codeString)}>
            {copyButtonText}
          </button>
        </div>
        <SyntaxHighlighter className="highlighter" language={language} style={materialDark} PreTag="div" children={codeString} {...props} />
      </div>
      : <code className="code-light-dark" {...props}>{children}</code>;
  };

  return (
    <div className="message-container" ref={scrollRef}>
      {messages.map((msg, index) => (
        <div className="message-wrapper" key={index}>
          <ReactMarkdown
            children={msg}
            components={{code: renderCodeBlock}}
          />
        </div>
      ))}
      <span ref={messagesEndRef}></span>
    </div>
  );
}