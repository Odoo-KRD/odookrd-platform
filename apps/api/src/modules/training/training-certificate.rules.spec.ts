import {
  defaultTrainingCertificateLayout,
  escapeTrainingCertificateXml,
  normalizeTrainingCertificateLayout,
  normalizeTrainingCertificateName,
  resolveTrainingCertificateText,
  trainingCertificateFontFamily,
  wrapTrainingCertificateText,
} from './training-certificate.rules';

describe('training certificate rules', () => {
  it('normalizes certificate names without accepting blanks', () => {
    expect(normalizeTrainingCertificateName('  Daban   Hameed  ')).toBe(
      'Daban Hameed',
    );
    expect(normalizeTrainingCertificateName(' ')).toBeNull();
  });

  it('uses current locale then Kurdish, Arabic and English fallback', () => {
    expect(
      resolveTrainingCertificateText(
        { ku: 'کوردی', ar: 'عربي', en: 'English' },
        'ar',
        'fallback',
      ),
    ).toBe('عربي');
    expect(
      resolveTrainingCertificateText({ ku: 'کوردی' }, 'en', 'fallback'),
    ).toBe('کوردی');
  });

  it('escapes certificate SVG content and wraps long text', () => {
    expect(escapeTrainingCertificateXml('<Daban & Co>')).toBe(
      '&lt;Daban &amp; Co&gt;',
    );
    expect(wrapTrainingCertificateText('one two three four', 7)).toEqual([
      'one two',
      'three',
      'four',
    ]);
  });

  it('creates an enterprise hierarchy with intro before learner name', () => {
    const layout = defaultTrainingCertificateLayout('#714b67');
    expect(layout.version).toBe(1);
    expect(layout.elements.intro.y).toBeLessThan(layout.elements.learnerName.y);
    expect(layout.elements.learnerName.y).toBeLessThan(layout.elements.body.y);
    expect(layout.elements.learnerName.fontSize).toBeGreaterThan(
      layout.elements.intro.fontSize,
    );
  });

  it('merges designer overrides while enforcing safe canvas boundaries', () => {
    const layout = normalizeTrainingCertificateLayout({
      version: 1,
      elements: {
        learnerName: {
          x: 720,
          y: 430,
          fontSize: 70,
          fontFamily: 'ARABIC_NASKH',
          color: '#123456',
          align: 'center',
          visible: true,
        },
      },
    });

    expect(layout.elements.learnerName.x).toBe(720);
    expect(layout.elements.learnerName.fontSize).toBe(70);
    expect(layout.elements.title.width).toBeGreaterThan(1000);

    expect(() =>
      normalizeTrainingCertificateLayout({
        version: 1,
        elements: { learnerName: { x: 9999 } },
      }),
    ).toThrow('Invalid certificate layout x.');
  });

  it('uses distinct professional Arabic-capable certificate font stacks', () => {
    expect(trainingCertificateFontFamily('ARABIC_NASKH')).toContain(
      'Noto Naskh Arabic',
    );
    expect(trainingCertificateFontFamily('ARABIC_SANS')).toContain(
      'Noto Sans Arabic',
    );
    expect(trainingCertificateFontFamily('ARABIC_NASKH')).not.toBe(
      trainingCertificateFontFamily('ARABIC_SANS'),
    );
  });
});
