import React, { useEffect, useRef } from 'react';

type TerminalProps = {
  messages: {
    id: string;
    type: 'info' | 'success' | 'error' | 'command';
    content: string;
  }[];
  progress?: number;
  uploadingFile?: string | null;
};

const Terminal: React.FC<TerminalProps> = ({ messages, progress = 0, uploadingFile }) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="bg-black text-white rounded-md p-4 font-mono text-sm h-[300px] overflow-auto" ref={terminalRef}>
      {messages.map((message) => (
        <div key={message.id} className={`mb-1 ${getMessageClass(message.type)}`}>
          {message.type === 'command' ? '> ' : ''}
          {message.content}
        </div>
      ))}
      
      {uploadingFile && (
        <div className="mt-2">
          <div className="text-blue-400">Uploading: {uploadingFile}</div>
          <div className="w-full bg-gray-700 h-2 mt-1 rounded-full">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">{progress}% complete</div>
        </div>
      )}
    </div>
  );
};

const getMessageClass = (type: string): string => {
  switch (type) {
    case 'info':
      return 'text-blue-400';
    case 'success':
      return 'text-green-400';
    case 'error':
      return 'text-red-400';
    case 'command':
      return 'text-yellow-400';
    default:
      return 'text-white';
  }
};

export default Terminal; 