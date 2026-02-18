import './styles/main.css';
import { HackComputer } from './emulator/cpu';
import { assemble } from './emulator/assembler';
import { SCREEN_BASE } from './emulator/types';
import type { SourceMapEntry, StepResult } from './emulator/types';
import { explainStep } from './ui/explain';
import { SAMPLES } from './data/samples';

// ═══════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════
const hack = new HackComputer();
let sourceMap: SourceMapEntry[] = [];
let sourceLines: string[] = [];
let running = false;
let cyclesPerFrame = 1;
let breakpoints = new Set<number>(); // ROM addresses
let totalCycles = 0;
let lastStep: StepResult | null = null;
let microMode = false;

// Speed presets (cycles per animation frame)
const SPEED_PRESETS = [
    { label: '1/s', cycles: 1 },
    { label: '10/s', cycles: 10 },
    { label: '100/s', cycles: 100 },
    { label: '1K/s', cycles: 1000 },
    { label: '10K/s', cycles: 10000 },
    { label: 'MAX', cycles: 100000 },
];
let activeSpeedIdx = 0;

// FPS counter
let fpsFrames = 0;
let fpsLast = performance.now();
let fpsCurrent = 0;

// RAM watch state
let ramWatchTab: 'registers' | 'aroundA' | 'screen' | 'stack' = 'registers';

// Memory heatmap fade
const readFade = new Float32Array(32768);
const writeFade = new Float32Array(32768);
const FADE_RATE = 0.04;

// ═══════════════════════════════════════════════════════════════════
// BUILD DOM
// ═══════════════════════════════════════════════════════════════════
const app = document.getElementById('app')!;

