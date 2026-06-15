import {
  Camera,
  Download,
  Eye,
  EyeOff,
  ImagePlus,
  Info,
  Loader2,
  Orbit,
  RefreshCw,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { appConfig } from './config';
import {
  ApiError,
  Photo,
  deletePhoto,
  fetchPhotos,
  hidePhoto,
  uploadPhoto
} from './lib/api';
import { preparePhotoForUpload } from './lib/photoProcessing';
import { GalleryView, GALLERY_VIEWS, getGalleryViewLabel } from './shared/galleryView';
import { buildPhotoDetailRows } from './shared/photoDetails';
import {
  MAX_STORED_PHOTO_SIZE_BYTES,
  MAX_PHOTO_SIZE_BYTES,
  normalizeUploaderName,
  validateUploaderName,
  validatePhotoFile
} from './shared/photoValidation';

const { apiBaseUrl, eventSlug, eventTitle } = appConfig;

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
  const [galleryView, setGalleryView] = useState<GalleryView>('grid');
  const [infoPhoto, setInfoPhoto] = useState<Photo | null>(null);

  const normalizedUploaderName = normalizeUploaderName(uploaderName);
  const canUpload =
    Boolean(apiBaseUrl) &&
    selectedFiles.length > 0 &&
    normalizedUploaderName.length > 0 &&
    uploadState !== 'uploading';
  const totalSize = useMemo(
    () => selectedFiles.reduce((total, file) => total + file.size, 0),
    [selectedFiles]
  );
  const latestPhoto = photos[0];

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

    const uploaderNameResult = validateUploaderName(uploaderName);
    if (!uploaderNameResult.ok) {
      setMessage(uploaderNameResult.message);
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
      const displayName = uploaderNameResult.value;

      for (const [index, file] of selectedFiles.entries()) {
        setMessage(`Optimizing ${index + 1} of ${selectedFiles.length}...`);
        const preparedPhoto = await preparePhotoForUpload(file);
        setMessage(`Uploading ${index + 1} of ${selectedFiles.length}...`);
        const photo = await uploadPhoto({
          apiBaseUrl,
          eventSlug,
          file: preparedPhoto.file,
          uploaderName: displayName,
          originalName: preparedPhoto.originalName,
          originalSizeBytes: preparedPhoto.originalSizeBytes,
          metadata: preparedPhoto.metadata
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
      if (infoPhoto?.id === photo.id) {
        setInfoPhoto(null);
      }
      setMessage('Photo deleted.');
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <main className="aurora-shell min-h-screen overflow-hidden text-white">
      <div className="aurora-field" aria-hidden="true" />
      <div className="star-mesh" aria-hidden="true" />

      <section className="relative mx-auto grid min-h-[92vh] w-full max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[390px_minmax(0,1fr)] lg:px-8">
        <aside className="z-10 flex flex-col gap-4 lg:sticky lg:top-5 lg:self-start">
          <section className="glass-panel overflow-hidden p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
                <Sparkles className="h-3.5 w-3.5 text-amber-200" aria-hidden="true" />
                Live album
              </div>
              <button
                type="button"
                onClick={() => void loadPhotos()}
                className="icon-button"
                disabled={!apiBaseUrl || isLoading}
                aria-label="Refresh photos"
                title="Refresh photos"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
              </button>
            </div>

            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl lg:text-4xl xl:text-5xl">
              {eventTitle}
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/68">
              A shared constellation of wedding moments.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <Metric label="Shared" value={photos.length.toString()} />
              <Metric label="Selected" value={selectedFiles.length.toString()} />
              <Metric label="Latest" value={latestPhoto ? formatDate(latestPhoto.createdAt, true) : '--'} />
            </div>
          </section>

          {!apiBaseUrl && (
            <div className="rounded-lg border border-amber-300/40 bg-amber-300/12 p-4 text-sm text-amber-50">
              Set <code className="font-mono">VITE_API_BASE_URL</code> before uploading photos.
            </div>
          )}

          <form onSubmit={handleUpload} className="glass-panel p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ImagePlus className="h-4 w-4 text-teal-200" aria-hidden="true" />
              Add memory
            </div>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-white/54" htmlFor="uploaderName">
              Name <span className="text-rose-100">*</span>
            </label>
            <input
              id="uploaderName"
              value={uploaderName}
              onChange={(event) => setUploaderName(event.target.value)}
              placeholder="Your name"
              required
              className="mt-2 h-11 w-full rounded-md border border-white/12 bg-black/24 px-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-teal-200/70 focus:ring-2 focus:ring-teal-200/20"
            />
            {selectedFiles.length > 0 && !normalizedUploaderName && (
              <p className="mt-2 text-xs text-rose-100">Name is required before upload.</p>
            )}

            <label htmlFor="photos" className="upload-dropzone mt-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-md border border-teal-200/30 bg-teal-200/12">
                <Upload className="h-5 w-5 text-teal-100" aria-hidden="true" />
              </span>
              <span className="mt-3 text-sm font-semibold text-white">Select images</span>
              <span className="mt-1 text-xs text-white/52">
                JPEG, PNG, WebP, HEIC, AVIF · {formatBytes(MAX_PHOTO_SIZE_BYTES)} original
              </span>
              <span className="mt-1 text-xs text-teal-100/72">
                Optimized below {formatBytes(MAX_STORED_PHOTO_SIZE_BYTES)} before upload
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
              <div className="mt-3 rounded-md border border-white/10 bg-white/8 px-3 py-2 text-xs text-white/68">
                {selectedFiles.length} selected · {formatBytes(totalSize)} original
              </div>
            )}

            <button type="submit" disabled={!canUpload} className="futuristic-button mt-4">
              {uploadState === 'uploading' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="h-4 w-4" aria-hidden="true" />
              )}
              {uploadState === 'uploading' ? 'Optimizing' : 'Upload'}
            </button>
          </form>

          <section className="glass-panel p-4">
            <button
              type="button"
              onClick={() => setIsAdminOpen((current) => !current)}
              className="flex w-full items-center justify-between text-left text-sm font-semibold text-white"
            >
              <span className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4 text-rose-200" aria-hidden="true" />
                Admin
              </span>
              {isAdminOpen ? (
                <EyeOff className="h-4 w-4 text-white/56" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4 text-white/56" aria-hidden="true" />
              )}
            </button>
            {isAdminOpen && (
              <div className="mt-4">
                <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-white/54" htmlFor="adminToken">
                  Token
                </label>
                <input
                  id="adminToken"
                  value={adminToken}
                  onChange={(event) => setAdminToken(event.target.value)}
                  type="password"
                  className="mt-2 h-11 w-full rounded-md border border-white/12 bg-black/24 px-3 text-sm text-white outline-none transition focus:border-rose-200/70 focus:ring-2 focus:ring-rose-200/20"
                />
              </div>
            )}
          </section>

          {message && (
            <div
              className={`rounded-lg border p-4 text-sm ${
                uploadState === 'error'
                  ? 'border-rose-300/40 bg-rose-400/14 text-rose-50'
                  : 'border-emerald-300/40 bg-emerald-300/14 text-emerald-50'
              }`}
            >
              {message}
            </div>
          )}
        </aside>

        <section className="z-10 flex min-w-0 flex-col gap-4">
          <div className="glass-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-100/80">
                <Orbit className="h-3.5 w-3.5" aria-hidden="true" />
                Memory field
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white">Shared moments</h2>
            </div>

            <div className="segmented-control" aria-label="Gallery view">
              {GALLERY_VIEWS.map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setGalleryView(view)}
                  className={galleryView === view ? 'is-active' : ''}
                >
                  {getGalleryViewLabel(view)}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <LoadingState />
          ) : photos.length === 0 ? (
            <EmptyState />
          ) : galleryView === 'constellation' ? (
            <ConstellationView
              photos={photos}
              isAdminOpen={isAdminOpen}
              onOpen={setSelectedPhoto}
              onShowInfo={setInfoPhoto}
              onHide={handleHide}
              onDelete={handleDelete}
            />
          ) : (
            <GridView
              photos={photos}
              isAdminOpen={isAdminOpen}
              onOpen={setSelectedPhoto}
              onShowInfo={setInfoPhoto}
              onHide={handleHide}
              onDelete={handleDelete}
            />
          )}
        </section>
      </section>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-4 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="lightbox-frame max-h-full w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <img
              src={selectedPhoto.imageUrl}
              alt={`Uploaded by ${selectedPhoto.uploaderName}`}
              className="max-h-[78vh] w-full rounded-lg object-contain"
            />
            <div className="mt-3 flex flex-col gap-3 text-sm text-white sm:flex-row sm:items-center sm:justify-between">
              <span>
                Uploaded by <strong>{selectedPhoto.uploaderName}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInfoPhoto(selectedPhoto)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/16 bg-white/10 px-4 font-semibold text-white hover:bg-white/16"
                >
                  <Info className="h-4 w-4" aria-hidden="true" />
                  Info
                </button>
                <a href={selectedPhoto.downloadUrl} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 font-semibold text-black">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {infoPhoto && <PhotoDetailsDialog photo={infoPhoto} onClose={() => setInfoPhoto(null)} />}
    </main>
  );
}

