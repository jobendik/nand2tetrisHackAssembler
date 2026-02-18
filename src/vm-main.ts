// ─── Hack VM Visualizer ──────────────────────────────────────────────────
// Interactive visualization of the Hack Virtual Machine (Projects 7 & 8)
// Stack operations, memory segments, branching, and function calls

import './styles/main.css';
import { HackVM } from './emulator/vm';
import { STACK_BASE, SEGMENT_POINTER_ADDR, TEMP_BASE, STATIC_BASE } from './emulator/vm-types';
import type { VMStepResult } from './emulator/vm-types';
import { explainVMStep } from './ui/vm-explain';
import { VM_SAMPLES } from './data/vm-samples';

// ═══════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════
const vm = new HackVM();
let running = false;
let totalSteps = 0;
let lastResult: VMStepResult | null = null;
let animatingPush = false;
let animatingPop = false;
let animValue = 0;
let animSource = '';
let animTimer: number | null = null;

const SPEED_PRESETS = [
    { label: '1/s', delay: 1000 },
    { label: '3/s', delay: 333 },
    { label: '10/s', delay: 100 },
    { label: '30/s', delay: 33 },
    { label: 'MAX', delay: 0 },
];
let activeSpeedIdx = 0;

// ═══════════════════════════════════════════════════════════════════
// BUILD DOM
// ═══════════════════════════════════════════════════════════════════
const app = document.getElementById('app')!;

app.innerHTML = `
<!-- Top Bar -->
<div class="topbar">
  <div class="topbar-left">
    <span class="topbar-logo">🖥 Hack VM</span>
    <select id="vm-sample-select" class="sample-select">
      <option value="">— Load Sample —</option>
    </select>
    <button class="btn btn-primary" id="vm-btn-load">⚡ LOAD</button>
    <a class="btn btn-mode-switch" id="btn-switch-asm" href="/" title="Switch to ASM Debugger">ASM Mode →</a>
  </div>
  <div class="topbar-center">
    <button class="btn" id="vm-btn-step" title="Execute one VM command">STEP</button>
    <button class="btn btn-run" id="vm-btn-run" title="Run continuously">▶ RUN</button>
    <button class="btn" id="vm-btn-pause" title="Pause execution">⏸ PAUSE</button>
    <button class="btn btn-danger" id="vm-btn-reset" title="Reset VM state">⏹ RESET</button>
    <div class="btn-sep"></div>
    <div class="speed-group" id="vm-speed-group"></div>
  </div>
  <div class="topbar-right">
    <span class="stat-pill" id="vm-stat-steps">0 steps</span>
    <span class="stat-pill" id="vm-stat-state">STOPPED</span>
  </div>
</div>

<!-- Main 3-Column Layout -->
<div class="main-layout">
  <!-- LEFT: VM Code Editor + Explain -->
  <div class="col col-left">
    <div class="panel editor-panel">
      <div class="panel-hdr">
        <span class="panel-title">VM Code</span>
        <span class="panel-subtitle" id="vm-cmd-count">0 commands</span>
      </div>
      <div class="editor-wrapper">
        <div class="gutter vm-gutter" id="vm-gutter"></div>
        <textarea class="code-editor vm-code-editor" id="vm-code-editor" spellcheck="false" wrap="off"></textarea>
      </div>
    </div>
    <div class="panel explain-panel">
      <div class="panel-hdr">
        <span class="panel-title">💡 What Just Happened</span>
      </div>
      <div class="panel-body" id="vm-explain-body">
        <div class="explain-placeholder">Click <strong>STEP</strong> to execute one VM command.<br>A plain-language explanation will appear here.</div>
      </div>
    </div>
  </div>

  <!-- CENTER: Stack Visualizer + Generated ASM -->
  <div class="col col-center">
    <div class="panel vm-stack-panel">
      <div class="panel-hdr">
        <span class="panel-title">📚 Stack</span>
        <span class="panel-subtitle" id="vm-sp-display">SP = 256</span>
      </div>
      <div class="panel-body vm-stack-body" id="vm-stack-body">
        <div class="vm-stack-empty">Stack is empty. Load a program and step through it.</div>
      </div>
    </div>
    <div class="panel vm-asm-panel">
      <div class="panel-hdr">
        <span class="panel-title">🔧 Generated ASM</span>
        <span class="panel-subtitle">What the VM → ASM translator produces</span>
      </div>
      <div class="panel-body vm-asm-body" id="vm-asm-body">
        <div class="explain-placeholder">The Hack assembly code generated for each VM command will appear here.</div>
      </div>
    </div>
  </div>

  <!-- RIGHT: Memory Segments + RAM Watch + Call Stack -->
  <div class="col col-right">
    <div class="panel vm-segments-panel">
      <div class="panel-hdr">
        <span class="panel-title">📦 Memory Segments</span>
      </div>
      <div class="panel-body" id="vm-segments-body"></div>
    </div>
    <div class="panel vm-callstack-panel">
      <div class="panel-hdr">
        <span class="panel-title">📞 Call Stack</span>
      </div>
      <div class="panel-body" id="vm-callstack-body">
        <div class="vm-callstack-empty">No active function calls.</div>
      </div>
    </div>
    <div class="panel ram-panel">
      <div class="panel-hdr">
        <span class="panel-title">RAM Pointers</span>
      </div>
      <div class="panel-body ram-body" id="vm-ram-body"></div>
    </div>
  </div>
</div>
`;

