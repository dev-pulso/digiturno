import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { Area } from '@/lib/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TopBar } from '@/components/layout/TopBar';
import {
  UserCog,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Building2,
} from 'lucide-react';

export interface Colaborador {
  id: number;
  numero_documento: string;
  nombre: string | null;
  rol: 'admin' | 'recepcion' | 'medico';
  area_id_predeterminada: number | null;
  puede_rotar: boolean;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  area_predeterminada?: Area | null;
}

interface ColaboradorFormData {
  numero_documento: string;
  nombre: string;
  rol: 'admin' | 'recepcion' | 'medico';
  area_id_predeterminada: string;
  puede_rotar: boolean;
  activo: boolean;
}

const formInicial: ColaboradorFormData = {
  numero_documento: '',
  nombre: '',
  rol: 'medico',
  area_id_predeterminada: '',
  puede_rotar: true,
  activo: true,
};

export function AdminPersonalPage() {
  const [personal, setPersonal] = useState<Colaborador[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('todos');

  // Modal Crear/Editar
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<ColaboradorFormData>(formInicial);
  const [guardando, setGuardando] = useState(false);

  // Modal Confirmar Eliminar
  const [confirmarEliminar, setConfirmarEliminar] = useState<Colaborador | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const fetchAreas = useCallback(async () => {
    try {
      const res = await api.get('/areas');
      const data: Area[] = res.data.data || res.data;
      setAreas(data.filter((a) => a.activo));
    } catch {
      toast.error('Error al cargar consultorios');
    }
  }, []);

  const fetchPersonal = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (busqueda.trim()) params.q = busqueda.trim();
      if (filtroRol !== 'todos') params.rol = filtroRol;

      const res = await api.get<Colaborador[]>('/admin/personal', { params });
      setPersonal(res.data);
    } catch {
      toast.error('Error al cargar lista de personal');
    } finally {
      setLoading(false);
    }
  }, [busqueda, filtroRol]);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  useEffect(() => {
    fetchPersonal();
  }, [fetchPersonal]);

  const abrirCrear = () => {
    setEditandoId(null);
    setForm({
      ...formInicial,
      area_id_predeterminada: areas.length > 0 ? String(areas[0].id) : '',
    });
    setDialogOpen(true);
  };

  const abrirEditar = (colaborador: Colaborador) => {
    setEditandoId(colaborador.id);
    setForm({
      numero_documento: colaborador.numero_documento,
      nombre: colaborador.nombre || '',
      rol: colaborador.rol,
      area_id_predeterminada: colaborador.area_id_predeterminada
        ? String(colaborador.area_id_predeterminada)
        : '',
      puede_rotar: colaborador.puede_rotar,
      activo: colaborador.activo,
    });
    setDialogOpen(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numero_documento.trim()) {
      toast.error('El número de documento es requerido');
      return;
    }

    setGuardando(true);
    try {
      const payload: Record<string, any> = {
        numero_documento: form.numero_documento.trim(),
        nombre: form.nombre.trim() || null,
        rol: form.rol,
        puede_rotar: form.puede_rotar,
        activo: form.activo,
        area_id_predeterminada:
          form.rol === 'medico' && form.area_id_predeterminada
            ? parseInt(form.area_id_predeterminada, 10)
            : null,
      };

      if (editandoId) {
        await api.put(`/admin/personal/${editandoId}`, payload);
        toast.success('Colaborador actualizado exitosamente');
      } else {
        await api.post('/admin/personal', payload);
        toast.success('Colaborador registrado exitosamente');
      }

      setDialogOpen(false);
      fetchPersonal();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.mensaje ||
        'Error al procesar la solicitud';
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  const toggleEstado = async (colaborador: Colaborador) => {
    try {
      await api.patch(`/admin/personal/${colaborador.id}/toggle-activo`);
      toast.success(
        colaborador.activo
          ? `Acceso desactivado para ${colaborador.nombre || colaborador.numero_documento}`
          : `Acceso reactivado para ${colaborador.nombre || colaborador.numero_documento}`
      );
      fetchPersonal();
    } catch (err: any) {
      toast.error('No se pudo cambiar el estado');
    }
  };

  const handleEliminar = async () => {
    if (!confirmarEliminar) return;
    setEliminando(true);
    try {
      await api.delete(`/admin/personal/${confirmarEliminar.id}`);
      toast.success('Colaborador eliminado del sistema');
      setConfirmarEliminar(null);
      fetchPersonal();
    } catch (err: any) {
      toast.error('No se pudo eliminar el colaborador');
    } finally {
      setEliminando(false);
    }
  };

  const getRolBadge = (rol: string) => {
    switch (rol) {
      case 'admin':
        return (
          <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 gap-1 font-semibold">
            <ShieldCheck className="h-3 w-3" /> Administrador
          </Badge>
        );
      case 'medico':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-semibold">
            <Stethoscope className="h-3 w-3" /> Médico
          </Badge>
        );
      case 'recepcion':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1 font-semibold">
            <Users className="h-3 w-3" /> Recepción
          </Badge>
        );
      default:
        return <Badge variant="outline">{rol}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar
        title="Admin — Gestión de Personal"
        subtitle="Administra colaboradores, roles y asignación de consultorios"
        showBack
        backPath="/recepcion"
      />

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Cabecera y Controles */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-xl flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" /> Colaboradores Registrados
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {personal.length} colaborador{personal.length !== 1 ? 'es' : ''} en el sistema
            </p>
          </div>

          <Button onClick={abrirCrear} className="gap-2 font-semibold">
            <Plus className="h-4 w-4" /> Registrar Colaborador
          </Button>
        </div>

        {/* Barra de Filtros */}
        <Card className="p-4 bg-card border-border shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cédula o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
            <div className="sm:col-span-4 flex gap-2">
              <Select value={filtroRol} onValueChange={setFiltroRol}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los roles</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="medico">Médico</SelectItem>
                  <SelectItem value="recepcion">Recepción</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchPersonal}
                className="h-10 w-10 shrink-0"
                title="Actualizar lista"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Lista de Colaboradores */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Cargando lista de colaboradores...</p>
          </div>
        ) : personal.length === 0 ? (
          <Card className="p-12 text-center bg-card border-border">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold text-base">No se encontraron colaboradores</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              No hay colaboradores que coincidan con los criterios de búsqueda o aún no has registrado ninguno.
            </p>
            <Button onClick={abrirCrear} variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Registrar el primero
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personal.map((colaborador) => (
              <Card
                key={colaborador.id}
                className={`p-5 bg-card border-border flex flex-col justify-between transition-all hover:border-primary/40 shadow-xs ${
                  !colaborador.activo ? 'opacity-60 bg-muted/30' : ''
                }`}
              >
                <div className="space-y-3">
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          colaborador.rol === 'admin'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : colaborador.rol === 'medico'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {colaborador.rol === 'admin' ? (
                          <ShieldCheck className="h-5 w-5" />
                        ) : colaborador.rol === 'medico' ? (
                          <Stethoscope className="h-5 w-5" />
                        ) : (
                          <Users className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">
                          {colaborador.nombre || 'Colaborador Consalud'}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          CC {colaborador.numero_documento}
                        </p>
                      </div>
                    </div>
                    {getRolBadge(colaborador.rol)}
                  </div>

                  {/* Detalles específicos del rol */}
                  <div className="pt-2 border-t border-border/60 text-xs space-y-1.5">
                    {colaborador.rol === 'medico' ? (
                      <>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span>Consultorio predeterminado:</span>
                          <span className="font-semibold text-foreground">
                            {colaborador.area_predeterminada?.nombre || 'Ninguno asignado'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>Rotación:</span>
                          <span className="font-medium text-foreground">
                            {colaborador.puede_rotar ? 'Permitida libremente' : 'Solo consultorio asignado'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Módulo:</span>
                        <span className="font-medium text-foreground">
                          {colaborador.rol === 'admin' ? 'Acceso Total + Configuración' : 'Módulo de Recepción'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pie de tarjeta con Estado y Acciones */}
                <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleEstado(colaborador)}
                    className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {colaborador.activo ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                        <XCircle className="h-3.5 w-3.5" /> Inactivo
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => abrirEditar(colaborador)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Editar colaborador"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmarEliminar(colaborador)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Eliminar colaborador"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Colaborador */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold">
              {editandoId ? 'Editar Colaborador' : 'Registrar Nuevo Colaborador'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Asigna el rol en Digiturno y el consultorio correspondiente para redirección inteligente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGuardar} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="numero_documento" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cédula o Documento de Identidad *
              </Label>
              <Input
                id="numero_documento"
                value={form.numero_documento}
                onChange={(e) => setForm({ ...form, numero_documento: e.target.value })}
                placeholder="ej. 1065584737"
                required
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Debe coincidir con la identificación del usuario en Consalud.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nombre" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nombre o Referencia (Opcional)
              </Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="ej. Dr. Juan Pérez"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rol" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rol en el Sistema *
              </Label>
              <Select
                value={form.rol}
                onValueChange={(val: 'admin' | 'recepcion' | 'medico') =>
                  setForm({ ...form, rol: val })
                }
              >
                <SelectTrigger id="rol">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medico">Médico (Atención en Consultorio)</SelectItem>
                  <SelectItem value="recepcion">Recepción (Gestión de Pacientes y Turnos)</SelectItem>
                  <SelectItem value="admin">Administrador (Control Total y Configuración)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.rol === 'medico' && (
              <div className="space-y-4 p-3 bg-muted/40 rounded-lg border border-border">
                <div className="space-y-1.5">
                  <Label htmlFor="area" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Consultorio Predeterminado
                  </Label>
                  <Select
                    value={form.area_id_predeterminada}
                    onValueChange={(val) => setForm({ ...form, area_id_predeterminada: val })}
                  >
                    <SelectTrigger id="area">
                      <SelectValue placeholder="Seleccionar consultorio" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                            {a.nombre} ({a.prefijo})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    El médico será redirigido automáticamente a este consultorio al iniciar sesión.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="puede_rotar"
                    checked={form.puede_rotar}
                    onChange={(e) => setForm({ ...form, puede_rotar: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <Label htmlFor="puede_rotar" className="text-xs font-medium cursor-pointer">
                    Permitir rotar libremente a otros consultorios
                  </Label>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="activo"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <Label htmlFor="activo" className="text-xs font-medium cursor-pointer">
                Colaborador con acceso activo al sistema
              </Label>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={guardando}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando} className="font-semibold">
                {guardando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                  </>
                ) : editandoId ? (
                  'Guardar Cambios'
                ) : (
                  'Registrar Colaborador'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmación de Eliminación */}
      <Dialog open={!!confirmarEliminar} onOpenChange={(open) => !open && setConfirmarEliminar(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive font-bold flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Eliminar Colaborador
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong className="text-foreground">
                {confirmarEliminar?.nombre || confirmarEliminar?.numero_documento}
              </strong>
              ? Perderá su rol y asignación en Digiturno.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmarEliminar(null)}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleEliminar}
              disabled={eliminando}
              className="font-semibold"
            >
              {eliminando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
