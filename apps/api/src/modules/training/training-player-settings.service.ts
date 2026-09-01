import { Injectable } from '@nestjs/common';

import { SettingsService } from '../settings/settings.service';

export interface TrainingPlayerSettings {
  autoplay: boolean;
  defaultPlaybackRate: '0.75' | '1' | '1.25' | '1.5' | '2';
  seekSeconds: number;
  controlsAutoHideSeconds: number;
  showFullscreen: boolean;
  showVolume: boolean;
  showChapters: boolean;
  showSpeedControl: boolean;
  showQualitySelector: boolean;
  branding: {
    enabled: boolean;
    text: string;
  };
  captions: {
    defaultBehavior: 'off' | 'video_default' | 'prefer_learner_language';
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
    textColor: 'white' | 'yellow';
    background: 'none' | 'light' | 'medium' | 'dark' | 'solid';
    backgroundOpacity: number;
    edgeStyle: 'none' | 'soft' | 'strong';
    position: 'bottom' | 'top';
    maxWidthPercent: number;
  };
}

@Injectable()
export class TrainingPlayerSettingsService {
  constructor(private readonly settings: SettingsService) {}

  async resolve(): Promise<TrainingPlayerSettings> {
    const keys = [
      'trainings.player.autoplay',
      'trainings.player.default_playback_rate',
      'trainings.player.seek_seconds',
      'trainings.player.controls_auto_hide_seconds',
      'trainings.player.show_fullscreen',
      'trainings.player.show_volume',
      'trainings.player.show_chapters',
      'trainings.player.show_speed_control',
      'trainings.player.show_quality_selector',
      'trainings.player.branding.enabled',
      'trainings.player.branding.text',
      'trainings.player.captions.default_behavior',
      'trainings.player.captions.font_size',
      'trainings.player.captions.text_color',
      'trainings.player.captions.background',
      'trainings.player.captions.background_opacity',
      'trainings.player.captions.edge_style',
      'trainings.player.captions.position',
      'trainings.player.captions.max_width_percent',
    ] as const;
    const values = await Promise.all(
      keys.map((key) => this.settings.resolveValue(key)),
    );
    return {
      autoplay: values[0] === true,
      defaultPlaybackRate: String(
        values[1],
      ) as TrainingPlayerSettings['defaultPlaybackRate'],
      seekSeconds: Number(values[2]),
      controlsAutoHideSeconds: Number(values[3]),
      showFullscreen: values[4] === true,
      showVolume: values[5] === true,
      showChapters: values[6] === true,
      showSpeedControl: values[7] === true,
      showQualitySelector: values[8] === true,
      branding: {
        enabled: values[9] === true,
        text: String(values[10]),
      },
      captions: {
        defaultBehavior: String(
          values[11],
        ) as TrainingPlayerSettings['captions']['defaultBehavior'],
        fontSize: String(
          values[12],
        ) as TrainingPlayerSettings['captions']['fontSize'],
        textColor: String(
          values[13],
        ) as TrainingPlayerSettings['captions']['textColor'],
        background: String(
          values[14],
        ) as TrainingPlayerSettings['captions']['background'],
        backgroundOpacity: Number(values[15]),
        edgeStyle: String(
          values[16],
        ) as TrainingPlayerSettings['captions']['edgeStyle'],
        position: String(
          values[17],
        ) as TrainingPlayerSettings['captions']['position'],
        maxWidthPercent: Number(values[18]),
      },
    };
  }
}
