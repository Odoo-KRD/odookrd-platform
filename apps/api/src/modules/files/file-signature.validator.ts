import { TextDecoder } from 'node:util';

import { BadRequestException } from '@nestjs/common';

export type SupportedFileFamily = 'IMAGE' | 'DOCUMENT' | 'ATTACHMENT';

export interface DetectedSupportedFile {
  family: SupportedFileFamily;
  mimeType: string;
  extension: string;
}

const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

function startsWithBytes(buffer: Buffer, expected: readonly number[]): boolean {
  return (
    buffer.length >= expected.length &&
    expected.every((value, index) => buffer[index] === value)
  );
}

function containsAscii(buffer: Buffer, value: string): boolean {
  return buffer.indexOf(Buffer.from(value, 'ascii')) >= 0;
}

function isZip(buffer: Buffer): boolean {
  return (
    startsWithBytes(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWithBytes(buffer, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWithBytes(buffer, [0x50, 0x4b, 0x07, 0x08])
  );
}

function stripXmlPreamble(value: string): string {
  let current = value.replace(/^\uFEFF/, '').trimStart();

  if (/^<\?xml\b/i.test(current)) {
    const end = current.indexOf('?>');
    if (end === -1) {
      throw new BadRequestException('The SVG XML declaration is malformed.');
    }
    current = current.slice(end + 2).trimStart();
  }

  while (current.startsWith('<!--')) {
    const end = current.indexOf('-->');
    if (end === -1) {
      throw new BadRequestException('The SVG comment is malformed.');
    }
    current = current.slice(end + 3).trimStart();
  }

  return current;
}

function validateSvg(value: string): void {
  const document = stripXmlPreamble(value);

  if (!/^<svg(?:\s|>)/i.test(document)) {
    throw new BadRequestException('The uploaded SVG document is invalid.');
  }

  const dangerousMarkup =
    /<!DOCTYPE|<!ENTITY|<\?xml-stylesheet|<\s*(?:script|foreignObject|iframe|object|embed|link|meta|style|audio|video)\b|\bon[a-z0-9_-]+\s*=|\bstyle\s*=|javascript\s*:|data\s*:\s*text\/html|@import/i;

  if (dangerousMarkup.test(document)) {
    throw new BadRequestException(
      'The SVG contains active or externally executable content.',
    );
  }

  const hrefPattern = /\b(?:href|xlink:href)\s*=\s*(["'])(.*?)\1/gi;
  for (const match of document.matchAll(hrefPattern)) {
    if (!match[2]?.trim().startsWith('#')) {
      throw new BadRequestException(
        'SVG external references are not permitted.',
      );
    }
  }

  const urlPattern = /url\(\s*(["']?)(.*?)\1\s*\)/gi;
  for (const match of document.matchAll(urlPattern)) {
    if (!match[2]?.trim().startsWith('#')) {
      throw new BadRequestException(
        'SVG external URL references are not permitted.',
      );
    }
  }
}

function detectSvg(buffer: Buffer): DetectedSupportedFile | null {
  if (buffer.length === 0) {
    return null;
  }

  const first = buffer[0];
  const looksTextual =
    first === 0xef ||
    first === 0x3c ||
    first === 0x09 ||
    first === 0x0a ||
    first === 0x0d ||
    first === 0x20;

  if (!looksTextual) {
    return null;
  }

  let value: string;
  try {
    value = utf8Decoder.decode(buffer);
  } catch {
    return null;
  }

  const normalized = value.replace(/^\uFEFF/, '').trimStart();
  if (
    !normalized.startsWith('<') ||
    (!/^<svg(?:\s|>)/i.test(normalized) &&
      !/^<\?xml\b/i.test(normalized) &&
      !/^<!--/.test(normalized))
  ) {
    return null;
  }

  validateSvg(value);

  return {
    family: 'IMAGE',
    mimeType: 'image/svg+xml',
    extension: 'svg',
  };
}

function detectZipFamily(buffer: Buffer): DetectedSupportedFile | null {
  if (!isZip(buffer)) {
    return null;
  }

  const hasContentTypes = containsAscii(buffer, '[Content_Types].xml');

  if (hasContentTypes && containsAscii(buffer, 'word/document.xml')) {
    return {
      family: 'ATTACHMENT',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
    };
  }

  if (hasContentTypes && containsAscii(buffer, 'ppt/presentation.xml')) {
    return {
      family: 'ATTACHMENT',
      mimeType:
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      extension: 'pptx',
    };
  }

  if (hasContentTypes && containsAscii(buffer, 'xl/workbook.xml')) {
    return {
      family: 'ATTACHMENT',
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
    };
  }

  return {
    family: 'ATTACHMENT',
    mimeType: 'application/zip',
    extension: 'zip',
  };
}

export function detectSupportedFile(buffer: Buffer): DetectedSupportedFile {
  const svg = detectSvg(buffer);
  if (svg) {
    return svg;
  }

  if (startsWithBytes(buffer, [0xff, 0xd8, 0xff])) {
    return { family: 'IMAGE', mimeType: 'image/jpeg', extension: 'jpg' };
  }

  if (
    startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return { family: 'IMAGE', mimeType: 'image/png', extension: 'png' };
  }

  if (
    buffer.length >= 6 &&
    (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' ||
      buffer.subarray(0, 6).toString('ascii') === 'GIF89a')
  ) {
    return { family: 'IMAGE', mimeType: 'image/gif', extension: 'gif' };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { family: 'IMAGE', mimeType: 'image/webp', extension: 'webp' };
  }

  if (
    buffer.length >= 5 &&
    buffer.subarray(0, 5).toString('ascii') === '%PDF-'
  ) {
    return {
      family: 'DOCUMENT',
      mimeType: 'application/pdf',
      extension: 'pdf',
    };
  }

  const archive = detectZipFamily(buffer);
  if (archive) {
    return archive;
  }

  throw new BadRequestException(
    'The uploaded file type could not be verified.',
  );
}
