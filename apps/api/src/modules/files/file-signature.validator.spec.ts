import { BadRequestException } from '@nestjs/common';

import { detectSupportedFile } from './file-signature.validator';

describe('detectSupportedFile', () => {
  it('detects JPEG, PDF and ZIP by content rather than filename', () => {
    const jpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);
    const pdf = Buffer.from('%PDF-1.7\n%%EOF\n', 'ascii');
    const emptyZip = Buffer.concat([
      Buffer.from('PK\x05\x06', 'binary'),
      Buffer.alloc(18),
    ]);

    expect(detectSupportedFile(jpeg)).toMatchObject({
      family: 'IMAGE',
      mimeType: 'image/jpeg',
    });
    expect(detectSupportedFile(pdf)).toMatchObject({
      family: 'DOCUMENT',
      mimeType: 'application/pdf',
    });
    expect(detectSupportedFile(emptyZip)).toMatchObject({
      family: 'ATTACHMENT',
      mimeType: 'application/zip',
    });
  });

  it('distinguishes OOXML resource packages from generic ZIP content', () => {
    const makePackage = (entry: string) =>
      Buffer.concat([
        Buffer.from('PK\x03\x04', 'binary'),
        Buffer.from(`[Content_Types].xml\0_rels/.rels\0${entry}`, 'ascii'),
      ]);

    expect(detectSupportedFile(makePackage('word/document.xml'))).toMatchObject(
      {
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'docx',
      },
    );
    expect(
      detectSupportedFile(makePackage('ppt/presentation.xml')),
    ).toMatchObject({
      mimeType:
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      extension: 'pptx',
    });
    expect(detectSupportedFile(makePackage('xl/workbook.xml'))).toMatchObject({
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
    });
  });

  it('accepts conservative SVG images and rejects active SVG content', () => {
    const safeSvg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>',
      'utf8',
    );

    expect(detectSupportedFile(safeSvg)).toEqual({
      family: 'IMAGE',
      mimeType: 'image/svg+xml',
      extension: 'svg',
    });

    expect(() =>
      detectSupportedFile(
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
          'utf8',
        ),
      ),
    ).toThrow(BadRequestException);

    expect(() =>
      detectSupportedFile(
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg"><use href="https://example.com/a.svg#x"/></svg>',
          'utf8',
        ),
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects unverified arbitrary text', () => {
    expect(() =>
      detectSupportedFile(Buffer.from('not a supported file', 'utf8')),
    ).toThrow(BadRequestException);
  });
});
