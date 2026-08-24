import {
  CreditCard,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  PiggyBank,
  Repeat,
  Shapes,
  Shield,
  Target,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
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
  );
}

function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="mt-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    >
      <LogOut className="h-4 w-4" /> Sair
    </button>
  );
}

export function RootLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <LockGate>
      <div className="flex min-h-screen flex-col md:flex-row">
        <header className="flex items-center justify-between border-b border-border bg-card p-4 md:hidden">
          <p className="text-lg font-semibold">FinancialControl</p>
          <Button variant="ghost" size="icon" aria-label="Abrir menu" onClick={() => setMobileNavOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Fechar menu"
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-card p-4 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-lg font-semibold">FinancialControl</p>
                <Button variant="ghost" size="icon" aria-label="Fechar menu" onClick={() => setMobileNavOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <NavLinks onNavigate={() => setMobileNavOpen(false)} />
              <SignOutButton />
            </div>
          </div>
        )}

        <aside className="hidden w-60 flex-col border-r border-border bg-card p-4 md:flex">
          <p className="mb-6 px-2 text-lg font-semibold">FinancialControl</p>
          <NavLinks />
          <SignOutButton />
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </LockGate>
  );
}