// ═══════════════════════════════════════════════════════════════════
// DOM REFS
// ═══════════════════════════════════════════════════════════════════
const $ = (id: string) => document.getElementById(id)!;
const codeEditor = $('vm-code-editor') as HTMLTextAreaElement;
const gutter = $('vm-gutter');
const stackBody = $('vm-stack-body');
const asmBody = $('vm-asm-body');
const explainBody = $('vm-explain-body');
const segmentsBody = $('vm-segments-body');
const callstackBody = $('vm-callstack-body');
const ramBody = $('vm-ram-body');

// ═══════════════════════════════════════════════════════════════════
// SAMPLE SELECTOR
// ═══════════════════════════════════════════════════════════════════
const sampleSelect = $('vm-sample-select') as HTMLSelectElement;
let lastCategory = '';
for (let i = 0; i < VM_SAMPLES.length; i++) {
    const s = VM_SAMPLES[i];
    if (s.category !== lastCategory) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = s.category;
        lastCategory = s.category;
        for (let j = i; j < VM_SAMPLES.length && VM_SAMPLES[j].category === s.category; j++) {
            const opt = document.createElement('option');
            opt.value = String(j);
            opt.textContent = VM_SAMPLES[j].title;
            optgroup.appendChild(opt);
        }
        sampleSelect.appendChild(optgroup);
    }
}

sampleSelect.addEventListener('change', () => {
    const idx = parseInt(sampleSelect.value);
    if (!isNaN(idx) && VM_SAMPLES[idx]) {
        codeEditor.value = VM_SAMPLES[idx].code;
        updateGutter();
    }
});

// ═══════════════════════════════════════════════════════════════════
// SPEED PRESETS
// ═══════════════════════════════════════════════════════════════════
const speedGroup = $('vm-speed-group');
SPEED_PRESETS.forEach((preset, i) => {
    const btn = document.createElement('button');
    btn.className = 'btn speed-btn' + (i === 0 ? ' active' : '');
    btn.textContent = preset.label;
    btn.addEventListener('click', () => {
        activeSpeedIdx = i;
        speedGroup.querySelectorAll('.speed-btn').forEach((b, j) => {
            b.classList.toggle('active', j === i);
        });
    });
    speedGroup.appendChild(btn);
});

// ═══════════════════════════════════════════════════════════════════
// EDITOR
// ═══════════════════════════════════════════════════════════════════
codeEditor.value = VM_SAMPLES[0].code;

