import React from 'react';
import { Home, ArrowLeft, Code2, Bug, RefreshCw } from 'lucide-react';

const NotFoundPage = () => {
  const suggestions = [
    { icon: <Code2 className="w-4 h-4" />, title: 'Code Editor', path: '/', description: 'Multi-file code editor' },
    { icon: <Bug className="w-4 h-4" />, title: 'Test Verifier', path: '/verification', description: 'Verify your code with test cases' }
  ];

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code2 className="w-6 h-6 text-blue-400" />
            <span className="font-semibold text-lg">CodeSpace</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white px-3 py-2 rounded transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Go Back</span>
            </button>
            
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 text-gray-400 hover:text-white px-3 py-2 rounded transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full text-center">
          {/* 404 Display */}
          <div className="mb-8">
            <div className="text-8xl md:text-9xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-pink-500 to-purple-600 select-none">
              404
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent flex-1"></div>
              <span className="text-gray-400 text-sm font-mono px-4">ERROR</span>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent flex-1"></div>
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-100">
              Page Not Found
            </h1>
            <p className="text-lg text-gray-400 mb-2">
              The page you're looking for seems to have vanished into the void.
            </p>
          </div>

          {/* Suggestions */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-6 text-gray-200">
              Maybe you were looking for:
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {suggestions.map((item, index) => (
                <div
                  key={index}
                  className="group bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-all duration-300 cursor-pointer hover:bg-gray-750"
                  onClick={() => window.location.href = item.path}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-blue-400 group-hover:text-blue-300 transition-colors">
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-white group-hover:text-blue-300 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
            
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>

          {/* Debug Info */}
          <div className="mt-16 p-4 bg-gray-800 border border-gray-700 rounded-lg max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Bug className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-mono text-yellow-400">DEBUG INFO</span>
            </div>
            
            <div className="text-left space-y-2 text-xs font-mono text-gray-400">
              <div className="flex justify-between">
                <span>Current URL:</span>
                <span className="text-blue-400">{window.location.pathname}</span>
              </div>
              <div className="flex justify-between">
                <span>Timestamp:</span>
                <span className="text-green-400">{new Date().toISOString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Status Code:</span>
                <span className="text-red-400">404</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <span>© 2025 CodeSpace</span>
            <span>•</span>
            <a href="/help" className="hover:text-white transition-colors">
              Need Help?
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`        
        .bg-gray-750 {
          background-color: #374151;
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;