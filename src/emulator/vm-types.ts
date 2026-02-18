// ─── VM Architecture Types ───────────────────────────────────────────────
// Covers Projects 7 (arithmetic + push/pop) and 8 (branching + functions)

// ─── Memory Segments ─────────────────────────────────────────────────────

export type MemorySegment =
    | 'constant' | 'local' | 'argument' | 'this' | 'that'
    | 'temp' | 'pointer' | 'static';

// Segment base addresses in RAM
// local, argument, this, that → pointer stored at RAM[1..4]
// temp → fixed at RAM[5..12]
// pointer → RAM[3..4] (THIS/THAT)
// static → RAM[16..255]
export const SEGMENT_POINTER_ADDR: Record<string, number> = {
    local: 1,     // LCL
    argument: 2,  // ARG
    this: 3,      // THIS
    that: 4,      // THAT
};

export const TEMP_BASE = 5;
export const STATIC_BASE = 16;
export const STACK_BASE = 256;

// ─── VM Command Types ────────────────────────────────────────────────────

export type VMCommandType =
    // Arithmetic-Logical (Project 7)
    | 'add' | 'sub' | 'neg' | 'eq' | 'gt' | 'lt' | 'and' | 'or' | 'not'
    // Memory Access (Project 7)
    | 'push' | 'pop'
    // Branching (Project 8)
    | 'label' | 'goto' | 'if-goto'
    // Function (Project 8)
    | 'function' | 'call' | 'return';

export interface VMCommand {
    type: VMCommandType;
    arg1?: string;         // segment or label/function name
    arg2?: number;         // index
    raw: string;           // original source line
    lineIdx: number;       // 0-based line index
}

// ─── VM Step Result ──────────────────────────────────────────────────────

export interface SegmentAccess {
    segment: string;
    index: number;
    ramAddr: number;
    value: number;
}

export interface StackChange {
    action: 'push' | 'pop';
    value: number;
    source?: string;       // e.g. "constant", "local[2]", "add result"
}

export interface FunctionFrame {
    name: string;
    returnAddr: number;
    savedLCL: number;
    savedARG: number;
    savedTHIS: number;
    savedTHAT: number;
    nLocals: number;
}

export interface VMStepResult {
    command: VMCommand;
    stackBefore: number[];
    stackAfter: number[];
    stackChanges: StackChange[];
    segmentAccess?: SegmentAccess;
    ramWrites: { addr: number; oldVal: number; newVal: number }[];
    generatedASM: string[];

    // Pointers before/after
    spBefore: number;
    spAfter: number;

    // For function commands
    frameAction?: 'call' | 'return';
    frame?: FunctionFrame;

    // For branching
    jumpTaken?: boolean;
    jumpTarget?: number;
}

// ─── Arithmetic command metadata ─────────────────────────────────────────

export const ARITHMETIC_COMMANDS = new Set([
    'add', 'sub', 'neg', 'eq', 'gt', 'lt', 'and', 'or', 'not',
]);

export const BINARY_OPS = new Set(['add', 'sub', 'eq', 'gt', 'lt', 'and', 'or']);
export const UNARY_OPS = new Set(['neg', 'not']);
