// ─── Hack VM Engine ──────────────────────────────────────────────────────
// Full VM implementation covering Projects 7 (arithmetic + push/pop)
// and Project 8 (branching + functions).
// Operates directly on the stack-based architecture with full introspection.

import type {
    VMCommand, VMCommandType, VMStepResult, StackChange,
    SegmentAccess, FunctionFrame,
} from './vm-types';
import {
    SEGMENT_POINTER_ADDR, TEMP_BASE, STATIC_BASE, STACK_BASE,
    ARITHMETIC_COMMANDS, BINARY_OPS, UNARY_OPS,
} from './vm-types';

// ─── Parser ──────────────────────────────────────────────────────────────

export function parseVM(source: string): VMCommand[] {
    const lines = source.split('\n');
    const commands: VMCommand[] = [];

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const stripped = raw.replace(/\/\/.*/, '').trim();
        if (stripped.length === 0) continue;

        const parts = stripped.split(/\s+/);
        const type = parts[0] as VMCommandType;

        const cmd: VMCommand = { type, raw: stripped, lineIdx: i };

        if (type === 'push' || type === 'pop') {
            cmd.arg1 = parts[1];
            cmd.arg2 = parseInt(parts[2], 10);
        } else if (type === 'label' || type === 'goto' || type === 'if-goto') {
            cmd.arg1 = parts[1];
        } else if (type === 'function') {
            cmd.arg1 = parts[1];
            cmd.arg2 = parseInt(parts[2], 10);
        } else if (type === 'call') {
            cmd.arg1 = parts[1];
            cmd.arg2 = parseInt(parts[2], 10);
        }
        // 'return' and arithmetic have no args

        commands.push(cmd);
    }

    return commands;
}

// ─── VM Executor ─────────────────────────────────────────────────────────

function s16(v: number): number {
    v = v & 0xFFFF;
    return v >= 0x8000 ? v - 0x10000 : v;
}

export class HackVM {
    ram = new Int16Array(32768);
    commands: VMCommand[] = [];
    cmdIndex = 0;
    halted = false;
    currentFunction = 'global';
    labelMap = new Map<string, number>(); // label → command index
    callStack: FunctionFrame[] = [];
    staticFileName = 'Main';

    // For tracking
    readAddrs = new Set<number>();
    writeAddrs = new Set<number>();

    // Internal label counter for eq/gt/lt
    private _cmpCounter = 0;

    get SP(): number { return this.ram[0]; }
    set SP(v: number) { this.ram[0] = v; }
    get LCL(): number { return this.ram[1]; }
    set LCL(v: number) { this.ram[1] = v; }
    get ARG(): number { return this.ram[2]; }
    set ARG(v: number) { this.ram[2] = v; }
    get THIS(): number { return this.ram[3]; }
    set THIS(v: number) { this.ram[3] = v; }
    get THAT(): number { return this.ram[4]; }
    set THAT(v: number) { this.ram[4] = v; }

    reset(): void {
        this.ram.fill(0);
        this.SP = STACK_BASE;
        this.cmdIndex = 0;
        this.halted = false;
        this.currentFunction = 'global';
        this.callStack = [];
        this._cmpCounter = 0;
        this.readAddrs.clear();
        this.writeAddrs.clear();
    }

    load(source: string): void {
        this.commands = parseVM(source);
        this.buildLabelMap();
        this.reset();
    }

    private buildLabelMap(): void {
        this.labelMap.clear();
        for (let i = 0; i < this.commands.length; i++) {
            const cmd = this.commands[i];
            if (cmd.type === 'label') {
                const fullLabel = `${this.currentFunction}$${cmd.arg1}`;
                this.labelMap.set(fullLabel, i + 1); // point to next command
                this.labelMap.set(cmd.arg1!, i + 1); // also store bare label
            } else if (cmd.type === 'function') {
                this.currentFunction = cmd.arg1!;
                this.labelMap.set(cmd.arg1!, i);
            }
        }
        this.currentFunction = 'global';
    }

