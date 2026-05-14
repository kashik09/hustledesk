const ErrorMessage = ({ message }) => {
  return (
    <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-xl">
      <p className="font-medium">Something went wrong</p>
      <p className="text-sm mt-1">
        {message || "Please try again later."}
      </p>
    </div>
  );
};

export default ErrorMessage;