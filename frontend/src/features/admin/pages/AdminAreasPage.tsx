import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Area } from '@/lib/types';
import { useAreas } from '@/hooks/use-areas';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { TopBar } from '@/components/layout/TopBar';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, Edit02Icon, Delete02Icon, CheckCircle, AlertCircleIcon } from '@hugeicons/core-free-icons';

interface AreaForm {
  codigo: string;
  nombre: string;
  prefijo: string;
  color: string;
}

const COLORES = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];
const formularioVacio: AreaForm = { codigo: '', nombre: '', prefijo: '', color: '#2563eb' };

export function AdminAreasPage() {
  const { areas, refetch } = useAreas();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<AreaForm>(formularioVacio);
  const [guardando, setGuardando] = useState(false);
  const [confirmarDesactivar, setConfirmarDesactivar] = useState<number | null>(null);

  const abrirCrear = () => { setEditandoId(null); setForm(formularioVacio); setDialogOpen(true); };
  const abrirEditar = (area: Area) => {
    setEditandoId(area.id);
    setForm({ codigo: area.codigo, nombre: area.nombre, prefijo: area.prefijo, color: area.color });
    setDialogOpen(true);
  };

  const guardar = async () => {
    if (!form.codigo.trim() || !form.nombre.trim() || !form.prefijo.trim()) { toast.error('Campos requeridos'); return; }
    setGuardando(true);
    try {
      if (editandoId) { await api.put(`/areas/${editandoId}`, form); toast.success('Área actualizada'); }
      else { await api.post('/areas', form); toast.success('Área creada'); }
      setDialogOpen(false); refetch();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Error'); }
    setGuardando(false);
  };

  const toggle = async (area: Area) => {
    await api.put(`/areas/${area.id}`, { activo: !area.activo });
    toast.success(area.activo ? 'Desactivada' : 'Activada'); refetch();
  };

  const desactivar = async (id: number) => {
    await api.delete(`/areas/${id}`);
    toast.success('Área desactivada'); setConfirmarDesactivar(null); refetch();
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col">
      <TopBar title="Admin — Gestión de Áreas" subtitle="Administra las áreas de atención" showBack />
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="font-display font-bold text-lg">Áreas de Atención</h2><p className="text-xs text-text-dim mt-0.5">{areas.length} área{areas.length !== 1 ? 's' : ''}</p></div>
          <Button onClick={abrirCrear} className="bg-primary-700 hover:bg-primary-600 text-white"><HugeiconsIcon icon={PlusSignIcon} className="h-4 w-4 mr-1.5" /> Nueva Área</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {areas.map((area) => (
            <Card key={area.id} className="p-5 bg-surface border-border hover:border-white/15 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm font-mono shrink-0" style={{ background: area.color }}>{area.prefijo}</div>
                  <div><p className="font-display font-bold text-sm">{area.nombre}</p>              <p className="text-[11px] text-text-dim font-mono mt-0.5">{area.codigo}</p></div>
                </div>
                <Badge variant="outline" className={`border text-[10px] font-semibold ${area.activo ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'}`}>{area.activo ? 'Activo' : 'Inactivo'}</Badge>
              </div>
              <div className="flex gap-1.5 items-center text-xs text-text-dim mb-3">
                <span className="font-mono">{area.turnos_espera} en espera</span>
                {area.turno_actual && <><span className="text-white/20">·</span><span>Actual: <span className="font-mono text-white/70">{area.turno_actual.numero_turno}</span></span></>}
              </div>
              <div className="flex gap-1.5 pt-3 border-t border-border">
                {area.activo ? <Button variant="ghost" size="sm" className="h-8 px-2 text-text-dim hover:text-amber-400" onClick={() => toggle(area)}><HugeiconsIcon icon={AlertCircleIcon} className="h-3.5 w-3.5 mr-1" /> Desactivar</Button>
                : <Button variant="ghost" size="sm" className="h-8 px-2 text-text-dim hover:text-emerald-400" onClick={() => toggle(area)}><HugeiconsIcon icon={CheckCircle} className="h-3.5 w-3.5 mr-1" /> Activar</Button>}
                <Button variant="ghost" size="sm" className="h-8 px-2 text-text-dim hover:text-text" onClick={() => abrirEditar(area)}><HugeiconsIcon icon={Edit02Icon} className="h-3.5 w-3.5 mr-1" /> Editar</Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-text-dim hover:text-red-400" onClick={() => setConfirmarDesactivar(area.id)}><HugeiconsIcon icon={Delete02Icon} className="h-3.5 w-3.5 mr-1" /> Eliminar</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-surface border-border text-text max-w-md">
          <DialogHeader><DialogTitle className="font-display font-bold text-lg">{editandoId ? 'Editar Área' : 'Nueva Área'}</DialogTitle><DialogDescription className="text-text-dim text-sm">{editandoId ? 'Actualiza los datos del área.' : 'Crea una nueva área de atención.'}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-text-mid mb-1.5 block">Código *</label><Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="c1" className="bg-[#080c14] border-border text-text font-mono" /></div>
              <div><label className="text-xs text-text-mid mb-1.5 block">Prefijo *</label><Input value={form.prefijo} onChange={(e) => setForm({ ...form, prefijo: e.target.value })} placeholder="C1" className="bg-[#080c14] border-border text-text font-mono" /></div>
            </div>
            <div><label className="text-xs text-text-mid mb-1.5 block">Nombre *</label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Consultorio 1" className="bg-[#080c14] border-border text-text" /></div>
            <div><label className="text-xs text-text-mid mb-1.5 block">Color</label><div className="flex gap-2 flex-wrap">{COLORES.map((c) => (<button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-lg border-2 transition-all ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ background: c }} />))}</div></div>

          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-text-dim">Cancelar</Button>
            <Button onClick={guardar} disabled={guardando} className="bg-primary-700 hover:bg-primary-600 text-white">{guardando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Crear Área'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmarDesactivar !== null} onOpenChange={(o) => !o && setConfirmarDesactivar(null)}>
        <DialogContent className="bg-surface border-border text-text max-w-sm">
          <DialogHeader><DialogTitle className="font-display font-bold text-lg">Desactivar Área</DialogTitle><DialogDescription className="text-text-dim text-sm">¿Estás seguro de desactivar esta área?</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmarDesactivar(null)} className="text-text-dim">Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmarDesactivar && desactivar(confirmarDesactivar)} className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">Desactivar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
