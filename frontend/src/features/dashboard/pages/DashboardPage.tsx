import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TopBar } from '@/components/layout/TopBar';
import { HugeiconsIcon } from '@hugeicons/react';
import { AlertCircleIcon, Clock01Icon, UserGroupIcon, CheckmarkCircle01Icon, CancelCircleIcon, BarChartIcon, ChartLineIcon, Activity01Icon } from '@hugeicons/core-free-icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';

interface DashboardSummary {
  total_turnos: number;
  turnos_espera: number;
  turnos_llamando: number;
  turnos_completados: number;
  turnos_ausentes: number;
  avg_segundos_espera: number;
  avg_segundos_servicio: number;
  estadisticas_areas: Array<{
    area_id: number;
    area_nombre: string;
    area_codigo: string;
    total: number;
    en_espera: number;
    completados: number;
    avg_espera: number;
  }>;
}

interface Alert {
  tipo: string;
  severidad: string;
  mensaje: string;
  area_codigo: string;
}

interface HourlyData {
  hour: number;
  total: number;
  completed: number;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, alertRes, hourlyRes] = await Promise.all([
        api.get('/dashboard/resumen'),
        api.get('/dashboard/alertas'),
        api.get('/dashboard/tendencia-horaria'),
      ]);
      setSummary(sumRes.data);
      setAlerts(alertRes.data || []);
      setHourlyData(hourlyRes.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !summary) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col">
        <TopBar title="Dashboard Analítico" subtitle="Métricas de rendimiento hospitalario" showBack />
        <div className="flex-1 flex items-center justify-center text-text-dim">
          <div className="text-center">
            <div className="text-3xl mb-3 animate-pulse">📊</div>
            <p className="text-sm">Cargando métricas...</p>
          </div>
        </div>
      </div>
    );
  }

  const areaColors: Record<string, string> = {
    mg: '#2563eb', es: '#7c3aed', lab: '#16a34a',
    img: '#0891b2', caja: '#ea580c', farm: '#db2777', adm: '#475569',
  };

  const formatHour = (h: unknown) => `${String(h).padStart(2, '0')}:00`;

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col">
      <TopBar title="Dashboard Analítico" subtitle="Métricas de rendimiento hospitalario" showBack />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-text-dim uppercase tracking-wider font-mono">Total</p>
              <HugeiconsIcon icon={BarChartIcon} className="h-4 w-4 text-blue-400" />
            </div>
            <p className="font-display font-extrabold text-2xl text-blue-400">{summary.total_turnos}</p>
            <p className="text-[10px] text-text-dim mt-1">turnos hoy</p>
          </Card>

          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-text-dim uppercase tracking-wider font-mono">Espera</p>
              <HugeiconsIcon icon={UserGroupIcon} className="h-4 w-4 text-amber-400" />
            </div>
            <p className="font-display font-extrabold text-2xl text-amber-400">{summary.turnos_espera}</p>
            <p className="text-[10px] text-text-dim mt-1">pacientes</p>
          </Card>

          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-text-dim uppercase tracking-wider font-mono">Llamando</p>
              <HugeiconsIcon icon={Activity01Icon} className="h-4 w-4 text-sky-400" />
            </div>
            <p className="font-display font-extrabold text-2xl text-sky-400">{summary.turnos_llamando}</p>
            <p className="text-[10px] text-text-dim mt-1">en consulta</p>
          </Card>

          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-text-dim uppercase tracking-wider font-mono">Atendidos</p>
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="font-display font-extrabold text-2xl text-emerald-400">{summary.turnos_completados}</p>
            <p className="text-[10px] text-text-dim mt-1">completados</p>
          </Card>

          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-text-dim uppercase tracking-wider font-mono">Ausentes</p>
              <HugeiconsIcon icon={CancelCircleIcon} className="h-4 w-4 text-red-400" />
            </div>
            <p className="font-display font-extrabold text-2xl text-red-400">{summary.turnos_ausentes}</p>
            <p className="text-[10px] text-text-dim mt-1">no asistieron</p>
          </Card>

          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-text-dim uppercase tracking-wider font-mono">T. Espera</p>
              <HugeiconsIcon icon={Clock01Icon} className="h-4 w-4 text-purple-400" />
            </div>
            <p className="font-display font-extrabold text-2xl text-purple-400">{formatDuration(summary.avg_segundos_espera)}</p>
            <p className="text-[10px] text-text-dim mt-1">promedio</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-5 bg-surface border-border">
            <h3 className="font-display font-bold text-sm mb-4">Estadísticas por Área</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-mono text-[10px] text-text-dim uppercase tracking-wider">Área</th>
                    <th className="text-right py-2 font-mono text-[10px] text-text-dim uppercase tracking-wider">Total</th>
                    <th className="text-right py-2 font-mono text-[10px] text-text-dim uppercase tracking-wider">Espera</th>
                    <th className="text-right py-2 font-mono text-[10px] text-text-dim uppercase tracking-wider">Atendidos</th>
                    <th className="text-right py-2 font-mono text-[10px] text-text-dim uppercase tracking-wider">T. Espera</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.estadisticas_areas.map((stat) => (
                    <tr key={stat.area_id} className="border-b border-border/50 hover:bg-white/[0.02]">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: areaColors[stat.area_codigo] || '#666' }} />
                          <span className="font-medium">{stat.area_nombre}</span>
                          <span className="font-mono text-[10px] text-text-dim">({stat.area_codigo})</span>
                        </div>
                      </td>
                      <td className="text-right font-mono">{stat.total}</td>
                      <td className="text-right">
                        <span className={stat.en_espera > 5 ? 'text-amber-400 font-medium' : ''}>{stat.en_espera}</span>
                      </td>
                      <td className="text-right font-mono text-emerald-400">{stat.completados}</td>
                      <td className="text-right font-mono text-text-dim">{formatDuration(stat.avg_espera)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5 bg-surface border-border">
            <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-amber-400" />
              Alertas
            </h3>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-text-dim">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-xs">Sin alertas activas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border text-xs"
                    style={{
                       background: alert.severidad === 'alta' ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)',
                        borderColor: alert.severidad === 'alta' ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.3)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-[9px] ${alert.severidad === 'alta' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {alert.severidad === 'alta' ? 'CRÍTICO' : 'MEDIO'}
                      </Badge>
                      <span className="font-mono text-[10px] uppercase opacity-50">{alert.area_codigo}</span>
                    </div>
                    <p className="text-text">{alert.mensaje}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="p-5 bg-surface border-border">
          <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
            <HugeiconsIcon icon={ChartLineIcon} className="h-4 w-4 text-primary-400" />
            Tendencia Horaria
          </h3>
          {hourlyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#044B84" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#044B84" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" tickFormatter={formatHour} stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#0d1420',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelFormatter={formatHour}
                  />
                  <Area type="monotone" dataKey="total" stroke="#044B84" fill="url(#totalGrad)" strokeWidth={2} name="Creados" />
                  <Area type="monotone" dataKey="completed" stroke="#4ade80" fill="url(#completedGrad)" strokeWidth={2} name="Atendidos" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-text-dim text-sm">
              Sin datos horarios para hoy
            </div>
          )}
        </Card>

        <Card className="p-5 bg-surface border-border">
          <h3 className="font-display font-bold text-sm mb-4">Turnos por Área</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.estadisticas_areas}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="area_codigo" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#0d1420',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]} fill="#044B84" />
                <Bar dataKey="completed" name="Atendidos" radius={[4, 4, 0, 0]} fill="#4ade80" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
