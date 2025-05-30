import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CodeEditor from './CodeEditor';
import TestCaseVerifier from './TestCaseVerifier';
import NotFound from './NotFound'; 
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CodeEditor />} />
        <Route path="/verification" element={<TestCaseVerifier />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);