import { ROM_SIZE, RAM_SIZE } from './types';
import type { StepResult, ALUInspection } from './types';

// ─── Reverse-lookup tables ───────────────────────────────────────────────

const COMP_TO_STR_A: Record<number, string> = {
    0b101010: '0', 0b111111: '1', 0b111010: '-1',
    0b001100: 'D', 0b110000: 'A',
    0b001101: '!D', 0b110001: '!A',
    0b001111: '-D', 0b110011: '-A',
    0b011111: 'D+1', 0b110111: 'A+1',
    0b001110: 'D-1', 0b110010: 'A-1',
    0b000010: 'D+A', 0b010011: 'D-A',
    0b000111: 'A-D', 0b000000: 'D&A', 0b010101: 'D|A',
};

const COMP_TO_STR_M: Record<number, string> = {
    0b110000: 'M', 0b110001: '!M', 0b110011: '-M',
    0b110111: 'M+1', 0b110010: 'M-1',
    0b000010: 'D+M', 0b010011: 'D-M',
    0b000111: 'M-D', 0b000000: 'D&M', 0b010101: 'D|M',
};

const DEST_NAMES: Record<number, string> = {
    0: '', 1: 'M', 2: 'D', 3: 'MD', 4: 'A', 5: 'AM', 6: 'AD', 7: 'AMD',
};

const JUMP_NAMES: Record<number, string> = {
    0: '', 1: 'JGT', 2: 'JEQ', 3: 'JGE', 4: 'JLT', 5: 'JNE', 6: 'JLE', 7: 'JMP',
};

export function compToStr(comp: number, aFlag: number): string {
    if (aFlag) return COMP_TO_STR_M[comp] ?? '?';
    return COMP_TO_STR_A[comp] ?? '?';
}

export function destToStr(dest: number): string {
    return DEST_NAMES[dest] ?? '';
}

export function jumpToStr(jump: number): string {
    return JUMP_NAMES[jump] ?? '';
}

// ─── ALU ─────────────────────────────────────────────────────────────────

function s16(n: number): number {
    n = n & 0xFFFF;
    return n >= 0x8000 ? n - 0x10000 : n;
}

function aluCompute(comp: number, xRaw: number, yRaw: number): number {
    switch (comp) {
        case 0b101010: return 0;
        case 0b111111: return 1;
        case 0b111010: return -1;
        case 0b001100: return xRaw;
        case 0b110000: return yRaw;
        case 0b001101: return ~xRaw;
        case 0b110001: return ~yRaw;
        case 0b001111: return -xRaw;
        case 0b110011: return -yRaw;
        case 0b011111: return xRaw + 1;
        case 0b110111: return yRaw + 1;
        case 0b001110: return xRaw - 1;
        case 0b110010: return yRaw - 1;
        case 0b000010: return xRaw + yRaw;
        case 0b010011: return xRaw - yRaw;
        case 0b000111: return yRaw - xRaw;
        case 0b000000: return xRaw & yRaw;
        case 0b010101: return xRaw | yRaw;
        default: return 0;
    }
}

export function inspectALU(comp: number, x: number, y: number): ALUInspection {
    const zx = (comp >> 5) & 1;
    const nx = (comp >> 4) & 1;
    const zy = (comp >> 3) & 1;
    const ny = (comp >> 2) & 1;
    const f = (comp >> 1) & 1;
    const no = comp & 1;

    const x16 = x & 0xFFFF, y16 = y & 0xFFFF;
    let px = zx ? 0 : x16;
    px = nx ? (~px & 0xFFFF) : px;
    let py = zy ? 0 : y16;
    py = ny ? (~py & 0xFFFF) : py;
    let fOut = f ? ((s16(px) + s16(py)) & 0xFFFF) : (px & py);
    const out = no ? (~fOut & 0xFFFF) : fOut;
    const result = s16(out);

    return {
        zx, nx, zy, ny, f, no,
        xIn: s16(x), yIn: s16(y),
        xAfter: s16(px), yAfter: s16(py),
        fOut: s16(fOut),
        result,
        zr: result === 0,
        ng: result < 0,
    };
}

// ─── Hack Computer ───────────────────────────────────────────────────────

