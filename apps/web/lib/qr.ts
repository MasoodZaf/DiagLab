/*
 * Minimal, dependency-free QR Code generator.
 * Fixed configuration: Version 4 (33×33 modules), error-correction level M,
 * byte mode. Capacity ~62 bytes — comfortably fits a verification URL + code.
 * Implements Reed-Solomon ECC, two-block interleaving, all eight data masks
 * with penalty scoring, and ISO/IEC 18004 format information.
 */

const SIZE = 33; // version 4
const EC_CODEWORDS_PER_BLOCK = 18;
const BLOCKS = 2;
const DATA_PER_BLOCK = 32;
const TOTAL_DATA_CODEWORDS = BLOCKS * DATA_PER_BLOCK; // 64
const ALIGNMENT_CENTER = 26; // single alignment pattern for version 4
const MAX_BYTES = 62;

// ---- Galois field GF(256), primitive polynomial 0x11D ----
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGeneratorPoly(ecLen);
  const res = new Array<number>(ecLen).fill(0);
  for (const byte of data) {
    const factor = byte ^ res[0];
    res.shift();
    res.push(0);
    for (let i = 0; i < gen.length - 1; i++) {
      res[i] ^= gfMul(gen[i + 1], factor);
    }
  }
  return res;
}

// ---- Bit buffer ----
function buildCodewords(text: string): number[] {
  const bytes = Array.from(new TextEncoder().encode(text)).slice(0, MAX_BYTES);
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };
  push(0b0100, 4); // byte mode
  push(bytes.length, 8); // char count (version < 10, byte mode)
  for (const b of bytes) push(b, 8);

  const capacityBits = TOTAL_DATA_CODEWORDS * 8;
  // Terminator
  for (let i = 0; i < 4 && bits.length < capacityBits; i++) bits.push(0);
  // Byte align
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let cw = 0;
    for (let j = 0; j < 8; j++) cw = (cw << 1) | bits[i + j];
    codewords.push(cw);
  }
  // Pad bytes
  const pads = [0xec, 0x11];
  let p = 0;
  while (codewords.length < TOTAL_DATA_CODEWORDS) {
    codewords.push(pads[p % 2]);
    p++;
  }
  return codewords;
}

function interleave(dataCodewords: number[]): number[] {
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  for (let b = 0; b < BLOCKS; b++) {
    const block = dataCodewords.slice(b * DATA_PER_BLOCK, (b + 1) * DATA_PER_BLOCK);
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, EC_CODEWORDS_PER_BLOCK));
  }
  const result: number[] = [];
  for (let i = 0; i < DATA_PER_BLOCK; i++) {
    for (let b = 0; b < BLOCKS; b++) result.push(dataBlocks[b][i]);
  }
  for (let i = 0; i < EC_CODEWORDS_PER_BLOCK; i++) {
    for (let b = 0; b < BLOCKS; b++) result.push(ecBlocks[b][i]);
  }
  return result;
}

type Grid = Int8Array[]; // -1 = unset(function-free), 0/1 module value; function flag tracked separately

function emptyGrid(): { modules: Grid; reserved: boolean[][] } {
  const modules: Grid = Array.from({ length: SIZE }, () => new Int8Array(SIZE).fill(-1));
  const reserved = Array.from({ length: SIZE }, () => new Array<boolean>(SIZE).fill(false));
  return { modules, reserved };
}

function setFn(modules: Grid, reserved: boolean[][], r: number, c: number, val: number) {
  if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return;
  modules[r][c] = val as 0 | 1;
  reserved[r][c] = true;
}

function placeFinder(modules: Grid, reserved: boolean[][], row: number, col: number) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || cc < 0 || rr >= SIZE || cc >= SIZE) continue;
      const inner = r >= 0 && r <= 6 && c >= 0 && c <= 6;
      const isDark =
        inner &&
        ((r === 0 || r === 6 || c === 0 || c === 6) || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
      setFn(modules, reserved, rr, cc, isDark ? 1 : 0);
    }
  }
}

function placeAlignment(modules: Grid, reserved: boolean[][], cr: number, cc: number) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isDark = Math.max(Math.abs(r), Math.abs(c)) !== 1;
      setFn(modules, reserved, cr + r, cc + c, isDark ? 1 : 0);
    }
  }
}

function placeFunctionPatterns(modules: Grid, reserved: boolean[][]) {
  placeFinder(modules, reserved, 0, 0);
  placeFinder(modules, reserved, 0, SIZE - 7);
  placeFinder(modules, reserved, SIZE - 7, 0);
  placeAlignment(modules, reserved, ALIGNMENT_CENTER, ALIGNMENT_CENTER);

  // Timing patterns
  for (let i = 8; i < SIZE - 8; i++) {
    const v = i % 2 === 0 ? 1 : 0;
    if (!reserved[6][i]) setFn(modules, reserved, 6, i, v);
    if (!reserved[i][6]) setFn(modules, reserved, i, 6, v);
  }

  // Dark module
  setFn(modules, reserved, SIZE - 8, 8, 1);

  // Reserve format-information areas
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      reserved[8][i] = true;
      reserved[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][SIZE - 1 - i] = true;
    reserved[SIZE - 1 - i][8] = true;
  }
}

