import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { Area, Paciente, Turno } from '@/lib/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { HugeiconsIcon } from '@hugeicons/react';
import { ChevronLeftIcon, Search01Icon, UserCheck01Icon, PrinterIcon, ArrowLeft01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';

interface StepState {
  step: 'document' | 'confirm' | 'area' | 'done';
  documentType: string;
  documentNumber: string;
  patient: Paciente | null;
  areaId: number | null;
  turn: Turno | null;
}

export function KioskPage() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<Area[]>([]);
  const [state, setState] = useState<StepState>({
    step: 'document',
    documentType: 'CC',
    documentNumber: '',
    patient: null,
    areaId: null,
    turn: null,
  });
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/areas').then((res) => {
      const data: Area[] = res.data.data || res.data;
      setAreas(data);
    }).catch(() => {});
    setTimeout(() => docInputRef.current?.focus(), 500);
  }, []);

  const handleSearchDoc = async () => {
    if (!state.documentNumber.trim()) {
      toast.error('Ingresa tu número de documento');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/pacientes/buscar-por-documento', {
        params: {
          numero_documento: state.documentNumber.trim(),
        },
      });
      const patient: Paciente = res.data.data || res.data;
      setState(prev => ({ ...prev, patient, step: 'confirm' }));
      setNewName('');
    } catch {
      // Patient not found, go to registration
      setState(prev => ({ ...prev, patient: null, step: 'confirm' }));
      setNewName('');
    }
    setLoading(false);
  };

  const handleRegisterDoc = async () => {
    if (!newName.trim()) {
      toast.error('Ingresa tu nombre completo');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/pacientes', {
        tipo_documento: state.documentType,
        numero_documento: state.documentNumber.trim(),
        nombre_completo: newName.trim(),
      });
      const patient: Paciente = res.data.data || res.data;
      setState(prev => ({ ...prev, patient, step: 'area' }));
    } catch {
      toast.error('Error al registrar');
    }
    setLoading(false);
  };

  const handleCreateTurn = async () => {
    if (!state.areaId || !state.patient) return;
    setLoading(true);
    try {
      const res = await api.post('/turnos', {
        area_id: state.areaId,
        paciente_id: state.patient.id,
        nombre_paciente: state.patient.nombre_completo,
        origen: 'kiosco',
      });
      const turn: Turno = res.data.data || res.data;
      setState(prev => ({ ...prev, turn, step: 'done' }));
      toast.success(`Turno ${turn.numero_turno} asignado`);
    } catch {
      toast.error('Error al crear turno');
    }
    setLoading(false);
  };

  const resetKiosk = () => {
    setState({
      step: 'document',
      documentType: 'CC',
      documentNumber: '',
      patient: null,
      areaId: null,
      turn: null,
    });
    setNewName('');
    setTimeout(() => docInputRef.current?.focus(), 300);
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col">
      {/* Touch-optimized header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-12 w-12 text-text-dim hover:text-text"
          >
            <HugeiconsIcon icon={ChevronLeftIcon} className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-xl">Kiosco de Autoservicio</h1>
            <p className="text-sm text-text-dim">Obtén tu turno rápido</p>
          </div>
        </div>
        <div className="w-14 h-14 bg-gradient-to-br from-primary-700 to-indigo-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-primary-700/30">
          🏥
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        {state.step === 'document' && (
          <Card className="w-full max-w-md p-10 bg-surface border-border">
            <div className="text-center mb-8">
              <h2 className="font-display font-bold text-2xl mb-2">Bienvenido</h2>
              <p className="text-text-dim text-sm">Ingresa tu documento para obtener un turno</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-mid mb-2 block">Tipo de Documento</label>
                <div className="flex gap-3">
                  {['CC', 'CE', 'NIT'].map((type) => (
                    <Button
                      key={type}
                      size="lg"
                      variant={state.documentType === type ? 'default' : 'outline'}
                      onClick={() => setState(prev => ({ ...prev, documentType: type }))}
                      className={`flex-1 h-14 text-base ${
                        state.documentType === type
                          ? 'bg-primary-700 text-white border-primary-700'
                          : 'border-border text-text-mid'
                      }`}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-text-mid mb-2 block">Número de Documento</label>
                <Input
                  ref={docInputRef}
                  value={state.documentNumber}
                  onChange={(e) => setState(prev => ({ ...prev, documentNumber: e.target.value }))}
                  placeholder="12345678"
                  className="h-14 text-lg bg-[#080c14] border-border text-center tracking-widest"
                  maxLength={15}
                  inputMode="numeric"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchDoc()}
                />
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-base bg-primary-700 hover:bg-primary-600 text-white mt-2"
                onClick={handleSearchDoc}
                disabled={loading || !state.documentNumber.trim()}
              >
                {loading ? 'Buscando...' : 'Buscar'}
                <HugeiconsIcon icon={Search01Icon} className="h-5 w-5 ml-2" />
              </Button>
            </div>

            <p className="text-center text-xs text-text-dim mt-6">
              Al usar este kiosco aceptas nuestros términos y condiciones
            </p>
          </Card>
        )}

        {state.step === 'confirm' && (
          <Card className="w-full max-w-md p-10 bg-surface border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setState(prev => ({ ...prev, step: 'document' }))}
              className="text-text-dim mb-4 -ml-2"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4 mr-1" /> Volver
            </Button>

            <div className="text-center mb-8">
              <div className="text-5xl mb-4">{state.patient ? '👤' : '📝'}</div>
              <h2 className="font-display font-bold text-2xl mb-2">
                {state.patient ? '¿Eres tú?' : 'Regístrate'}
              </h2>
              <p className="text-text-dim text-sm">
                {state.patient
                  ? 'Confirma tu identidad para continuar'
                  : 'No encontramos tu documento. Regístrate para continuar.'}
              </p>
            </div>

            {state.patient ? (
              <div className="space-y-6">
                <div className="bg-[#080c14] border border-border rounded-xl p-5 text-center">
                  <p className="font-display font-bold text-xl">{state.patient.nombre_completo}</p>
                  <p className="text-text-dim text-sm mt-1">
                    {state.patient.tipo_documento} {state.patient.numero_documento}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 h-14 text-base border-border text-text-dim"
                    onClick={() => setState(prev => ({ ...prev, step: 'document' }))}
                  >
                    No soy yo
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 h-14 text-base bg-primary-700 hover:bg-primary-600 text-white"
                    onClick={() => setState(prev => ({ ...prev, step: 'area' }))}
                  >
                    Sí, soy yo
                    <HugeiconsIcon icon={UserCheck01Icon} className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-mid mb-2 block">Nombre Completo</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej: Juan Pérez García"
                    className="h-14 text-base bg-[#080c14] border-border"
                    maxLength={50}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleRegisterDoc()}
                  />
                </div>

                <Button
                  size="lg"
                  className="w-full h-14 text-base bg-primary-700 hover:bg-primary-600 text-white"
                  onClick={handleRegisterDoc}
                  disabled={loading || !newName.trim()}
                >
                  {loading ? 'Registrando...' : 'Registrar y Continuar'}
                </Button>
              </div>
            )}
          </Card>
        )}

        {state.step === 'area' && (
          <Card className="w-full max-w-md p-10 bg-surface border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setState(prev => ({ ...prev, step: 'confirm' }))}
              className="text-text-dim mb-4 -ml-2"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4 mr-1" /> Volver
            </Button>

            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🏥</div>
              <h2 className="font-display font-bold text-2xl mb-2">Selecciona un Área</h2>
              <p className="text-text-dim text-sm">
                {state.patient?.nombre_completo}, elige el servicio que necesitas
              </p>
            </div>

            <div className="space-y-3">
              {areas.map((area) => (
                <Button
                  key={area.id}
                  size="lg"
                  variant={state.areaId === area.id ? 'default' : 'outline'}
                  onClick={() => setState(prev => ({ ...prev, areaId: area.id }))}
                  className={`w-full h-16 text-base justify-start px-5 ${
                    state.areaId === area.id
                      ? 'text-white font-bold'
                      : 'border-border text-text'
                  }`}
                  style={state.areaId === area.id ? { background: area.color, borderColor: area.color } : {}}
                >
                  <span className="w-3 h-3 rounded-full mr-3 shrink-0" style={{ background: state.areaId === area.id ? 'white' : area.color }} />
                  <span className="font-mono text-sm mr-2 opacity-60">{area.prefijo}</span>
                  <span>{area.nombre}</span>
                </Button>
              ))}
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-base bg-primary-700 hover:bg-primary-600 text-white mt-6"
              onClick={handleCreateTurn}
              disabled={loading || !state.areaId}
            >
              {loading ? 'Generando...' : 'Obtener mi Turno'}
              <HugeiconsIcon icon={PrinterIcon} className="h-5 w-5 ml-2" />
            </Button>
          </Card>
        )}

        {state.step === 'done' && state.turn && (
          <Card className="w-full max-w-md p-10 bg-surface border-border text-center">
            <div className="text-6xl mb-4 text-emerald-400">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="font-display font-bold text-2xl mb-2">¡Turno Asignado!</h2>
            <p className="text-text-dim text-sm mb-8">Tu turno ha sido generado exitosamente</p>

            <div className="bg-[#080c14] border border-border rounded-2xl p-8 mb-8">
              <p className="font-mono text-xs text-text-dim uppercase tracking-widest mb-4">Tu turno</p>
              <p
                className="font-display font-extrabold text-6xl tracking-tight mb-4"
                style={{ color: areas.find(a => a.id === state.turn!.area_id)?.color || '#044B84' }}
              >
                {state.turn.numero_turno}
              </p>
              <p className="text-lg font-medium">{state.turn.nombre_paciente}</p>
              <p className="text-sm text-text-dim mt-2">
                {areas.find(a => a.id === state.turn!.area_id)?.nombre || ''}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full h-14 text-base bg-primary-700 hover:bg-primary-600 text-white"
                onClick={resetKiosk}
              >
                Atender Siguiente Paciente
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-base border-border text-text-dim"
                onClick={() => navigate('/')}
              >
                Volver al Inicio
              </Button>
            </div>
          </Card>
        )}
      </main>

      {/* Footer timer for auto-reset on idle */}
      {state.step !== 'document' && state.step !== 'done' && (
        <footer className="text-center py-4 text-xs text-text-dim border-t border-white/5">
          <button onClick={resetKiosk} className="hover:text-text transition-colors">
            ← Inicio
          </button>
        </footer>
      )}
    </div>
  );
}
