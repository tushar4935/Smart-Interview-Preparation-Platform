import React from 'react';

const LoadingSpinner = ({ size = 'md', fullScreen = true }) => {
  const sizes = { sm: 'w-5 h-5', md: 'w-10 h-10', lg: 'w-16 h-16' };
  const spinner = (
    <div className={`${sizes[size]} border-4 border-gray-700 border-t-primary-500 rounded-full animate-spin`} />
  );
  if (!fullScreen) return spinner;
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      {spinner}
    </div>
  );
};

export default LoadingSpinner;