app.innerHTML = `
<!-- Top Bar -->
<div class="topbar">
  <div class="topbar-left">
    <span class="topbar-logo">⚙ Hack Debugger</span>
    <select id="sample-select" class="sample-select">
      <option value="">— Load Sample —</option>
    </select>
    <button class="btn btn-primary" id="btn-assemble">⚡ ASSEMBLE</button>
  </div>
  <div class="topbar-center">
    <label class="micro-toggle" title="Micro-step: step through individual CPU stages">
      <input type="checkbox" id="chk-micro" />
      <span>MICRO</span>
    </label>
    <div class="btn-sep"></div>
    <button class="btn" id="btn-step" title="Execute one instruction (or one micro-stage in MICRO mode)">STEP</button>
    <button class="btn btn-run" id="btn-run" title="Run continuously">▶ RUN</button>
    <button class="btn" id="btn-pause" title="Pause execution">⏸ PAUSE</button>
    <button class="btn btn-danger" id="btn-reset" title="Reset CPU and RAM to initial state">⏹ RESET</button>
    <div class="btn-sep"></div>
    <div class="speed-group" id="speed-group"></div>
  </div>
  <div class="topbar-right">
    <span class="stat-pill" id="stat-cycles">0 cycles</span>
    <span class="stat-pill" id="stat-state">STOPPED</span>
  </div>
</div>

<!-- Main 3-Column Layout -->
<div class="main-layout">
  <!-- LEFT: Editor + Explain -->
  <div class="col col-left">
    <div class="panel editor-panel">
      <div class="panel-hdr">
        <span class="panel-title">ASM Editor</span>
        <span class="line-info" id="line-info">Ln 1</span>
      </div>
      <div class="editor-wrapper">
        <div class="gutter" id="gutter"></div>
        <textarea class="code-editor" id="code-editor" spellcheck="false" wrap="off"></textarea>
      </div>
    </div>
    <div class="panel explain-panel">
      <div class="panel-hdr">
        <span class="panel-title">💡 Explain</span>
      </div>
      <div class="panel-body" id="explain-body">
        <div class="explain-placeholder">Click <strong>STEP</strong> to execute one instruction.<br>A plain-language explanation will appear here.</div>
      </div>
    </div>
  </div>

  <!-- CENTER: Disassembly + Screen + Memory Map -->
  <div class="col col-center">
    <div class="panel disasm-panel">
      <div class="panel-hdr">
        <span class="panel-title">Disassembly (ROM)</span>
        <span class="panel-subtitle" id="rom-count">0 instructions</span>
      </div>
      <div class="panel-body disasm-scroll" id="disasm-body"></div>
    </div>
    <div class="center-bottom-row">
      <div class="panel screen-panel">
        <div class="panel-hdr">
          <span class="panel-title">Screen (512×256)</span>
        </div>
        <div class="panel-body screen-container">
          <canvas id="screen-canvas" width="512" height="256"></canvas>
        </div>
      </div>
      <div class="panel memmap-panel">
        <div class="panel-hdr">
          <span class="panel-title">Memory Heatmap (32K)</span>
        </div>
        <div class="panel-body memmap-container">
          <canvas id="memmap-canvas" width="256" height="128"></canvas>
        </div>
      </div>
    </div>
  </div>

  <!-- RIGHT: Registers + ALU + RAM Watch -->
  <div class="col col-right">
    <div class="panel reg-panel">
      <div class="panel-hdr">
        <span class="panel-title">CPU Registers</span>
      </div>
      <div class="panel-body" id="reg-body"></div>
    </div>
    <div class="panel instruction-panel">
      <div class="panel-hdr">
        <span class="panel-title">Current Instruction</span>
      </div>
      <div class="panel-body" id="instruction-body"></div>
    </div>
    <div class="panel alu-panel">
      <div class="panel-hdr">
        <span class="panel-title">ALU Inspector</span>
        <button class="panel-toggle" id="alu-toggle">▼</button>
      </div>
      <div class="panel-body alu-body" id="alu-body"></div>
    </div>
    <div class="panel ram-panel">
      <div class="panel-hdr">
        <span class="panel-title">RAM Watch</span>
        <div class="tab-bar" id="ram-tabs">
          <button class="tab active" data-tab="registers">R0–R15</button>
          <button class="tab" data-tab="aroundA">A±8</button>
          <button class="tab" data-tab="stack">Stack</button>
          <button class="tab" data-tab="screen">Screen</button>
        </div>
      </div>
      <div class="panel-body ram-body" id="ram-body"></div>
    </div>
  </div>
</div>
`;

// ═══════════════════════════════════════════════════════════════════
// DOM REFS
// ═══════════════════════════════════════════════════════════════════
const $ = (id: string) => document.getElementById(id)!;
const codeEditor = $('code-editor') as HTMLTextAreaElement;
const gutter = $('gutter');
const disasmBody = $('disasm-body');
const screenCanvas = $('screen-canvas') as HTMLCanvasElement;
const memmapCanvas = $('memmap-canvas') as HTMLCanvasElement;
const explainBody = $('explain-body');
const regBody = $('reg-body');
const instructionBody = $('instruction-body');
const aluBody = $('alu-body');
const ramBody = $('ram-body');

const screenCtx = screenCanvas.getContext('2d')!;
const memmapCtx = memmapCanvas.getContext('2d')!;
const screenImg = screenCtx.createImageData(512, 256);
const memmapImg = memmapCtx.createImageData(256, 128);

// ═══════════════════════════════════════════════════════════════════
// SAMPLE PROGRAM SELECTOR
// ═══════════════════════════════════════════════════════════════════
const sampleSelect = $('sample-select') as HTMLSelectElement;
let lastCategory = '';
for (let i = 0; i < SAMPLES.length; i++) {
    const s = SAMPLES[i];
    if (s.category !== lastCategory) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = s.category;
        lastCategory = s.category;
        // Add all samples in this category
        for (let j = i; j < SAMPLES.length && SAMPLES[j].category === s.category; j++) {
            const opt = document.createElement('option');
            opt.value = String(j);
            opt.textContent = SAMPLES[j].title;
            optgroup.appendChild(opt);
        }
        sampleSelect.appendChild(optgroup);
    }
}

