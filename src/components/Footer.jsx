export default function Footer() {
  return (
    <footer className="bg-stone-100 border-t border-stone-200 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-stone-500">
        <p>HustleDesk — FX toolkit for Kenyan freelancers</p>
        <p className="mt-1">
          Rates from{" "}
          <a
            href="https://open.er-api.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-stone-700"
          >
            Open Exchange Rates API
          </a>
        </p>
      </div>
    </footer>
  );
}
