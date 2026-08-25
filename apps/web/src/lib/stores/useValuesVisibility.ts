import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ValuesVisibilityState {
  hidden: boolean;
  toggle: () => void;
}

/** Whether monetary values on the dashboard are masked. Defaults to
 *  hidden (shoulder-surfing protection) and remembers the choice locally. */
export const useValuesVisibility = create<ValuesVisibilityState>()(
  persist(
    (set) => ({
      hidden: true,
      toggle: () => set((state) => ({ hidden: !state.hidden })),
    }),
    { name: "financial-control:values-hidden" }
  )
);
