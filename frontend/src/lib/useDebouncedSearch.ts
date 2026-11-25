import { useEffect, useRef, useState } from "react";

interface UseDebouncedSearchOptions<T> {
  searchFn: (query: string, signal: AbortSignal) => Promise<T[]>;
  delay?: number;
  minChars?: number;
}

export function useDebouncedSearch<T>({
  searchFn,
  delay = 350,
  minChars = 2,
}: UseDebouncedSearchOptions<T>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < minChars) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const data = await searchFn(trimmed, controller.signal);
        setResults(data);
      } catch (err: any) {
        if (err.name === "CanceledError" || err.name === "AbortError") {
          return;
        }
        console.error("Search error:", err);
        setError("Qidiruvda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [query, delay, minChars]);

  const clear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setQuery("");
    setResults([]);
    setLoading(false);
    setError(null);
  };

  return {
    query,
    setQuery,
    results,
    setResults,
    loading,
    error,
    clear,
  };
}
