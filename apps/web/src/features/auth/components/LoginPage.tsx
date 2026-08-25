import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, signInWithPassword } from "../api/auth";
import { IDLE_LOGOUT_REASON_KEY } from "../hooks/useIdleLogout";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [idleLogoutNotice, setIdleLogoutNotice] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(IDLE_LOGOUT_REASON_KEY) === "idle") {
      setIdleLogoutNotice(true);
      sessionStorage.removeItem(IDLE_LOGOUT_REASON_KEY);
    }
  }, []);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await signInWithPassword(values.email, values.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao entrar.");
    }
  }

  async function handleMagicLink() {
    setError(null);
    const email = getValues("email");
    if (!email) {
      setError("Informe o e-mail para receber o link mágico.");
      return;
    }
    try {
      await sendMagicLink(email);
      setMagicLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar link mágico.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acesse sua conta FinancialControl.</CardDescription>
        </CardHeader>
        <CardContent>
          {idleLogoutNotice && (
            <p className="mb-4 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-800">
              Sessão expirada por inatividade. Faça login novamente.
            </p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {magicLinkSent && <p className="text-sm text-emerald-600">Link mágico enviado, confira seu e-mail.</p>}
            <Button type="submit" disabled={isSubmitting}>
              Entrar
            </Button>
            <Button type="button" variant="outline" onClick={handleMagicLink} disabled={isSubmitting}>
              Enviar link mágico
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/signup" className="text-primary underline-offset-4 hover:underline">
              Cadastre-se
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