type PhotoViewProps = {
  photos: Photo[];
  isAdminOpen: boolean;
  onOpen: (photo: Photo) => void;
  onShowInfo: (photo: Photo) => void;
  onHide: (photo: Photo) => void;
  onDelete: (photo: Photo) => void;
};

function GridView({ photos, isAdminOpen, onOpen, onShowInfo, onHide, onDelete }: PhotoViewProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          index={index}
          isAdminOpen={isAdminOpen}
          onOpen={onOpen}
          onShowInfo={onShowInfo}
          onHide={onHide}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function ConstellationView({ photos, isAdminOpen, onOpen, onHide, onDelete }: PhotoViewProps) {
  const visiblePhotos = photos.slice(0, 18);

  return (
    <div className="constellation-map min-h-[620px] overflow-hidden rounded-lg border border-white/10 bg-black/22 p-4 sm:p-6">
      <svg className="constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {visiblePhotos.slice(1).map((photo, index) => {
          const from = getConstellationPosition(index, visiblePhotos.length);
          const to = getConstellationPosition(index + 1, visiblePhotos.length);
          return (
            <line
              key={photo.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {visiblePhotos.map((photo, index) => {
        const position = getConstellationPosition(index, visiblePhotos.length);
        return (
          <article
            key={photo.id}
            className="constellation-node"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          >
            <button type="button" onClick={() => onOpen(photo)} aria-label={`Open ${photo.originalName}`}>
              <img src={photo.imageUrl} alt={`Uploaded by ${photo.uploaderName}`} loading="lazy" />
            </button>
            <div className="mt-2 max-w-28 text-center text-[11px] font-medium text-white/76">
              {photo.uploaderName}
            </div>
            {isAdminOpen && (
              <AdminActions
                photo={photo}
                compact
                onHide={onHide}
                onDelete={onDelete}
              />
            )}
          </article>
        );
      })}

      {photos.length > visiblePhotos.length && (
        <div className="absolute bottom-4 left-4 rounded-md border border-white/12 bg-black/34 px-3 py-2 text-xs text-white/70">
          Showing latest {visiblePhotos.length} of {photos.length}
        </div>
      )}
    </div>
  );
}

type PhotoCardProps = Omit<PhotoViewProps, 'photos'> & {
  photo: Photo;
  index: number;
};

function PhotoCard({ photo, index, isAdminOpen, onOpen, onShowInfo, onHide, onDelete }: PhotoCardProps) {
  return (
    <article className="memory-card group" style={{ animationDelay: `${Math.min(index * 45, 450)}ms` }}>
      <button
        type="button"
        onClick={() => onOpen(photo)}
        className="block aspect-square w-full overflow-hidden bg-black/30"
        aria-label={`Open ${photo.originalName}`}
      >
        <img
          src={photo.imageUrl}
          alt={`Uploaded by ${photo.uploaderName}`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          loading="lazy"
        />
      </button>
      <div className="space-y-3 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{photo.uploaderName}</p>
          <p className="text-xs text-white/48">{formatDate(photo.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onShowInfo(photo)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/12 bg-white/8 text-white/72 hover:bg-white/14"
            aria-label="Show photo details"
            title="Show photo details"
          >
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <a href={photo.downloadUrl} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-md border border-white/12 bg-white/8 text-xs font-semibold text-white hover:bg-white/14">
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download
          </a>
          {isAdminOpen && (
            <AdminActions photo={photo} onHide={onHide} onDelete={onDelete} />
          )}
        </div>
      </div>
    </article>
  );
}

function PhotoDetailsDialog({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  const detailRows = buildPhotoDetailRows(photo);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/72 p-4 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <section className="glass-panel max-h-full w-full max-w-lg overflow-auto p-5" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-100/80">
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              Photo info
            </div>
            <h3 className="mt-2 text-xl font-semibold text-white">{photo.uploaderName}</h3>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close photo details">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <dl className="mt-5 divide-y divide-white/10 rounded-lg border border-white/10 bg-black/20">
          {detailRows.map((row) => (
            <div key={row.label} className="grid gap-1 px-3 py-3 sm:grid-cols-[130px_minmax(0,1fr)]">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-white/42">
                {row.label}
              </dt>
              <dd className="break-words text-sm text-white/84">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function AdminActions({
  photo,
  compact = false,
  onHide,
  onDelete
}: {
  photo: Photo;
  compact?: boolean;
  onHide: (photo: Photo) => void;
  onDelete: (photo: Photo) => void;
}) {
  return (
    <div className={compact ? 'mt-2 flex justify-center gap-1' : 'flex items-center gap-2'}>
      <button
        type="button"
        onClick={() => void onHide(photo)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/12 bg-white/8 text-white/72 hover:bg-white/14"
        aria-label="Hide photo"
      >
        <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => void onDelete(photo)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-300/30 bg-rose-400/12 text-rose-100 hover:bg-rose-400/20"
        aria-label="Delete photo"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/8 px-3 py-3">
      <div className="text-lg font-semibold leading-none text-white">{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/42">{label}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="glass-panel flex min-h-96 items-center justify-center text-white/70">
      <Loader2 className="mr-2 h-5 w-5 animate-spin text-teal-100" aria-hidden="true" />
      Loading photos
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-panel flex min-h-96 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-teal-200/20 bg-teal-200/10">
        <Camera className="h-8 w-8 text-teal-100" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">No photos yet</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-white/58">
        The first shared image will light up the gallery.
      </p>
    </div>
  );
}

function getConstellationPosition(index: number, total: number): { x: number; y: number } {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  const ring = index % 3;
  const radiusX = 22 + ring * 9;
  const radiusY = 20 + ring * 7;

  return {
    x: 50 + Math.cos(angle) * radiusX,
    y: 50 + Math.sin(angle) * radiusY
  };
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

function formatDate(value: string, compact = false): string {
  return new Intl.DateTimeFormat(undefined, {
    month: compact ? undefined : 'short',
    day: compact ? undefined : 'numeric',
    hour: 'numeric',
    minute: compact ? undefined : '2-digit'
  }).format(new Date(value));
}