sampleSelect.addEventListener('change', () => {
    const idx = parseInt(sampleSelect.value);
    if (!isNaN(idx) && SAMPLES[idx]) {
        codeEditor.value = SAMPLES[idx].code;
        updateGutter();
    }
});

// ═══════════════════════════════════════════════════════════════════
// SPEED PRESETS
// ═══════════════════════════════════════════════════════════════════
const speedGroup = $('speed-group');
SPEED_PRESETS.forEach((preset, i) => {
    const btn = document.createElement('button');
    btn.className = 'btn speed-btn' + (i === 0 ? ' active' : '');
    btn.textContent = preset.label;
    btn.addEventListener('click', () => {
        activeSpeedIdx = i;
        cyclesPerFrame = preset.cycles;
        speedGroup.querySelectorAll('.speed-btn').forEach((b, j) => {
            b.classList.toggle('active', j === i);
        });
    });
    speedGroup.appendChild(btn);
});

// ═══════════════════════════════════════════════════════════════════
// EDITOR
// ═══════════════════════════════════════════════════════════════════
codeEditor.value = SAMPLES[0].code;

function updateGutter(): void {
    const lines = codeEditor.value.split('\n');
    let html = '';
    for (let i = 0; i < lines.length; i++) {
        html += `<div class="gutter-line" data-line="${i}">${i + 1}</div>`;
    }
    gutter.innerHTML = html;
}

codeEditor.addEventListener('input', updateGutter);
codeEditor.addEventListener('scroll', () => {
    gutter.scrollTop = codeEditor.scrollTop;
});
codeEditor.addEventListener('keyup', () => {
    const pos = codeEditor.selectionStart;
    const lineNum = codeEditor.value.substring(0, pos).split('\n').length;
    $('line-info').textContent = `Ln ${lineNum}`;
});

updateGutter();

// ═══════════════════════════════════════════════════════════════════
// ASSEMBLE & LOAD
// ═══════════════════════════════════════════════════════════════════
$('btn-assemble').addEventListener('click', doAssemble);

function doAssemble(): void {
    try {
        sourceLines = codeEditor.value.split('\n');
        const result = assemble(codeEditor.value);
        sourceMap = result.sourceMap;
        hack.reset();
        hack.loadROM(result.rom);
        breakpoints.clear();
        totalCycles = 0;
        running = false;
        lastStep = null;
        readFade.fill(0);
        writeFade.fill(0);
        buildDisassembly();
        explainBody.innerHTML = '<div class="explain-placeholder">Program assembled! Click <strong>STEP</strong> to begin.</div>';
        $('rom-count').textContent = `${sourceMap.length} instructions`;
    } catch (e: any) {
        explainBody.innerHTML = `<div class="explain-error">❌ Assembly Error: ${escHtml(e.message)}</div>`;
    }
}

// ═══════════════════════════════════════════════════════════════════
// DISASSEMBLY VIEW
// ═══════════════════════════════════════════════════════════════════
function buildDisassembly(): void {
    disasmBody.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (let i = 0; i < sourceMap.length; i++) {
        const entry = sourceMap[i];
        const div = document.createElement('div');
        div.className = 'dline';
        div.dataset.addr = String(i);

        const instVal = parseInt(entry.bin, 2);
        const hexStr = instVal.toString(16).toUpperCase().padStart(4, '0');
        const binStr = entry.bin;

        // Format: [BP] ADDR  HEX  BIN  SOURCE
        div.innerHTML = `<span class="bp-dot" title="Click to toggle breakpoint">●</span><span class="d-addr">${i.toString(16).toUpperCase().padStart(4, '0')}</span><span class="d-hex">${hexStr}</span><span class="d-bin">${binStr.substring(0, 3)} <em>${binStr.substring(3, 10)}</em> ${binStr.substring(10, 13)} ${binStr.substring(13)}</span><span class="d-src">${escHtml(entry.src)}</span>`;

        div.addEventListener('click', () => toggleBreakpoint(div, i));
        frag.appendChild(div);
    }
    disasmBody.appendChild(frag);
}

function escHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toggleBreakpoint(div: HTMLDivElement, addr: number): void {
    if (breakpoints.has(addr)) {
        breakpoints.delete(addr);
        div.classList.remove('breakpoint');
    } else {
        breakpoints.add(addr);
        div.classList.add('breakpoint');
    }
}

function scrollToPC(): void {
    const lines = disasmBody.children;
    for (let i = 0; i < lines.length; i++) {
        const el = lines[i] as HTMLElement;
        const addr = parseInt(el.dataset.addr!);
        if (addr === hack.PC) {
            el.classList.add('current');
            const body = disasmBody;
            const eTop = el.offsetTop;
            const eBot = eTop + el.offsetHeight;
            const sTop = body.scrollTop;
            const sBot = sTop + body.clientHeight;
            if (eTop < sTop || eBot > sBot) {
                body.scrollTop = eTop - body.clientHeight / 3;
            }
        } else {
            el.classList.remove('current');
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// CONTROLS
// ═══════════════════════════════════════════════════════════════════
$('btn-step').addEventListener('click', () => {
    running = false;
    doStep();
});

$('btn-run').addEventListener('click', () => { running = true; });
$('btn-pause').addEventListener('click', () => { running = false; });
$('btn-reset').addEventListener('click', () => {
    running = false;
    hack.reset();
    totalCycles = 0;
    lastStep = null;
    readFade.fill(0);
    writeFade.fill(0);
    explainBody.innerHTML = '<div class="explain-placeholder">CPU reset. Click <strong>STEP</strong> to begin.</div>';
});

$('chk-micro').addEventListener('change', (e) => {
    microMode = (e.target as HTMLInputElement).checked;
});

function doStep(): void {
    hack.readAddrs.clear();
    hack.writeAddrs.clear();
    lastStep = hack.stepDetailed();
    totalCycles++;

    // Update explain panel
    const srcLine = sourceMap[lastStep.prevPC]?.src ?? '?';
    explainBody.innerHTML = explainStep(lastStep, srcLine);

    // Highlight source line in editor
    highlightSourceLine(lastStep.prevPC);
}

function highlightSourceLine(romAddr: number): void {
    const entry = sourceMap[romAddr];
    if (!entry) return;
    const lineIdx = entry.lineIdx;
    const lines = codeEditor.value.split('\n');
    let start = 0;
    for (let i = 0; i < lineIdx && i < lines.length; i++) {
        start += lines[i].length + 1;
    }
    const end = start + (lines[lineIdx]?.length ?? 0);
    codeEditor.focus();
    codeEditor.setSelectionRange(start, end);
    // blur so the selection doesn't capture keyboard
    codeEditor.blur();
}

// ═══════════════════════════════════════════════════════════════════
// KEYBOARD I/O
// ═══════════════════════════════════════════════════════════════════
const KEY_MAP: Record<string, number> = {
    Enter: 128, Backspace: 129, ArrowLeft: 130, ArrowUp: 131,
    ArrowRight: 132, ArrowDown: 133, Home: 134, End: 135,
    PageUp: 136, PageDown: 137, Insert: 138, Delete: 139, Escape: 140,
    F1: 141, F2: 142, F3: 143, F4: 144, F5: 145, F6: 146,
    F7: 147, F8: 148, F9: 149, F10: 150, F11: 151, F12: 152,
};

document.addEventListener('keydown', (e) => {
    if (document.activeElement === codeEditor) return;
    // Space = step, key shortcuts
    if (e.key === ' ') { e.preventDefault(); doStep(); return; }
    if (e.key === 'r' && !e.ctrlKey) { running = true; return; }
    if (e.key === 'p') { running = false; return; }

    let code = 0;
    if (KEY_MAP[e.key] !== undefined) code = KEY_MAP[e.key];
    else if (e.key.length === 1) code = e.key.charCodeAt(0);
    if (code) hack.ram[24576] = code;
});

document.addEventListener('keyup', (e) => {
    if (document.activeElement === codeEditor) return;
    hack.ram[24576] = 0;
});

// ═══════════════════════════════════════════════════════════════════
// RAM WATCH TABS
// ═══════════════════════════════════════════════════════════════════
$('ram-tabs').addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('tab')) {
        ramWatchTab = target.dataset.tab as any;
        $('ram-tabs').querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
        target.classList.add('active');
    }
});

