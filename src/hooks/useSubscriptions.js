import { useState, useCallback } from "react";

const STORAGE_KEY = "hd_subscriptions";

/**
 * useSubscriptions
 * Manages subscription CRUD with localStorage persistence
 * Returns: { subscriptions, addSubscription, deleteSubscription, updateSubscription }
 *
 * @example
 * const { subscriptions, addSubscription, deleteSubscription } = useSubscriptions();
 * addSubscription({ name: "Netflix", amount: 15.49, cycle: "monthly" });
 */
export default function useSubscriptions() {
  const loadFromStorage = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  };

  const [subscriptions, setSubscriptions] = useState(loadFromStorage);

  const saveToStorage = useCallback((data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const addSubscription = useCallback((sub) => {
    const newSub = {
      ...sub,
      id: crypto.randomUUID(),
      currency: sub.currency || "USD",
      createdAt: new Date().toISOString(),
    };
    setSubscriptions((prev) => {
      const next = [...prev, newSub];
      saveToStorage(next);
      return next;
    });
    return newSub;
  }, [saveToStorage]);

  const deleteSubscription = useCallback((id) => {
    setSubscriptions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveToStorage(next);
      return next;
    });
  }, [saveToStorage]);

  const updateSubscription = useCallback((id, updates) => {
    setSubscriptions((prev) => {
      const next = prev.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      );
      saveToStorage(next);
      return next;
    });
  }, [saveToStorage]);

  const clearAll = useCallback(() => {
    setSubscriptions([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    subscriptions,
    addSubscription,
    deleteSubscription,
    updateSubscription,
    clearAll,
  };
}