    private push(val: number): void {
        this.ram[this.SP] = val;
        this.writeAddrs.add(this.SP);
        this.SP++;
    }

    private pop(): number {
        this.SP--;
        const val = s16(this.ram[this.SP]);
        this.readAddrs.add(this.SP);
        return val;
    }

    private peek(): number {
        return s16(this.ram[this.SP - 1]);
    }

    private getSegmentAddr(segment: string, index: number): number {
        switch (segment) {
            case 'local':
            case 'argument':
            case 'this':
            case 'that': {
                const basePtr = SEGMENT_POINTER_ADDR[segment];
                return s16(this.ram[basePtr]) + index;
            }
            case 'temp':
                return TEMP_BASE + index;
            case 'pointer':
                return 3 + index; // THIS=3, THAT=4
            case 'static':
                return STATIC_BASE + index;
            default:
                return 0;
        }
    }

    getStackContents(): number[] {
        const result: number[] = [];
        for (let i = STACK_BASE; i < this.SP && i < 32768; i++) {
            result.push(s16(this.ram[i]));
        }
        return result;
    }

    getSegmentContents(segment: string, maxLen = 8): { addr: number; values: number[] } {
        let baseAddr: number;
        let len: number;

        switch (segment) {
            case 'local':
            case 'argument':
            case 'this':
            case 'that': {
                const ptrAddr = SEGMENT_POINTER_ADDR[segment];
                baseAddr = s16(this.ram[ptrAddr]);
                len = maxLen;
                break;
            }
            case 'temp':
                baseAddr = TEMP_BASE;
                len = 8;
                break;
            case 'pointer':
                baseAddr = 3;
                len = 2;
                break;
            case 'static':
                baseAddr = STATIC_BASE;
                len = maxLen;
                break;
            default:
                return { addr: 0, values: [] };
        }

        const values: number[] = [];
        for (let i = 0; i < len; i++) {
            values.push(s16(this.ram[baseAddr + i]));
        }
        return { addr: baseAddr, values };
    }