// ═══════════════════════════════════════════════════════════════════
// ALU TOGGLE
// ═══════════════════════════════════════════════════════════════════
let aluCollapsed = false;
$('alu-toggle').addEventListener('click', () => {
    aluCollapsed = !aluCollapsed;
    aluBody.style.display = aluCollapsed ? 'none' : '';
    $('alu-toggle').textContent = aluCollapsed ? '▶' : '▼';
});

// ═══════════════════════════════════════════════════════════════════
// RENDER: REGISTERS
// ═══════════════════════════════════════════════════════════════════
function hex16(v: number): string {
    return ((v & 0xFFFF) >>> 0).toString(16).toUpperCase().padStart(4, '0');
}

function bin16(v: number): string {
    return ((v & 0xFFFF) >>> 0).toString(2).padStart(16, '0');
}

function s16(v: number): number {
    v = v & 0xFFFF;
    return v >= 0x8000 ? v - 0x10000 : v;
}

let prevA = 0, prevD = 0, prevPC = 0;

function renderRegisters(): void {
    const a = hack.A & 0xFFFF;
    const d = s16(hack.D);
    const pc = hack.PC;
    const mAddr = hack.A & 0x7FFF;
    const mVal = s16(hack.ram[mAddr]);

    const aFlash = a !== prevA ? ' flash' : '';
    const dFlash = d !== s16(prevD) ? ' flash' : '';
    const pcFlash = pc !== prevPC ? ' flash' : '';

    regBody.innerHTML = `
    <div class="reg-row">
      <div class="reg-box${aFlash}">
        <div class="reg-name">A</div>
        <div class="reg-val">${s16(a)}</div>
        <div class="reg-sub">0x${hex16(a)}</div>
      </div>
      <div class="reg-box${dFlash}">
        <div class="reg-name">D</div>
        <div class="reg-val">${d}</div>
        <div class="reg-sub">0x${hex16(hack.D)}</div>
      </div>
      <div class="reg-box${pcFlash}">
        <div class="reg-name">PC</div>
        <div class="reg-val">${pc}</div>
        <div class="reg-sub">0x${hex16(pc)}</div>
      </div>
    </div>
    <div class="m-ribbon">
      <span class="m-label">M ≡ RAM[A]</span>
      <span class="m-detail">RAM[${mAddr}] = <strong>${mVal}</strong> (0x${hex16(mVal)})</span>
    </div>`;

    prevA = a;
    prevD = hack.D;
    prevPC = pc;
}

