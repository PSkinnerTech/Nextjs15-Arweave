import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getContentType, formatBytes, uploadToArweave, uploadFolderToArweave } from '../utils/turboClient';
import toast from 'react-hot-toast';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

type TerminalMessage = {
  id: string;
  type: 'info' | 'success' | 'error' | 'command';
  content: string;
};

const DashboardPage = () => {
  const { walletAddress, primaryName, userName } = useAuth();
  const [isLoadingName, setIsLoadingName] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [terminalMessages, setTerminalMessages] = useState<TerminalMessage[]>([]);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [walletStatus, setWalletStatus] = useState<'checking' | 'connected' | 'not-connected'>('checking');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Add a terminal message with a reliable unique ID
  const addTerminalMessage = useCallback((content: string, type: TerminalMessage['type'] = 'info') => {
    const newId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newMessage = {
      id: newId,
      type,
      content
    };
    setTerminalMessages(prev => [...prev, newMessage]);
    
    // Scroll terminal to bottom
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 50);
  }, []);
  
  useEffect(() => {
    if (walletAddress) {
      setIsLoadingName(true);
      const timer = setTimeout(() => {
        setIsLoadingName(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [walletAddress]);
  
  // Check wallet connection status
  useEffect(() => {
    if (walletAddress) {
      setWalletStatus('connected');
      addTerminalMessage('Wallet connected. Ready to upload files.', 'info');
    } else {
      setWalletStatus('not-connected');
    }
  }, [walletAddress, addTerminalMessage]);
  
  // Handle file upload using direct client-side
  const handleUpload = async () => {
    if (files.length === 0) {
      addTerminalMessage('No files selected for upload.', 'error');
      return;
    }
    
    if (walletStatus !== 'connected') {
      addTerminalMessage('Wallet not connected. Please connect your wallet to upload files.', 'error');
      return;
    }
    
    setUploadStatus('uploading');
    setTerminalMessages([]); // Clear previous messages
    addTerminalMessage('$ arweave deploy', 'command');
    addTerminalMessage('Preparing for Arweave upload...', 'info');
    addTerminalMessage('Using ArConnect for direct transaction signing', 'info');
    
    try {
      // Calculate total size for info
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      addTerminalMessage(`Total upload size: ${formatBytes(totalSize)}`, 'info');
      
      // Multiple files - use folder upload
      if (files.length > 1) {
        addTerminalMessage('Multiple files detected, using folder upload...', 'info');
        addTerminalMessage('Note: For this demo, only the first file will be uploaded', 'info');
        
        // Upload folder directly from browser
        const result = await uploadFolderToArweave(files, (percent) => {
          setProgressPercent(percent);
        });
        
        addTerminalMessage('File uploaded successfully!', 'success');
        addTerminalMessage(`Transaction ID: ${result.id}`, 'success');
        addTerminalMessage(`View your file at: ${result.url}`, 'success');
        
        setDeploymentUrl(result.url);
        setUploadStatus('success');
      } else {
        // Single file upload
        const file = files[0];
        addTerminalMessage(`Preparing file: ${file.name} (${formatBytes(file.size)})`, 'info');
        
        // Determine content type
        const contentType = getContentType(file);
        addTerminalMessage(`Content-Type detected: ${contentType}`, 'info');
        addTerminalMessage('Requesting ArConnect wallet permissions...', 'info');
        
        setUploadingFile(file.name);
        setProgressPercent(10);
        
        // Upload file directly from browser
        const result = await uploadToArweave(file, (percent) => {
          setProgressPercent(percent);
        });
        
        setUploadingFile(null);
        setProgressPercent(100);
        
        addTerminalMessage(`File uploaded successfully with TX ID: ${result.id}`, 'success');
        addTerminalMessage(`View your file at: ${result.url}`, 'success');
        addTerminalMessage('Transaction has been posted to the Arweave network', 'info');
        addTerminalMessage('It may take a few minutes to propagate across the network', 'info');
        
        setDeploymentUrl(result.url);
        setUploadStatus('success');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFile(null);
      setProgressPercent(0);
      
      addTerminalMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error during upload'}`, 'error');
      addTerminalMessage('Upload failed. Please try again or check your wallet connection.', 'error');
      setUploadStatus('error');
    }
  };
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(droppedFiles);
      addTerminalMessage(`Added ${droppedFiles.length} file(s) for upload.`, 'info');
    }
  };
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      addTerminalMessage(`Added ${selectedFiles.length} file(s) for upload.`, 'info');
    }
  };
  
  // Handle button click to open file dialog
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  // Clear selected files
  const handleClearFiles = () => {
    setFiles([]);
    setUploadStatus('idle');
    setDeploymentUrl(null);
    addTerminalMessage('Cleared all files.', 'info');
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {/* Wallet Information */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 mb-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              Welcome, {userName}
            </h2>
            <div className="mb-3">
              {isLoadingName ? (
                <span className="inline-flex items-center bg-blue-400/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  Getting Primary Name...
                </span>
              ) : primaryName ? (
                <span className="inline-flex items-center bg-blue-400/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Primary Name: {primaryName}
                </span>
              ) : (
                <span className="inline-flex items-center bg-yellow-400/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                  No Primary Name
                </span>
              )}
            </div>
            <p className="font-mono bg-white/20 px-3 py-1.5 rounded text-sm backdrop-blur-sm overflow-hidden text-ellipsis max-w-full">
              {walletAddress}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-400 text-green-800 text-sm font-medium">
              <span className="w-2 h-2 bg-green-800 rounded-full mr-2"></span>
              Connected
            </span>
          </div>
        </div>
      </div>
      
      {/* File Upload Section */}
      <div className="bg-white rounded-lg shadow mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Upload to Arweave</h2>
          <p className="text-gray-600 text-sm mb-4">
            Drag and drop files to permanently store them on the Arweave network.
          </p>
          
          {/* Drag and Drop Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={handleButtonClick}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              multiple
              className="hidden" 
              onChange={handleFileChange}
            />
            <div className="text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium">
                Drop files here or click to select
              </p>
              <p className="text-sm mt-1">
                Upload any file type to be permanently stored
              </p>
            </div>
          </div>
          
          {/* Selected Files */}
          {files.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files ({files.length})</h3>
              <ul className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
                {files.map((file, index) => (
                  <li key={index} className="text-sm text-gray-600 py-1 border-b border-gray-100 last:border-0">
                    {file.name} <span className="text-gray-400 text-xs">({formatBytes(file.size)})</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex space-x-3">
                <button 
                  onClick={handleUpload}
                  disabled={uploadStatus === 'uploading'}
                  className={`px-4 py-2 rounded-md text-white font-medium ${
                    uploadStatus === 'uploading' 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {uploadStatus === 'uploading' ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </span>
                  ) : 'Upload to Arweave'}
                </button>
                <button
                  onClick={handleClearFiles}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          
          {/* Upload Progress */}
          {uploadingFile && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Uploading {uploadingFile}...</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Terminal Interface */}
        <div className="bg-gray-900 p-4">
          <div className="flex items-center mb-2 text-gray-400 text-xs">
            <div className="flex space-x-1 mr-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div>terminal — arweave deployment</div>
          </div>
          <div 
            ref={terminalRef}
            className="font-mono text-sm text-gray-200 bg-gray-800 rounded p-3 h-48 overflow-y-auto"
          >
            {terminalMessages.length === 0 ? (
              <p className="text-gray-500">Waiting for file upload...</p>
            ) : (
              terminalMessages.map(message => (
                <div key={message.id} className={`mb-1 ${
                  message.type === 'error' ? 'text-red-400' :
                  message.type === 'success' ? 'text-green-400' :
                  message.type === 'command' ? 'text-blue-400' : 'text-gray-200'
                }`}>
                  {message.type === 'command' ? '> ' : ''}{message.content}
                </div>
              ))
            )}
          </div>
          
          {deploymentUrl && (
            <div className="mt-3 flex items-center justify-between bg-green-900/30 text-green-400 rounded p-2">
              <span className="font-mono text-xs truncate">
                {deploymentUrl}
              </span>
              <button 
                onClick={() => window.open(deploymentUrl, '_blank')}
                className="ml-2 px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600"
              >
                Open
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 