    stepDetailed(): VMStepResult {
        if (this.halted || this.cmdIndex >= this.commands.length) {
            this.halted = true;
            return this.makeHaltedResult();
        }

        this.readAddrs.clear();
        this.writeAddrs.clear();

        const cmd = this.commands[this.cmdIndex];
        const stackBefore = this.getStackContents();
        const spBefore = this.SP;
        const ramWrites: VMStepResult['ramWrites'] = [];
        const stackChanges: StackChange[] = [];
        let segmentAccess: SegmentAccess | undefined;
        let frameAction: VMStepResult['frameAction'];
        let frame: VMStepResult['frame'];
        let jumpTaken: boolean | undefined;
        let jumpTarget: number | undefined;

        // Track RAM writes
        const trackWrite = (addr: number, oldVal: number, newVal: number) => {
            ramWrites.push({ addr, oldVal, newVal });
        };

        switch (cmd.type) {
            // ───── Arithmetic-Logical (Project 7) ─────
            case 'add': case 'sub': case 'and': case 'or': {
                const b = this.pop();
                const a = this.pop();
                let result: number;
                switch (cmd.type) {
                    case 'add': result = s16((a + b) & 0xFFFF); break;
                    case 'sub': result = s16((a - b) & 0xFFFF); break;
                    case 'and': result = s16((a & b) & 0xFFFF); break;
                    case 'or': result = s16((a | b) & 0xFFFF); break;
                    default: result = 0;
                }
                stackChanges.push({ action: 'pop', value: b, source: 'y (top)' });
                stackChanges.push({ action: 'pop', value: a, source: 'x (second)' });
                this.push(result);
                stackChanges.push({ action: 'push', value: result, source: `${cmd.type} result` });
                break;
            }

            case 'eq': case 'gt': case 'lt': {
                const b = this.pop();
                const a = this.pop();
                let cond: boolean;
                switch (cmd.type) {
                    case 'eq': cond = a === b; break;
                    case 'gt': cond = a > b; break;
                    case 'lt': cond = a < b; break;
                    default: cond = false;
                }
                const result = cond ? -1 : 0; // true = -1 (0xFFFF), false = 0
                stackChanges.push({ action: 'pop', value: b, source: 'y (top)' });
                stackChanges.push({ action: 'pop', value: a, source: 'x (second)' });
                this.push(result);
                stackChanges.push({ action: 'push', value: result, source: `${cmd.type}: ${a} ${cmd.type === 'eq' ? '==' : cmd.type === 'gt' ? '>' : '<'} ${b} → ${cond}` });
                this._cmpCounter++;
                break;
            }

            case 'neg': {
                const a = this.pop();
                const result = s16((-a) & 0xFFFF);
                stackChanges.push({ action: 'pop', value: a });
                this.push(result);
                stackChanges.push({ action: 'push', value: result, source: 'neg result' });
                break;
            }

            case 'not': {
                const a = this.pop();
                const result = s16((~a) & 0xFFFF);
                stackChanges.push({ action: 'pop', value: a });
                this.push(result);
                stackChanges.push({ action: 'push', value: result, source: 'not result' });
                break;
            }

            // ───── Memory Access (Project 7) ─────
            case 'push': {
                const seg = cmd.arg1!;
                const idx = cmd.arg2!;
                let value: number;

                if (seg === 'constant') {
                    value = idx;
                    stackChanges.push({ action: 'push', value, source: `constant ${idx}` });
                } else {
                    const addr = this.getSegmentAddr(seg, idx);
                    value = s16(this.ram[addr]);
                    this.readAddrs.add(addr);
                    segmentAccess = { segment: seg, index: idx, ramAddr: addr, value };
                    stackChanges.push({ action: 'push', value, source: `${seg}[${idx}] (RAM[${addr}])` });
                }
                this.push(value);
                break;
            }

            case 'pop': {
                const seg = cmd.arg1!;
                const idx = cmd.arg2!;
                const addr = this.getSegmentAddr(seg, idx);
                const value = this.pop();
                const oldVal = s16(this.ram[addr]);
                this.ram[addr] = value;
                this.writeAddrs.add(addr);
                segmentAccess = { segment: seg, index: idx, ramAddr: addr, value };
                trackWrite(addr, oldVal, value);
                stackChanges.push({ action: 'pop', value, source: `→ ${seg}[${idx}] (RAM[${addr}])` });
                break;
            }

            // ───── Branching (Project 8) ─────
            case 'label':
                // No runtime effect — labels are resolved at load
                break;

            case 'goto': {
                const label = cmd.arg1!;
                const target = this.resolveLabel(label);
                if (target !== undefined) {
                    this.cmdIndex = target;
                    jumpTaken = true;
                    jumpTarget = target;
                    // Return early — don't increment cmdIndex
                    return {
                        command: cmd,
                        stackBefore,
                        stackAfter: this.getStackContents(),
                        stackChanges,
                        ramWrites,
                        generatedASM: this.generateASM(cmd),
                        spBefore,
                        spAfter: this.SP,
                        jumpTaken: true,
                        jumpTarget: target,
                    };
                }
                break;
            }

            case 'if-goto': {
                const label = cmd.arg1!;
                const val = this.pop();
                stackChanges.push({ action: 'pop', value: val, source: 'condition' });
                if (val !== 0) {
                    const target = this.resolveLabel(label);
                    if (target !== undefined) {
                        this.cmdIndex = target;
                        jumpTaken = true;
                        jumpTarget = target;
                        return {
                            command: cmd,
                            stackBefore,
                            stackAfter: this.getStackContents(),
                            stackChanges,
                            ramWrites,
                            generatedASM: this.generateASM(cmd),
                            spBefore,
                            spAfter: this.SP,
                            jumpTaken: true,
                            jumpTarget: target,
                        };
                    }
                }
                jumpTaken = false;
                break;
            }

            // ───── Function Commands (Project 8) ─────
            case 'function': {
                const funcName = cmd.arg1!;
                const nLocals = cmd.arg2!;
                this.currentFunction = funcName;
                // Push nLocals 0s
                for (let i = 0; i < nLocals; i++) {
                    this.push(0);
                    stackChanges.push({ action: 'push', value: 0, source: `local[${i}] init` });
                }
                break;
            }

            case 'call': {
                const funcName = cmd.arg1!;
                const nArgs = cmd.arg2!;
                const returnAddr = this.cmdIndex + 1;

                // Save frame
                const savedLCL = this.LCL;
                const savedARG = this.ARG;
                const savedTHIS = this.THIS;
                const savedTHAT = this.THAT;

                this.push(returnAddr);
                stackChanges.push({ action: 'push', value: returnAddr, source: 'return address' });
                this.push(this.LCL);
                stackChanges.push({ action: 'push', value: this.LCL, source: 'saved LCL' });
                this.push(this.ARG);
                stackChanges.push({ action: 'push', value: this.ARG, source: 'saved ARG' });
                this.push(this.THIS);
                stackChanges.push({ action: 'push', value: this.THIS, source: 'saved THIS' });
                this.push(this.THAT);
                stackChanges.push({ action: 'push', value: this.THAT, source: 'saved THAT' });

                this.ARG = this.SP - nArgs - 5;
                this.LCL = this.SP;

                frame = {
                    name: funcName,
                    returnAddr,
                    savedLCL, savedARG, savedTHIS, savedTHAT,
                    nLocals: 0,
                };
                this.callStack.push(frame);
                frameAction = 'call';

                // Jump to function
                const target = this.labelMap.get(funcName);
                if (target !== undefined) {
                    this.cmdIndex = target;
                    return {
                        command: cmd,
                        stackBefore,
                        stackAfter: this.getStackContents(),
                        stackChanges,
                        ramWrites,
                        generatedASM: this.generateASM(cmd),
                        spBefore,
                        spAfter: this.SP,
                        frameAction,
                        frame,
                        jumpTaken: true,
                        jumpTarget: target,
                    };
                }
                break;
            }

            case 'return': {
                const endFrame = this.LCL;
                const retAddr = s16(this.ram[endFrame - 5]);
                const retVal = this.pop();
                stackChanges.push({ action: 'pop', value: retVal, source: 'return value' });

                this.ram[this.ARG] = retVal;
                trackWrite(this.ARG, 0, retVal);
                this.SP = this.ARG + 1;

                this.THAT = s16(this.ram[endFrame - 1]);
                this.THIS = s16(this.ram[endFrame - 2]);
                this.ARG = s16(this.ram[endFrame - 3]);
                this.LCL = s16(this.ram[endFrame - 4]);

                frameAction = 'return';
                if (this.callStack.length > 0) {
                    frame = this.callStack.pop();
                }

                if (retAddr >= 0 && retAddr < this.commands.length) {
                    this.cmdIndex = retAddr;
                } else {
                    this.halted = true;
                }

                return {
                    command: cmd,
                    stackBefore,
                    stackAfter: this.getStackContents(),
                    stackChanges,
                    ramWrites,
                    generatedASM: this.generateASM(cmd),
                    spBefore,
                    spAfter: this.SP,
                    frameAction,
                    frame,
                };
            }
        }

        this.cmdIndex++;

        return {
            command: cmd,
            stackBefore,
            stackAfter: this.getStackContents(),
            stackChanges,
            segmentAccess,
            ramWrites,
            generatedASM: this.generateASM(cmd),
            spBefore,
            spAfter: this.SP,
            frameAction,
            frame,
            jumpTaken,
            jumpTarget,
        };
    }

