// ─── VM Explain Module ───────────────────────────────────────────────────
// Generates plain-language educational explanations for every VM command.
// This is the core pedagogical feature — makes the abstract concrete.

import type { VMStepResult } from '../emulator/vm-types';

function fmtVal(v: number): string {
    const hex = ((v & 0xFFFF) >>> 0).toString(16).toUpperCase().padStart(4, '0');
    return `<strong>${v}</strong> <span class="vm-hex">(0x${hex})</span>`;
}

function segmentName(seg: string): string {
    const names: Record<string, string> = {
        local: 'local', argument: 'argument', this: 'this', that: 'that',
        temp: 'temp', pointer: 'pointer', static: 'static', constant: 'constant',
    };
    return names[seg] ?? seg;
}

function segmentExplanation(seg: string): string {
    const explanations: Record<string, string> = {
        constant: 'A virtual segment — the value is embedded directly in the command.',
        local: 'Stores the function\'s local variables. Base address at RAM[LCL].',
        argument: 'Stores the arguments passed to the current function. Base address at RAM[ARG].',
        this: 'Points to the current object (used for OOP). Base address at RAM[THIS].',
        that: 'Points to array elements or another object. Base address at RAM[THAT].',
        temp: 'Fixed 8-register segment at RAM[5]–RAM[12]. Shared across all functions.',
        pointer: 'Direct access to THIS (pointer 0) and THAT (pointer 1) base addresses.',
        static: 'Per-file static variables starting at RAM[16]. Persists across function calls.',
    };
    return explanations[seg] ?? '';
}