// ═══════════════════════════════════════════════════════════════════
// RENDER: CURRENT INSTRUCTION
// ═══════════════════════════════════════════════════════════════════
function renderCurrentInstruction(): void {
    const pc = hack.PC;
    const inst = hack.rom[pc];
    const binStr = ((inst & 0xFFFF) >>> 0).toString(2).padStart(16, '0');
    const srcLine = sourceMap[pc]?.src ?? '—';

    if ((inst & 0x8000) === 0) {
        // A-instruction
        const val = inst & 0x7FFF;
        instructionBody.innerHTML = `
        <div class="inst-type a-type">A-Instruction</div>
        <div class="inst-src"><code>@${val}</code></div>
        <div class="inst-binary">
          <span class="bit-a">0</span><span class="bit-value">${binStr.substring(1)}</span>
        </div>
        <div class="inst-fields">
          <span class="field-label">value</span> = ${val}
        </div>`;
    } else {
        // C-instruction
        const aFlag = (inst >> 12) & 1;
        const comp = (inst >> 6) & 0x3F;
        const dest = (inst >> 3) & 7;
        const jump = inst & 7;

        instructionBody.innerHTML = `
        <div class="inst-type c-type">C-Instruction</div>
        <div class="inst-src"><code>${escHtml(srcLine)}</code></div>
        <div class="inst-binary">
          <span class="bit-c">111</span><span class="bit-a">${aFlag}</span> <span class="bit-comp">${binStr.substring(4, 10)}</span> <span class="bit-dest">${binStr.substring(10, 13)}</span> <span class="bit-jump">${binStr.substring(13)}</span>
        </div>
        <div class="inst-fields">
          <span class="field-label">a</span>=${aFlag} (${aFlag ? 'use M' : 'use A'})
          <span class="field-label">comp</span>=${binStr.substring(4, 10)}
          <span class="field-label">dest</span>=${binStr.substring(10, 13)}
          <span class="field-label">jump</span>=${binStr.substring(13)}
        </div>`;
    }
}

