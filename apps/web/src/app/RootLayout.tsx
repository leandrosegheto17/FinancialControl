import {
  CreditCard,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PiggyBank,
  Repeat,
  Shapes,
  Shield,
  Target,
  Wallet,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { signOut } from "@/features/auth/api/auth";
import { LockGate } from "@/features/auth/components/LockGate";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/accounts", label: "Contas", icon: Wallet },
  { to: "/payment-methods", label: "Modos de pagamento", icon: Repeat },
  { to: "/categories", label: "Categorias", icon: Shapes },
  { to: "/transactions", label: "Lançamentos", icon: ListChecks },
  { to: "/cards", label: "Cartões", icon: CreditCard },
  { to: "/budgets", label: "Orçamentos", icon: PiggyBank },
  { to: "/goals", label: "Metas", icon: Target },
  { to: "/settings/security", label: "Segurança", icon: Shield },
];

export function RootLayout() {
  return (
    <LockGate>
      <div className="flex min-h-screen">
        <aside className="hidden w-60 flex-col border-r border-border bg-card p-4 md:flex">
          <p className="mb-6 px-2 text-lg font-semibold">FinancialControl</p>
          <nav className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-accent text-accent-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </aside>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </LockGate>
  );
}
