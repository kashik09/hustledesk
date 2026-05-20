import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-stone-50">
      <div className="text-center max-w-md">

        <h1 className="text-7xl font-bold text-orange-500">
          404
        </h1>

        <h2 className="mt-4 text-2xl font-semibold text-stone-800">
          Page not found
        </h2>

        <p className="mt-2 text-stone-500">
          The page you are looking for
          does not exist or was moved.
        </p>

        <Link
          to="/"
          className="inline-flex mt-6 px-5 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
        >
          Go back home
        </Link>

      </div>
    </main>
  );
}