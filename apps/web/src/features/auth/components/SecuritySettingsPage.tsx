import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/app/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listWebauthnCredentials,
  registerWebauthnCredential,
  removeWebauthnCredential,
  setPin,
} from "../api/security";

export function SecuritySettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pin, setPinValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: credentials } = useQuery({
    queryKey: ["webauthn-credentials", user?.id],
    queryFn: () => listWebauthnCredentials(user!.id),
    enabled: Boolean(user),
  });

  async function handleSetPin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await setPin(pin);
      setMessage("PIN configurado.");
      setPinValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao configurar PIN.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegisterWebauthn() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await registerWebauthnCredential(navigator.userAgent.slice(0, 60));
      setMessage("Dispositivo registrado para desbloqueio biométrico.");
      queryClient.invalidateQueries({ queryKey: ["webauthn-credentials", user?.id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao registrar biometria.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    await removeWebauthnCredential(id);
    queryClient.invalidateQueries({ queryKey: ["webauthn-credentials", user?.id] });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>PIN de desbloqueio</CardTitle>
          <CardDescription>4 a 8 dígitos, usado como alternativa à biometria.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetPin} className="flex items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pin">Novo PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPinValue(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={busy || pin.length < 4}>
              Salvar PIN
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Biometria / chave de acesso (WebAuthn)</CardTitle>
          <CardDescription>Registre este dispositivo para desbloquear com Face ID, Touch ID ou Windows Hello.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button type="button" onClick={handleRegisterWebauthn} disabled={busy} className="w-fit">
            Registrar este dispositivo
          </Button>
          <ul className="flex flex-col gap-2">
            {(credentials ?? []).map((cred) => (
              <li key={cred.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                <span>{cred.device_label ?? "Dispositivo"}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemove(cred.id)}>
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
