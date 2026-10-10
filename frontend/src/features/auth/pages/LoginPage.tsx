import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import Logo from '@/assets/LOGO CONSALUD L.png';
import { User, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) return;

    const success = await login(usernameOrEmail, password);
    if (success) {
      navigate('/recepcion', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background relative px-4 overflow-hidden">
      {/* Fondo estético decorativo */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(4,75,132,0.08),transparent_70%),radial-gradient(ellipse_40%_40%_at_80%_80%,rgba(124,58,237,0.05),transparent_60%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(4,75,132,0.2),transparent_70%),radial-gradient(ellipse_40%_40%_at_80%_80%,rgba(124,58,237,0.12),transparent_60%)]"
        aria-hidden="true"
      />

      {/* Selector de tema en esquina superior */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Encabezado con Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center gap-3 mb-2">
            <img src={Logo} alt="Consalud Laboral" className="w-14 h-14 object-contain drop-shadow-sm" />
            <div className="text-left">
              <span className="font-extrabold text-2xl tracking-tight text-foreground block">
                CONSALUD LABORAL
              </span>
              <span className="text-xs text-muted-foreground tracking-widest uppercase block">
                Sistema de Turnos
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Inicio de Sesión */}
        <Card className="shadow-xl border-border/60 backdrop-blur-sm bg-card/90">
          <CardHeader className="space-y-1 pb-6 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">Iniciar Sesión</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Ingresa con tus credenciales de Consalud para acceder a Recepción
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usernameOrEmail" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Usuario o Correo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="usernameOrEmail"
                    type="text"
                    placeholder="ej. aperes o usuario@consalud.com"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    required
                    autoFocus
                    className="pl-9 text-sm h-11"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Contraseña
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 pr-10 text-sm h-11"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold mt-2 cursor-pointer transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validando credenciales...
                  </>
                ) : (
                  <>
                    Entrar al Sistema
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Pie de página con aviso de seguridad */}
        <p className="mt-6 text-center text-xs text-muted-foreground/80">
          Protección de datos médicos y registro de auditoría activo.
        </p>
      </div>
    </div>
  );
}