function placeData(modules: Grid, reserved: boolean[][], codewords: number[]) {
  const bits: number[] = [];
  for (const cw of codewords) {
    for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1);
  }
  let bitIndex = 0;
  let upward = true;
  for (let col = SIZE - 1; col > 0; col -= 2) {
    if (col === 6) col--; // skip timing column
    for (let i = 0; i < SIZE; i++) {
      const row = upward ? SIZE - 1 - i : i;
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (reserved[row][cc]) continue;
        const bit = bitIndex < bits.length ? bits[bitIndex] : 0;
        modules[row][cc] = bit as 0 | 1;
        bitIndex++;
      }
    }
    upward = !upward;
  }
}

function maskCondition(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    default: return false;
  }
}

function applyMask(modules: Grid, reserved: boolean[][], mask: number): Grid {
  const out: Grid = modules.map((row) => Int8Array.from(row));
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (reserved[r][c]) continue;
      if (maskCondition(mask, r, c)) out[r][c] = (out[r][c] ^ 1) as 0 | 1;
    }
  }
  return out;
}

// Format info: EC level M = 0b00, with mask, BCH(15,5) + XOR mask 0x5412.
function formatBits(mask: number): number[] {
  const data = (0b00 << 3) | mask; // 5 bits
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ (((rem >> 9) & 1) ? 0b10100110111 : 0);
  const bits = ((data << 10) | rem) ^ 0b101010000010010;
  const out: number[] = [];
  for (let i = 14; i >= 0; i--) out.push((bits >> i) & 1);
  return out;
}

function placeFormat(modules: Grid, mask: number) {
  const bits = formatBits(mask);
  // Around top-left finder
  for (let i = 0; i <= 5; i++) modules[8][i] = bits[i] as 0 | 1;
  modules[8][7] = bits[6] as 0 | 1;
  modules[8][8] = bits[7] as 0 | 1;
  modules[7][8] = bits[8] as 0 | 1;
  for (let i = 9; i <= 14; i++) modules[14 - i][8] = bits[i] as 0 | 1;
  // Around the other two finders: 7-bit vertical strip (rows SIZE-1..SIZE-7),
  // then 8-bit horizontal strip (cols SIZE-8..SIZE-1). The dark module at
  // (SIZE-8, 8) sits just above the vertical strip and must not be overwritten.
  for (let i = 0; i <= 6; i++) modules[SIZE - 1 - i][8] = bits[i] as 0 | 1;
  for (let i = 7; i <= 14; i++) modules[8][SIZE - 15 + i] = bits[i] as 0 | 1;
}

function penalty(modules: Grid): number {
  let score = 0;
  // Rule 1: runs of 5+
  for (let r = 0; r < SIZE; r++) {
    for (let dir = 0; dir < 2; dir++) {
      let run = 1;
      let prev = -1;
      for (let c = 0; c < SIZE; c++) {
        const v = dir === 0 ? modules[r][c] : modules[c][r];
        if (v === prev) {
          run++;
          if (run === 5) score += 3;
          else if (run > 5) score += 1;
        } else {
          run = 1;
          prev = v;
        }
      }
    }
  }
  // Rule 3: finder-like patterns
  const pattern = [1, 0, 1, 1, 1, 0, 1];
  const check = (cells: number[]) => {
    for (let i = 0; i + 7 <= cells.length; i++) {
      let match = true;
      for (let k = 0; k < 7; k++) if (cells[i + k] !== pattern[k]) { match = false; break; }
      if (match) score += 40;
    }
  };
  for (let r = 0; r < SIZE; r++) {
    const row: number[] = [];
    const col: number[] = [];
    for (let c = 0; c < SIZE; c++) {
      row.push(modules[r][c]);
      col.push(modules[c][r]);
    }
    check(row);
    check(col);
  }
  // Rule 4: dark ratio
  let dark = 0;
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (modules[r][c] === 1) dark++;
  const ratio = (dark * 100) / (SIZE * SIZE);
  score += Math.floor(Math.abs(ratio - 50) / 5) * 10;
  return score;
}

/** Returns the QR code as a boolean matrix (true = dark module). */
export function qrMatrix(text: string): boolean[][] {
  const { modules, reserved } = emptyGrid();
  placeFunctionPatterns(modules, reserved);
  placeData(modules, reserved, interleave(buildCodewords(text)));

  let best: Grid | null = null;
  let bestScore = Infinity;
  let bestMask = 0;
  for (let mask = 0; mask < 8; mask++) {
    const masked = applyMask(modules, reserved, mask);
    placeFormat(masked, mask);
    const score = penalty(masked);
    if (score < bestScore) {
      bestScore = score;
      best = masked;
      bestMask = mask;
    }
  }
  const finalGrid = applyMask(modules, reserved, bestMask);
  placeFormat(finalGrid, bestMask);
  void best;
  return finalGrid.map((row) => Array.from(row, (v) => v === 1));
}

/** Renders the QR code as a self-contained, theme-aware SVG string. */
export function qrSvg(text: string, options?: { size?: number; quiet?: number }): string {
  const matrix = qrMatrix(text);
  const quiet = options?.quiet ?? 2;
  const dim = matrix.length + quiet * 2;
  const px = options?.size ?? 132;
  const cell = px / dim;
  let rects = "";
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        const x = ((c + quiet) * cell).toFixed(2);
        const y = ((r + quiet) * cell).toFixed(2);
        const s = (cell + 0.4).toFixed(2);
        rects += `<rect x="${x}" y="${y}" width="${s}" height="${s}"/>`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}" role="img" aria-label="QR verification code"><rect width="${px}" height="${px}" fill="#ffffff"/><g fill="#0b0f0e">${rects}</g></svg>`;
}
