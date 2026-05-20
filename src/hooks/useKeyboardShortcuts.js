import { useEffect } from "react";

export default function useKeyboardShortcuts(
  shortcuts = {}
) {
  useEffect(() => {
    function handleKeyDown(event) {
      const key = event.key.toLowerCase();

      if (
        (event.ctrlKey || event.metaKey) &&
        shortcuts[key]
      ) {
        event.preventDefault();

        shortcuts[key](event);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [shortcuts]);
}