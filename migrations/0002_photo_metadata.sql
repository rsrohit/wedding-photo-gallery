ALTER TABLE photos ADD COLUMN stored_name TEXT;
ALTER TABLE photos ADD COLUMN original_size_bytes INTEGER;
ALTER TABLE photos ADD COLUMN camera_make TEXT;
ALTER TABLE photos ADD COLUMN camera_model TEXT;
ALTER TABLE photos ADD COLUMN captured_at TEXT;
ALTER TABLE photos ADD COLUMN latitude REAL;
ALTER TABLE photos ADD COLUMN longitude REAL;
