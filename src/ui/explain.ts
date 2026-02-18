// ─── Explain Module ──────────────────────────────────────────────────────
// Generates plain-language explanations for every Hack instruction.
// This is the core educational feature — makes the invisible visible.

import type { StepResult } from '../emulator/types';

function s16(v: number): number {
    return ((v << 16) >> 16);
}

function fmtVal(v: number): string {
    const s = s16(v);
    const hex = (v & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    return `${s} <span class="explain-hex">(0x${hex})</span>`;
}

function fmtAddr(addr: number): string {
    if (addr === 24576) return `KBD (24576)`;
    if (addr >= 16384 && addr < 24576) return `Screen[${addr - 16384}] (${addr})`;
    if (addr <= 15) return `R${addr}`;
    if (addr === 0) return 'SP (R0)';
    if (addr === 1) return 'LCL (R1)';
    if (addr === 2) return 'ARG (R2)';
    if (addr === 3) return 'THIS (R3)';
    if (addr === 4) return 'THAT (R4)';
    return `RAM[${addr}]`;
}

/** Generate a full HTML explanation for one step */
export function explainStep(r: StepResult, srcLine: string): string {
    const parts: string[] = [];

    if (r.isA) {
        // A-instruction
        const val = r.aValue ?? 0;
        parts.push(`<div class="explain-title">A-Instruction: <code>${srcLine}</code></div>`);
        parts.push(`<div class="explain-body">`);
        parts.push(`Load <strong>${fmtVal(val)}</strong> into the <strong>A register</strong>.`);

        if (val >= 16384 && val < 24576) {
            parts.push(`<br><span class="explain-note">💡 This points A at screen memory (pixel word ${val - 16384}).</span>`);
        } else if (val === 24576) {
            parts.push(`<br><span class="explain-note">💡 This points A at the keyboard register.</span>`);
        } else if (val <= 15) {
            parts.push(`<br><span class="explain-note">💡 R${val} — general-purpose register.</span>`);
        }

        parts.push(`<br>After: A = ${fmtVal(val)}, so M (RAM[A]) now refers to ${fmtAddr(val)}.`);
        parts.push(`</div>`);
    } else {
        // C-instruction
        const compStr = r.compStr ?? '?';
        const destStr = r.destStr ?? '';
        const jumpStr = r.jumpStr ?? '';
        const aBefore = r.aBefore ?? 0;

        parts.push(`<div class="explain-title">C-Instruction: <code>${srcLine}</code></div>`);
        parts.push(`<div class="explain-body">`);

        // Computation
        parts.push(`<strong>Compute:</strong> ALU calculates <code>${compStr}</code>`);
        if (r.aFlag) {
            parts.push(` — here M means RAM[${aBefore}] = ${fmtVal(r.yInput ?? 0)}`);
        }
        parts.push(` → result = <strong>${fmtVal(r.aluResult ?? 0)}</strong>`);

        // Breakdown of ALU inputs
        parts.push(`<br><span class="explain-detail">D = ${fmtVal(r.xInput ?? 0)}`);
        if (r.aFlag) {
            parts.push(`, M = RAM[${aBefore}] = ${fmtVal(r.yInput ?? 0)}`);
        } else {
            parts.push(`, A = ${fmtVal(r.yInput ?? 0)}`);
        }
        parts.push(`</span>`);

        // Destination
        if (destStr) {
            parts.push(`<br><br><strong>Store:</strong> Write result to `);
            const names = r.destNames ?? [];
            parts.push(names.map(n => `<strong>${n}</strong>`).join(', '));
        } else {
            parts.push(`<br><br><strong>Store:</strong> <em>no destination</em> — result is discarded.`);
        }

        // Jump
        if (jumpStr) {
            const result = r.aluResult ?? 0;
            const jumpDesc: Record<string, string> = {
                'JGT': `result > 0 (${result} > 0 → ${result > 0})`,
                'JEQ': `result == 0 (${result} == 0 → ${result === 0})`,
                'JGE': `result ≥ 0 (${result} ≥ 0 → ${result >= 0})`,
                'JLT': `result < 0 (${result} < 0 → ${result < 0})`,
                'JNE': `result ≠ 0 (${result} ≠ 0 → ${result !== 0})`,
                'JLE': `result ≤ 0 (${result} ≤ 0 → ${result <= 0})`,
                'JMP': `always (unconditional)`,
            };

            parts.push(`<br><br><strong>Jump:</strong> <code>${jumpStr}</code> — `);
            parts.push(jumpDesc[jumpStr] ?? '?');

            if (r.jumped) {
                parts.push(`<br>→ <span class="explain-jump-yes">✓ JUMPED</span> to instruction ${r.newPC}`);
            } else {
                parts.push(`<br>→ <span class="explain-jump-no">✗ NO JUMP</span>, continue to next instruction`);
            }
        }

        parts.push(`</div>`);
    }

    return parts.join('');
}
