import { createBrowserRouter } from "react-router-dom";
import { AccountsPage } from "@/features/accounts/components/AccountsPage";
import { LoginPage } from "@/features/auth/components/LoginPage";
import { SecuritySettingsPage } from "@/features/auth/components/SecuritySettingsPage";
import { SignupPage } from "@/features/auth/components/SignupPage";
import { BudgetsPage } from "@/features/budgets/components/BudgetsPage";
import { CardInvoicesPage } from "@/features/cards/components/CardInvoicesPage";
import { CardsPage } from "@/features/cards/components/CardsPage";
import { CategoriesPage } from "@/features/categories/components/CategoriesPage";
import { DashboardPage } from "@/features/dashboard/components/DashboardPage";
import { GoalsPage } from "@/features/goals/components/GoalsPage";
import { PaymentMethodsPage } from "@/features/payment-methods/components/PaymentMethodsPage";
import { TransactionsPage } from "@/features/transactions/components/TransactionsPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicOnlyRoute } from "./PublicOnlyRoute";
import { RootLayout } from "./RootLayout";

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/accounts", element: <AccountsPage /> },
          { path: "/payment-methods", element: <PaymentMethodsPage /> },
          { path: "/categories", element: <CategoriesPage /> },
          { path: "/transactions", element: <TransactionsPage /> },
          { path: "/cards", element: <CardsPage /> },
          { path: "/cards/:cardId", element: <CardInvoicesPage /> },
          { path: "/budgets", element: <BudgetsPage /> },
          { path: "/goals", element: <GoalsPage /> },
          { path: "/settings/security", element: <SecuritySettingsPage /> },
        ],
      },
    ],
  },
]);
