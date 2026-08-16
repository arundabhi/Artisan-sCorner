import React from 'react';

const SkeletonLoader = ({ count = 3, layout = "grid" }) => {
  const skeletons = Array(count).fill(null);

  if (layout === "list") {
    return (
      <div className="space-y-4">
        {skeletons.map((_, idx) => (
          <div key={idx} className="flex gap-4 p-4 bg-white border border-artisanal-200 rounded-xl animate-pulse">
            <div className="w-24 h-24 bg-artisanal-200 rounded-lg"></div>
            <div className="flex-1 space-y-3 py-1">
              <div className="h-4 bg-artisanal-200 rounded w-1/3"></div>
              <div className="h-4 bg-artisanal-200 rounded w-3/4"></div>
              <div className="h-4 bg-artisanal-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {skeletons.map((_, idx) => (
        <div key={idx} className="bg-white rounded-2xl border border-artisanal-200 p-5 space-y-4 animate-pulse">
          <div className="aspect-square bg-artisanal-200 rounded-xl w-full"></div>
          <div className="h-3 bg-artisanal-200 rounded w-1/4"></div>
          <div className="h-4 bg-artisanal-200 rounded w-3/4"></div>
          <div className="h-3 bg-artisanal-200 rounded w-1/2"></div>
          <div className="border-t border-artisanal-100 pt-3 flex justify-between items-center">
            <div className="h-4 bg-artisanal-200 rounded w-1/4"></div>
            <div className="h-8 w-8 bg-artisanal-200 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
