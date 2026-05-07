import { useEffect, useState } from "react";

/**
 * Handles subscription storage using localStorage.
 * Adds,delete and persist after refresh
 */

export default function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);

  /**
   * Load subscriptions from localStorage
   * when app starts
   */
  useEffect(() => {
    const savedSubscriptions =
      localStorage.getItem("subscriptions");

    if (savedSubscriptions) {
      setSubscriptions(
        JSON.parse(savedSubscriptions)
      );
    }
  }, []);

  /**
   * Save subscriptions whenever they change
   */
  useEffect(() => {
    localStorage.setItem(
      "subscriptions",
      JSON.stringify(subscriptions)
    );
  }, [subscriptions]);

  
  const addSubscription = (subscription) => {
    setSubscriptions((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...subscription,
      },
    ]);
  };

  const deleteSubscription = (id) => {
    setSubscriptions((prev) =>
      prev.filter((sub) => sub.id !== id)
    );
  };

  return {
    subscriptions,
    addSubscription,
    deleteSubscription,
  };
}
