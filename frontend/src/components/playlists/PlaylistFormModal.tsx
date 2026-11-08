import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/stores/toastStore';
import { errorMessage } from '@/lib/errors';
import type { Playlist } from '@/types';

interface PlaylistFormModalProps {
  open: boolean;
  onClose: () => void;
  playlist?: Playlist | null;
  onSubmit: (input: {
    name: string;
    description: string | null;
    cover_url: string | null;
  }) => Promise<void>;
  onUploadCover?: (file: File, playlistId: string) => Promise<string>;
}

export function PlaylistFormModal({
  open,
  onClose,
  playlist,
  onSubmit,
  onUploadCover,
}: PlaylistFormModalProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(playlist?.name ?? '');
    setDescription(playlist?.description ?? '');
    setFile(null);
    setPreview(null);
  }, [open, playlist]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSave = async () => {
    const cleanName = name.trim();
    if (!cleanName) return;
    setSaving(true);
    try {
      let coverUrl = playlist?.cover_url ?? null;
      if (file && playlist && user && onUploadCover) {
        coverUrl = await onUploadCover(file, playlist.id);
      } else if (file && !playlist) {
        // A playlist must exist before a cover can be uploaded. The cover can
        // be added from the playlist page immediately afterwards.
        toast.info('Playlist created', 'Open it to add a custom cover.');
      }
      await onSubmit({
        name: cleanName,
        description: description.trim() || null,
        cover_url: coverUrl,
      });
      onClose();
    } catch (error) {
      toast.error('Could not save playlist', errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={playlist ? 'Edit playlist' : 'New playlist'}
      description={
        playlist
          ? 'Update the name, description or cover.'
          : 'Give your collection a name. You can refine it later.'
      }
      size="sm"
      footer={
        <div className="flex justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} loading={saving} disabled={!name.trim()}>
            {playlist ? 'Save changes' : 'Create playlist'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {playlist && (
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-ink-800">
              {preview || playlist.cover_url ? (
                <img
                  src={preview ?? playlist.cover_url ?? ''}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-bone-600">
                  <ImagePlus className="h-5 w-5" />
                </div>
              )}
            </div>
            <div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileRef.current?.click()}
                type="button"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Upload cover
              </Button>
              {preview && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="ml-2 inline-flex items-center gap-1 text-[11px] text-bone-500 hover:text-bone-200"
                >
                  <X className="h-3 w-3" /> Remove
                </button>
              )}
              <p className="mt-2 text-[10.5px] text-bone-600">JPEG, PNG or WebP · max 5 MB</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
        )}

        <Input
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Late night listening"
          maxLength={80}
          autoFocus
        />

        <label className="block">
          <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-bone-500">
            Description
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional — a note for your future self."
            maxLength={300}
            rows={3}
            className="w-full resize-none rounded-xl border border-white/[0.09] bg-white/[0.035] px-3.5 py-3 text-[13px] leading-relaxed text-bone-100 placeholder:text-bone-600 transition-colors focus:border-white/[0.2] focus:bg-white/[0.05] focus:outline-none"
          />
        </label>

        {saving && (
          <p className="flex items-center gap-2 text-[11px] text-bone-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving…
          </p>
        )}
      </div>
    </Modal>
  );
}