// ═══════════════════════════════════════════════════════════════════
// RENDER: ALU INSPECTOR
// ═══════════════════════════════════════════════════════════════════
function renderALU(): void {
    if (!lastStep || lastStep.isA || !lastStep.alu) {
        aluBody.innerHTML = '<div class="alu-empty">No C-instruction yet — step through one to see the ALU.</div>';
        return;
    }

    const a = lastStep.alu;
    const bitBox = (name: string, val: number) =>
        `<div class="alu-bit"><span class="alu-bit-name">${name}</span><span class="alu-bit-val ${val ? 'on' : 'off'}">${val}</span></div>`;

    aluBody.innerHTML = `
    <div class="alu-control-bits">
      ${bitBox('zx', a.zx)}${bitBox('nx', a.nx)}${bitBox('zy', a.zy)}${bitBox('ny', a.ny)}${bitBox('f', a.f)}${bitBox('no', a.no)}
    </div>
    <div class="alu-pipeline">
      <div class="alu-stage"><span class="alu-label">x (D)</span><span class="alu-val">${a.xIn}</span></div>
      <div class="alu-arrow">→</div>
      <div class="alu-stage"><span class="alu-label">after zx,nx</span><span class="alu-val">${a.xAfter}</span></div>
      <div class="alu-stage"><span class="alu-label">y (${lastStep.aFlag ? 'M' : 'A'})</span><span class="alu-val">${a.yIn}</span></div>
      <div class="alu-arrow">→</div>
      <div class="alu-stage"><span class="alu-label">after zy,ny</span><span class="alu-val">${a.yAfter}</span></div>
    </div>
    <div class="alu-result-row">
      <div class="alu-stage"><span class="alu-label">${a.f ? 'x+y' : 'x&y'}</span><span class="alu-val">${a.fOut}</span></div>
      <div class="alu-arrow">→ ${a.no ? '!' : ''} →</div>
      <div class="alu-stage result"><span class="alu-label">out</span><span class="alu-val">${a.result}</span></div>
      <div class="alu-flags">
        <span class="alu-flag ${a.zr ? 'on' : ''}">zr=${a.zr ? '1' : '0'}</span>
        <span class="alu-flag ${a.ng ? 'on' : ''}">ng=${a.ng ? '1' : '0'}</span>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// RENDER: RAM WATCH
// ═══════════════════════════════════════════════════════════════════
function renderRAMWatch(): void {
    let html = '';
    const makeRow = (addr: number, label?: string, highlight = false) => {
        const val = s16(hack.ram[addr & 0x7FFF]);
        const cls = highlight ? ' class="ram-highlight"' : '';
        const lbl = label ?? `RAM[${addr}]`;
        const wf = writeFade[addr] > 0.3 ? ' ram-written' : '';
        const rf = readFade[addr] > 0.3 ? ' ram-read' : '';
        return `<div class="ram-row${wf}${rf}"${cls}><span class="ram-addr">${lbl}</span><span class="ram-val">${val}</span><span class="ram-hex">0x${hex16(val)}</span></div>`;
    };

    switch (ramWatchTab) {
        case 'registers':
            html += '<div class="ram-section-label">Special Pointers</div>';
            html += makeRow(0, 'SP (R0)');
            html += makeRow(1, 'LCL (R1)');
            html += makeRow(2, 'ARG (R2)');
            html += makeRow(3, 'THIS (R3)');
            html += makeRow(4, 'THAT (R4)');
            html += '<div class="ram-section-label">Temp Registers</div>';
            for (let i = 5; i <= 12; i++) html += makeRow(i, `R${i}`);
            html += '<div class="ram-section-label">R13–R15 (static)</div>';
            for (let i = 13; i <= 15; i++) html += makeRow(i, `R${i}`);
            break;

        case 'aroundA': {
            const center = hack.A & 0x7FFF;
            const start = Math.max(0, center - 8);
            const end = Math.min(32767, center + 8);
            for (let i = start; i <= end; i++) {
                html += makeRow(i, `RAM[${i}]`, i === center);
            }
            break;
        }

        case 'stack': {
            const sp = hack.ram[0];
            html += `<div class="ram-section-label">SP = ${sp}</div>`;
            const start = Math.max(256, sp - 4);
            for (let i = start; i < start + 16 && i < 32768; i++) {
                html += makeRow(i, `RAM[${i}]`, i === sp);
            }
            break;
        }

        case 'screen': {
            html += '<div class="ram-section-label">Screen (first 16 words)</div>';
            for (let i = 0; i < 16; i++) {
                const addr = 16384 + i;
                html += makeRow(addr, `SCR[${i}]`);
            }
            html += '<div class="ram-section-label">KBD</div>';
            html += makeRow(24576, 'KBD');
            break;
        }
    }

    ramBody.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════
// RENDER: SCREEN
// ═══════════════════════════════════════════════════════════════════
function renderScreen(): void {
    const data = screenImg.data;
    for (let row = 0; row < 256; row++) {
        for (let wordCol = 0; wordCol < 32; wordCol++) {
            const word = hack.ram[SCREEN_BASE + row * 32 + wordCol];
            for (let bit = 0; bit < 16; bit++) {
                const px = wordCol * 16 + bit;
                const idx = (row * 512 + px) * 4;
                const on = (word >> bit) & 1;
                data[idx] = on ? 160 : 15;
                data[idx + 1] = on ? 230 : 18;
                data[idx + 2] = on ? 180 : 25;
                data[idx + 3] = 255;
            }
        }
    }
    screenCtx.putImageData(screenImg, 0, 0);
}

// ═══════════════════════════════════════════════════════════════════
// RENDER: MEMORY HEATMAP
// ═══════════════════════════════════════════════════════════════════
function renderMemoryMap(): void {
    const data = memmapImg.data;

    for (let i = 0; i < 32768; i++) {
        if (readFade[i] > 0) { readFade[i] -= FADE_RATE; if (readFade[i] < 0) readFade[i] = 0; }
        if (writeFade[i] > 0) { writeFade[i] -= FADE_RATE; if (writeFade[i] < 0) writeFade[i] = 0; }
    }

    for (const addr of hack.readAddrs) { readFade[addr] = 1.0; }
    for (const addr of hack.writeAddrs) { writeFade[addr] = 1.0; }

    for (let i = 0; i < 32768; i++) {
        const px = i % 256;
        const py = (i / 256) | 0;
        const idx = (py * 256 + px) * 4;

        const val = hack.ram[i];
        const wf = writeFade[i];
        const rf = readFade[i];

        // Grey base for non-zero values
        let r = val !== 0 ? 25 : 8;
        let g = val !== 0 ? 28 : 10;
        let b = val !== 0 ? 35 : 14;

        // Write: red overlay
        if (wf > 0.01) { r += wf * 220; g += wf * 40; }
        // Read: green/cyan overlay
        if (rf > 0.01) { g += rf * 180; b += rf * 120; }

        data[idx] = Math.min(255, r) | 0;
        data[idx + 1] = Math.min(255, g) | 0;
        data[idx + 2] = Math.min(255, b) | 0;
        data[idx + 3] = 255;
    }

    memmapCtx.putImageData(memmapImg, 0, 0);
}

// ═══════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════
function updateStats(): void {
    $('stat-cycles').textContent = `${totalCycles.toLocaleString()} cycles`;
    const stateEl = $('stat-state');
    stateEl.textContent = running ? 'RUNNING' : 'STOPPED';
    stateEl.className = 'stat-pill ' + (running ? 'running' : 'stopped');
}

// ═══════════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════════
function mainLoop(ts: number): void {
    requestAnimationFrame(mainLoop);

    // FPS
    fpsFrames++;
    if (ts - fpsLast >= 1000) {
        fpsCurrent = fpsFrames;
        fpsFrames = 0;
        fpsLast = ts;
    }

    // Execute
    if (running) {
        hack.readAddrs.clear();
        hack.writeAddrs.clear();

        if (cyclesPerFrame <= 100) {
            // At slow speeds, use detailed step for explain panel
            for (let i = 0; i < cyclesPerFrame; i++) {
                lastStep = hack.stepDetailed();
                totalCycles++;
                if (breakpoints.has(hack.PC)) {
                    running = false;
                    break;
                }
            }
            if (lastStep) {
                const srcLine = sourceMap[lastStep.prevPC]?.src ?? '?';
                explainBody.innerHTML = explainStep(lastStep, srcLine);
            }
        } else {
            // High speed: use fast step, no explain
            for (let i = 0; i < cyclesPerFrame; i++) {
                hack.step();
                totalCycles++;
                if (breakpoints.has(hack.PC)) {
                    running = false;
                    break;
                }
            }
        }
    }

    // Render everything
    renderRegisters();
    renderCurrentInstruction();
    renderALU();
    renderRAMWatch();
    renderMemoryMap();
    renderScreen();
    scrollToPC();
    updateStats();
}

// ═══════════════════════════════════════════════════════════════════
// RESIZE
// ═══════════════════════════════════════════════════════════════════
function resizeCanvases(): void {
    const scWrap = screenCanvas.parentElement!;
    const scMaxW = scWrap.clientWidth - 4;
    const scMaxH = scWrap.clientHeight - 4;
    const scScale = Math.max(0.5, Math.min(scMaxW / 512, scMaxH / 256));
    screenCanvas.style.width = Math.floor(512 * scScale) + 'px';
    screenCanvas.style.height = Math.floor(256 * scScale) + 'px';

    const mmWrap = memmapCanvas.parentElement!;
    const mmMaxW = mmWrap.clientWidth - 4;
    const mmMaxH = mmWrap.clientHeight - 4;
    const mmScale = Math.max(1, Math.min(Math.floor(mmMaxW / 256), Math.floor(mmMaxH / 128)));
    memmapCanvas.style.width = (256 * mmScale) + 'px';
    memmapCanvas.style.height = (128 * mmScale) + 'px';
}

window.addEventListener('resize', resizeCanvases);
setTimeout(resizeCanvases, 100);

// ═══════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════
doAssemble();
requestAnimationFrame(mainLoop);
