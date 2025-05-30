import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play, Settings, Terminal, Code2, FileText, Plus, X, Folder, FolderOpen, Save, Download, Upload, CheckCircle} from 'lucide-react';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";

const languageOptions = {
  python: { ext: "py", name: "Python", icon: "🐍" },
  java: { ext: "java", name: "Java", icon: "☕" },
  cpp: { ext: "cpp", name: "C++", icon: "⚡" },
  c: { ext: "c", name: "C", icon: "🔧" },
  javascript: { ext: "js", name: "JavaScript", icon: "📜" },
  typescript: { ext: "ts", name: "TypeScript", icon: "🔷" },
  html: { ext: "html", name: "HTML", icon: "🌐" },
  css: { ext: "css", name: "CSS", icon: "🎨" }
};

const getLanguageFromExtension = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  for (const [lang, config] of Object.entries(languageOptions)) {
    if (config.ext === ext) return lang;
  }
  return 'javascript'; // default
};

const getExecutableLanguages = () => ['python', 'java', 'cpp', 'c'];

const helloWorldSnippets = {
  python: 'print("Hello, World!")',
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  javascript: 'console.log("Hello, World!");',
  typescript: 'console.log("Hello, World!");',
  html: `<!DOCTYPE html>
<html>
<head>
    <title>Hello World</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>`,
  css: `body {
    font-family: Arial, sans-serif;
    text-align: center;
    background-color: #f0f0f0;
}`
};

