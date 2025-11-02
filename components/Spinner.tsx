import React from 'react';

const Spinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 rounded-full animate-spin border-4 border-solid border-green-600 border-t-transparent"></div>
    <p className="text-gray-600">AI is analyzing the leaf...</p>
  </div>
);

export default Spinner;
