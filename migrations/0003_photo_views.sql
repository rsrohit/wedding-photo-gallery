ALTER TABLE photos ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE photos ADD COLUMN last_viewed_at TEXT;

CREATE INDEX IF NOT EXISTS idx_photos_event_status_views
  ON photos (event_slug, status, view_count DESC, created_at DESC);