export default function CodeEditor() {
  const [files, setFiles] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedFiles = localStorage.getItem('codeEditor_files');
      if (savedFiles) {
        return JSON.parse(savedFiles);
      }
    }
    // Default files
    return {
      'main.py': { 
        content: helloWorldSnippets.python, 
        language: 'python',
        saved: true 
      },
      'Main.java': { 
        content: helloWorldSnippets.java, 
        language: 'java',
        saved: true 
      },
      'main.cpp': { 
        content: helloWorldSnippets.cpp, 
        language: 'cpp',
        saved: true 
      }
    };
  });

  const [activeFile, setActiveFile] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedActiveFile = localStorage.getItem('codeEditor_activeFile');
      return savedActiveFile || 'main.py';
    }
    return 'main.py';
  });

  const [input, setInput] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('codeEditor_input') || "";
    }
    return "";
  });

  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('output');
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [fileExplorerCollapsed, setFileExplorerCollapsed] = useState(false);

  // Save files to localStorage
  useEffect(() => {
    localStorage.setItem('codeEditor_files', JSON.stringify(files));
  }, [files]);

  // Save active file to localStorage
  useEffect(() => {
    localStorage.setItem('codeEditor_activeFile', activeFile);
  }, [activeFile]);

  // Save input to localStorage
  useEffect(() => {
    localStorage.setItem('codeEditor_input', input);
  }, [input]);

  const updateFileContent = (filename, content) => {
    setFiles(prev => ({
      ...prev,
      [filename]: {
        ...prev[filename],
        content,
        saved: false
      }
    }));
  };

  const createNewFile = () => {
    if (!newFileName.trim()) return;
    
    const filename = newFileName.includes('.') ? newFileName : `${newFileName}.py`;
    const language = getLanguageFromExtension(filename);
    
    if (files[filename]) {
      alert('File already exists!');
      return;
    }

    setFiles(prev => ({
      ...prev,
      [filename]: {
        content: helloWorldSnippets[language] || '',
        language,
        saved: true
      }
    }));

    setActiveFile(filename);
    setNewFileName('');
    setShowNewFileDialog(false);
  };

  const deleteFile = (filename) => {
    if (Object.keys(files).length === 1) {
      alert('Cannot delete the last file!');
      return;
    }

    if (confirm(`Are you sure you want to delete ${filename}?`)) {
      const newFiles = { ...files };
      delete newFiles[filename];
      setFiles(newFiles);

      if (activeFile === filename) {
        setActiveFile(Object.keys(newFiles)[0]);
      }
    }
  };

  const saveFile = (filename) => {
    setFiles(prev => ({
      ...prev,
      [filename]: {
        ...prev[filename],
        saved: true
      }
    }));
  };

  const saveAllFiles = () => {
    setFiles(prev => {
      const updated = {};
      Object.keys(prev).forEach(filename => {
        updated[filename] = { ...prev[filename], saved: true };
      });
      return updated;
    });
  };

  const handleRun = async () => {
    const currentFile = files[activeFile];
    const language = currentFile.language;

    if (!getExecutableLanguages().includes(language)) {
      alert('This file type cannot be executed. Please select a Python, Java, C++, or C file.');
      return;
    }

    setLoading(true);
    setActiveTab('output');

    try {
      // Determine the main file name based on language
      let mainFileName;
      switch (language) {
        case 'java':
          mainFileName = 'Main.java';
          break;
        case 'cpp':
          mainFileName = 'Main.cpp';
          break;
        case 'c':
          mainFileName = 'Main.c';
          break;
        default:
          mainFileName = 'Main.py';
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          properties: {
            language: language,
            stdin: input,
            files: [
              {
                name: mainFileName,
                content: currentFile.content,
              },
            ],
          },
        }),
      });
      const result = await response.json();
      setOutput(result?.exception || result?.stdout || "No output");
    } catch (err) {
      setOutput("Error executing code: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportFiles = () => {
    const dataStr = JSON.stringify(files, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'code-editor-files.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFiles = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedFiles = JSON.parse(e.target.result);
        setFiles(importedFiles);
        setActiveFile(Object.keys(importedFiles)[0]);
      } catch (error) {
        alert('Invalid file format!');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleClearStorage = () => {
    if (confirm('Are you sure you want to clear all files and reset to defaults?')) {
      localStorage.removeItem('codeEditor_files');
      localStorage.removeItem('codeEditor_activeFile');
      localStorage.removeItem('codeEditor_input');
      
      const defaultFiles = {
        'main.py': { content: helloWorldSnippets.python, language: 'python', saved: true },
        'Main.java': { content: helloWorldSnippets.java, language: 'java', saved: true },
        'main.cpp': { content: helloWorldSnippets.cpp, language: 'cpp', saved: true }
      };
      
      setFiles(defaultFiles);
      setActiveFile('main.py');
      setInput('');
      setOutput('');
    }
  };

  const currentFile = files[activeFile];
  const currentLanguage = currentFile?.language || 'python';
  const canExecute = getExecutableLanguages().includes(currentLanguage);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-lg hidden sm:block">Multi-File Code Editor</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.href = '/verification'}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Code Verification</span>
            <span className="sm:hidden">Verify</span>
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewFileDialog(true)}
            className="text-gray-400 hover:text-blue-400 p-1 rounded text-xs transition-colors flex items-center gap-1"
            title="New File"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </button>
          
          <button
            onClick={saveAllFiles}
            className="text-gray-400 hover:text-green-400 p-1 rounded text-xs transition-colors flex items-center gap-1"
            title="Save All"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save All</span>
          </button>

          <button
            onClick={exportFiles}
            className="text-gray-400 hover:text-yellow-400 p-1 rounded text-xs transition-colors flex items-center gap-1"
            title="Export Files"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <label className="text-gray-400 hover:text-yellow-400 p-1 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer" title="Import Files">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".json" onChange={importFiles} className="hidden" />
          </label>
          
          <button
            onClick={handleClearStorage}
            className="text-gray-400 hover:text-red-400 p-1 rounded text-xs transition-colors"
            title="Clear all files"
          >
            Clear
          </button>
          
          <button
            onClick={handleRun}
            disabled={loading || !canExecute}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors"
            title={!canExecute ? `Cannot execute ${languageOptions[currentLanguage]?.name} files` : ''}
          >
            <Play className="w-4 h-4" />
            {loading ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      {/* New File Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create New File</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.py"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              onKeyPress={(e) => e.key === 'Enter' && createNewFile()}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowNewFileDialog(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={createNewFile}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="w-full h-full">
          {/* File Explorer Panel */}
          <Panel defaultSize={20} minSize={15} maxSize={40}>
            <div className="h-full bg-gray-800 border-r border-gray-700">
              <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                <button
                  onClick={() => setFileExplorerCollapsed(!fileExplorerCollapsed)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
                >
                  {fileExplorerCollapsed ? <Folder className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />}
                  EXPLORER
                </button>
              </div>
              
              {!fileExplorerCollapsed && (
                <div className="p-2">
                  {Object.entries(files).map(([filename, file]) => (
                    <div
                      key={filename}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer group ${
                        activeFile === filename ? 'bg-blue-600' : 'hover:bg-gray-700'
                      }`}
                      onClick={() => setActiveFile(filename)}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm truncate">{filename}</span>
                        {!file.saved && (
                          <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" title="Unsaved changes" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveFile(filename);
                          }}
                          className="p-1 hover:bg-gray-600 rounded"
                          title="Save file"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFile(filename);
                          }}
                          className="p-1 hover:bg-gray-600 rounded text-red-400"
                          title="Delete file"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-600 hover:bg-gray-500 cursor-col-resize transition-colors" />

          {/* Code Editor Panel */}
          <Panel defaultSize={55} minSize={30}>
            <div className="h-full flex flex-col">
              {/* File Tabs */}
              <div className="bg-gray-800 border-b border-gray-700 flex overflow-x-auto">
                {Object.entries(files).map(([filename, file]) => (
                  <div
                    key={filename}
                    className={`flex items-center gap-2 px-4 py-2 border-r border-gray-700 cursor-pointer min-w-0 ${
                      activeFile === filename ? 'bg-gray-900 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                    onClick={() => setActiveFile(filename)}
                  >
                    <span className="text-sm truncate">{filename}</span>
                    {!file.saved && (
                      <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Unsaved changes" />
                    )}
                    {Object.keys(files).length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(filename);
                        }}
                        className="p-1 hover:bg-gray-600 rounded ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={currentLanguage}
                  value={currentFile?.content || ''}
                  onChange={(value) => updateFileContent(activeFile, value || "")}
                  theme="vs-dark"
                  options={{
                    automaticLayout: true,
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    fontSize: 14,
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: 'on',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    folding: true,
                    lineNumbers: 'on',
                    renderWhitespace: 'selection',
                  }}
                />
              </div>
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-gray-600 hover:bg-gray-500 cursor-col-resize transition-colors" />
          
          {/* Right Panel - Input/Output */}
          <Panel defaultSize={25} minSize={20}>
            <div className="h-full flex flex-col bg-gray-800">
              {/* Tabs for mobile/tablet */}
              <div className="lg:hidden bg-gray-700 flex">
                <button
                  onClick={() => setActiveTab('input')}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    activeTab === 'input' 
                      ? 'bg-gray-800 text-white border-b-2 border-blue-500' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Input
                </button>
                <button
                  onClick={() => setActiveTab('output')}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    activeTab === 'output' 
                      ? 'bg-gray-800 text-white border-b-2 border-blue-500' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Output
                </button>
              </div>

              {/* Desktop resizable panels */}
              <div className="hidden lg:flex flex-1">
                <PanelGroup direction="vertical" className="h-full">
                  {/* Input Panel */}
                  <Panel defaultSize={40} minSize={20}>
                    <div className="h-full flex flex-col">
                      <div className="bg-gray-700 px-4 py-2 flex items-center gap-2 border-b border-gray-600">
                        <Terminal className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">STDIN</span>
                      </div>
                      <div className="flex-1 p-3">
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          className="w-full h-full p-3 bg-gray-900 border border-gray-600 rounded text-gray-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Input for your program (optional)"
                        />
                      </div>
                    </div>
                  </Panel>
                  
                  <PanelResizeHandle className="h-1 bg-gray-600 hover:bg-gray-500 cursor-row-resize transition-colors" />
                  
                  {/* Output Panel */}
                  <Panel defaultSize={60} minSize={30}>
                    <div className="h-full flex flex-col">
                      <div className="bg-gray-700 px-4 py-2 flex items-center gap-2 border-b border-gray-600">
                        <Terminal className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium">Output</span>
                        {loading && (
                          <div className="ml-auto">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-3">
                        <pre className="w-full h-full p-3 bg-black rounded border border-gray-600 text-green-400 font-mono text-sm overflow-auto whitespace-pre-wrap">
                          {output || '// Click "Run Code" to see the output\n// Your program results will appear here'}
                        </pre>
                      </div>
                    </div>
                  </Panel>
                </PanelGroup>
              </div>

              {/* Mobile/Tablet sections */}
              <div className={`flex-1 lg:hidden flex-col ${activeTab === 'input' ? 'flex' : 'hidden'}`}>
                <div className="bg-gray-700 px-4 py-2 flex items-center gap-2 border-b border-gray-600">
                  <Terminal className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">STDIN</span>
                </div>
                <div className="flex-1 p-3">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full h-full p-3 bg-gray-900 border border-gray-600 rounded text-gray-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Input for your program (optional)"
                  />
                </div>
              </div>

              <div className={`flex-1 lg:hidden flex-col ${activeTab === 'output' ? 'flex' : 'hidden'}`}>
                <div className="bg-gray-700 px-4 py-2 flex items-center gap-2 border-b border-gray-600">
                  <Terminal className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium">Output</span>
                  {loading && (
                    <div className="ml-auto">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-3">
                  <pre className="w-full h-full p-3 bg-black rounded border border-gray-600 text-green-400 font-mono text-sm overflow-auto whitespace-pre-wrap">
                    {output || '// Click "Run Code" to see the output\n// Your program results will appear here'}
                  </pre>
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>File: {activeFile}</span>
          <span>Language: {languageOptions[currentLanguage]?.name}</span>
          <span>Lines: {currentFile?.content.split('\n').length || 0}</span>
          <span>Characters: {currentFile?.content.length || 0}</span>
          <span className={currentFile?.saved ? 'text-green-400' : 'text-yellow-400'}>
            {currentFile?.saved ? '● Saved' : '● Unsaved'}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span>{Object.keys(files).length} files</span>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
}