function updateGutter(): void {
    const lines = codeEditor.value.split('\n');
    let html = '';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].replace(/\/\/.*/, '').trim();
        const isCmd = line.length > 0;
        html += `<div class="gutter-line${isCmd ? '' : ' gutter-comment'}" data-line="${i}">${i + 1}</div>`;
    }
    gutter.innerHTML = html;
}

codeEditor.addEventListener('input', updateGutter);
codeEditor.addEventListener('scroll', () => {
    gutter.scrollTop = codeEditor.scrollTop;
});
updateGutter();

// ═══════════════════════════════════════════════════════════════════
// LOAD & RESET
// ═══════════════════════════════════════════════════════════════════
$('vm-btn-load').addEventListener('click', doLoad);

function doLoad(): void {
    try {
        const source = codeEditor.value;
        vm.load(source);

        // Apply init segments from sample
        const idx = parseInt(sampleSelect.value);
        if (!isNaN(idx) && VM_SAMPLES[idx]) {
            const sample = VM_SAMPLES[idx];
            if (sample.initSP) vm.SP = sample.initSP;
            if (sample.initSegments) {
                if (sample.initSegments.local) vm.LCL = sample.initSegments.local[0];
                if (sample.initSegments.argument) vm.ARG = sample.initSegments.argument[0];
                if (sample.initSegments.this) vm.THIS = sample.initSegments.this[0];
                if (sample.initSegments.that) vm.THAT = sample.initSegments.that[0];
            }
        }

        totalSteps = 0;
        running = false;
        lastResult = null;
        $('vm-cmd-count').textContent = `${vm.commands.length} commands`;
        explainBody.innerHTML = '<div class="explain-placeholder">Program loaded! Click <strong>STEP</strong> to begin.</div>';
        renderAll();
    } catch (e: any) {
        explainBody.innerHTML = `<div class="explain-error">❌ Parse Error: ${escHtml(e.message)}</div>`;
    }
}

$('vm-btn-reset').addEventListener('click', () => {
    running = false;
    doLoad();
});

// ═══════════════════════════════════════════════════════════════════
// STEP & RUN
// ═══════════════════════════════════════════════════════════════════
$('vm-btn-step').addEventListener('click', () => {
    running = false;
    doStep();
});

$('vm-btn-run').addEventListener('click', () => { running = true; });
$('vm-btn-pause').addEventListener('click', () => { running = false; });

function doStep(): void {
    if (vm.halted || vm.cmdIndex >= vm.commands.length) return;

    lastResult = vm.stepDetailed();
    totalSteps++;

    // Highlight current line in editor
    highlightLine(lastResult.command.lineIdx);

    // Trigger stack animation
    if (lastResult.stackChanges.length > 0) {
        const lastChange = lastResult.stackChanges[lastResult.stackChanges.length - 1];
        if (lastChange.action === 'push') {
            triggerPushAnimation(lastChange.value, lastChange.source || '');
        } else {
            triggerPopAnimation(lastChange.value, lastChange.source || '');
        }
    }

    // Update explain
    explainBody.innerHTML = explainVMStep(lastResult);

    // Update generated ASM
    renderGeneratedASM(lastResult);

    renderAll();
}

function highlightLine(lineIdx: number): void {
    if (lineIdx < 0) return;
    const lines = codeEditor.value.split('\n');
    let start = 0;
    for (let i = 0; i < lineIdx && i < lines.length; i++) {
        start += lines[i].length + 1;
    }
    const end = start + (lines[lineIdx]?.length ?? 0);
    codeEditor.focus();
    codeEditor.setSelectionRange(start, end);
    codeEditor.blur();

    // Highlight in gutter
    gutter.querySelectorAll('.gutter-line').forEach((el) => {
        (el as HTMLElement).classList.remove('gutter-active');
    });
    const gutterLine = gutter.querySelector(`[data-line="${lineIdx}"]`);
    if (gutterLine) (gutterLine as HTMLElement).classList.add('gutter-active');
}

