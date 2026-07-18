import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Area } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClock } from '@/hooks/use-clock';
import { ThemeToggle } from '@/components/theme/theme-toggle';

import Logo from '../../../assets/LOGO CONSALUD L.png'
import { HugeiconsIcon } from '@hugeicons/react';
import { ChevronRightFreeIcons, Ticket, Tv } from '@hugeicons/core-free-icons';

export function LandingPage() {
  const navigate = useNavigate();
  const { formatted } = useClock();
  const [areas, setAreas] = useState<Area[]>([]);
  const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0, ausentes: 0 });

  useEffect(() => {
    api.get('/areas').then((res) => {
      const data: Area[] = res.data.data || res.data;
      setAreas(data);
      const waiting = data.reduce((s, a) => s + (a.turnos_espera || 0), 0);
      setStats({ total: data.length, waiting, completed: 0, ausentes: 0 });
    }).catch(() => { });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(4,75,132,0.06),transparent_70%),radial-gradient(ellipse_40%_40%_at_80%_80%,rgba(124,58,237,0.04),transparent_60%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(4,75,132,0.18),transparent_70%),radial-gradient(ellipse_40%_40%_at_80%_80%,rgba(124,58,237,0.10),transparent_60%)]"
        aria-hidden="true"
      />
      <header className="relative z-10 flex items-center justify-between px-12 py-7 border-b border-border/50">
        <div className="flex items-center gap-3.5">
          <img src={Logo} className='w-12 h-12' />
          <div>
            <div className="font-display font-extrabold text-xl tracking-tight">CONSALUD LABORAL</div>
            <div className="text-[11px] text-muted-foreground tracking-widest uppercase mt-0.5">Sistema de Turnos</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="font-mono text-xs text-muted-foreground bg-muted border border-border rounded-lg px-4 py-2">
            {formatted}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-12 py-16 gap-12">
        <div className="text-center">
          <p className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase mb-4">IPS CONSALUD LABORAL · Gestión Inteligente</p>
          <h1 className="font-display font-extrabold text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight bg-linear-to-b from-foreground to-muted-foreground bg-clip-text text-primary">
            Control total<br />de tus turnos
          </h1>
          <p className="mt-4 text-muted-foreground text-base font-light max-w-md mx-auto leading-relaxed">
            Sistema multi-consultorio con gestión inteligente de colas y exámenes médicos
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/recepcion')}
            className="group flex items-center gap-4 bg-card border border-border rounded-2xl px-8 py-5 hover:border-primary/30 hover:bg-accent transition-all duration-300 min-w-[280px]"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <HugeiconsIcon icon={Ticket} className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left flex-1">
              <p className="font-display font-bold text-base">Recepción</p>
              <p className="text-xs text-muted-foreground">Buscar pacientes y gestionar turnos</p>
            </div>
            <HugeiconsIcon icon={ChevronRightFreeIcons} className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>

          <button
            onClick={() => navigate('/display')}
            className="group flex items-center gap-4 bg-card border border-border rounded-2xl px-8 py-5 hover:border-primary/30 hover:bg-accent transition-all duration-300 min-w-[280px]"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors">
              <HugeiconsIcon icon={Tv} className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-left flex-1">
              <p className="font-display font-bold text-base">Pantalla</p>
              <p className="text-xs text-muted-foreground">Ver turnos y videos corporativos</p>
            </div>
            <HugeiconsIcon icon={ChevronRightFreeIcons} className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-3xl">
          {areas.map((area) => (
            <Card key={area.id} className="px-4 py-3 bg-card border-border hover:border-foreground/10 transition-colors flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ background: area.color }} />
              <span className="font-mono font-bold text-xs">{area.prefijo}</span>
              <span className="text-xs text-muted-foreground">{area.nombre}</span>
              {area.turnos_espera > 0 && (
                <Badge className="text-[10px] font-semibold bg-foreground/10 text-foreground/60">
                  {area.turnos_espera} en espera
                </Badge>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
