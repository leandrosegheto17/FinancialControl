import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./AuthProvider";
import { QueryProvider } from "./QueryProvider";
import { router } from "./router";

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryProvider>
  );
}
