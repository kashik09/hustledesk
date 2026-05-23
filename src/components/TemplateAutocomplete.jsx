import { useState, useRef, useEffect } from "react";
import api from "../lib/api";

export default function TemplateAutocomplete({ onSelect, countryCode = "" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query, limit: "10" });
        if (countryCode) params.set("country", countryCode);
        const data = await api.get(`/templates?${params}`);
        setResults(data);
        setOpen(data.length > 0);
        setHighlighted(-1);
      } catch (err) {
        console.error("Template search failed:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, countryCode]);

  function handleSelect(template) {
    onSelect(template);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function handleKeyDown(e) {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      handleSelect(results[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-stone-600 mb-1.5">
        Quick-fill from template
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Search Netflix, Spotify, Canva..."
          className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((template, index) => (
            <li
              key={template.id}
              onClick={() => handleSelect(template)}
              onMouseEnter={() => setHighlighted(index)}
              className={`px-4 py-3 cursor-pointer border-b border-stone-100 last:border-0 ${
                highlighted === index ? "bg-orange-50" : "hover:bg-stone-50"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-stone-800">
                    {template.service_name}
                  </span>
                  <span className="text-stone-400 mx-1.5">·</span>
                  <span className="text-stone-500 text-sm">
                    {template.plan_name}
                  </span>
                </div>
                <span className="text-orange-600 font-semibold text-sm">
                  {template.currency} {template.amount}
                </span>
              </div>
              {template.pricing_tiers && (
                <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                  {template.pricing_tiers.length} tiers available
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {query && !loading && results.length === 0 && open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg p-4 text-center text-stone-500 text-sm">
          No templates found for "{query}"
        </div>
      )}
    </div>
  );
}
