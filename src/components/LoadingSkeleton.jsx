const LoadingSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 animate-pulse">
      <div className="h-6 bg-stone-200 rounded w-1/3 mb-4"></div>

      <div className="space-y-3">
        <div className="h-4 bg-stone-200 rounded"></div>
        <div className="h-4 bg-stone-200 rounded w-5/6"></div>
        <div className="h-4 bg-stone-200 rounded w-2/3"></div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;