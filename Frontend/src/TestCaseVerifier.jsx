import React, { useState, useRef, useEffect } from 'react';
import { Play, Plus, X, Upload, Download, Code2, FileText, CheckCircle, XCircle, Clock, AlertCircle, Trash2, ChevronDown, ChevronUp, Hash, Save } from 'lucide-react';

const TestCaseVerifier = () => {
  const [activeLanguage, setActiveLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('manual');
  const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '', id: 1 }]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [numTestCases, setNumTestCases] = useState(1);
  const [showTestCaseModal, setShowTestCaseModal] = useState(false);
  const [currentTestCase, setCurrentTestCase] = useState(null);
  const fileInputRef = useRef(null);
  const codeEditorRef = useRef(null);

  // Only support C, C++, Python, and Java
  const languageOptions = {
    c: { 
      name: 'C', 
      extension: '.c', 
      example: '#include<stdio.h>\nint main(){\n    printf("Hello World");\n    return 0;\n}' 
    },
    cpp: { 
      name: 'C++', 
      extension: '.cpp', 
      example: '#include<iostream>\nusing namespace std;\nint main(){\n    cout << "Hello World";\n    return 0;\n}' 
    },
    python: { 
      name: 'Python', 
      extension: '.py', 
      example: 'print("Hello World")' 
    },
    java: { 
      name: 'Java', 
      extension: '.java', 
      example: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}' 
    }
  };

  // Load cached data on component mount
  useEffect(() => {
    const cachedData = JSON.parse(localStorage.getItem('testVerifierData') || '{}');
    
    // Load general settings
    if (cachedData.activeLanguage && languageOptions[cachedData.activeLanguage]) {
      setActiveLanguage(cachedData.activeLanguage);
    }
    if (cachedData.verificationMethod) setVerificationMethod(cachedData.verificationMethod);
    if (cachedData.testCases) setTestCases(cachedData.testCases);
    if (cachedData.numTestCases) setNumTestCases(cachedData.numTestCases);
    if (cachedData.results) {
      setResults(cachedData.results);
      if (cachedData.results.length > 0) setShowResults(true);
    }
    
    // Load language-specific code
    const languageToLoad = cachedData.activeLanguage || 'python';
    if (cachedData.languageCode && cachedData.languageCode[languageToLoad]) {
      setCode(cachedData.languageCode[languageToLoad]);
    }
  }, []);

  // Save to cache whenever data changes
  useEffect(() => {
    const cachedData = JSON.parse(localStorage.getItem('testVerifierData') || '{}');
    
    // Prepare language-specific code cache
    const languageCode = cachedData.languageCode || {};
    languageCode[activeLanguage] = code;
    
    const dataToCache = {
      activeLanguage,
      verificationMethod,
      testCases,
      numTestCases,
      results,
      languageCode
    };
    
    localStorage.setItem('testVerifierData', JSON.stringify(dataToCache));
  }, [code, activeLanguage, verificationMethod, testCases, numTestCases, results]);

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    // Save current code for current language
    const cachedData = JSON.parse(localStorage.getItem('testVerifierData') || '{}');
    const languageCode = cachedData.languageCode || {};
    languageCode[activeLanguage] = code;
    
    // Update cache
    const updatedCache = {
      ...cachedData,
      activeLanguage: newLanguage,
      languageCode
    };
    localStorage.setItem('testVerifierData', JSON.stringify(updatedCache));
    
    // Load code for new language
    const newCode = languageCode[newLanguage] || '';
    setCode(newCode);
    setActiveLanguage(newLanguage);
    
    // Clear results when switching languages
    setResults([]);
    setShowResults(false);
  };

  // Handle tab key for code editor
  const handleCodeEditorKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newValue);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const generateTestCases = () => {
    const newTestCases = [];
    for (let i = 0; i < numTestCases; i++) {
      const existing = testCases[i];
      newTestCases.push({
        id: existing?.id || Date.now() + i,
        input: existing?.input || '',
        expectedOutput: existing?.expectedOutput || ''
      });
    }
    setTestCases(newTestCases);
  };

  const openTestCaseModal = (testCase, index) => {
    setCurrentTestCase({ ...testCase, index });
    setShowTestCaseModal(true);
  };

  const saveTestCase = () => {
    if (currentTestCase) {
      const updatedTestCases = [...testCases];
      updatedTestCases[currentTestCase.index] = {
        id: currentTestCase.id,
        input: currentTestCase.input,
        expectedOutput: currentTestCase.expectedOutput
      };
      setTestCases(updatedTestCases);
      setShowTestCaseModal(false);
    }
  };

  const addTestCase = () => {
    const newId = Math.max(...testCases.map(tc => tc.id)) + 1;
    setTestCases([...testCases, { input: '', expectedOutput: '', id: newId }]);
    setNumTestCases(testCases.length + 1);
  };

  const removeTestCase = (id) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter(tc => tc.id !== id));
      setNumTestCases(Math.max(1, testCases.length - 1));
    }
  };

  const updateTestCase = (id, field, value) => {
    setTestCases(testCases.map(tc => 
      tc.id === id ? { ...tc, [field]: value } : tc
    ));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const fileData = [];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        fileData.push({
          name: file.name,
          content: e.target.result,
          size: file.size
        });
        
        if (fileData.length === files.length) {
          setUploadedFiles(prev => [...prev, ...fileData]);
          processUploadedFiles([...uploadedFiles, ...fileData]);
        }
      };
      reader.readAsText(file);
    });
  };

  const processUploadedFiles = (files) => {
    const inputFiles = files.filter(f => f.name.includes('input'));
    const outputFiles = files.filter(f => f.name.includes('output'));
    
    const processedTestCases = [];
    
    inputFiles.forEach(inputFile => {
      const baseNameMatch = inputFile.name.match(/(.*)input(.*)\.txt$/);
      if (baseNameMatch) {
        const [, prefix, suffix] = baseNameMatch;
        const expectedOutputName = `${prefix}output${suffix}.txt`;
        const outputFile = outputFiles.find(f => f.name === expectedOutputName);
        
        if (outputFile) {
          processedTestCases.push({
            id: Date.now() + Math.random(),
            input: inputFile.content.trim(),
            expectedOutput: outputFile.content.trim(),
            inputFileName: inputFile.name,
            outputFileName: outputFile.name
          });
        }
      }
    });
    
    if (processedTestCases.length > 0) {
      setTestCases(processedTestCases);
      setNumTestCases(processedTestCases.length);
    }
  };

  const clearUploadedFiles = () => {
    setUploadedFiles([]);
    setTestCases([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const runVerification = async () => {
    if (!code.trim()) {
      alert('Please provide code to verify');
      return;
    }

    if (verificationMethod === 'manual' && testCases.some(tc => !tc.input.trim() && !tc.expectedOutput.trim())) {
      alert('Please provide input and expected output for all test cases');
      return;
    }

    setLoading(true);
    setShowResults(true);
    const testResults = [];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            properties: {
              language: activeLanguage,
              files: [
                {
                  name: "Main." + languageOptions[activeLanguage].extension.substring(1),
                  content: code,
                },
              ],
              stdin: testCase.input,
            },
          }),
        });

        const result = await response.json();
        const actualOutput = result?.exception || result?.stdout || "No output";
        const executionTime = result?.executionTime || "NA";

        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        const passed = actualOutput.trim() === testCase.expectedOutput.trim();
        
        testResults.push({
          id: testCase.id,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput,
          passed,
          executionTime,
          inputFileName: testCase.inputFileName,
          outputFileName: testCase.outputFileName
        });
      } catch (error) {
        testResults.push({
          id: testCase.id,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: `Error: ${error.message}`,
          passed: false,
          error: true,
          inputFileName: testCase.inputFileName,
          outputFileName: testCase.outputFileName
        });
      }
    }

    setResults(testResults);
    setLoading(false);
  };

  const exportResults = () => {
    const resultsData = {
      language: activeLanguage,
      code,
      verificationMethod,
      testCases,
      results,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(resultsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearCache = () => {
    localStorage.removeItem('testVerifierData');
    setCode('');
    setTestCases([{ input: '', expectedOutput: '', id: 1 }]);
    setResults([]);
    setNumTestCases(1);
    setShowResults(false);
    setActiveLanguage('python');
  };

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-lg hidden sm:block">Code Verification</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Code Editor</span>
            <span className="sm:hidden">Editor</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={activeLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white"
          >
            {Object.entries(languageOptions).map(([key, lang]) => (
              <option key={key} value={key}>{lang.name}</option>
            ))}
          </select>
          
          <button
            onClick={clearCache}
            className="text-gray-400 hover:text-red-400 p-1 rounded text-xs transition-colors flex items-center gap-1"
            title="Clear Cache"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
          
          <button
            onClick={exportResults}
            disabled={results.length === 0}
            className="text-gray-400 hover:text-yellow-400 disabled:text-gray-600 p-1 rounded text-xs transition-colors flex items-center gap-1"
            title="Export Results"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          
          <button
            onClick={runVerification}
            disabled={loading || !code.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            {loading ? 'Verifying...' : 'Run Verification'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Code Editor */}
        <div className="w-1/2 flex flex-col border-r border-gray-700">
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">CODE EDITOR</span>
              <span className="text-xs text-gray-400">({languageOptions[activeLanguage].name})</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Tab to indent</span>
              <Save className="w-3 h-3" />
              <span>Language-specific cache</span>
            </div>
          </div>
          
          <div className="flex-1 relative">
            <textarea
              ref={codeEditorRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleCodeEditorKeyDown}
              className="w-full h-full p-4 bg-gray-900 border-0 text-gray-100 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 leading-6"
              placeholder={`Enter your ${languageOptions[activeLanguage].name} code here...\n\nExample:\n${languageOptions[activeLanguage].example}\n\nTip: Use Tab key for indentation\nNote: Code is cached separately for each language`}
              style={{ 
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                lineHeight: '1.5',
                tabSize: 2
              }}
            />
            {/* Line numbers could be added here */}
            <div className="absolute bottom-4 right-4 text-xs text-gray-500">
              Lines: {code.split('\n').length} | Characters: {code.length}
            </div>
          </div>
        </div>

        {/* Right Panel - Test Cases */}
        <div className="w-1/2 flex flex-col">
          {/* Method Selection */}
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Verification Method:</span>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="manual"
                  checked={verificationMethod === 'manual'}
                  onChange={(e) => setVerificationMethod(e.target.value)}
                  className="text-blue-500"
                />
                <span className="text-sm">Manual Input</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="files"
                  checked={verificationMethod === 'files'}
                  onChange={(e) => setVerificationMethod(e.target.value)}
                  className="text-blue-500"
                />
                <span className="text-sm">File Upload</span>
              </label>
            </div>
          </div>

          {/* Manual Test Cases Setup */}
          {verificationMethod === 'manual' && (
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <div className="flex items-center gap-3 mb-3">
                <Hash className="w-4 h-4 text-blue-400" />
                <label className="text-sm font-medium">Number of Test Cases:</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={numTestCases}
                  onChange={(e) => setNumTestCases(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-16 text-center"
                />
                <button
                  onClick={generateTestCases}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                >
                  Generate
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Click on test case cards below to edit them in a focused window
              </p>
            </div>
          )}

          {/* File Upload Section */}
          {verificationMethod === 'files' && (
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <div className="flex items-center gap-3 mb-2">
                <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded cursor-pointer text-sm">
                  <Upload className="w-4 h-4" />
                  Upload Test Files
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {uploadedFiles.length > 0 && (
                  <button
                    onClick={clearUploadedFiles}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Files
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Upload .txt files with naming pattern: prefix_input_suffix.txt & prefix_output_suffix.txt
              </p>
              {uploadedFiles.length > 0 && (
                <div className="text-xs text-gray-300">
                  Uploaded: {uploadedFiles.length} files
                </div>
              )}
            </div>
          )}

          {/* Test Cases Display */}
          <div className="flex-1 overflow-auto p-4">
            {verificationMethod === 'manual' && (
              <div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {testCases.map((testCase, index) => (
                    <div
                      key={testCase.id}
                      onClick={() => openTestCaseModal(testCase, index)}
                      className="border border-gray-600 rounded p-3 cursor-pointer hover:border-blue-500 transition-colors bg-gray-800/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Test {index + 1}</span>
                        <div className="text-xs text-gray-400">
                          {testCase.input && testCase.expectedOutput ? '✓' : '○'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div className="truncate">
                          Input: {testCase.input || 'Not set'}
                        </div>
                        <div className="truncate">
                          Output: {testCase.expectedOutput || 'Not set'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={addTestCase}
                  className="w-full border-2 border-dashed border-gray-600 rounded p-4 text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
                >
                  <Plus className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm">Add Test Case</div>
                </button>
              </div>
            )}

            {verificationMethod === 'files' && (
              <div>
                <h3 className="text-sm font-medium mb-4">Loaded Test Cases</h3>
                {testCases.length > 0 ? (
                  <div className="space-y-3">
                    {testCases.map((testCase, index) => (
                      <div key={testCase.id} className="border border-gray-600 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300">Test Case {index + 1}</span>
                          {testCase.inputFileName && (
                            <div className="text-xs text-gray-400">
                              {testCase.inputFileName} → {testCase.outputFileName}
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-gray-400 mb-1">Input</div>
                            <pre className="p-2 bg-gray-900 rounded font-mono text-gray-300 overflow-auto max-h-16">
                              {testCase.input || 'No input'}
                            </pre>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">Expected</div>
                            <pre className="p-2 bg-gray-900 rounded font-mono text-gray-300 overflow-auto max-h-16">
                              {testCase.expectedOutput || 'No expected output'}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No test files uploaded yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Case Modal */}
      {showTestCaseModal && currentTestCase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium">Edit Test Case {currentTestCase.index + 1}</h3>
              <button
                onClick={() => setShowTestCaseModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Input</label>
                <textarea
                  value={currentTestCase.input}
                  onChange={(e) => setCurrentTestCase({...currentTestCase, input: e.target.value})}
                  className="w-full h-32 p-3 bg-gray-900 border border-gray-600 rounded text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter input for this test case..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Expected Output</label>
                <textarea
                  value={currentTestCase.expectedOutput}
                  onChange={(e) => setCurrentTestCase({...currentTestCase, expectedOutput: e.target.value})}
                  className="w-full h-32 p-3 bg-gray-900 border border-gray-600 rounded text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter expected output..."
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border-t border-gray-700 gap-3">
              <button
                onClick={() => {
                  removeTestCase(currentTestCase.id);
                  setShowTestCaseModal(false);
                }}
                disabled={testCases.length <= 1}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Delete Test Case
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTestCaseModal(false)}
                  className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTestCase}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Panel */}
      {showResults && (
        <div className="border-t border-gray-700 bg-gray-800 max-h-80 overflow-auto">
          <div className="px-4 py-2 border-b border-gray-600 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Verification Results</span>
              {!loading && (
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-green-400">✓ {passedTests} Passed</span>
                  <span className="text-red-400">✗ {totalTests - passedTests} Failed</span>
                  <span className="text-gray-400">Total: {totalTests}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {loading && (
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  Running verification...
                </div>
              )}
              <button
                onClick={() => setShowResults(false)}
                className="text-gray-400 hover:text-white p-1"
                title="Close Results"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {results.map((result, index) => (
                  <div key={result.id} className={`border rounded-lg p-4 ${
                    result.passed ? 'border-green-600 bg-green-900/20' : 'border-red-600 bg-red-900/20'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Test Case {index + 1}</span>
                      <div className="flex items-center gap-2">
                        {result.passed ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : result.error ? (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        {result.executionTime && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {result.executionTime.toFixed(0)}ms
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-gray-400">Input:</span>
                        <pre className="mt-1 p-2 bg-gray-900 rounded font-mono text-gray-300 overflow-auto max-h-16">
                          {result.input || 'No input'}
                        </pre>
                      </div>
                      
                      <div>
                        <span className="text-gray-400">Expected:</span>
                        <pre className="mt-1 p-2 bg-gray-900 rounded font-mono text-gray-300 overflow-auto max-h-16">
                          {result.expectedOutput}
                        </pre>
                      </div>
                      
                      <div>
                        <span className="text-gray-400">Actual:</span>
                        <pre className={`mt-1 p-2 bg-gray-900 rounded font-mono overflow-auto max-h-16 ${
                          result.passed ? 'text-green-300' : 'text-red-300'
                        }`}>
                          {result.actualOutput}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show Results Button when hidden */}
      {!showResults && results.length > 0 && (
        <div className="border-t border-gray-700 bg-gray-800">
          <button
            onClick={() => setShowResults(true)}
            className="w-full py-2 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
            Show Results ({passedTests}/{totalTests} passed)
          </button>
        </div>
      )}

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>Language: {languageOptions[activeLanguage]?.name}</span>
          <span>Method: {verificationMethod === 'manual' ? 'Manual Input' : 'File Upload'}</span>
          <span>Test Cases: {testCases.length}</span>
          {results.length > 0 && (
            <span className={`${passedTests === totalTests ? 'text-green-400' : 'text-yellow-400'}`}>
              Success Rate: {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
            </span>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Auto-saved</span>
        </div>
      </div>
    </div>
  );
};

export default TestCaseVerifier;