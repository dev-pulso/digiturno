import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { TipoExamen, Area } from '@/lib/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TopBar } from '@/components/layout/TopBar';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, Edit02Icon, Delete02Icon, CheckCircle, AlertCircleIcon } from '@hugeicons/core-free-icons';

export function AdminTiposExamenesPage() {
  const [tipos, setTipos] = useState<TipoExamen[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: '', codigo: '', area_id: '' });
  const [guardando, setGuardando] = useState(false);

  const fetch = () => {
    setLoading(true);
    Promise.all([api.get('/tipos-examenes'), api.get('/areas')])
      .then(([r1, r2]) => {
        setTipos(r1.data.data || r1.data);
        setAreas(r2.data.data || r2.data);
      }).catch(() => toast.error('Error al cargar')).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const abrirCrear = () => { setEditandoId(null); setForm({ nombre: '', codigo: '', area_id: areas[0]?.id?.toString() || '' }); setDialogOpen(true); };
  const abrirEditar = (t: TipoExamen) => { setEditandoId(t.id); setForm({ nombre: t.nombre, codigo: t.codigo, area_id: t.area_id.toString() }); setDialogOpen(true); };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.codigo.trim() || !form.area_id) { toast.error('Campos requeridos'); return; }
    setGuardando(true);
    try {
      const data = { nombre: form.nombre, codigo: form.codigo, area_id: parseInt(form.area_id) };
      if (editandoId) { await api.put(`/tipos-examenes/${editandoId}`, data); toast.success('Actualizado'); }
      else { await api.post('/tipos-examenes', data); toast.success('Creado'); }
      setDialogOpen(false); fetch();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Error'); }
    setGuardando(false);
  };

  const toggleActivo = async (t: TipoExamen) => {
    await api.put(`/tipos-examenes/${t.id}`, { activo: !t.activo });
    toast.success(t.activo ? 'Desactivado' : 'Activado'); fetch();
  };

  const eliminar = async (id: number) => {
    await api.delete(`/tipos-examenes/${id}`);
    toast.success('Eliminado'); fetch();
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col">
      <TopBar title="Admin — Tipos de Examen" subtitle="Gestiona los tipos de examen por consultorio" showBack />
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="font-display font-bold text-lg">Tipos de Examen</h2><p className="text-xs text-text-dim mt-0.5">{tipos.length} tipo{tipos.length !== 1 ? 's' : ''}</p></div>
          <Button onClick={abrirCrear} className="bg-primary-700 hover:bg-primary-600 text-white"><HugeiconsIcon icon={PlusSignIcon} className="h-4 w-4 mr-1.5" /> Nuevo Tipo</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tipos.map((t) => (
            <Card key={t.id} className="p-4 bg-surface border-border hover:border-white/15 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div><p className="font-display font-bold text-sm">{t.nombre}</p><p className="font-mono text-[11px] text-text-dim">{t.codigo}</p></div>
                <Badge variant="outline" className={`border text-[10px] font-semibold ${t.activo ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'}`}>{t.activo ? 'Activo' : 'Inactivo'}</Badge>
              </div>
              <div className="text-xs text-text-mid mb-3">{t.area ? `${t.area.prefijo} – ${t.area.nombre}` : `Área #${t.area_id}`}</div>
              <div className="flex gap-1.5 pt-3 border-t border-border">
                {t.activo ? <Button variant="ghost" size="sm" className="h-8 px-2 text-text-dim hover:text-amber-400" onClick={() => toggleActivo(t)}><HugeiconsIcon icon={AlertCircleIcon} className="h-3.5 w-3.5 mr-1" /> Desactivar</Button>
                : <Button variant="ghost" size="sm" className="h-8 px-2 text-text-dim hover:text-emerald-400" onClick={() => toggleActivo(t)}><HugeiconsIcon icon={CheckCircle} className="h-3.5 w-3.5 mr-1" /> Activar</Button>}
                <Button variant="ghost" size="sm" className="h-8 px-2 text-text-dim hover:text-text" onClick={() => abrirEditar(t)}><HugeiconsIcon icon={Edit02Icon} className="h-3.5 w-3.5 mr-1" /> Editar</Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-text-dim hover:text-red-400" onClick={() => eliminar(t.id)}><HugeiconsIcon icon={Delete02Icon} className="h-3.5 w-3.5 mr-1" /> Eliminar</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-surface border-border text-text max-w-md">
          <DialogHeader><DialogTitle className="font-display font-bold text-lg">{editandoId ? 'Editar Tipo' : 'Nuevo Tipo de Examen'}</DialogTitle><DialogDescription className="text-text-dim text-sm">Cada tipo de examen se asocia a un consultorio.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-xs text-text-mid mb-1.5 block">Nombre</label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Espirometría" className="bg-[#080c14] border-border text-text" /></div>
            <div><label className="text-xs text-text-mid mb-1.5 block">Código</label><Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="ESP" className="bg-[#080c14] border-border text-text font-mono" /></div>
            <div>
              <label className="text-xs text-text-mid mb-1.5 block">Consultorio</label>
              <Select value={form.area_id} onValueChange={(v) => setForm({ ...form, area_id: v })}>
                <SelectTrigger className="bg-[#080c14] border-border text-xs"><SelectValue placeholder="Seleccionar consultorio" /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {areas.map((a) => (<SelectItem key={a.id} value={String(a.id)} className="text-xs">{a.prefijo} – {a.nombre}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-text-dim">Cancelar</Button>
            <Button onClick={guardar} disabled={guardando} className="bg-primary-700 hover:bg-primary-600 text-white">{guardando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
