import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { TipoExamen, Area, ConsaludCategoriaArea } from '@/lib/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TopBar } from '@/components/layout/TopBar';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, Edit02Icon, Delete02Icon, CheckCircle, AlertCircleIcon, Settings02Icon, Layers01Icon } from '@hugeicons/core-free-icons';

export function AdminTiposExamenesPage() {
  const [tipos, setTipos] = useState<TipoExamen[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [categoriasConsalud, setCategoriasConsalud] = useState<ConsaludCategoriaArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConsalud, setLoadingConsalud] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: '', codigo: '', area_id: '' });
  const [guardando, setGuardando] = useState(false);
  const [actualizandoMapeoId, setActualizandoMapeoId] = useState<number | null>(null);

  const fetchDatos = () => {
    setLoading(true);
    Promise.all([
      api.get('/tipos-examenes'),
      api.get('/areas'),
      api.get('/consalud/categorias-areas').catch(() => ({ data: [] })),
    ])
      .then(([r1, r2, r3]) => {
        setTipos(r1.data.data || r1.data);
        setAreas(r2.data.data || r2.data);
        setCategoriasConsalud(r3.data.data || r3.data || []);
      })
      .catch(() => toast.error('Error al cargar datos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDatos();
  }, []);

  const abrirCrear = () => {
    setEditandoId(null);
    setForm({ nombre: '', codigo: '', area_id: areas[0]?.id?.toString() || '' });
    setDialogOpen(true);
  };

  const abrirEditar = (t: TipoExamen) => {
    setEditandoId(t.id);
    setForm({ nombre: t.nombre, codigo: t.codigo, area_id: t.area_id.toString() });
    setDialogOpen(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.codigo.trim() || !form.area_id) {
      toast.error('Campos requeridos');
      return;
    }
    setGuardando(true);
    try {
      const data = { nombre: form.nombre, codigo: form.codigo, area_id: parseInt(form.area_id) };
      if (editandoId) {
        await api.put(`/tipos-examenes/${editandoId}`, data);
        toast.success('Tipo de examen actualizado');
      } else {
        await api.post('/tipos-examenes', data);
        toast.success('Tipo de examen creado');
      }
      setDialogOpen(false);
      fetchDatos();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al guardar');
    }
    setGuardando(false);
  };

  const toggleActivo = async (t: TipoExamen) => {
    await api.put(`/tipos-examenes/${t.id}`, { activo: !t.activo });
    toast.success(t.activo ? 'Desactivado' : 'Activado');
    fetchDatos();
  };

  const eliminar = async (id: number) => {
    await api.delete(`/tipos-examenes/${id}`);
    toast.success('Eliminado');
    fetchDatos();
  };

  const cambiarAreaMapeoConsalud = async (categoriaMappingId: number, nuevaAreaId: number) => {
    setActualizandoMapeoId(categoriaMappingId);
    try {
      const res = await api.put(`/consalud/categorias-areas/${categoriaMappingId}`, {
        area_id: nuevaAreaId,
      });
      const mappingActualizado = res.data;
      setCategoriasConsalud((prev) =>
        prev.map((c) => (c.id === categoriaMappingId ? mappingActualizado : c))
      );
      toast.success(`Consultorio actualizado para ${mappingActualizado.nombre}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al actualizar mapeo');
    } finally {
      setActualizandoMapeoId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar
        title="Admin — Exámenes y Mapeos"
        subtitle="Gestiona tipos de examen y asignación de categorías Consalud por consultorio"
        showBack
        backPath="/recepcion"
      />

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <Tabs defaultValue="consalud" className="w-full space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted p-1">
              <TabsTrigger value="consalud" className="text-xs flex items-center gap-1.5 px-3">
                <HugeiconsIcon icon={Settings02Icon} className="h-3.5 w-3.5" />
                Mapeo Categorías Consalud ({categoriasConsalud.length})
              </TabsTrigger>
              <TabsTrigger value="tipos" className="text-xs flex items-center gap-1.5 px-3">
                <HugeiconsIcon icon={Layers01Icon} className="h-3.5 w-3.5" />
                Tipos de Examen ({tipos.length})
              </TabsTrigger>
            </TabsList>

            <Button onClick={abrirCrear} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
              <HugeiconsIcon icon={PlusSignIcon} className="h-4 w-4 mr-1.5" /> Nuevo Tipo Manual
            </Button>
          </div>

          {/* TAB 1: Mapeo de Categorías Consalud */}
          <TabsContent value="consalud" className="space-y-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-display font-bold text-base">Mapeo de Categorías Consalud &rarr; Consultorio</h2>
              <p className="text-xs text-muted-foreground">
                Configura a qué consultorio físico o estación es derivado el paciente según el código de examen recibido desde Consalud Laboral.
              </p>
            </div>

            <Card className="border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border font-medium">
                    <tr>
                      <th className="p-3 w-16">ID Cat.</th>
                      <th className="p-3">Nombre del Examen / Categoría</th>
                      <th className="p-3 w-72">Consultorio / Área Asignada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {categoriasConsalud.map((cat) => (
                      <tr key={cat.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono font-semibold text-primary">#{cat.categoria_exam_id}</td>
                        <td className="p-3">
                          <span className="font-semibold text-foreground">{cat.nombre}</span>
                          {cat.tipo_examen && (
                            <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                              ({cat.tipo_examen.codigo})
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <Select
                            value={String(cat.area_id)}
                            disabled={actualizandoMapeoId === cat.id}
                            onValueChange={(val) => cambiarAreaMapeoConsalud(cat.id, parseInt(val))}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background border-border w-full">
                              <SelectValue placeholder="Seleccionar consultorio" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              {areas.map((a) => (
                                <SelectItem key={a.id} value={String(a.id)} className="text-xs">
                                  <span className="font-bold mr-1.5">{a.prefijo}</span> — {a.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                    {categoriasConsalud.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-muted-foreground">
                          No hay categorías registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 2: Tipos de Examen Estándar */}
          <TabsContent value="tipos" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-base">Catálogo de Tipos de Examen</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{tipos.length} tipo{tipos.length !== 1 ? 's' : ''} registrado{tipos.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tipos.map((t) => (
                <Card key={t.id} className="p-4 bg-card border-border hover:border-foreground/15 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-display font-bold text-sm">{t.nombre}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{t.codigo}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`border text-[10px] font-semibold ${
                        t.activo
                          ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                          : 'border-red-500/30 text-red-700 dark:text-red-400'
                      }`}
                    >
                      {t.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    {t.area ? `${t.area.prefijo} – ${t.area.nombre}` : `Área #${t.area_id}`}
                  </div>
                  <div className="flex gap-1.5 pt-3 border-t border-border">
                    {t.activo ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400"
                        onClick={() => toggleActivo(t)}
                      >
                        <HugeiconsIcon icon={AlertCircleIcon} className="h-3.5 w-3.5 mr-1" /> Desactivar
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-700 dark:text-emerald-400"
                        onClick={() => toggleActivo(t)}
                      >
                        <HugeiconsIcon icon={CheckCircle} className="h-3.5 w-3.5 mr-1" /> Activar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => abrirEditar(t)}
                    >
                      <HugeiconsIcon icon={Edit02Icon} className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground hover:text-red-700 dark:hover:text-red-700 dark:text-red-400"
                      onClick={() => eliminar(t.id)}
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="h-3.5 w-3.5 mr-1" /> Eliminar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg">
              {editandoId ? 'Editar Tipo' : 'Nuevo Tipo de Examen'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Cada tipo de examen se asocia a un consultorio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Nombre</label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Espirometría"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Código</label>
              <Input
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                placeholder="ESP"
                className="bg-background border-border text-foreground font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Consultorio</label>
              <Select value={form.area_id} onValueChange={(v) => setForm({ ...form, area_id: v })}>
                <SelectTrigger className="bg-background border-border text-xs">
                  <SelectValue placeholder="Seleccionar consultorio" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)} className="text-xs">
                      {a.prefijo} – {a.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-muted-foreground">
              Cancelar
            </Button>
            <Button
              onClick={guardar}
              disabled={guardando}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {guardando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
