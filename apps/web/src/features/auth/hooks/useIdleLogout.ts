import { useEffect, useRef } from "react";
import { signOut } from "../api/auth";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;
export const IDLE_LOGOUT_REASON_KEY = "financial-control:logout-reason";

/** Signs the user out after `timeoutMs` of no mouse/keyboard/touch/scroll activity. */
export function useIdleLogout(timeoutMs: number): void {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        sessionStorage.setItem(IDLE_LOGOUT_REASON_KEY, "idle");
        void signOut();
      }, timeoutMs);
    }

    resetTimer();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, [timeoutMs]);
}
