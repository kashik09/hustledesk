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

export default function LoadingSkeleton() {
  return (
    <div style={{ padding: "16px" }}>
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
    </div>
  );
}
.skeleton-line {
  height: 12px;
  background: #e0e0e0;
  margin: 8px 0;
  border-radius: 6px;
  animation: pulse 1.2s infinite ease-in-out;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 0.6;
  }
}