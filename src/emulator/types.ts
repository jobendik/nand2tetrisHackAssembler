// ─── Hack Architecture Constants ─────────────────────────────────────────

export const ROM_SIZE = 32768;
export const RAM_SIZE = 32768;
export const SCREEN_BASE = 16384;
export const SCREEN_END = 24576;
export const KBD_ADDR = 24576;
export const SCREEN_ROWS = 256;
export const SCREEN_COLS = 512;
export const SCREEN_WORDS_PER_ROW = 32;

export const PREDEFINED_SYMBOLS: Record<string, number> = {
    SP: 0, LCL: 1, ARG: 2, THIS: 3, THAT: 4,
    R0: 0, R1: 1, R2: 2, R3: 3, R4: 4, R5: 5, R6: 6, R7: 7,
    R8: 8, R9: 9, R10: 10, R11: 11, R12: 12, R13: 13, R14: 14, R15: 15,
    SCREEN: 16384, KBD: 24576,
};

// ─── Source Map ──────────────────────────────────────────────────────────

export interface SourceMapEntry {
    src: string;       // cleaned source line (e.g. "@42" or "D=A")
    lineNum: number;   // 1-based line number in original source
    lineIdx: number;   // 0-based line index in original source
    bin: string;       // 16-bit binary string
}

export interface AssemblyResult {
    rom: number[];
    sourceMap: SourceMapEntry[];
}

// ─── ALU Introspection ───────────────────────────────────────────────────

export interface ALUInspection {
    zx: number; nx: number; zy: number; ny: number; f: number; no: number;
    xIn: number;     // D register value (raw input to ALU)
    yIn: number;     // A or M value (raw input to ALU)
    xAfter: number;  // x after zx/nx
    yAfter: number;  // y after zy/ny
    fOut: number;    // output of f stage (before no)
    result: number;  // final ALU output
    zr: boolean;     // zero flag
    ng: boolean;     // negative flag
}

// ─── Step Result ─────────────────────────────────────────────────────────

export interface StepResult {
    isA: boolean;
    instruction: number;
    prevPC: number;
    newPC: number;

    // A-instruction fields
    aValue?: number;

    // C-instruction fields
    aFlag?: number;      // a-bit (0=use A, 1=use M)
    comp?: number;       // 6-bit comp field
    dest?: number;       // 3-bit dest field
    jump?: number;       // 3-bit jump field
    compStr?: string;    // human-readable comp (e.g. "D+A")
    destStr?: string;    // human-readable dest (e.g. "MD")
    jumpStr?: string;    // human-readable jump (e.g. "JGT")
    aBefore?: number;    // A register before dest writes
    xInput?: number;     // D value fed to ALU
    yInput?: number;     // A or M value fed to ALU
    aluResult?: number;  // ALU output
    destNames?: string[];// which destinations were written (e.g. ["D", "RAM[42]"])
    jumped?: boolean;    // whether jump was taken
    alu?: ALUInspection; // full ALU introspection
}

// ─── Micro-Step ──────────────────────────────────────────────────────────

export const MICRO_STAGES_A = ['FETCH', 'DECODE', 'LOAD A', 'PC+1'] as const;
export const MICRO_STAGES_C = ['FETCH', 'DECODE', 'SEL Y', 'COMPUTE', 'WRITE', 'JUMP/PC'] as const;

export type MicroStageNameA = typeof MICRO_STAGES_A[number];
export type MicroStageNameC = typeof MICRO_STAGES_C[number];

export interface MicroStepData {
    isA: boolean;
    instruction: number;
    prevPC: number;
    srcLineIdx: number;

    // A-instruction
    aValue?: number;

    // C-instruction (pre-computed at start of instruction)
    aFlag?: number;
    comp?: number;
    dest?: number;
    jump?: number;
    aBefore?: number;
    mVal?: number;
    xInput?: number;
    yInput?: number;
    aluResult?: number;
    jumped?: boolean;
    jumpTarget?: number;
    alu?: ALUInspection;
}
