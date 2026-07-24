import React from 'react';

// simple shimmer placeholder used while data loads
export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-800 rounded-lg ${className}`} />
);

export const CardSkeleton = () => (
  <div className="card space-y-3">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-2/3" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-5/6" />
  </div>
);

export const StatGridSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card">
        <Skeleton className="h-3 w-1/2 mb-3" />
        <Skeleton className="h-7 w-1/3" />
      </div>
    ))}
  </div>
);

export default Skeleton;
