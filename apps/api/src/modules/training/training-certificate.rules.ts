export type TrainingCertificateLocale = 'ku' | 'ar' | 'en';
export type TrainingCertificateFontFamily =
  'SANS' | 'SERIF' | 'ARABIC_SANS' | 'ARABIC_NASKH';
export type TrainingCertificateTextAlign = 'left' | 'center' | 'right';

export interface TrainingCertificateLayoutElement {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: TrainingCertificateFontFamily;
  fontWeight: number;
  color: string;
  align: TrainingCertificateTextAlign;
  visible: boolean;
}

export interface TrainingCertificateLayoutConfig {
  version: 1;
  elements: {
    logo: TrainingCertificateLayoutElement;
    title: TrainingCertificateLayoutElement;
    intro: TrainingCertificateLayoutElement;
    learnerName: TrainingCertificateLayoutElement;
    body: TrainingCertificateLayoutElement;
    courseTitle: TrainingCertificateLayoutElement;
    details: TrainingCertificateLayoutElement;
    score: TrainingCertificateLayoutElement;
    signature: TrainingCertificateLayoutElement;
    signatoryName: TrainingCertificateLayoutElement;
    signatoryTitle: TrainingCertificateLayoutElement;
    certificateNumber: TrainingCertificateLayoutElement;
    verificationCode: TrainingCertificateLayoutElement;
  };
}

const colorPattern = /^#[0-9a-fA-F]{6}$/;
const fontFamilies = new Set<TrainingCertificateFontFamily>([
  'SANS',
  'SERIF',
  'ARABIC_SANS',
  'ARABIC_NASKH',
]);
const alignments = new Set<TrainingCertificateTextAlign>([
  'left',
  'center',
  'right',
]);

export function defaultTrainingCertificateLayout(
  primaryColor = '#714b67',
): TrainingCertificateLayoutConfig {
  const text = (
    x: number,
    y: number,
    width: number,
    fontSize: number,
    color: string,
    fontWeight = 400,
    fontFamily: TrainingCertificateFontFamily = 'ARABIC_NASKH',
    align: TrainingCertificateTextAlign = 'center',
    visible = true,
  ): TrainingCertificateLayoutElement => ({
    x,
    y,
    width,
    height: Math.max(40, Math.round(fontSize * 1.7)),
    fontSize,
    fontFamily,
    fontWeight,
    color,
    align,
    visible,
  });

  return {
    version: 1,
    elements: {
      logo: {
        x: 800,
        y: 135,
        width: 220,
        height: 110,
        fontSize: 16,
        fontFamily: 'SANS',
        fontWeight: 400,
        color: '#0f172a',
        align: 'center',
        visible: true,
      },
      title: text(800, 275, 1240, 56, primaryColor, 700, 'ARABIC_NASKH'),
      intro: text(800, 365, 1120, 25, '#475569', 400, 'ARABIC_NASKH'),
      learnerName: text(800, 455, 1180, 64, '#0f172a', 700, 'ARABIC_NASKH'),
      body: text(800, 560, 1120, 28, '#475569', 400, 'ARABIC_NASKH'),
      courseTitle: text(800, 665, 1120, 38, '#0f172a', 700, 'ARABIC_NASKH'),
      details: text(800, 755, 980, 22, '#64748b', 400, 'ARABIC_NASKH'),
      score: text(800, 795, 800, 21, '#475569', 500, 'ARABIC_NASKH'),
      signature: {
        x: 800,
        y: 890,
        width: 260,
        height: 90,
        fontSize: 16,
        fontFamily: 'SANS',
        fontWeight: 400,
        color: '#0f172a',
        align: 'center',
        visible: true,
      },
      signatoryName: text(800, 972, 600, 22, '#0f172a', 700, 'ARABIC_NASKH'),
      signatoryTitle: text(800, 1004, 600, 18, '#64748b', 400, 'ARABIC_NASKH'),
      certificateNumber: text(
        115,
        1040,
        620,
        16,
        '#64748b',
        400,
        'SANS',
        'left',
      ),
      verificationCode: text(
        115,
        1068,
        620,
        14,
        '#64748b',
        400,
        'SANS',
        'left',
      ),
    },
  };
}