// ═══════════════════════════════════════════════════════════════════
// STACK ANIMATIONS
// ═══════════════════════════════════════════════════════════════════
function triggerPushAnimation(value: number, source: string): void {
    animatingPush = true;
    animatingPop = false;
    animValue = value;
    animSource = source;
    if (animTimer) clearTimeout(animTimer);
    animTimer = window.setTimeout(() => {
        animatingPush = false;
        animTimer = null;
    }, 400);
}

function triggerPopAnimation(value: number, source: string): void {
    animatingPop = true;
    animatingPush = false;
    animValue = value;
    animSource = source;
    if (animTimer) clearTimeout(animTimer);
    animTimer = window.setTimeout(() => {
        animatingPop = false;
        animTimer = null;
    }, 400);
}

// ═══════════════════════════════════════════════════════════════════
// RENDER: STACK
// ═══════════════════════════════════════════════════════════════════
function s16(v: number): number {
    v = v & 0xFFFF;
    return v >= 0x8000 ? v - 0x10000 : v;
}

function renderStack(): void {
    const stack = vm.getStackContents();
    if (stack.length === 0) {
        stackBody.innerHTML = '<div class="vm-stack-empty">Stack is empty</div>';
        $('vm-sp-display').textContent = `SP = ${vm.SP}`;
        return;
    }

    let html = '<div class="vm-stack-container">';

    // SP indicator at top
    html += `<div class="vm-sp-indicator">← SP = ${vm.SP}</div>`;

    // Render stack top-to-bottom (top of stack first)
    for (let i = stack.length - 1; i >= 0; i--) {
        const val = stack[i];
        const addr = STACK_BASE + i;
        const isTop = i === stack.length - 1;
        const hex = ((val & 0xFFFF) >>> 0).toString(16).toUpperCase().padStart(4, '0');

        let classes = 'vm-stack-item';
        if (isTop && animatingPush) classes += ' vm-stack-push-anim';
        if (isTop && animatingPop) classes += ' vm-stack-pop-anim';
        if (isTop) classes += ' vm-stack-top';

        // Color-code by origin/type
        let color = '';
        if (val === 0) color = 'vm-stack-zero';
        else if (val === -1) color = 'vm-stack-true';
        else if (val < 0) color = 'vm-stack-negative';
        else color = 'vm-stack-positive';

        // Check if this is part of a saved frame
        const frameInfo = getFrameInfo(addr);

        html += `<div class="${classes} ${color}">`;
        html += `  <span class="vm-stack-addr">RAM[${addr}]</span>`;
        html += `  <span class="vm-stack-val">${val}</span>`;
        html += `  <span class="vm-stack-hex">0x${hex}</span>`;
        if (frameInfo) {
            html += `  <span class="vm-stack-frame-label">${frameInfo}</span>`;
        }
        html += `</div>`;
    }

    html += '</div>';
    stackBody.innerHTML = html;
    $('vm-sp-display').textContent = `SP = ${vm.SP}`;

    // Auto-scroll to top
    stackBody.scrollTop = 0;
}

function getFrameInfo(addr: number): string | null {
    // Check if this address is a known frame header component
    const lcl = vm.LCL;
    if (addr === lcl - 1) return '⟵ saved THAT';
    if (addr === lcl - 2) return '⟵ saved THIS';
    if (addr === lcl - 3) return '⟵ saved ARG';
    if (addr === lcl - 4) return '⟵ saved LCL';
    if (addr === lcl - 5) return '⟵ return addr';
    return null;
}

