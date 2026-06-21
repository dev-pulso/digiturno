import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Area } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClock } from '@/hooks/use-clock';

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
    <div className="min-h-screen bg-[#080c14] flex flex-col"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(4,75,132,0.12) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(124,58,237,0.08) 0%, transparent 60%), #080c14'
      }}>
      <header className="flex items-center justify-between px-12 py-7 border-b border-white/5">
        <div className="flex items-center gap-3.5">
          <img src={Logo} className='w-24 h-24' style={{width:'50px', height:'50px'}}/>
          <div>
            <div className="font-display font-extrabold text-xl tracking-tight">CONSALUD LABORAL</div>
            <div className="text-[11px] text-text-dim tracking-widest uppercase mt-0.5">Sistema de Turnos</div>
          </div>
        </div>
        <div className="font-mono text-xs text-text-mid bg-surface border border-border rounded-lg px-4 py-2">
          {formatted}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-12 py-16 gap-12">
        <div className="text-center">
          <p className="font-mono text-[11px] tracking-[0.2em] text-primary-400 uppercase mb-4">IPS CONSALUD LABORAL · Gestión Inteligente</p>
          <h1 className="font-display font-extrabold text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Control total<br />de tus turnos
          </h1>
          <p className="mt-4 text-text-dim text-base font-light max-w-md mx-auto leading-relaxed">
            Sistema multi-consultorio con gestión inteligente de colas y exámenes médicos
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/recepcion')}
            className="group flex items-center gap-4 bg-surface border border-border rounded-2xl px-8 py-5 hover:border-primary-500/30 hover:bg-surface2 transition-all duration-300 min-w-[280px]"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-700/20 flex items-center justify-center group-hover:bg-primary-700/30 transition-colors">
              <HugeiconsIcon icon={Ticket} className="h-5 w-5 text-primary-400" />
            </div>
            <div className="text-left flex-1">
              <p className="font-display font-bold text-base">Recepción</p>
              <p className="text-xs text-text-dim">Buscar pacientes y gestionar turnos</p>
            </div>
            <HugeiconsIcon icon={ChevronRightFreeIcons} className="h-4 w-4 text-text-dim group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={() => navigate('/display')}
            className="group flex items-center gap-4 bg-surface border border-border rounded-2xl px-8 py-5 hover:border-primary-500/30 hover:bg-surface2 transition-all duration-300 min-w-[280px]"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors">
              <HugeiconsIcon icon={Tv} className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="text-left flex-1">
              <p className="font-display font-bold text-base">Pantalla</p>
              <p className="text-xs text-text-dim">Ver turnos y videos corporativos</p>
            </div>
            <HugeiconsIcon icon={ChevronRightFreeIcons} className="h-4 w-4 text-text-dim group-hover:text-white transition-colors" />
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-3xl">
          {areas.map((area) => (
            <Card key={area.id} className="px-4 py-3 bg-surface border-border hover:border-white/10 transition-colors flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ background: area.color }} />
              <span className="font-mono font-bold text-xs">{area.prefijo}</span>
              <span className="text-xs text-text-mid">{area.nombre}</span>
              {area.turnos_espera > 0 && (
                <Badge className="text-[10px] font-semibold bg-white/10 text-white/60">
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
