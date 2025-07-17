import React from 'react';

const MexcBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Blue glow effects */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {/* Extra large outer glow */}
        <div className="w-[800px] h-[800px] rounded-full bg-blue-500/8 blur-[100px] animate-pulse"></div>

        {/* Large outer glow */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-400/10 blur-[80px] animate-pulse delay-300"></div>

        {/* Medium glow */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-400/15 blur-[60px] animate-pulse delay-700"></div>

        {/* Inner intense glow */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-400/20 blur-[40px] animate-pulse delay-1000"></div>

        {/* Core glow */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-cyan-300/25 blur-[30px] animate-pulse delay-1500"></div>
      </div>

      {/* Scattered light particles */}
      <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
      <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-cyan-300 rounded-full animate-pulse delay-700 opacity-80"></div>
      <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-blue-300 rounded-full animate-pulse delay-300 opacity-50"></div>
      <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-1200 opacity-70"></div>
      <div className="absolute bottom-1/3 right-1/5 w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-900 opacity-40"></div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default MexcBackground;
