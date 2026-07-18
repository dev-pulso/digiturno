import { useState, useEffect, useCallback, useRef } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '@/lib/api-client';
import { Video } from '@/lib/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TopBar } from '@/components/layout/TopBar';
import { HugeiconsIcon } from '@hugeicons/react';
import { GripVertical } from 'lucide-react';
import { Upload01Icon, Delete02Icon, EyeIcon, EyeOffIcon, PlusSignIcon, FileVideoIcon } from '@hugeicons/core-free-icons';

interface SortableVideoItemProps {
  video: Video;
  index: number;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  formatSize: (bytes: number) => string;
}

function SortableVideoItem({ video, index, onToggle, onDelete, formatSize }: SortableVideoItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: video.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 bg-card border-border flex flex-col gap-3 hover:border-foreground/15 transition-colors ${isDragging ? 'z-10 opacity-80 shadow-xl border-primary/50' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">#{index + 1}</span>
        <button
          type="button"
          className="h-9 w-9 shrink-0 rounded-md border border-border bg-accent text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-grab active:cursor-grabbing flex items-center justify-center"
          aria-label={`Arrastrar ${video.titulo}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-start gap-3 min-w-0">
        <div className="w-24 h-14 rounded-lg bg-accent border border-border flex items-center justify-center shrink-0">
          <HugeiconsIcon icon={FileVideoIcon} className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{video.titulo}</p>
          <div className="mt-1 text-[11px] text-muted-foreground min-w-0">
            <span>{formatSize(video.tamano)}</span>
            <span className="font-mono truncate block">{video.nombre_original}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className={`border text-[10px] font-semibold shrink-0 ${video.activo ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'border-red-500/30 text-red-700 dark:text-red-400'}`}>
          {video.activo ? 'Activo' : 'Inactivo'}
        </Badge>

        <div className="flex gap-1.5 shrink-0">
          {video.activo ? (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400" onClick={() => onToggle(video.id)}>
              <HugeiconsIcon icon={EyeOffIcon} className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-700 dark:text-emerald-400" onClick={() => onToggle(video.id)}>
              <HugeiconsIcon icon={EyeIcon} className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-700 dark:hover:text-red-700 dark:text-red-400" onClick={() => onDelete(video.id)}>
            <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitulo, setUploadTitulo] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchVideos = useCallback(() => {
    setLoading(true);
    api.get('/videos')
      .then((res) => setVideos(res.data.data || res.data))
      .catch(() => toast.error('Error al cargar videos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchVideos);
  }, [fetchVideos]);

  const handleUpload = async () => {
    if (!uploadTitulo.trim()) { toast.error('Ingresa un titulo'); return; }
    if (!uploadFile) { toast.error('Selecciona un archivo'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('titulo', uploadTitulo.trim());
      form.append('video', uploadFile);
      await api.post('/videos', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Video subido');
      setUploadOpen(false);
      setUploadTitulo('');
      setUploadFile(null);
      fetchVideos();
    } catch {
      toast.error('Error al subir video');
    }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/videos/${id}`);
      toast.success('Video eliminado');
      setDeleteConfirm(null);
      fetchVideos();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await api.post(`/videos/${id}/toggle`);
      fetchVideos();
    } catch {
      toast.error('Error');
    }
  };

  const persistOrder = async (orderedVideos: Video[], previousVideos: Video[]) => {
    try {
      await api.post('/videos/reordenar', { ids: orderedVideos.map((video) => video.id) });
      toast.success('Orden actualizado');
    } catch {
      setVideos(previousVideos);
      toast.error('Error al actualizar el orden');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = videos.findIndex((video) => video.id === active.id);
    const newIndex = videos.findIndex((video) => video.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previousVideos = videos;
    const orderedVideos = arrayMove(videos, oldIndex, newIndex);
    setVideos(orderedVideos);
    void persistOrder(orderedVideos, previousVideos);
  };

  const formatSize = (bytes: number) => bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar title="Admin - Gestion de Videos" subtitle="Sube y organiza videos corporativos" showBack backPath="/recepcion" />
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-lg">Videos Corporativos</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{videos.length} video{videos.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={() => setUploadOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <HugeiconsIcon icon={Upload01Icon} className="h-4 w-4 mr-1.5" /> Subir Video
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-3xl mb-3 animate-pulse"><HugeiconsIcon icon={FileVideoIcon} className="h-6 w-6" /></div>
            <p className="text-sm">Cargando...</p>
          </div>
        ) : videos.length === 0 ? (
          <Card className="p-16 bg-card border-border text-center">
            <div className="text-5xl mb-4 opacity-30"><HugeiconsIcon icon={FileVideoIcon} className="h-16 w-16" /></div>
            <h3 className="font-display font-bold text-lg text-muted-foreground mb-2">Sin videos</h3>
            <p className="text-sm text-muted-foreground mb-6">Sube tu primer video corporativo.</p>
            <Button onClick={() => setUploadOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <HugeiconsIcon icon={PlusSignIcon} className="h-4 w-4 mr-1.5" /> Subir Video
            </Button>
          </Card>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={videos.map((video) => video.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {videos.map((video, i) => (
                  <SortableVideoItem
                    key={video.id}
                    video={video}
                    index={i}
                    onToggle={handleToggle}
                    onDelete={setDeleteConfirm}
                    formatSize={formatSize}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg">Subir Video</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">Formatos: MP4, WebM, OGG. Maximo 200MB.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Titulo</label>
              <Input value={uploadTitulo} onChange={(e) => setUploadTitulo(e.target.value)} placeholder="Video institucional" className="bg-background border-border text-foreground" />
            </div>
            <div>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                {uploadFile ? (
                  <div>
                    <HugeiconsIcon icon={FileVideoIcon} className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">{uploadFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatSize(uploadFile.size)}</p>
                  </div>
                ) : (
                  <div>
                    <HugeiconsIcon icon={Upload01Icon} className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Haz clic o arrastra un video</p>
                    <p className="text-xs text-muted-foreground mt-1">MP4, WebM - hasta 200MB</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadOpen(false)} className="text-muted-foreground">Cancelar</Button>
            <Button onClick={handleUpload} disabled={uploading || !uploadTitulo.trim() || !uploadFile} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {uploading ? 'Subiendo...' : 'Subir Video'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg">Eliminar Video</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">Seguro que quieres eliminar este video?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="text-muted-foreground">Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30 hover:bg-red-500/30">Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
