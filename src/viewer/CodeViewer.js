import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {materialDark} from 'react-syntax-highlighter/dist/cjs/styles/prism/index.js';
import { memo } from 'react';
import {useState} from 'react';
import ReactMarkdown from 'react-markdown';

export const CodeViewer = memo(({message}) => {

  const [copyButtonText, setCopyButtonText] = useState('Copy');
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

  return <ReactMarkdown
    children={message}
    components={{code: renderCodeBlock}}
  />;
});