CREATE TABLE "training_video_caption_tracks" (
    "id" UUID NOT NULL,
    "video_asset_id" UUID NOT NULL,
    "file_asset_id" UUID NOT NULL,
    "language_code" VARCHAR(35) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "training_video_caption_tracks_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "training_video_chapters" (
    "id" UUID NOT NULL,
    "video_asset_id" UUID NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "title_translations" JSONB NOT NULL DEFAULT '{}',
    "start_seconds" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "training_video_chapters_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "training_video_caption_tracks_video_language_unique" ON "training_video_caption_tracks"("video_asset_id", "language_code");
CREATE UNIQUE INDEX "training_video_caption_tracks_video_file_unique" ON "training_video_caption_tracks"("video_asset_id", "file_asset_id");
CREATE UNIQUE INDEX "training_video_caption_tracks_one_default" ON "training_video_caption_tracks"("video_asset_id") WHERE "is_default" = true;
CREATE INDEX "training_video_caption_tracks_video_order_idx" ON "training_video_caption_tracks"("video_asset_id", "sort_order", "id");
CREATE UNIQUE INDEX "training_video_chapters_video_start_unique" ON "training_video_chapters"("video_asset_id", "start_seconds");
CREATE INDEX "training_video_chapters_video_order_idx" ON "training_video_chapters"("video_asset_id", "start_seconds", "id");
ALTER TABLE "training_video_caption_tracks" ADD CONSTRAINT "training_video_caption_tracks_video_asset_fkey" FOREIGN KEY ("video_asset_id") REFERENCES "training_video_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "training_video_caption_tracks" ADD CONSTRAINT "training_video_caption_tracks_file_asset_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "training_video_chapters" ADD CONSTRAINT "training_video_chapters_video_asset_fkey" FOREIGN KEY ("video_asset_id") REFERENCES "training_video_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
