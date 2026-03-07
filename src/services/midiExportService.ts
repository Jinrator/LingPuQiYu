import { DetectedNote } from './pitchDetectionService';

interface MidiExportOptions {
  bpm?: number;
  timeSignatureNumerator?: number;
  timeSignatureDenominator?: number;
  trackName?: string;
}

/**
 * Converts DetectedNote array to a standard MIDI file (SMF format 0).
 * Returns a Blob with MIME type audio/midi.
 */
export function exportToMidi(
  notes: DetectedNote[],
  options: MidiExportOptions = {}
): Blob {
  const bpm = options.bpm ?? 120;
  const timeSigNum = options.timeSignatureNumerator ?? 4;
  const timeSigDen = options.timeSignatureDenominator ?? 4;
  const trackName = options.trackName ?? 'Melody';

  const ticksPerBeat = 480;
  const microsecondsPerBeat = Math.round(60_000_000 / bpm);

  // --- Helper writers ---
  const writeUint32BE = (val: number): number[] => [
    (val >>> 24) & 0xff,
    (val >>> 16) & 0xff,
    (val >>> 8) & 0xff,
    val & 0xff,
  ];

  const writeUint16BE = (val: number): number[] => [
    (val >>> 8) & 0xff,
    val & 0xff,
  ];

  const writeVarLen = (val: number): number[] => {
    const bytes: number[] = [];
    bytes.unshift(val & 0x7f);
    val >>>= 7;
    while (val > 0) {
      bytes.unshift((val & 0x7f) | 0x80);
      val >>>= 7;
    }
    return bytes;
  };

  const writeString = (str: string): number[] =>
    Array.from(str).map((c) => c.charCodeAt(0));

  // --- Build track events ---
  interface MidiEvent {
    tick: number;
    data: number[];
  }

  const events: MidiEvent[] = [];

  // Tempo event
  events.push({
    tick: 0,
    data: [
      0xff, 0x51, 0x03,
      (microsecondsPerBeat >>> 16) & 0xff,
      (microsecondsPerBeat >>> 8) & 0xff,
      microsecondsPerBeat & 0xff,
    ],
  });

  // Time signature event
  events.push({
    tick: 0,
    data: [0xff, 0x58, 0x04, timeSigNum, Math.log2(timeSigDen), 24, 8],
  });

  // Track name event
  const nameBytes = writeString(trackName);
  events.push({
    tick: 0,
    data: [0xff, 0x03, ...writeVarLen(nameBytes.length), ...nameBytes],
  });

  // Note on/off events
  const channel = 0;
  for (const note of notes) {
    const midi = Math.max(0, Math.min(127, note.midiNumber));
    const velocity = Math.max(1, Math.min(127, note.velocity));
    const onTick = Math.round(note.startTime * ticksPerBeat * (bpm / 60));
    const offTick = Math.round(note.endTime * ticksPerBeat * (bpm / 60));

    events.push({ tick: onTick, data: [0x90 | channel, midi, velocity] });
    events.push({ tick: offTick, data: [0x80 | channel, midi, 0] });
  }

  // End of track
  const lastTick =
    events.length > 3
      ? Math.max(...events.map((e) => e.tick)) + ticksPerBeat
      : ticksPerBeat * 4;
  events.push({ tick: lastTick, data: [0xff, 0x2f, 0x00] });

  // Sort by tick
  events.sort((a, b) => a.tick - b.tick);

  // Convert to delta-time bytes
  const trackBytes: number[] = [];
  let prevTick = 0;
  for (const ev of events) {
    const delta = ev.tick - prevTick;
    prevTick = ev.tick;
    trackBytes.push(...writeVarLen(delta), ...ev.data);
  }

  // --- Assemble MIDI file ---
  // Header chunk: MThd
  const header: number[] = [
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    ...writeUint32BE(6),     // chunk length = 6
    ...writeUint16BE(0),     // format 0
    ...writeUint16BE(1),     // 1 track
    ...writeUint16BE(ticksPerBeat),
  ];

  // Track chunk: MTrk
  const track: number[] = [
    0x4d, 0x54, 0x72, 0x6b, // "MTrk"
    ...writeUint32BE(trackBytes.length),
    ...trackBytes,
  ];

  const fileBytes = new Uint8Array([...header, ...track]);
  return new Blob([fileBytes], { type: 'audio/midi' });
}

/**
 * Triggers a browser download of the given MIDI blob.
 */
export function downloadMidi(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