    private resolveLabel(label: string): number | undefined {
        // Try function-scoped label first
        const scoped = `${this.currentFunction}$${label}`;
        if (this.labelMap.has(scoped)) return this.labelMap.get(scoped)!;
        if (this.labelMap.has(label)) return this.labelMap.get(label)!;
        return undefined;
    }

    private makeHaltedResult(): VMStepResult {
        return {
            command: { type: 'add', raw: '(halted)', lineIdx: -1 },
            stackBefore: this.getStackContents(),
            stackAfter: this.getStackContents(),
            stackChanges: [],
            ramWrites: [],
            generatedASM: ['// Program halted'],
            spBefore: this.SP,
            spAfter: this.SP,
        };
    }

    // ─── ASM Generation ──────────────────────────────────────────────────
    // Shows the student what Hack assembly this VM command translates to

    generateASM(cmd: VMCommand): string[] {
        const lines: string[] = [];
        const l = (s: string) => lines.push(s);

        switch (cmd.type) {
            case 'push': {
                const seg = cmd.arg1!;
                const idx = cmd.arg2!;

                l(`// push ${seg} ${idx}`);

                if (seg === 'constant') {
                    l(`@${idx}`);
                    l(`D=A`);
                } else if (seg === 'temp') {
                    l(`@${TEMP_BASE + idx}`);
                    l(`D=M`);
                } else if (seg === 'pointer') {
                    l(`@${idx === 0 ? 'THIS' : 'THAT'}`);
                    l(`D=M`);
                } else if (seg === 'static') {
                    l(`@${this.staticFileName}.${idx}`);
                    l(`D=M`);
                } else {
                    // local, argument, this, that
                    const ptr = seg === 'local' ? 'LCL' : seg === 'argument' ? 'ARG' : seg === 'this' ? 'THIS' : 'THAT';
                    l(`@${ptr}`);
                    l(`D=M`);
                    l(`@${idx}`);
                    l(`A=D+A`);
                    l(`D=M`);
                }
                // Push D onto stack
                l(`@SP`);
                l(`A=M`);
                l(`M=D`);
                l(`@SP`);
                l(`M=M+1`);
                break;
            }

            case 'pop': {
                const seg = cmd.arg1!;
                const idx = cmd.arg2!;

                l(`// pop ${seg} ${idx}`);

                if (seg === 'temp') {
                    l(`@SP`);
                    l(`AM=M-1`);
                    l(`D=M`);
                    l(`@${TEMP_BASE + idx}`);
                    l(`M=D`);
                } else if (seg === 'pointer') {
                    l(`@SP`);
                    l(`AM=M-1`);
                    l(`D=M`);
                    l(`@${idx === 0 ? 'THIS' : 'THAT'}`);
                    l(`M=D`);
                } else if (seg === 'static') {
                    l(`@SP`);
                    l(`AM=M-1`);
                    l(`D=M`);
                    l(`@${this.staticFileName}.${idx}`);
                    l(`M=D`);
                } else {
                    const ptr = seg === 'local' ? 'LCL' : seg === 'argument' ? 'ARG' : seg === 'this' ? 'THIS' : 'THAT';
                    l(`@${ptr}`);
                    l(`D=M`);
                    l(`@${idx}`);
                    l(`D=D+A`);
                    l(`@R13`);
                    l(`M=D`);
                    l(`@SP`);
                    l(`AM=M-1`);
                    l(`D=M`);
                    l(`@R13`);
                    l(`A=M`);
                    l(`M=D`);
                }
                break;
            }

            case 'add':
                l(`// add`);
                l(`@SP`); l(`AM=M-1`); l(`D=M`);
                l(`A=A-1`); l(`M=D+M`);
                break;

            case 'sub':
                l(`// sub`);
                l(`@SP`); l(`AM=M-1`); l(`D=M`);
                l(`A=A-1`); l(`M=M-D`);
                break;

            case 'neg':
                l(`// neg`);
                l(`@SP`); l(`A=M-1`); l(`M=-M`);
                break;

            case 'not':
                l(`// not`);
                l(`@SP`); l(`A=M-1`); l(`M=!M`);
                break;

            case 'and':
                l(`// and`);
                l(`@SP`); l(`AM=M-1`); l(`D=M`);
                l(`A=A-1`); l(`M=D&M`);
                break;

            case 'or':
                l(`// or`);
                l(`@SP`); l(`AM=M-1`); l(`D=M`);
                l(`A=A-1`); l(`M=D|M`);
                break;

            case 'eq': case 'gt': case 'lt': {
                const jmp = cmd.type === 'eq' ? 'JEQ' : cmd.type === 'gt' ? 'JGT' : 'JLT';
                const n = this._cmpCounter;
                l(`// ${cmd.type}`);
                l(`@SP`); l(`AM=M-1`); l(`D=M`);
                l(`A=A-1`); l(`D=M-D`);
                l(`@TRUE_${n}`);
                l(`D;${jmp}`);
                l(`@SP`); l(`A=M-1`); l(`M=0`);
                l(`@END_${n}`);
                l(`0;JMP`);
                l(`(TRUE_${n})`);
                l(`@SP`); l(`A=M-1`); l(`M=-1`);
                l(`(END_${n})`);
                break;
            }

            case 'label':
                l(`// label ${cmd.arg1}`);
                l(`(${this.currentFunction}$${cmd.arg1})`);
                break;

            case 'goto':
                l(`// goto ${cmd.arg1}`);
                l(`@${this.currentFunction}$${cmd.arg1}`);
                l(`0;JMP`);
                break;

            case 'if-goto':
                l(`// if-goto ${cmd.arg1}`);
                l(`@SP`); l(`AM=M-1`); l(`D=M`);
                l(`@${this.currentFunction}$${cmd.arg1}`);
                l(`D;JNE`);
                break;

            case 'function': {
                l(`// function ${cmd.arg1} ${cmd.arg2}`);
                l(`(${cmd.arg1})`);
                for (let i = 0; i < cmd.arg2!; i++) {
                    l(`@SP`); l(`A=M`); l(`M=0`); l(`@SP`); l(`M=M+1`);
                }
                break;
            }

            case 'call': {
                const n = this._cmpCounter;
                l(`// call ${cmd.arg1} ${cmd.arg2}`);
                // Push return address
                l(`@RETURN_${cmd.arg1}_${n}`); l(`D=A`);
                l(`@SP`); l(`A=M`); l(`M=D`); l(`@SP`); l(`M=M+1`);
                // Push LCL, ARG, THIS, THAT
                for (const ptr of ['LCL', 'ARG', 'THIS', 'THAT']) {
                    l(`@${ptr}`); l(`D=M`);
                    l(`@SP`); l(`A=M`); l(`M=D`); l(`@SP`); l(`M=M+1`);
                }
                // ARG = SP - nArgs - 5
                l(`@SP`); l(`D=M`);
                l(`@${cmd.arg2! + 5}`); l(`D=D-A`);
                l(`@ARG`); l(`M=D`);
                // LCL = SP
                l(`@SP`); l(`D=M`); l(`@LCL`); l(`M=D`);
                // goto function
                l(`@${cmd.arg1}`); l(`0;JMP`);
                l(`(RETURN_${cmd.arg1}_${n})`);
                break;
            }

            case 'return':
                l(`// return`);
                l(`@LCL`); l(`D=M`); l(`@R13`); l(`M=D`);  // R13 = endFrame
                l(`@5`); l(`A=D-A`); l(`D=M`); l(`@R14`); l(`M=D`);  // R14 = retAddr
                l(`@SP`); l(`AM=M-1`); l(`D=M`);  // pop return value
                l(`@ARG`); l(`A=M`); l(`M=D`);     // *ARG = return value
                l(`@ARG`); l(`D=M+1`); l(`@SP`); l(`M=D`);  // SP = ARG + 1
                // Restore THAT, THIS, ARG, LCL
                l(`@R13`); l(`AM=M-1`); l(`D=M`); l(`@THAT`); l(`M=D`);
                l(`@R13`); l(`AM=M-1`); l(`D=M`); l(`@THIS`); l(`M=D`);
                l(`@R13`); l(`AM=M-1`); l(`D=M`); l(`@ARG`); l(`M=D`);
                l(`@R13`); l(`AM=M-1`); l(`D=M`); l(`@LCL`); l(`M=D`);
                // goto retAddr
                l(`@R14`); l(`A=M`); l(`0;JMP`);
                break;
        }

        return lines;
    }
}
