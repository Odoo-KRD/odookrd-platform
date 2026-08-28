-- Stage 3B — Training Content Administration
--
-- Stage 3A intentionally reserved the complete training persistence model.
-- Stage 3B creates lesson metadata before Stage 3C attaches an AWS/local video asset,
-- therefore the asset relation must be optional during authoring.
ALTER TABLE "training_video_lessons"
  ALTER COLUMN "video_asset_id" DROP NOT NULL;