// ═══════════════════════════════════════════════════════════════════
// RENDER: GENERATED ASM
// ═══════════════════════════════════════════════════════════════════
function renderGeneratedASM(result: VMStepResult): void {
    const lines = result.generatedASM;
    let html = '<div class="vm-asm-listing">';
    for (const line of lines) {
        const isComment = line.trim().startsWith('//');
        const isLabel = line.trim().startsWith('(');
        let cls = 'vm-asm-line';
        if (isComment) cls += ' vm-asm-comment';
        else if (isLabel) cls += ' vm-asm-label';

        html += `<div class="${cls}">${escHtml(line)}</div>`;
    }
    html += '</div>';
    html += `<div class="vm-asm-count">${lines.filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('(')).length} assembly instructions</div>`;
    asmBody.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════
// RENDER: MEMORY SEGMENTS
// ═══════════════════════════════════════════════════════════════════
function renderSegments(): void {
    let html = '';

    // Segment cards
    const segments: { name: string; key: string; color: string }[] = [
        { name: 'local', key: 'local', color: 'var(--accent-blue)' },
        { name: 'argument', key: 'argument', color: 'var(--accent-green)' },
        { name: 'this', key: 'this', color: 'var(--accent-orange)' },
        { name: 'that', key: 'that', color: 'var(--accent-purple)' },
        { name: 'temp', key: 'temp', color: 'var(--accent-cyan)' },
        { name: 'pointer', key: 'pointer', color: 'var(--accent-yellow)' },
        { name: 'static', key: 'static', color: 'var(--accent-red)' },
    ];

    for (const seg of segments) {
        const data = vm.getSegmentContents(seg.key, 6);
        const isAccessed = lastResult?.segmentAccess?.segment === seg.key;

        html += `<div class="vm-seg-card${isAccessed ? ' vm-seg-accessed' : ''}" style="--seg-color: ${seg.color}">`;
        html += `  <div class="vm-seg-header">`;
        html += `    <span class="vm-seg-name">${seg.name}</span>`;

        // Show base pointer info
        if (seg.key in SEGMENT_POINTER_ADDR) {
            const ptrAddr = SEGMENT_POINTER_ADDR[seg.key];
            const ptrName = ['SP', 'LCL', 'ARG', 'THIS', 'THAT'][ptrAddr];
            html += `    <span class="vm-seg-base">base: ${ptrName} = ${data.addr}</span>`;
        } else if (seg.key === 'temp') {
            html += `    <span class="vm-seg-base">fixed: R5–R12</span>`;
        } else if (seg.key === 'pointer') {
            html += `    <span class="vm-seg-base">R3 (THIS), R4 (THAT)</span>`;
        } else if (seg.key === 'static') {
            html += `    <span class="vm-seg-base">RAM[16]+</span>`;
        }

        html += `  </div>`;
        html += `  <div class="vm-seg-values">`;

        for (let i = 0; i < data.values.length; i++) {
            const val = data.values[i];
            const addr = data.addr + i;
            const isActive = lastResult?.segmentAccess?.segment === seg.key
                && lastResult?.segmentAccess?.index === i;

            html += `<div class="vm-seg-value${isActive ? ' vm-seg-active' : ''}${val !== 0 ? ' vm-seg-nonzero' : ''}">`;
            html += `  <span class="vm-seg-idx">[${i}]</span>`;
            html += `  <span class="vm-seg-val">${val}</span>`;
            html += `  <span class="vm-seg-addr">RAM[${addr}]</span>`;
            html += `</div>`;
        }

        html += `  </div>`;
        html += `</div>`;
    }

    segmentsBody.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════
// RENDER: CALL STACK
// ═══════════════════════════════════════════════════════════════════
function renderCallStack(): void {
    const frames = vm.callStack;
    if (frames.length === 0) {
        callstackBody.innerHTML = `<div class="vm-callstack-empty">
            <div class="vm-callstack-current">${vm.currentFunction}</div>
            <div class="vm-callstack-hint">Function call frames will appear here when <code>call</code> is executed.</div>
        </div>`;
        return;
    }

    let html = '';

    // Current function (top of call stack)
    html += `<div class="vm-callframe vm-callframe-current">`;
    html += `  <div class="vm-callframe-name">▶ ${vm.currentFunction}</div>`;
    html += `  <div class="vm-callframe-info">LCL=${vm.LCL} ARG=${vm.ARG}</div>`;
    html += `</div>`;

    // Previous frames
    for (let i = frames.length - 1; i >= 0; i--) {
        const f = frames[i];
        html += `<div class="vm-callframe">`;
        html += `  <div class="vm-callframe-name">${f.name}</div>`;
        html += `  <div class="vm-callframe-info">saved: LCL=${f.savedLCL} ARG=${f.savedARG}</div>`;
        html += `  <div class="vm-callframe-info">retAddr=${f.returnAddr}</div>`;
        html += `</div>`;
    }

    callstackBody.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════
// RENDER: RAM POINTERS
// ═══════════════════════════════════════════════════════════════════
function renderRAMPointers(): void {
    const pointers = [
        { name: 'SP', addr: 0, color: 'var(--accent-green)' },
        { name: 'LCL', addr: 1, color: 'var(--accent-blue)' },
        { name: 'ARG', addr: 2, color: 'var(--accent-orange)' },
        { name: 'THIS', addr: 3, color: 'var(--accent-purple)' },
        { name: 'THAT', addr: 4, color: 'var(--accent-cyan)' },
    ];

    let html = '';
    for (const p of pointers) {
        const val = s16(vm.ram[p.addr]);
        const changed = lastResult && (
            (p.addr === 0 && lastResult.spBefore !== lastResult.spAfter) ||
            vm.writeAddrs.has(p.addr)
        );

        html += `<div class="vm-ptr-row${changed ? ' vm-ptr-changed' : ''}" style="--ptr-color: ${p.color}">`;
        html += `  <span class="vm-ptr-name">${p.name}</span>`;
        html += `  <span class="vm-ptr-eq">=</span>`;
        html += `  <span class="vm-ptr-val">${val}</span>`;
        html += `  <span class="vm-ptr-desc">RAM[${p.addr}] → points to RAM[${val}]</span>`;
        html += `</div>`;
    }

    // Temp registers
    html += `<div class="vm-ptr-section">Temp (R5–R12)</div>`;
    for (let i = 0; i < 8; i++) {
        const val = s16(vm.ram[TEMP_BASE + i]);
        if (val !== 0) {
            html += `<div class="vm-ptr-row">`;
            html += `  <span class="vm-ptr-name">R${TEMP_BASE + i}</span>`;
            html += `  <span class="vm-ptr-eq">=</span>`;
            html += `  <span class="vm-ptr-val">${val}</span>`;
            html += `</div>`;
        }
    }

    ramBody.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════
// RENDER ALL
// ═══════════════════════════════════════════════════════════════════
function renderAll(): void {
    renderStack();
    renderSegments();
    renderCallStack();
    renderRAMPointers();
    updateStats();
}

function updateStats(): void {
    $('vm-stat-steps').textContent = `${totalSteps} steps`;
    const stateEl = $('vm-stat-state');
    if (vm.halted) {
        stateEl.textContent = 'HALTED';
        stateEl.className = 'stat-pill stopped';
    } else {
        stateEl.textContent = running ? 'RUNNING' : 'STOPPED';
        stateEl.className = 'stat-pill ' + (running ? 'running' : 'stopped');
    }
}

function escHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ═══════════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════════
let lastRunTime = 0;

function mainLoop(ts: number): void {
    requestAnimationFrame(mainLoop);

    if (running && !vm.halted) {
        const delay = SPEED_PRESETS[activeSpeedIdx].delay;

        if (delay === 0) {
            // MAX speed
            for (let i = 0; i < 100; i++) {
                if (vm.halted || vm.cmdIndex >= vm.commands.length) {
                    running = false;
                    break;
                }
                lastResult = vm.stepDetailed();
                totalSteps++;
            }
        } else if (ts - lastRunTime >= delay) {
            lastRunTime = ts;
            doStep();
        }

        renderAll();

        if (delay === 0 && lastResult) {
            explainBody.innerHTML = explainVMStep(lastResult);
            renderGeneratedASM(lastResult);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('keydown', (e) => {
    if (document.activeElement === codeEditor) return;
    if (e.key === ' ') { e.preventDefault(); doStep(); return; }
    if (e.key === 'r' && !e.ctrlKey) { running = true; return; }
    if (e.key === 'p') { running = false; return; }
});

// ═══════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════
doLoad();
requestAnimationFrame(mainLoop);
