/**
 * Lightweight ID3v2 tag reader for browser.
 * Reads title, artist, album, and embedded cover art from MP3 files.
 * Supports ID3v2.3 and ID3v2.4 (the most common versions).
 */

export interface ID3Meta {
  title?: string;
  artist?: string;
  album?: string;
  coverUrl?: string; // blob URL for album art
}

/** Read a UTF-8 string from a DataView, stripping null bytes */
function readUTF8(view: DataView, offset: number, length: number): string {
  const bytes: number[] = [];
  for (let i = 0; i < length; i++) {
    const b = view.getUint8(offset + i);
    if (b !== 0) bytes.push(b);
  }
  return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
}

/** Read a UTF-16 string (LE or BE) from a DataView */
function readUTF16(view: DataView, offset: number, length: number): string {
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, length);
  // Detect BOM
  let encoding: 'utf-16le' | 'utf-16be' = 'utf-16le';
  let start = 0;
  if (bytes.length >= 2) {
    if (bytes[0] === 0xFF && bytes[1] === 0xFE) { encoding = 'utf-16le'; start = 2; }
    else if (bytes[0] === 0xFE && bytes[1] === 0xFF) { encoding = 'utf-16be'; start = 2; }
  }
  const slice = bytes.slice(start);
  // Strip trailing nulls
  let end = slice.length;
  while (end >= 2 && slice[end - 1] === 0 && slice[end - 2] === 0) end -= 2;
  return new TextDecoder(encoding).decode(slice.slice(0, end));
}

/** Decode a text frame value based on encoding byte */
function decodeTextFrame(view: DataView, offset: number, size: number): string {
  if (size < 2) return '';
  const encoding = view.getUint8(offset);
  const textOffset = offset + 1;
  const textLength = size - 1;
  if (encoding === 0) return readUTF8(view, textOffset, textLength);       // ISO-8859-1
  if (encoding === 1) return readUTF16(view, textOffset, textLength);      // UTF-16 with BOM
  if (encoding === 2) return readUTF16(view, textOffset, textLength);      // UTF-16BE
  if (encoding === 3) return readUTF8(view, textOffset, textLength);       // UTF-8
  return readUTF8(view, textOffset, textLength);
}

/** Parse an APIC (attached picture) frame and return a blob URL */
function parseAPIC(view: DataView, offset: number, size: number): string | undefined {
  const encoding = view.getUint8(offset);
  let pos = offset + 1;

  // Read MIME type (null-terminated ASCII)
  let mime = '';
  while (pos < offset + size && view.getUint8(pos) !== 0) {
    mime += String.fromCharCode(view.getUint8(pos));
    pos++;
  }
  pos++; // skip null terminator

  // Picture type byte (skip)
  pos++;

  // Description (null-terminated, encoding-dependent)
  if (encoding === 0 || encoding === 3) {
    while (pos < offset + size && view.getUint8(pos) !== 0) pos++;
    pos++; // skip null
  } else {
    // UTF-16: look for double-null
    while (pos + 1 < offset + size) {
      if (view.getUint8(pos) === 0 && view.getUint8(pos + 1) === 0) { pos += 2; break; }
      pos += 2;
    }
  }

  const imageData = new Uint8Array(view.buffer, view.byteOffset + pos, offset + size - pos);
  if (imageData.length === 0) return undefined;

  if (!mime || mime === 'image/') mime = 'image/jpeg';
  const blob = new Blob([imageData], { type: mime });
  return URL.createObjectURL(blob);
}

/** Read ID3v2 synchsafe integer (4 bytes, 7 bits each) */
function synchsafe(view: DataView, offset: number): number {
  return (
    ((view.getUint8(offset) & 0x7F) << 21) |
    ((view.getUint8(offset + 1) & 0x7F) << 14) |
    ((view.getUint8(offset + 2) & 0x7F) << 7) |
    (view.getUint8(offset + 3) & 0x7F)
  );
}

/**
 * Read ID3 tags from an audio file URL.
 * Fetches only the header portion of the file (first ~512KB) to avoid
 * downloading the entire audio file.
 */
export async function readID3(url: string): Promise<ID3Meta> {
  try {
    // Fetch first 512KB — enough for most ID3 tags with embedded art
    const resp = await fetch(url, { headers: { Range: 'bytes=0-524287' } });
    const buffer = await resp.arrayBuffer();
    const view = new DataView(buffer);

    // Check for ID3v2 header: "ID3"
    if (
      buffer.byteLength < 10 ||
      view.getUint8(0) !== 0x49 || // I
      view.getUint8(1) !== 0x44 || // D
      view.getUint8(2) !== 0x33    // 3
    ) {
      return {};
    }

    const majorVersion = view.getUint8(3); // 3 or 4
    const tagSize = synchsafe(view, 6);
    const useSynchsafe = majorVersion >= 4; // v2.4 uses synchsafe frame sizes

    const meta: ID3Meta = {};
    let pos = 10; // skip header
    const end = Math.min(10 + tagSize, buffer.byteLength);

    while (pos + 10 <= end) {
      // Frame ID: 4 ASCII chars
      const frameId =
        String.fromCharCode(view.getUint8(pos)) +
        String.fromCharCode(view.getUint8(pos + 1)) +
        String.fromCharCode(view.getUint8(pos + 2)) +
        String.fromCharCode(view.getUint8(pos + 3));

      // End of frames (padding)
      if (frameId[0] === '\0') break;

      const frameSize = useSynchsafe
        ? synchsafe(view, pos + 4)
        : view.getUint32(pos + 4);

      // Skip flags (2 bytes)
      const dataOffset = pos + 10;

      if (frameSize <= 0 || dataOffset + frameSize > end) break;

      switch (frameId) {
        case 'TIT2': meta.title = decodeTextFrame(view, dataOffset, frameSize); break;
        case 'TPE1': meta.artist = decodeTextFrame(view, dataOffset, frameSize); break;
        case 'TALB': meta.album = decodeTextFrame(view, dataOffset, frameSize); break;
        case 'APIC': {
          const url = parseAPIC(view, dataOffset, frameSize);
          if (url) meta.coverUrl = url;
          break;
        }
      }

      pos = dataOffset + frameSize;
    }

    return meta;
  } catch {
    return {};
  }
}
