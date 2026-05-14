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

export default function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div
      style={{
        background: "#ffe5e5",
        color: "#b00020",
        padding: "10px 12px",
        borderRadius: "6px",
        margin: "10px 0",
        fontSize: "14px",
        border: "1px solid #ffb3b3"
      }}
    >
      {message}
    </div>
  );
}