export class HackComputer {
    rom = new Uint16Array(ROM_SIZE);
    ram = new Int16Array(RAM_SIZE);
    A = 0;
    D = 0;
    PC = 0;
    cycles = 0;
    halted = false;

    // Per-frame memory access tracking
    readAddrs = new Set<number>();
    writeAddrs = new Set<number>();

    reset(): void {
        this.ram.fill(0);
        this.A = 0;
        this.D = 0;
        this.PC = 0;
        this.cycles = 0;
        this.halted = false;
        this.readAddrs.clear();
        this.writeAddrs.clear();
    }

    loadROM(data: number[]): void {
        this.rom.fill(0);
        for (let i = 0; i < data.length && i < ROM_SIZE; i++) {
            this.rom[i] = data[i];
        }
    }

    /** Fast step — no introspection (for high-speed run) */
    step(): void {
        if (this.halted) return;
        const inst = this.rom[this.PC];

        if ((inst & 0x8000) === 0) {
            this.A = inst & 0x7FFF;
            this.PC = (this.PC + 1) & 0x7FFF;
        } else {
            const a = (inst >> 12) & 1;
            const c = (inst >> 6) & 0x3F;
            const d = (inst >> 3) & 7;
            const j = inst & 7;

            const addr = this.A & 0x7FFF;
            const aluIn = a === 0 ? this.A : this.ram[addr];
            if (a) this.readAddrs.add(addr);

            let out = s16(aluCompute(c, s16(this.D), s16(aluIn)));

            if (d & 1) { this.ram[addr] = out; this.writeAddrs.add(addr); }
            if (d & 2) this.D = out;
            if (d & 4) this.A = out & 0xFFFF;

            let doJump = false;
            if (j) {
                if ((j & 1) && out > 0) doJump = true;
                if ((j & 2) && out === 0) doJump = true;
                if ((j & 4) && out < 0) doJump = true;
            }

            this.PC = doJump ? (this.A & 0x7FFF) : ((this.PC + 1) & 0x7FFF);
        }
        this.cycles++;
    }

    /** Detailed step — returns full instruction analysis for educational display */
    stepDetailed(): StepResult {
        if (this.halted) {
            return { isA: true, instruction: 0, prevPC: this.PC, newPC: this.PC };
        }

        const inst = this.rom[this.PC];
        const prevPC = this.PC;

        if ((inst & 0x8000) === 0) {
            // A-instruction
            const val = inst & 0x7FFF;
            this.A = val;
            this.PC = (this.PC + 1) & 0x7FFF;
            this.cycles++;

            return {
                isA: true,
                instruction: inst,
                prevPC,
                newPC: this.PC,
                aValue: val,
            };
        } else {
            // C-instruction
            const aBefore = this.A & 0x7FFF;
            const aFlag = (inst >> 12) & 1;
            const comp = (inst >> 6) & 0x3F;
            const dest = (inst >> 3) & 7;
            const jump = inst & 7;

            const mVal = s16(this.ram[aBefore]);
            const xInput = s16(this.D);
            const yInput = aFlag ? mVal : s16(this.A);

            if (aFlag) this.readAddrs.add(aBefore);

            const alu = inspectALU(comp, xInput, yInput);
            const result = alu.result;

            const destNames: string[] = [];
            if (dest & 4) { this.A = result & 0xFFFF; destNames.push('A'); }
            if (dest & 2) { this.D = result; destNames.push('D'); }
            if (dest & 1) {
                this.ram[aBefore] = result;
                this.writeAddrs.add(aBefore);
                destNames.push(`RAM[${aBefore}]`);
            }

            let jumped = false;
            if (jump) {
                if ((jump & 1) && result > 0) jumped = true;
                if ((jump & 2) && result === 0) jumped = true;
                if ((jump & 4) && result < 0) jumped = true;
            }

            this.PC = jumped ? (this.A & 0x7FFF) : ((prevPC + 1) & 0x7FFF);
            this.cycles++;

            return {
                isA: false,
                instruction: inst,
                prevPC,
                newPC: this.PC,
                aFlag,
                comp,
                dest,
                jump,
                compStr: compToStr(comp, aFlag),
                destStr: destToStr(dest),
                jumpStr: jumpToStr(jump),
                aBefore,
                xInput,
                yInput,
                aluResult: result,
                destNames,
                jumped,
                alu,
            };
        }
    }
}
