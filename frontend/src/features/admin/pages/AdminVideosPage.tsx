import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Upload01Icon, Delete02Icon, EyeIcon, EyeOffIcon, PlusSignIcon, FileVideoIcon } from '@hugeicons/core-free-icons';

export function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitulo, setUploadTitulo] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVideos = useCallback(() => {
    setLoading(true);
    api.get('/videos').then((res) => setVideos(res.data.data || res.data)).catch(() => toast.error('Error al cargar videos')).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const handleUpload = async () => {
    if (!uploadTitulo.trim()) { toast.error('Ingresa un título'); return; }
    if (!uploadFile) { toast.error('Selecciona un archivo'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('titulo', uploadTitulo.trim());
      form.append('video', uploadFile);
      await api.post('/videos', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Video subido');
      setUploadOpen(false); setUploadTitulo(''); setUploadFile(null); fetchVideos();
    } catch { toast.error('Error al subir video'); }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/videos/${id}`); toast.success('Video eliminado'); setDeleteConfirm(null); fetchVideos(); }
    catch { toast.error('Error al eliminar'); }
  };

  const handleToggle = async (id: number) => {
    try { await api.post(`/videos/${id}/toggle`); fetchVideos(); } catch { toast.error('Error'); }
  };

  const moveItem = (from: number, to: number) => {
    const newVideos = [...videos];
    const [moved] = newVideos.splice(from, 1);
    newVideos.splice(to, 0, moved);
    setVideos(newVideos);
  };

  const handleReorder = async () => {
    try { await api.post('/videos/reordenar', { ids: videos.map(v => v.id) }); toast.success('Orden actualizado'); }
    catch { toast.error('Error'); }
  };

  const moveUp = (i: number) => { if (i === 0) return; moveItem(i, i - 1); setTimeout(handleReorder, 100); };
  const moveDown = (i: number) => { if (i === videos.length - 1) return; moveItem(i, i + 1); setTimeout(handleReorder, 100); };

  const formatSize = (bytes: number) => bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col">
      <TopBar title="Admin — Gestión de Videos" subtitle="Sube y organiza videos corporativos" showBack />
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="font-display font-bold text-lg">Videos Corporativos</h2><p className="text-xs text-text-dim mt-0.5">{videos.length} video{videos.length !== 1 ? 's' : ''}</p></div>
          <Button onClick={() => setUploadOpen(true)} className="bg-primary-700 hover:bg-primary-600 text-white"><HugeiconsIcon icon={Upload01Icon} className="h-4 w-4 mr-1.5" /> Subir Video</Button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-text-dim"><div className="text-3xl mb-3 animate-pulse"><HugeiconsIcon icon={FileVideoIcon} className="h-6 w-6" /></div><p className="text-sm">Cargando...</p></div>
        ) : videos.length === 0 ? (
          <Card className="p-16 bg-surface border-border text-center"><div className="text-5xl mb-4 opacity-30"><HugeiconsIcon icon={FileVideoIcon} className="h-16 w-16" /></div><h3 className="font-display font-bold text-lg text-text-mid mb-2">Sin videos</h3><p className="text-sm text-text-dim mb-6">Sube tu primer video corporativo.</p><Button onClick={() => setUploadOpen(true)} className="bg-primary-700 hover:bg-primary-600 text-white"><HugeiconsIcon icon={PlusSignIcon} className="h-4 w-4 mr-1.5" /> Subir Video</Button></Card>
        ) : (
          <div className="space-y-3">
            {videos.map((video, i) => (
              <Card key={video.id} className="p-4 bg-surface border-border flex items-center gap-4 hover:border-white/15 transition-colors">
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button onClick={() => moveUp(i)} disabled={i === 0} className="text-text-dim hover:text-text disabled:opacity-20 p-0.5">▲</button>
                  <span className="font-mono text-[11px] text-text-dim text-center">{i + 1}</span>
                  <button onClick={() => moveDown(i)} disabled={i === videos.length - 1} className="text-text-dim hover:text-text disabled:opacity-20 p-0.5">▼</button>
                </div>
                <div className="w-24 h-14 rounded-lg bg-surface2 border border-border flex items-center justify-center shrink-0"><HugeiconsIcon icon={FileVideoIcon} className="h-6 w-6 text-text-dim" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{video.titulo}</p>
                  <div className="flex gap-3 mt-1 text-[11px] text-text-dim"><span>{formatSize(video.tamano)}</span><span className="font-mono">{video.nombre_original}</span></div>
                </div>
                <Badge variant="outline" className={`border text-[10px] font-semibold ${video.activo ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'}`}>{video.activo ? 'Activo' : 'Inactivo'}</Badge>
                <div className="flex gap-1.5 shrink-0">
                  {video.activo ? <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-text-dim hover:text-amber-400" onClick={() => handleToggle(video.id)}><HugeiconsIcon icon={EyeOffIcon} className="h-4 w-4" /></Button>
                  : <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-text-dim hover:text-emerald-400" onClick={() => handleToggle(video.id)}><HugeiconsIcon icon={EyeIcon} className="h-4 w-4" /></Button>}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-text-dim hover:text-red-400" onClick={() => setDeleteConfirm(video.id)}><HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" /></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="bg-surface border-border text-text max-w-md">
          <DialogHeader><DialogTitle className="font-display font-bold text-lg">Subir Video</DialogTitle><DialogDescription className="text-text-dim text-sm">Formatos: MP4, WebM, OGG. Máximo 200MB.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-xs text-text-mid mb-1.5 block">Título</label><Input value={uploadTitulo} onChange={(e) => setUploadTitulo(e.target.value)} placeholder="Video institucional" className="bg-[#080c14] border-border text-text" /></div>
            <div>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary-500/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                {uploadFile ? <div><HugeiconsIcon icon={FileVideoIcon} className="h-8 w-8 mx-auto mb-2 text-primary-400" /><p className="text-sm font-medium">{uploadFile.name}</p><p className="text-xs text-text-dim mt-1">{formatSize(uploadFile.size)}</p></div>
                : <div><HugeiconsIcon icon={Upload01Icon} className="h-8 w-8 mx-auto mb-2 text-text-dim" /><p className="text-sm text-text-mid">Haz clic o arrastra un video</p><p className="text-xs text-text-dim mt-1">MP4, WebM — hasta 200MB</p></div>}
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadOpen(false)} className="text-text-dim">Cancelar</Button>
            <Button onClick={handleUpload} disabled={uploading || !uploadTitulo.trim() || !uploadFile} className="bg-primary-700 hover:bg-primary-600 text-white">{uploading ? 'Subiendo...' : 'Subir Video'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm !== null} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="bg-surface border-border text-text max-w-sm">
          <DialogHeader><DialogTitle className="font-display font-bold text-lg">Eliminar Video</DialogTitle><DialogDescription className="text-text-dim text-sm">¿Estás seguro de eliminar este video?</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="text-text-dim">Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
