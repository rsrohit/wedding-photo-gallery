import {
  Camera,
  Download,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  RefreshCw,
  Shield,
  Trash2,
  Upload
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  Photo,
  deletePhoto,
  fetchPhotos,
  hidePhoto,
  uploadPhoto
} from './lib/api';
import {
  MAX_PHOTO_SIZE_BYTES,
  normalizeUploaderName,
  validatePhotoFile
} from './shared/photoValidation';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const eventSlug = import.meta.env.VITE_EVENT_SLUG || 'wedding';
const eventTitle = import.meta.env.VITE_EVENT_TITLE || 'Wedding Photo Gallery';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [uploaderName, setUploaderName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(apiBaseUrl));
  const [adminToken, setAdminToken] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const canUpload = Boolean(apiBaseUrl) && selectedFiles.length > 0 && uploadState !== 'uploading';
  const totalSize = useMemo(
    () => selectedFiles.reduce((total, file) => total + file.size, 0),
    [selectedFiles]
  );

  useEffect(() => {
    if (!apiBaseUrl) {
      setIsLoading(false);
      return;
    }

    void loadPhotos();
  }, []);

  async function loadPhotos() {
    setIsLoading(true);
    setMessage('');

    try {
      const loadedPhotos = await fetchPhotos({ apiBaseUrl, eventSlug });
      setPhotos(loadedPhotos);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!apiBaseUrl) {
      setMessage('Set VITE_API_BASE_URL before uploading photos.');
      setUploadState('error');
      return;
    }

    for (const file of selectedFiles) {
      const validation = validatePhotoFile(file);
      if (!validation.ok) {
        setMessage(validation.message);
        setUploadState('error');
        return;
      }
    }

    setUploadState('uploading');

    try {
      const uploadedPhotos: Photo[] = [];
      const displayName = normalizeUploaderName(uploaderName);

      for (const file of selectedFiles) {
        const photo = await uploadPhoto({
          apiBaseUrl,
          eventSlug,
          file,
          uploaderName: displayName
        });
        uploadedPhotos.push(photo);
      }

      setPhotos((current) => [...uploadedPhotos, ...current]);
      setSelectedFiles([]);
      setUploadState('done');
      setMessage(
        uploadedPhotos.length === 1
          ? 'Photo uploaded.'
          : `${uploadedPhotos.length} photos uploaded.`
      );
    } catch (error) {
      setUploadState('error');
      setMessage(getErrorMessage(error));
    }
  }

  async function handleHide(photo: Photo) {
    if (!adminToken) {
      setMessage('Enter the admin token first.');
      return;
    }

    try {
      await hidePhoto({ apiBaseUrl, eventSlug, photoId: photo.id, adminToken });
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      setMessage('Photo hidden.');
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function handleDelete(photo: Photo) {
    if (!adminToken) {
      setMessage('Enter the admin token first.');
      return;
    }

    try {
      await deletePhoto({ apiBaseUrl, eventSlug, photoId: photo.id, adminToken });
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      if (selectedPhoto?.id === photo.id) {
        setSelectedPhoto(null);
      }
      setMessage('Photo deleted.');
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <main className="min-h-screen bg-mist text-ink">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-rosewood">
              <Camera className="h-4 w-4" aria-hidden="true" />
              Shared wedding gallery
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              {eventTitle}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Upload your favorite moments and view photos shared by guests with this link.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadPhotos()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!apiBaseUrl || isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        <aside className="space-y-4">
          {!apiBaseUrl && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              Set <code className="font-mono">VITE_API_BASE_URL</code> to your Cloudflare Worker URL
              before deployment.
            </div>
          )}

          <form onSubmit={handleUpload} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ImagePlus className="h-4 w-4 text-saffron" aria-hidden="true" />
              Add photos
            </div>

            <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="uploaderName">
              Your name
            </label>
            <input
              id="uploaderName"
              value={uploaderName}
              onChange={(event) => setUploaderName(event.target.value)}
              placeholder="Guest"
              className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-rosewood focus:ring-2 focus:ring-rosewood/20"
            />

            <label
              htmlFor="photos"
              className="mt-4 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-center transition hover:border-saffron hover:bg-amber-50"
            >
              <Upload className="h-8 w-8 text-slate-500" aria-hidden="true" />
              <span className="mt-3 text-sm font-medium text-slate-800">
                Choose photos from your phone
              </span>
              <span className="mt-1 text-xs text-slate-500">
                JPEG, PNG, WebP, HEIC, or AVIF up to {formatBytes(MAX_PHOTO_SIZE_BYTES)} each
              </span>
            </label>
            <input
              id="photos"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif"
              multiple
              className="sr-only"
              onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
            />

            {selectedFiles.length > 0 && (
              <div className="mt-3 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600">
                {selectedFiles.length} selected, {formatBytes(totalSize)} total
              </div>
            )}

            <button
              type="submit"
              disabled={!canUpload}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-rosewood px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rosewood/90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {uploadState === 'uploading' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="h-4 w-4" aria-hidden="true" />
              )}
              Upload
            </button>
          </form>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <button
              type="button"
              onClick={() => setIsAdminOpen((current) => !current)}
              className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-800"
            >
              <span className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Admin tools
              </span>
              {isAdminOpen ? (
                <EyeOff className="h-4 w-4 text-slate-500" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4 text-slate-500" aria-hidden="true" />
              )}
            </button>
            {isAdminOpen && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700" htmlFor="adminToken">
                  Admin token
                </label>
                <input
                  id="adminToken"
                  value={adminToken}
                  onChange={(event) => setAdminToken(event.target.value)}
                  type="password"
                  className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-rosewood focus:ring-2 focus:ring-rosewood/20"
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Token is only sent to Cloudflare for hide/delete actions.
                </p>
              </div>
            )}
          </section>

          {message && (
            <div
              className={`rounded-lg border p-4 text-sm ${
                uploadState === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-900'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900'
              }`}
            >
              {message}
            </div>
          )}
        </aside>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Photos</h2>
            <span className="text-sm text-slate-500">{photos.length} shared</span>
          </div>

          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              Loading photos
            </div>
          ) : photos.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-center">
              <Camera className="h-10 w-10 text-slate-400" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold">No photos yet</h3>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                Be the first guest to add a moment from the celebration.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {photos.map((photo) => (
                <article
                  key={photo.id}
                  className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(photo)}
                    className="block aspect-square w-full overflow-hidden bg-slate-100"
                    aria-label={`Open ${photo.originalName}`}
                  >
                    <img
                      src={photo.imageUrl}
                      alt={`Uploaded by ${photo.uploaderName}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </button>
                  <div className="space-y-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{photo.uploaderName}</p>
                      <p className="text-xs text-slate-500">{formatDate(photo.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={photo.downloadUrl}
                        className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-md border border-slate-300 text-xs font-medium hover:bg-slate-50"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        Download
                      </a>
                      {isAdminOpen && (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleHide(photo)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                            aria-label="Hide photo"
                          >
                            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(photo)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50"
                            aria-label="Delete photo"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <img
              src={selectedPhoto.imageUrl}
              alt={`Uploaded by ${selectedPhoto.uploaderName}`}
              className="max-h-[82vh] w-auto rounded-lg object-contain shadow-2xl"
            />
            <div className="mt-3 flex items-center justify-between gap-4 text-sm text-white">
              <span>
                Uploaded by <strong>{selectedPhoto.uploaderName}</strong>
              </span>
              <a
                href={selectedPhoto.downloadUrl}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 font-medium text-slate-950"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}