export function normalizeTrainingCertificateLayout(
  value: unknown,
  primaryColor = '#714b67',
): TrainingCertificateLayoutConfig {
  const defaults = defaultTrainingCertificateLayout(primaryColor);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaults;
  }

  const source = value as Record<string, unknown>;
  if (source.version !== undefined && source.version !== 1) {
    throw new Error('Unsupported certificate layout version.');
  }

  const rawElements =
    source.elements &&
    typeof source.elements === 'object' &&
    !Array.isArray(source.elements)
      ? (source.elements as Record<string, unknown>)
      : {};

  const normalized = structuredClone(defaults);
  for (const key of Object.keys(normalized.elements) as Array<
    keyof TrainingCertificateLayoutConfig['elements']
  >) {
    const raw = rawElements[key];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    normalized.elements[key] = normalizeElement(
      raw as Record<string, unknown>,
      normalized.elements[key],
    );
  }

  return normalized;
}

function normalizeElement(
  value: Record<string, unknown>,
  fallback: TrainingCertificateLayoutElement,
): TrainingCertificateLayoutElement {
  const number = (
    key: string,
    minimum: number,
    maximum: number,
    defaultValue: number,
  ) => {
    const candidate = value[key];
    if (candidate === undefined) return defaultValue;
    if (
      typeof candidate !== 'number' ||
      !Number.isFinite(candidate) ||
      candidate < minimum ||
      candidate > maximum
    ) {
      throw new Error(`Invalid certificate layout ${key}.`);
    }
    return Math.round(candidate * 100) / 100;
  };

  const fontFamily = value.fontFamily ?? fallback.fontFamily;
  if (
    typeof fontFamily !== 'string' ||
    !fontFamilies.has(fontFamily as TrainingCertificateFontFamily)
  ) {
    throw new Error('Invalid certificate layout font family.');
  }

  const align = value.align ?? fallback.align;
  if (
    typeof align !== 'string' ||
    !alignments.has(align as TrainingCertificateTextAlign)
  ) {
    throw new Error('Invalid certificate layout text alignment.');
  }

  const color = value.color ?? fallback.color;
  if (typeof color !== 'string' || !colorPattern.test(color)) {
    throw new Error('Invalid certificate layout color.');
  }

  const visible = value.visible ?? fallback.visible;
  if (typeof visible !== 'boolean') {
    throw new Error('Invalid certificate layout visibility.');
  }

  return {
    x: number('x', 0, 1600, fallback.x),
    y: number('y', 0, 1131, fallback.y),
    width: number('width', 40, 1600, fallback.width),
    height: number('height', 20, 1131, fallback.height),
    fontSize: number('fontSize', 10, 120, fallback.fontSize),
    fontFamily: fontFamily as TrainingCertificateFontFamily,
    fontWeight: number('fontWeight', 300, 800, fallback.fontWeight),
    color,
    align: align as TrainingCertificateTextAlign,
    visible,
  };
}

export function trainingCertificateFontFamily(value: string): string {
  switch (value) {
    case 'SERIF':
      return 'Noto Serif, DejaVu Serif, serif';
    case 'ARABIC_SANS':
      return 'Noto Sans Arabic, Noto Sans, DejaVu Sans, sans-serif';
    case 'ARABIC_NASKH':
      return 'Noto Naskh Arabic, Noto Sans Arabic, DejaVu Sans, serif';
    case 'SANS':
    default:
      return 'Noto Sans, DejaVu Sans, sans-serif';
  }
}

export function normalizeTrainingCertificateName(value: string): string | null {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length >= 2 && normalized.length <= 250 ? normalized : null;
}

export function resolveTrainingCertificateText(
  translations: unknown,
  locale: TrainingCertificateLocale,
  fallback: string,
): string {
  if (
    translations &&
    typeof translations === 'object' &&
    !Array.isArray(translations)
  ) {
    const source = translations as Record<string, unknown>;
    for (const key of [locale, 'ku', 'ar', 'en'] as const) {
      const candidate = source[key];
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  return fallback;
}

export function escapeTrainingCertificateXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function wrapTrainingCertificateText(
  value: string,
  maximumCharacters = 55,
): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maximumCharacters || !current) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines.slice(0, 5);
}
