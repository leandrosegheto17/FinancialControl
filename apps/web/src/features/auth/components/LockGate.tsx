import { useQuery } from "@tanstack/react-query";
import { Fingerprint } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authenticateWithWebauthn, hasLocalUnlockConfigured, verifyPin } from "../api/security";

export function LockGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: requiresUnlock, isLoading } = useQuery({
    queryKey: ["local-unlock-configured", user?.id],
    queryFn: () => hasLocalUnlockConfigured(user!.id),
    enabled: Boolean(user),
  });

  if (!user || isLoading) return <>{children}</>;
  if (!requiresUnlock || unlocked) return <>{children}</>;

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const ok = await verifyPin(pin);
      if (ok) setUnlocked(true);
      else setError("PIN incorreto.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao validar PIN.");
    } finally {
      setBusy(false);
      setPin("");
    }
  }

  async function handleBiometric() {
    setError(null);
    setBusy(true);
    try {
      const ok = await authenticateWithWebauthn();
      if (ok) setUnlocked(true);
      else setError("Não foi possível confirmar sua identidade.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na autenticação biométrica.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Desbloquear</CardTitle>
          <CardDescription>Confirme sua identidade para continuar.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button type="button" variant="outline" onClick={handleBiometric} disabled={busy}>
            <Fingerprint className="h-4 w-4" /> Usar biometria / chave de acesso
          </Button>
          <form onSubmit={handlePinSubmit} className="flex flex-col gap-2">
            <Input
              type="password"
              inputMode="numeric"
              placeholder="PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              disabled={busy}
            />
            <Button type="submit" disabled={busy || pin.length < 4}>
              Entrar com PIN
            </Button>
          </form>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