/** Generate a full HTML explanation for one VM step */
export function explainVMStep(r: VMStepResult): string {
    const parts: string[] = [];
    const cmd = r.command;

    parts.push(`<div class="vm-explain-title"><code>${cmd.raw}</code></div>`);
    parts.push(`<div class="vm-explain-body">`);

    switch (cmd.type) {
        // ───── Arithmetic ─────
        case 'add': case 'sub': case 'and': case 'or': {
            const opNames: Record<string, string> = { add: 'adds', sub: 'subtracts', and: 'ANDs', or: 'ORs' };
            const opSyms: Record<string, string> = { add: '+', sub: '-', and: '&', or: '|' };
            const y = r.stackChanges[0]?.value ?? 0;
            const x = r.stackChanges[1]?.value ?? 0;
            const result = r.stackChanges[2]?.value ?? 0;

            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">1.</span> Pop the top value: ${fmtVal(y)} (y)`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">2.</span> Pop the second value: ${fmtVal(x)} (x)`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">3.</span> Compute x ${opSyms[cmd.type]} y = ${x} ${opSyms[cmd.type]} ${y} = ${fmtVal(result)}`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">4.</span> Push result ${fmtVal(result)} onto the stack`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-note">💡 The <code>${cmd.type}</code> command ${opNames[cmd.type]} two values and replaces them with one — the stack shrinks by 1.</div>`);
            break;
        }

        case 'eq': case 'gt': case 'lt': {
            const opSyms: Record<string, string> = { eq: '==', gt: '>', lt: '<' };
            const y = r.stackChanges[0]?.value ?? 0;
            const x = r.stackChanges[1]?.value ?? 0;
            const result = r.stackChanges[2]?.value ?? 0;
            const cond = result !== 0;

            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">1.</span> Pop the top value: ${fmtVal(y)} (y)`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">2.</span> Pop the second value: ${fmtVal(x)} (x)`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">3.</span> Compare: ${x} ${opSyms[cmd.type]} ${y} → <strong class="${cond ? 'vm-true' : 'vm-false'}">${cond ? 'TRUE' : 'FALSE'}</strong>`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">4.</span> Push ${fmtVal(result)} (${cond ? '-1 = true' : '0 = false'})`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-note">💡 In Hack, <strong>true = -1</strong> (all bits 1 = 0xFFFF) and <strong>false = 0</strong>.</div>`);
            break;
        }

        case 'neg': case 'not': {
            const before = r.stackChanges[0]?.value ?? 0;
            const after = r.stackChanges[1]?.value ?? 0;
            const opName = cmd.type === 'neg' ? 'arithmetic negation' : 'bitwise NOT';

            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">1.</span> Pop the top value: ${fmtVal(before)}`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">2.</span> Apply ${opName}: ${cmd.type === 'neg' ? `-${before}` : `~${before}`} = ${fmtVal(after)}`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">3.</span> Push result ${fmtVal(after)} onto the stack`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-note">💡 <code>${cmd.type}</code> is a unary operator — it replaces the top value in-place (stack size unchanged).</div>`);
            break;
        }

        // ───── Memory Access ─────
        case 'push': {
            const seg = cmd.arg1!;
            const idx = cmd.arg2!;
            const val = r.stackChanges[0]?.value ?? 0;

            parts.push(`<div class="vm-step-desc">`);

            if (seg === 'constant') {
                parts.push(`<span class="vm-step-num">1.</span> The value ${fmtVal(idx)} is a constant — it exists only in the VM command, not in RAM.`);
                parts.push(`</div>`);
                parts.push(`<div class="vm-step-desc">`);
                parts.push(`<span class="vm-step-num">2.</span> Push ${fmtVal(idx)} onto the stack at RAM[${r.spBefore}]`);
                parts.push(`</div>`);
            } else {
                const access = r.segmentAccess;
                parts.push(`<span class="vm-step-num">1.</span> Calculate address: <code>${seg}[${idx}]</code> → RAM[${access?.ramAddr ?? '?'}]`);
                parts.push(`</div>`);
                parts.push(`<div class="vm-step-desc">`);
                parts.push(`<span class="vm-step-num">2.</span> Read value ${fmtVal(val)} from RAM[${access?.ramAddr ?? '?'}]`);
                parts.push(`</div>`);
                parts.push(`<div class="vm-step-desc">`);
                parts.push(`<span class="vm-step-num">3.</span> Push ${fmtVal(val)} onto the stack at RAM[${r.spBefore}]`);
                parts.push(`</div>`);
            }

            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">→</span> SP: ${r.spBefore} → ${r.spAfter}`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-note">💡 <strong>${segmentName(seg)}</strong>: ${segmentExplanation(seg)}</div>`);
            break;
        }

        case 'pop': {
            const seg = cmd.arg1!;
            const idx = cmd.arg2!;
            const val = r.stackChanges[0]?.value ?? 0;
            const access = r.segmentAccess;

            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">1.</span> Calculate target address: <code>${seg}[${idx}]</code> → RAM[${access?.ramAddr ?? '?'}]`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">2.</span> Pop ${fmtVal(val)} from the top of the stack`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">3.</span> Store ${fmtVal(val)} into RAM[${access?.ramAddr ?? '?'}]`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">→</span> SP: ${r.spBefore} → ${r.spAfter}`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-note">💡 <strong>${segmentName(seg)}</strong>: ${segmentExplanation(seg)}</div>`);
            break;
        }

        // ───── Branching ─────
        case 'label':
            parts.push(`<div class="vm-step-desc">Declares a label <code>${cmd.arg1}</code> at this position.</div>`);
            parts.push(`<div class="vm-note">💡 Labels are targets for <code>goto</code> and <code>if-goto</code>. They have no runtime effect — the VM simply moves to the next command.</div>`);
            break;

        case 'goto':
            parts.push(`<div class="vm-step-desc">Unconditionally jumps to label <code>${cmd.arg1}</code>.</div>`);
            if (r.jumpTaken) {
                parts.push(`<div class="vm-step-desc"><span class="vm-true">✓ JUMPED</span> to command #${r.jumpTarget}</div>`);
            }
            parts.push(`<div class="vm-note">💡 <code>goto</code> is an unconditional jump — equivalent to <code>0;JMP</code> in Hack assembly.</div>`);
            break;

        case 'if-goto': {
            const val = r.stackChanges[0]?.value ?? 0;
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">1.</span> Pop the top value: ${fmtVal(val)}`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">2.</span> Test: ${val} ≠ 0 → <strong class="${r.jumpTaken ? 'vm-true' : 'vm-false'}">${r.jumpTaken ? 'TRUE → JUMP' : 'FALSE → continue'}</strong>`);
            parts.push(`</div>`);
            if (r.jumpTaken) {
                parts.push(`<div class="vm-step-desc"><span class="vm-true">✓ JUMPED</span> to label <code>${cmd.arg1}</code> (command #${r.jumpTarget})</div>`);
            } else {
                parts.push(`<div class="vm-step-desc"><span class="vm-false">✗ NO JUMP</span> — continuing to next command</div>`);
            }
            parts.push(`<div class="vm-note">💡 <code>if-goto</code> pops a value and jumps if it's non-zero. This is how loops and conditionals work in the VM.</div>`);
            break;
        }

        // ───── Functions ─────
        case 'function':
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`Declares function <code>${cmd.arg1}</code> with <strong>${cmd.arg2}</strong> local variable${cmd.arg2 !== 1 ? 's' : ''}.`);
            parts.push(`</div>`);
            if (cmd.arg2! > 0) {
                parts.push(`<div class="vm-step-desc">`);
                parts.push(`Pushes ${cmd.arg2} zeros onto the stack to initialize local variables.`);
                parts.push(`</div>`);
            }
            parts.push(`<div class="vm-note">💡 The <code>function</code> command sets up the function's local segment by pushing zeros. LCL points to where these locals begin.</div>`);
            break;

        case 'call': {
            const funcName = cmd.arg1;
            const nArgs = cmd.arg2;
            parts.push(`<div class="vm-step-desc vm-call-title">Calling <code>${funcName}</code> with ${nArgs} argument${nArgs !== 1 ? 's' : ''}</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">1.</span> Push return address onto the stack`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">2.</span> Save caller's frame: push LCL, ARG, THIS, THAT`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">3.</span> Reposition ARG = SP - ${nArgs} - 5 (points to the arguments)`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">4.</span> Set LCL = SP (callee's local segment starts here)`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">5.</span> Jump to <code>${funcName}</code>`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-note">💡 The <code>call</code> command saves the caller's state (the "frame") so it can be restored when the function returns. The 5 saved values (return address + 4 pointers) form the frame header.</div>`);
            break;
        }

        case 'return': {
            parts.push(`<div class="vm-step-desc vm-call-title">Returning from function</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">1.</span> Save LCL into a temp variable (endFrame)`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">2.</span> Get return address from endFrame - 5`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">3.</span> Pop return value → place at *ARG (for the caller)`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">4.</span> SP = ARG + 1 (discard callee's stack)`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">5.</span> Restore THAT, THIS, ARG, LCL from frame`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-step-desc">`);
            parts.push(`<span class="vm-step-num">6.</span> Jump to return address`);
            parts.push(`</div>`);
            parts.push(`<div class="vm-note">💡 <code>return</code> restores everything the <code>call</code> saved. The return value ends up at the top of the caller's stack — exactly where the arguments were.</div>`);
            break;
        }
    }

    parts.push(`</div>`);
    return parts.join('');
}
