var dt=Object.defineProperty;var pt=(t,e,s)=>e in t?dt(t,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[e]=s;var v=(t,e,s)=>pt(t,typeof e!="symbol"?e+"":e,s);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&a(o)}).observe(document,{childList:!0,subtree:!0});function s(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(n){if(n.ep)return;n.ep=!0;const r=s(n);fetch(n.href,r)}})();const Q=32768,ut=32768,At=16384,Et={SP:0,LCL:1,ARG:2,THIS:3,THAT:4,R0:0,R1:1,R2:2,R3:3,R4:4,R5:5,R6:6,R7:7,R8:8,R9:9,R10:10,R11:11,R12:12,R13:13,R14:14,R15:15,SCREEN:16384,KBD:24576},mt={42:"0",63:"1",58:"-1",12:"D",48:"A",13:"!D",49:"!A",15:"-D",51:"-A",31:"D+1",55:"A+1",14:"D-1",50:"A-1",2:"D+A",19:"D-A",7:"A-D",0:"D&A",21:"D|A"},Rt={48:"M",49:"!M",51:"-M",55:"M+1",50:"M-1",2:"D+M",19:"D-M",7:"M-D",0:"D&M",21:"D|M"},gt={0:"",1:"M",2:"D",3:"MD",4:"A",5:"AM",6:"AD",7:"AMD"},ft={0:"",1:"JGT",2:"JEQ",3:"JGE",4:"JLT",5:"JNE",6:"JLE",7:"JMP"};function vt(t,e){return e?Rt[t]??"?":mt[t]??"?"}function bt(t){return gt[t]??""}function ht(t){return ft[t]??""}function g(t){return t=t&65535,t>=32768?t-65536:t}function yt(t,e,s){switch(t){case 42:return 0;case 63:return 1;case 58:return-1;case 12:return e;case 48:return s;case 13:return~e;case 49:return~s;case 15:return-e;case 51:return-s;case 31:return e+1;case 55:return s+1;case 14:return e-1;case 50:return s-1;case 2:return e+s;case 19:return e-s;case 7:return s-e;case 0:return e&s;case 21:return e|s;default:return 0}}function Lt(t,e,s){const a=t>>5&1,n=t>>4&1,r=t>>3&1,o=t>>2&1,i=t>>1&1,M=t&1,l=e&65535,p=s&65535;let u=a?0:l;u=n?~u&65535:u;let d=r?0:p;d=o?~d&65535:d;let E=i?g(u)+g(d)&65535:u&d;const R=M?~E&65535:E,w=g(R);return{zx:a,nx:n,zy:r,ny:o,f:i,no:M,xIn:g(e),yIn:g(s),xAfter:g(u),yAfter:g(d),fOut:g(E),result:w,zr:w===0,ng:w<0}}class Pt{constructor(){v(this,"rom",new Uint16Array(Q));v(this,"ram",new Int16Array(ut));v(this,"A",0);v(this,"D",0);v(this,"PC",0);v(this,"cycles",0);v(this,"halted",!1);v(this,"readAddrs",new Set);v(this,"writeAddrs",new Set)}reset(){this.ram.fill(0),this.A=0,this.D=0,this.PC=0,this.cycles=0,this.halted=!1,this.readAddrs.clear(),this.writeAddrs.clear()}loadROM(e){this.rom.fill(0);for(let s=0;s<e.length&&s<Q;s++)this.rom[s]=e[s]}step(){if(this.halted)return;const e=this.rom[this.PC];if((e&32768)===0)this.A=e&32767,this.PC=this.PC+1&32767;else{const s=e>>12&1,a=e>>6&63,n=e>>3&7,r=e&7,o=this.A&32767,i=s===0?this.A:this.ram[o];s&&this.readAddrs.add(o);let M=g(yt(a,g(this.D),g(i)));n&1&&(this.ram[o]=M,this.writeAddrs.add(o)),n&2&&(this.D=M),n&4&&(this.A=M&65535);let l=!1;r&&(r&1&&M>0&&(l=!0),r&2&&M===0&&(l=!0),r&4&&M<0&&(l=!0)),this.PC=l?this.A&32767:this.PC+1&32767}this.cycles++}stepDetailed(){if(this.halted)return{isA:!0,instruction:0,prevPC:this.PC,newPC:this.PC};const e=this.rom[this.PC],s=this.PC;if((e&32768)===0){const a=e&32767;return this.A=a,this.PC=this.PC+1&32767,this.cycles++,{isA:!0,instruction:e,prevPC:s,newPC:this.PC,aValue:a}}else{const a=this.A&32767,n=e>>12&1,r=e>>6&63,o=e>>3&7,i=e&7,M=g(this.ram[a]),l=g(this.D),p=n?M:g(this.A);n&&this.readAddrs.add(a);const u=Lt(r,l,p),d=u.result,E=[];o&4&&(this.A=d&65535,E.push("A")),o&2&&(this.D=d,E.push("D")),o&1&&(this.ram[a]=d,this.writeAddrs.add(a),E.push(`RAM[${a}]`));let R=!1;return i&&(i&1&&d>0&&(R=!0),i&2&&d===0&&(R=!0),i&4&&d<0&&(R=!0)),this.PC=R?this.A&32767:s+1&32767,this.cycles++,{isA:!1,instruction:e,prevPC:s,newPC:this.PC,aFlag:n,comp:r,dest:o,jump:i,compStr:vt(r,n),destStr:bt(o),jumpStr:ht(i),aBefore:a,xInput:l,yInput:p,aluResult:d,destNames:E,jumped:R,alu:u}}}}const wt={0:"0101010",1:"0111111","-1":"0111010",D:"0001100",A:"0110000","!D":"0001101","!A":"0110001","-D":"0001111","-A":"0110011","D+1":"0011111","A+1":"0110111","D-1":"0001110","A-1":"0110010","D+A":"0000010","A+D":"0000010","D-A":"0010011","A-D":"0000111","D&A":"0000000","A&D":"0000000","D|A":"0010101","A|D":"0010101",M:"1110000","!M":"1110001","-M":"1110011","M+1":"1110111","M-1":"1110010","D+M":"1000010","M+D":"1000010","D-M":"1010011","M-D":"1000111","D&M":"1000000","M&D":"1000000","D|M":"1010101","M|D":"1010101"},Jt={"":"000",M:"001",D:"010",MD:"011",DM:"011",A:"100",AM:"101",MA:"101",AD:"110",DA:"110",AMD:"111",ADM:"111",MAD:"111",MDA:"111",DMA:"111",DAM:"111"},St={"":"000",JGT:"001",JEQ:"010",JGE:"011",JLT:"100",JNE:"101",JLE:"110",JMP:"111"};function xt(t){const e=t.split(`
`),s=[];for(let l=0;l<e.length;l++){const p=e[l].replace(/\/\/.*/,"").trim();p.length>0&&s.push({text:p,lineNum:l+1,lineIdx:l})}const a={...Et};let n=0;const r=[];for(const l of s){const p=l.text.match(/^\(([A-Za-z_.$:][A-Za-z0-9_.$:]*)\)$/);p?a[p[1]]=n:(r.push(l),n++)}let o=16;const i=[],M=[];for(const l of r){const p=l.text;if(p.startsWith("@")){const u=p.substring(1);let d;/^\d+$/.test(u)?d=parseInt(u,10):(u in a||(a[u]=o++),d=a[u]);const E=(d&32767).toString(2).padStart(16,"0");i.push(parseInt(E,2)),M.push({src:p,lineNum:l.lineNum,lineIdx:l.lineIdx,bin:E})}else{let u="",d="",E="",R=p;if(R.includes("=")){const x=R.split("=");u=x[0].trim(),R=x[1].trim()}if(R.includes(";")){const x=R.split(";");d=x[0].trim(),E=x[1].trim()}else d=R.trim();const w=wt[d];if(!w)throw new Error(`Unknown comp "${d}" at line ${l.lineNum}`);const U=Jt[u];if(U===void 0)throw new Error(`Unknown dest "${u}" at line ${l.lineNum}`);const W=St[E];if(W===void 0)throw new Error(`Unknown jump "${E}" at line ${l.lineNum}`);const K="111"+w+U+W;i.push(parseInt(K,2)),M.push({src:p,lineNum:l.lineNum,lineIdx:l.lineIdx,bin:K})}}return{rom:i,sourceMap:M}}function Ct(t){return t<<16>>16}function P(t){const e=Ct(t),s=(t&65535).toString(16).toUpperCase().padStart(4,"0");return`${e} <span class="explain-hex">(0x${s})</span>`}function Nt(t){return t===24576?"KBD (24576)":t>=16384&&t<24576?`Screen[${t-16384}] (${t})`:t<=15?`R${t}`:t===0?"SP (R0)":t===1?"LCL (R1)":t===2?"ARG (R2)":t===3?"THIS (R3)":t===4?"THAT (R4)":`RAM[${t}]`}function nt(t,e){const s=[];if(t.isA){const a=t.aValue??0;s.push(`<div class="explain-title">A-Instruction: <code>${e}</code></div>`),s.push('<div class="explain-body">'),s.push(`Load <strong>${P(a)}</strong> into the <strong>A register</strong>.`),a>=16384&&a<24576?s.push(`<br><span class="explain-note">💡 This points A at screen memory (pixel word ${a-16384}).</span>`):a===24576?s.push('<br><span class="explain-note">💡 This points A at the keyboard register.</span>'):a<=15&&s.push(`<br><span class="explain-note">💡 R${a} — general-purpose register.</span>`),s.push(`<br>After: A = ${P(a)}, so M (RAM[A]) now refers to ${Nt(a)}.`),s.push("</div>")}else{const a=t.compStr??"?",n=t.destStr??"",r=t.jumpStr??"",o=t.aBefore??0;if(s.push(`<div class="explain-title">C-Instruction: <code>${e}</code></div>`),s.push('<div class="explain-body">'),s.push(`<strong>Compute:</strong> ALU calculates <code>${a}</code>`),t.aFlag&&s.push(` — here M means RAM[${o}] = ${P(t.yInput??0)}`),s.push(` → result = <strong>${P(t.aluResult??0)}</strong>`),s.push(`<br><span class="explain-detail">D = ${P(t.xInput??0)}`),t.aFlag?s.push(`, M = RAM[${o}] = ${P(t.yInput??0)}`):s.push(`, A = ${P(t.yInput??0)}`),s.push("</span>"),n){s.push("<br><br><strong>Store:</strong> Write result to ");const i=t.destNames??[];s.push(i.map(M=>`<strong>${M}</strong>`).join(", "))}else s.push("<br><br><strong>Store:</strong> <em>no destination</em> — result is discarded.");if(r){const i=t.aluResult??0,M={JGT:`result > 0 (${i} > 0 → ${i>0})`,JEQ:`result == 0 (${i} == 0 → ${i===0})`,JGE:`result ≥ 0 (${i} ≥ 0 → ${i>=0})`,JLT:`result < 0 (${i} < 0 → ${i<0})`,JNE:`result ≠ 0 (${i} ≠ 0 → ${i!==0})`,JLE:`result ≤ 0 (${i} ≤ 0 → ${i<=0})`,JMP:"always (unconditional)"};s.push(`<br><br><strong>Jump:</strong> <code>${r}</code> — `),s.push(M[r]??"?"),t.jumped?s.push(`<br>→ <span class="explain-jump-yes">✓ JUMPED</span> to instruction ${t.newPC}`):s.push('<br>→ <span class="explain-jump-no">✗ NO JUMP</span>, continue to next instruction')}s.push("</div>")}return s.join("")}const y=[{title:"Hello: Set R0 = 42",category:"Beginner",code:`// Hello Hack! — Set R0 to the value 42
// This is the simplest possible program.
// Step through it to see @value and D=A;M=D in action.

    @42       // Load 42 into the A register
    D=A       // Copy A into D register
    @R0       // Point A at RAM[0] (a.k.a. R0)
    M=D       // Write D into RAM[0]  →  R0 = 42

(END)
    @END
    0;JMP     // Infinite loop — program done
`},{title:"Add Two Numbers",category:"Beginner",code:`// Add R0 + R1, store result in R2
// Load R0 and R1 with values first,
// then watch the ALU compute D+M.

    @5
    D=A
    @R0
    M=D       // R0 = 5

    @3
    D=A
    @R1
    M=D       // R1 = 3

    @R0
    D=M       // D = R0 = 5
    @R1
    D=D+M     // D = D + R1 = 5 + 3 = 8
    @R2
    M=D       // R2 = 8

(END)
    @END
    0;JMP
`},{title:"Subtract",category:"Beginner",code:`// Compute R2 = R0 - R1
// Compare with Add — same ALU, different comp bits.

    @10
    D=A
    @R0
    M=D       // R0 = 10

    @4
    D=A
    @R1
    M=D       // R1 = 4

    @R0
    D=M       // D = 10
    @R1
    D=D-M     // D = 10 - 4 = 6
    @R2
    M=D       // R2 = 6

(END)
    @END
    0;JMP
`},{title:"Absolute Value",category:"Intermediate",code:`// R1 = |R0|  (absolute value)
// Shows conditional jump: JGE skips negation if R0 >= 0.

    @7
    D=A
    D=-D      // D = -7  (so we have a negative to test)
    @R0
    M=D       // R0 = -7

    @R0
    D=M       // D = R0
    @POSITIVE
    D;JGE     // If D >= 0, skip negation

    D=-D      // Negate D (make positive)

(POSITIVE)
    @R1
    M=D       // R1 = |R0| = 7

(END)
    @END
    0;JMP
`},{title:"Countdown Loop",category:"Intermediate",code:`// Count from 5 down to 0 in R0
// Watch R0 decrease each iteration.
// The loop uses D;JGT to test and branch.

    @5
    D=A
    @R0
    M=D       // R0 = 5

(LOOP)
    @R0
    D=M       // D = R0
    @END
    D;JEQ     // If R0 == 0, done

    @R0
    M=M-1     // R0 = R0 - 1

    @LOOP
    0;JMP     // Go to LOOP

(END)
    @END
    0;JMP
`},{title:"Sum 1..N",category:"Intermediate",code:`// Compute R1 = 1 + 2 + ... + R0
// Uses a loop accumulator pattern.

    @10
    D=A
    @R0
    M=D       // R0 = 10 (compute sum 1..10 = 55)

    @R1
    M=0       // R1 = 0 (accumulator)

(LOOP)
    @R0
    D=M       // D = remaining counter
    @END
    D;JEQ     // If counter == 0, done

    @R1
    M=D+M     // R1 = R1 + counter

    @R0
    M=M-1     // counter--

    @LOOP
    0;JMP

(END)
    @END
    0;JMP
`},{title:"Max of Two",category:"Intermediate",code:`// R2 = max(R0, R1)
// Demonstrates comparison via subtraction and JGT.

    @23
    D=A
    @R0
    M=D       // R0 = 23

    @42
    D=A
    @R1
    M=D       // R1 = 42

    @R0
    D=M       // D = R0
    @R1
    D=D-M     // D = R0 - R1
    @R0_WINS
    D;JGT     // If R0 > R1, jump

    // R1 wins (or equal)
    @R1
    D=M
    @STORE
    0;JMP

(R0_WINS)
    @R0
    D=M

(STORE)
    @R2
    M=D       // R2 = max

(END)
    @END
    0;JMP
`},{title:"Multiply R0 × R1",category:"Intermediate",code:`// R2 = R0 × R1 via repeated addition
// The Hack CPU has no multiply instruction,
// so we add R0 to itself R1 times.

    @4
    D=A
    @R0
    M=D       // R0 = 4

    @5
    D=A
    @R1
    M=D       // R1 = 5

    @R2
    M=0       // R2 = 0 (accumulator)

(LOOP)
    @R1
    D=M       // D = remaining count
    @END
    D;JEQ     // If count == 0, done

    @R0
    D=M       // D = R0
    @R2
    M=D+M     // R2 += R0

    @R1
    M=M-1     // count--

    @LOOP
    0;JMP

(END)
    @END
    0;JMP
`},{title:"Draw One Pixel",category:"Screen",code:`// Draw a single pixel at (0,0)
// The screen starts at RAM[16384].
// Each word = 16 pixels, bit 0 = leftmost.

    @SCREEN   // A = 16384
    M=1       // Set bit 0 → pixel (0,0) is on

(END)
    @END
    0;JMP
`},{title:"Draw Horizontal Line",category:"Screen",code:`// Draw a 512-pixel horizontal line (top row)
// Each screen row = 32 words × 16 bits = 512 pixels.
// Setting a word to -1 turns on all 16 bits.

    @SCREEN
    D=A
    @addr
    M=D       // addr = SCREEN (16384)

    @32
    D=A
    @count
    M=D       // count = 32 words (one full row)

(LOOP)
    @count
    D=M
    @END
    D;JEQ     // If count == 0, done

    @addr
    A=M       // Go to the screen address
    M=-1      // All 16 bits on  (= 0xFFFF)

    @addr
    M=M+1     // Next word
    @count
    M=M-1     // Decrement count

    @LOOP
    0;JMP

(END)
    @END
    0;JMP
`},{title:"Draw Rectangle",category:"Screen",code:`// Draw a filled rectangle: 16px wide × 32px tall
// at top-left corner of screen.

    @SCREEN
    D=A
    @addr
    M=D       // addr = SCREEN

    @32
    D=A
    @rows
    M=D       // rows = 32

(ROW)
    @rows
    D=M
    @END
    D;JEQ     // If rows == 0, done

    @addr
    A=M
    M=-1      // Draw 16 pixels (1 word)

    // Move to next row: add 32 to addr
    @32
    D=A
    @addr
    M=D+M

    @rows
    M=M-1

    @ROW
    0;JMP

(END)
    @END
    0;JMP
`},{title:"Fill Entire Screen",category:"Screen",code:`// Fill the entire 512×256 screen (8192 words)
// with alternating stripe pattern.

    @SCREEN
    D=A
    @addr
    M=D       // addr = SCREEN start

    @8192
    D=A
    @count
    M=D       // count = total screen words

    @pattern
    M=-1      // pattern = all bits on

(LOOP)
    @count
    D=M
    @END
    D;JEQ     // Done if count == 0

    @pattern
    D=M
    @addr
    A=M
    M=D       // Write pattern to screen

    @addr
    M=M+1     // Next word

    @count
    M=M-1

    // Toggle pattern every 32 words (every row)
    @count
    D=M
    @31
    D=D&A     // D = count & 31
    @SKIP
    D;JNE     // Don't toggle unless at row boundary

    @pattern
    M=!M      // Flip pattern bits

(SKIP)
    @LOOP
    0;JMP

(END)
    @END
    0;JMP
`},{title:"Fibonacci",category:"Advanced",code:`// Compute Fibonacci numbers in R0..R4
// F(0)=0, F(1)=1, F(2)=1, F(3)=2, F(4)=3...
// Watch the registers update each iteration.

    @R0
    M=0       // F(0) = 0
    @R1
    M=1       // F(1) = 1

    // F(2) = F(0) + F(1)
    @R0
    D=M
    @R1
    D=D+M
    @R2
    M=D       // R2 = 1

    // F(3) = F(1) + F(2)
    @R1
    D=M
    @R2
    D=D+M
    @R3
    M=D       // R3 = 2

    // F(4) = F(2) + F(3)
    @R2
    D=M
    @R3
    D=D+M
    @R4
    M=D       // R4 = 3

(END)
    @END
    0;JMP
`},{title:"Integer Division",category:"Advanced",code:`// R2 = R0 / R1  (integer division, quotient only)
// Uses repeated subtraction.

    @20
    D=A
    @R0
    M=D       // R0 = 20 (dividend)

    @6
    D=A
    @R1
    M=D       // R1 = 6  (divisor)

    @R2
    M=0       // R2 = 0  (quotient)

    @R0
    D=M
    @rem
    M=D       // rem = R0 (remaining)

(LOOP)
    @rem
    D=M       // D = remaining
    @R1
    D=D-M     // D = rem - divisor
    @END
    D;JLT     // If rem < divisor, done

    @rem
    M=D       // rem = rem - divisor

    @R2
    M=M+1     // quotient++

    @LOOP
    0;JMP

(END)
    @END
    0;JMP
`},{title:"Keyboard Input Echo",category:"Advanced",code:`// Read keyboard and show key code in R0.
// Press any key while running — the KBD register
// (RAM[24576]) is memory-mapped hardware.
// This shows how I/O works on the Hack platform.

(LOOP)
    @KBD       // A = 24576 (keyboard register)
    D=M        // D = current key (0 if none)
    @R0
    M=D        // R0 = key code

    @LOOP
    0;JMP      // Poll forever
`},{title:"Bouncing Box",category:"Animation",code:`// Bouncing Box — 16×16 block slides left and right
// across the middle of the screen.
// Demonstrates: animation loop, screen address math,
// clearing old graphics, conditional direction reversal.
// ⚡ Run at 10K/s or MAX for smooth animation.

    // pos = word column (0–30), dir = 0 right / 1 left
    @pos
    M=0
    @dir
    M=0

(FRAME)
    // ── Clear old box (rows 120–135 at column pos) ──
    // addr = SCREEN + 120*32 + pos = 16384 + 3840 + pos
    @20224
    D=A
    @pos
    D=D+M
    @addr
    M=D
    @16
    D=A
    @i
    M=D
(CLR)
    @i
    D=M
    @MOVE
    D;JEQ
    @addr
    A=M
    M=0
    @32
    D=A
    @addr
    M=D+M
    @i
    M=M-1
    @CLR
    0;JMP

(MOVE)
    // ── Update position ──
    @dir
    D=M
    @GOLEFT
    D;JNE
    // Moving right
    @pos
    M=M+1
    D=M
    @30
    D=D-A
    @DRAW
    D;JLT
    // Hit right edge → reverse
    @30
    D=A
    @pos
    M=D
    @dir
    M=1
    @DRAW
    0;JMP
(GOLEFT)
    // Moving left
    @pos
    M=M-1
    D=M
    @DRAW
    D;JGT
    // Hit left edge → reverse
    @pos
    M=0
    @dir
    M=0

(DRAW)
    // ── Draw box at new position ──
    @20224
    D=A
    @pos
    D=D+M
    @addr
    M=D
    @16
    D=A
    @i
    M=D
(DRAWL)
    @i
    D=M
    @WAIT
    D;JEQ
    @addr
    A=M
    M=-1
    @32
    D=A
    @addr
    M=D+M
    @i
    M=M-1
    @DRAWL
    0;JMP

(WAIT)
    // ── Delay loop for animation timing ──
    @1200
    D=A
    @dly
    M=D
(DLY)
    @dly
    M=M-1
    D=M
    @FRAME
    D;JEQ
    @DLY
    0;JMP
`},{title:"Spiral Fill",category:"Animation",code:`// Spiral Fill — fills the screen from edges inward
// in a clockwise spiral pattern.
// Each "pixel" is one word (16px wide) for speed.
// Demonstrates: 2D boundary tracking, address computation,
// multiply-by-32 via bit shifting (5 doublings).
// ⚡ Run at MAX speed to watch the pattern build.

    // Boundaries: top row, bottom row, left col, right col
    @top
    M=0
    @255
    D=A
    @bot
    M=D
    @left
    M=0
    @31
    D=A
    @right
    M=D

(SPIRAL)
    // Check done
    @top
    D=M
    @bot
    D=D-M
    @END
    D;JGT
    @left
    D=M
    @right
    D=D-M
    @END
    D;JGT

    // ── TOP EDGE: right along top row ──
    @top
    D=M
    @t
    M=D
    @t
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    @SCREEN
    D=A
    @t
    D=D+M
    @left
    D=D+M
    @addr
    M=D
    @right
    D=M
    @left
    D=D-M
    D=D+1
    @cnt
    M=D
(TE)
    @cnt
    D=M
    @TE_D
    D;JEQ
    @addr
    A=M
    M=-1
    @addr
    M=M+1
    @cnt
    M=M-1
    @TE
    0;JMP
(TE_D)
    @top
    M=M+1

    // ── RIGHT EDGE: down along right column ──
    @top
    D=M
    @t
    M=D
    @t
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    @SCREEN
    D=A
    @t
    D=D+M
    @right
    D=D+M
    @addr
    M=D
    @bot
    D=M
    @top
    D=D-M
    D=D+1
    @cnt
    M=D
(RE)
    @cnt
    D=M
    @RE_D
    D;JEQ
    @addr
    A=M
    M=-1
    @32
    D=A
    @addr
    M=D+M
    @cnt
    M=M-1
    @RE
    0;JMP
(RE_D)
    @right
    M=M-1

    // ── Check: top still <= bot? ──
    @top
    D=M
    @bot
    D=D-M
    @SKIP_B
    D;JGT

    // ── BOTTOM EDGE: left along bottom row ──
    @bot
    D=M
    @t
    M=D
    @t
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    @SCREEN
    D=A
    @t
    D=D+M
    @right
    D=D+M
    @addr
    M=D
    @right
    D=M
    @left
    D=D-M
    D=D+1
    @cnt
    M=D
(BE)
    @cnt
    D=M
    @BE_D
    D;JEQ
    @addr
    A=M
    M=-1
    @addr
    M=M-1
    @cnt
    M=M-1
    @BE
    0;JMP
(BE_D)
    @bot
    M=M-1

(SKIP_B)
    // ── Check: left still <= right? ──
    @left
    D=M
    @right
    D=D-M
    @SPIRAL
    D;JGT

    // ── LEFT EDGE: up along left column ──
    @bot
    D=M
    @t
    M=D
    @t
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    @SCREEN
    D=A
    @t
    D=D+M
    @left
    D=D+M
    @addr
    M=D
    @bot
    D=M
    @top
    D=D-M
    D=D+1
    @cnt
    M=D
(LE)
    @cnt
    D=M
    @LE_D
    D;JEQ
    @addr
    A=M
    M=-1
    @32
    D=A
    @addr
    M=M-D
    @cnt
    M=M-1
    @LE
    0;JMP
(LE_D)
    @left
    M=M+1

    @SPIRAL
    0;JMP

(END)
    @END
    0;JMP
`},{title:"Dino Jump",category:"Animation",code:`// Dinosaur Jump — Press any key to jump over obstacles!
// A simplified endless runner using Hack screen I/O.
// Demonstrates: game loop, physics (gravity), keyboard
// input, collision detection, sprite drawing/clearing.
// ⚡ Run at 10K/s for playable speed.

    @dy
    M=0
    @vy
    M=0
    @jumping
    M=0
    @28
    D=A
    @ox
    M=D
    @gameover
    M=0

(FRAME)
    @gameover
    D=M
    @HALT
    D;JNE

    // ── Clear the game area (rows 200–255, cols 0–31) ──
    // SCREEN + 200*32 = 16384 + 6400 = 22784
    @22784
    D=A
    @addr
    M=D
    @1792
    D=A
    @i
    M=D
(CLRG)
    @i
    D=M
    @AFTER_CLR
    D;JEQ
    @addr
    A=M
    M=0
    @addr
    M=M+1
    @i
    M=M-1
    @CLRG
    0;JMP

(AFTER_CLR)
    // ── Draw ground (row 248–255, all 32 cols) ──
    // SCREEN + 248*32 = 16384 + 7936 = 24320
    @24320
    D=A
    @addr
    M=D
    @256
    D=A
    @i
    M=D
(GND)
    @i
    D=M
    @DRAW_DINO
    D;JEQ
    @addr
    A=M
    M=-1
    @addr
    M=M+1
    @i
    M=M-1
    @GND
    0;JMP

(DRAW_DINO)
    // ── Draw dino at col 3, row = (232 - dy) ──
    // Height: 16 rows. Base row when grounded = 232 (above ground).
    @232
    D=A
    @dy
    D=D-M
    @drow
    M=D
    // Compute addr = SCREEN + drow*32 + 3
    @drow
    D=M
    @t
    M=D
    @t
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    @SCREEN
    D=A
    @t
    D=D+M
    @3
    D=D+A
    @addr
    M=D
    @16
    D=A
    @i
    M=D
(DDINO)
    @i
    D=M
    @DRAW_OBS
    D;JEQ
    @addr
    A=M
    M=-1
    @32
    D=A
    @addr
    M=D+M
    @i
    M=M-1
    @DDINO
    0;JMP

(DRAW_OBS)
    // ── Draw obstacle at col ox, rows 232–247 ──
    // addr = SCREEN + 232*32 + ox = 16384 + 7424 + ox
    @23808
    D=A
    @ox
    D=D+M
    @addr
    M=D
    @16
    D=A
    @i
    M=D
(DOBS)
    @i
    D=M
    @INPUT
    D;JEQ
    @addr
    A=M
    M=-1
    @32
    D=A
    @addr
    M=D+M
    @i
    M=M-1
    @DOBS
    0;JMP

(INPUT)
    // ── Read keyboard ──
    @KBD
    D=M
    @NO_KEY
    D;JEQ
    // Key pressed → start jump if grounded
    @jumping
    D=M
    @NO_KEY
    D;JNE
    @jumping
    M=1
    @6
    D=A
    @vy
    M=D

(NO_KEY)
    // ── Update dino physics ──
    @jumping
    D=M
    @MOVE_OBS
    D;JEQ
    @vy
    D=M
    @dy
    M=D+M
    @vy
    M=M-1
    // Check if landed
    @dy
    D=M
    @MOVE_OBS
    D;JGT
    @dy
    M=0
    @vy
    M=0
    @jumping
    M=0

(MOVE_OBS)
    // ── Move obstacle left ──
    @ox
    M=M-1
    D=M
    @NO_RESET
    D;JGE
    @28
    D=A
    @ox
    M=D
(NO_RESET)
    // ── Collision check: ox==3 and dy==0 ──
    @ox
    D=M
    @3
    D=D-A
    @DELAY
    D;JNE
    @dy
    D=M
    @DELAY
    D;JNE
    // Hit! Game over
    @gameover
    M=1

(DELAY)
    @600
    D=A
    @dly
    M=D
(DL)
    @dly
    M=M-1
    D=M
    @FRAME
    D;JEQ
    @DL
    0;JMP

(HALT)
    @HALT
    0;JMP
`},{title:"Pong",category:"Animation",code:`// Pong — Move the paddle with arrow keys to keep
// the ball bouncing. Miss it and the game freezes!
// Demonstrates: keyboard I/O, 2D motion, collision
// detection, full game loop with real-time input.
// ⚡ Run at 10K/s for playable speed.
// Paddle: Left arrow (130) / Right arrow (132)

    // Ball state: bx/by = word col/row, bdx/bdy = direction
    @15
    D=A
    @bx
    M=D
    @30
    D=A
    @by
    M=D
    @bdx
    M=1
    @bdy
    M=1
    // Paddle at col 14, row 250
    @14
    D=A
    @px
    M=D
    @over
    M=0

(FRAME)
    @over
    D=M
    @HALT
    D;JNE

    // ── Clear screen ──
    @SCREEN
    D=A
    @addr
    M=D
    @8192
    D=A
    @i
    M=D
(CS)
    @i
    D=M
    @DBALL
    D;JEQ
    @addr
    A=M
    M=0
    @addr
    M=M+1
    @i
    M=M-1
    @CS
    0;JMP

(DBALL)
    // ── Draw ball (1 word at bx, by) ──
    @by
    D=M
    @t
    M=D
    @t
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    @SCREEN
    D=A
    @t
    D=D+M
    @bx
    D=D+M
    @addr
    M=D
    @addr
    A=M
    M=-1

    // ── Draw paddle (3 words wide at px, row 250) ──
    // SCREEN + 250*32 = 16384 + 8000 = 24384
    @24384
    D=A
    @px
    D=D+M
    @addr
    M=D
    @addr
    A=M
    M=-1
    @addr
    M=M+1
    A=M
    M=-1
    @addr
    M=M+1
    A=M
    M=-1

    // ── Read keyboard for paddle ──
    @KBD
    D=M
    @130
    D=D-A
    @PAD_LEFT
    D;JEQ
    @KBD
    D=M
    @132
    D=D-A
    @PAD_RIGHT
    D;JEQ
    @MOVE_BALL
    0;JMP

(PAD_LEFT)
    @px
    D=M
    @MOVE_BALL
    D;JLE
    @px
    M=M-1
    @MOVE_BALL
    0;JMP
(PAD_RIGHT)
    @px
    D=M
    @29
    D=D-A
    @MOVE_BALL
    D;JGE
    @px
    M=M+1

(MOVE_BALL)
    // ── Update ball X ──
    @bdx
    D=M
    @BALL_LEFT
    D;JLT
    // Moving right
    @bx
    M=M+1
    D=M
    @30
    D=D-A
    @BALL_Y
    D;JLT
    // Hit right wall → reverse
    @30
    D=A
    @bx
    M=D
    @bdx
    M=-1
    @BALL_Y
    0;JMP
(BALL_LEFT)
    @bx
    M=M-1
    D=M
    @BALL_Y
    D;JGT
    // Hit left wall → reverse
    @bx
    M=0
    @bdx
    M=1

(BALL_Y)
    // ── Update ball Y ──
    @bdy
    D=M
    @BALL_UP
    D;JLT
    // Moving down
    @by
    M=M+1
    D=M
    @248
    D=D-A
    @CHK_PADDLE
    D;JGE
    @DELAY
    0;JMP

(CHK_PADDLE)
    // Ball reached paddle row — check if paddle is there
    @248
    D=A
    @by
    M=D
    @bx
    D=M
    @px
    D=D-M
    @MISS
    D;JLT
    @3
    D=D-A
    @MISS
    D;JGE
    // Hit paddle! Bounce up
    @bdy
    M=-1
    @DELAY
    0;JMP
(MISS)
    @over
    M=1
    @DELAY
    0;JMP

(BALL_UP)
    @by
    M=M-1
    D=M
    @DELAY
    D;JGT
    // Hit top wall → reverse
    @by
    M=0
    @bdy
    M=1

(DELAY)
    @400
    D=A
    @dly
    M=D
(DL)
    @dly
    M=M-1
    D=M
    @FRAME
    D;JEQ
    @DL
    0;JMP

(HALT)
    @HALT
    0;JMP
`},{title:"Drawing Pad",category:"Animation",code:`// Drawing Pad — Use arrow keys to move a cursor,
// press Space (32) to stamp a filled word.
// Demonstrates: real-time keyboard polling, cursor
// tracking, and interactive screen I/O.
// ⚡ Run at 1K/s or 10K/s.

    // cx = cursor word column, cy = cursor row
    @15
    D=A
    @cx
    M=D
    @128
    D=A
    @cy
    M=D
    @drawn
    M=0

(POLL)
    // ── Compute cursor address = SCREEN + cy*32 + cx ──
    @cy
    D=M
    @t
    M=D
    @t
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    @SCREEN
    D=A
    @t
    D=D+M
    @cx
    D=D+M
    @caddr
    M=D

    // ── Flash cursor (toggle on/off) ──
    @drawn
    D=M
    @SKIP_FLASH
    D;JNE
    @caddr
    A=M
    M=!M

(SKIP_FLASH)
    // ── Read keyboard ──
    @KBD
    D=M
    @NO_INPUT
    D;JEQ

    // Restore pixel before moving (un-flash)
    @drawn
    D=M
    @SKIP_RESTORE
    D;JNE
    @caddr
    A=M
    M=!M
(SKIP_RESTORE)
    @drawn
    M=0

    // Check arrow keys
    @KBD
    D=M
    @131
    D=D-A
    @GO_UP
    D;JEQ
    @KBD
    D=M
    @133
    D=D-A
    @GO_DOWN
    D;JEQ
    @KBD
    D=M
    @130
    D=D-A
    @GO_LEFT
    D;JEQ
    @KBD
    D=M
    @132
    D=D-A
    @GO_RIGHT
    D;JEQ

    // Any other key = draw (stamp)
    @caddr
    A=M
    M=-1
    @drawn
    M=1
    @DELAY
    0;JMP

(GO_UP)
    @cy
    D=M
    @DELAY
    D;JLE
    @cy
    M=M-1
    @DELAY
    0;JMP
(GO_DOWN)
    @cy
    D=M
    @254
    D=D-A
    @DELAY
    D;JGE
    @cy
    M=M+1
    @DELAY
    0;JMP
(GO_LEFT)
    @cx
    D=M
    @DELAY
    D;JLE
    @cx
    M=M-1
    @DELAY
    0;JMP
(GO_RIGHT)
    @cx
    D=M
    @30
    D=D-A
    @DELAY
    D;JGE
    @cx
    M=M+1
    @DELAY
    0;JMP

(NO_INPUT)
(DELAY)
    @200
    D=A
    @dly
    M=D
(DL)
    @dly
    M=M-1
    D=M
    @POLL
    D;JEQ
    @DL
    0;JMP
`},{title:"Gravity Ball",category:"Animation",code:`// Gravity Ball — A ball falls under gravity, bounces
// off the floor and walls. Watch vy increase as the
// ball accelerates downward, then reverses on bounce.
// Demonstrates: velocity + acceleration physics,
// wall collision, signed arithmetic.
// ⚡ Run at 10K/s for smooth animation.

    // Ball position and velocity
    @5
    D=A
    @bx
    M=D
    @0
    D=A
    @by
    M=D
    @bvx
    M=1
    @bvy
    M=0

(FRAME)
    // ── Clear old ball (1 word at old position) ──
    @by
    D=M
    @t
    M=D
    @t
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    @SCREEN
    D=A
    @t
    D=D+M
    @bx
    D=D+M
    @addr
    M=D
    @addr
    A=M
    M=0

    // ── Apply gravity: vy += 1 ──
    @bvy
    M=M+1

    // ── Update Y position ──
    @bvy
    D=M
    @by
    M=D+M

    // Check floor (row 250)
    @by
    D=M
    @250
    D=D-A
    @NO_FLOOR
    D;JLT
    // Bounce off floor
    @250
    D=A
    @by
    M=D
    // Reverse vy and dampen
    @bvy
    D=M
    D=-D
    D=D+1
    @bvy
    M=D
    // If vy is 0 or positive after damping, stop bouncing
    @bvy
    D=M
    @NO_FLOOR
    D;JLT
    @bvy
    M=-1

(NO_FLOOR)
    // Check ceiling (row 0)
    @by
    D=M
    @NO_CEIL
    D;JGE
    @by
    M=0
    @bvy
    D=M
    D=-D
    @bvy
    M=D

(NO_CEIL)
    // ── Update X position ──
    @bvx
    D=M
    @bx
    M=D+M

    // Check right wall
    @bx
    D=M
    @30
    D=D-A
    @NO_RWALL
    D;JLT
    @30
    D=A
    @bx
    M=D
    @bvx
    M=-1
(NO_RWALL)
    // Check left wall
    @bx
    D=M
    @NO_LWALL
    D;JGE
    @bx
    M=0
    @bvx
    M=1
(NO_LWALL)

    // ── Draw ball at new position ──
    @by
    D=M
    @t
    M=D
    @t
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    @SCREEN
    D=A
    @t
    D=D+M
    @bx
    D=D+M
    @addr
    M=D
    @addr
    A=M
    M=-1

    // ── Delay ──
    @300
    D=A
    @dly
    M=D
(DL)
    @dly
    M=M-1
    D=M
    @FRAME
    D;JEQ
    @DL
    0;JMP
`},{title:"Snake Trail",category:"Animation",code:`// Snake Trail — A dot moves continuously in the
// current direction, leaving a permanent trail behind.
// Change direction with arrow keys (← ↑ → ↓).
// Demonstrates: state machine (direction), continuous
// motion, keyboard input without stopping.
// ⚡ Run at 10K/s.

    // sx/sy = snake head, sdir = 0:right 1:down 2:left 3:up
    @15
    D=A
    @sx
    M=D
    @128
    D=A
    @sy
    M=D
    @sdir
    M=0

(FRAME)
    // ── Draw pixel at current position ──
    @sy
    D=M
    @t
    M=D
    @t
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    @SCREEN
    D=A
    @t
    D=D+M
    @sx
    D=D+M
    @addr
    M=D
    @addr
    A=M
    M=-1

    // ── Read keyboard for direction ──
    @KBD
    D=M
    @132
    D=D-A
    @DIR_RIGHT
    D;JEQ
    @KBD
    D=M
    @133
    D=D-A
    @DIR_DOWN
    D;JEQ
    @KBD
    D=M
    @130
    D=D-A
    @DIR_LEFT
    D;JEQ
    @KBD
    D=M
    @131
    D=D-A
    @DIR_UP
    D;JEQ
    @MOVE
    0;JMP
(DIR_RIGHT)
    @sdir
    M=0
    @MOVE
    0;JMP
(DIR_DOWN)
    @sdir
    M=1
    @MOVE
    0;JMP
(DIR_LEFT)
    @sdir
    M=0
    @2
    D=A
    @sdir
    M=D
    @MOVE
    0;JMP
(DIR_UP)
    @3
    D=A
    @sdir
    M=D

(MOVE)
    // ── Move based on direction ──
    @sdir
    D=M
    @M_DOWN
    D;JGT
    // dir=0 → right
    @sx
    M=M+1
    D=M
    @31
    D=D-A
    @DELAY
    D;JLE
    @sx
    M=0
    @DELAY
    0;JMP
(M_DOWN)
    @sdir
    D=M
    @1
    D=D-A
    @M_LEFT
    D;JGT
    // dir=1 → down
    @sy
    M=M+1
    D=M
    @255
    D=D-A
    @DELAY
    D;JLE
    @sy
    M=0
    @DELAY
    0;JMP
(M_LEFT)
    @sdir
    D=M
    @2
    D=D-A
    @M_UP
    D;JGT
    // dir=2 → left
    @sx
    M=M-1
    D=M
    @DELAY
    D;JGE
    @31
    D=A
    @sx
    M=D
    @DELAY
    0;JMP
(M_UP)
    // dir=3 → up
    @sy
    M=M-1
    D=M
    @DELAY
    D;JGE
    @255
    D=A
    @sy
    M=D

(DELAY)
    @500
    D=A
    @dly
    M=D
(DL)
    @dly
    M=M-1
    D=M
    @FRAME
    D;JEQ
    @DL
    0;JMP
`},{title:"Scrolling Bars",category:"Animation",code:`// Scrolling Bars — Animated horizontal bar pattern
// that scrolls downward continuously. The pattern
// shifts by one row each frame, creating motion.
// Demonstrates: screen-wide writes, frame offset
// animation, modular arithmetic.
// ⚡ Run at MAX speed.

    @offset
    M=0

(FRAME)
    @SCREEN
    D=A
    @addr
    M=D
    @0
    D=A
    @row
    M=D

(ROW_LOOP)
    @row
    D=M
    @256
    D=D-A
    @NEXT_FRAME
    D;JGE

    // Compute bar pattern: (row + offset) / 8 is even → fill
    @row
    D=M
    @offset
    D=D+M
    // Shift right 3 times to divide by 8
    @t
    M=D
    // We'll check bit 3: if (row+offset) & 8 == 0, fill
    @t
    D=M
    @8
    D=D&A
    @FILL_ROW
    D;JEQ

    // Empty row — clear 32 words
    @32
    D=A
    @cnt
    M=D
(EMPTY)
    @cnt
    D=M
    @ROW_DONE
    D;JEQ
    @addr
    A=M
    M=0
    @addr
    M=M+1
    @cnt
    M=M-1
    @EMPTY
    0;JMP

(FILL_ROW)
    // Filled row — set 32 words to -1
    @32
    D=A
    @cnt
    M=D
(FILL)
    @cnt
    D=M
    @ROW_DONE
    D;JEQ
    @addr
    A=M
    M=-1
    @addr
    M=M+1
    @cnt
    M=M-1
    @FILL
    0;JMP

(ROW_DONE)
    @row
    M=M+1
    @ROW_LOOP
    0;JMP

(NEXT_FRAME)
    @offset
    M=M+1
    // Delay
    @100
    D=A
    @dly
    M=D
(DL)
    @dly
    M=M-1
    D=M
    @FRAME
    D;JEQ
    @DL
    0;JMP
`},{title:"Pixel Rain",category:"Animation",code:`// Pixel Rain — Droplets fall from the top of the
// screen. Uses a simple pseudo-random number generator
// (LFSR-style) to pick new drop positions.
// Demonstrates: pseudo-random numbers, multiple object
// tracking, screen memory manipulation.
// ⚡ Run at 10K/s or MAX.

    // 4 raindrops: y stored in R5-R8, x (word col) fixed
    // Drop columns: 4, 11, 20, 27
    @R5
    M=0
    @40
    D=A
    @R6
    M=D
    @80
    D=A
    @R7
    M=D
    @120
    D=A
    @R8
    M=D
    // RNG seed
    @12345
    D=A
    @rng
    M=D

(FRAME)
    // ── Process drop 0 (col 4) ──
    @R5
    D=M
    @t
    M=D
    @t
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    @SCREEN
    D=A
    @t
    D=D+M
    @4
    D=D+A
    @addr
    M=D
    @addr
    A=M
    M=-1
    @R5
    M=M+1
    D=M
    @255
    D=D-A
    @D1
    D;JLE
    @R5
    M=0

(D1)
    // ── Process drop 1 (col 11) ──
    @R6
    D=M
    @t
    M=D
    @t
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    @SCREEN
    D=A
    @t
    D=D+M
    @11
    D=D+A
    @addr
    M=D
    @addr
    A=M
    M=-1
    @R6
    M=M+1
    D=M
    @255
    D=D-A
    @D2
    D;JLE
    // Reset with RNG offset
    @rng
    D=M
    D=D+M
    @7
    D=D+A
    @rng
    M=D
    @31
    D=D&A
    @R6
    M=D

(D2)
    // ── Process drop 2 (col 20) ──
    @R7
    D=M
    @t
    M=D
    @t
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    @SCREEN
    D=A
    @t
    D=D+M
    @20
    D=D+A
    @addr
    M=D
    @addr
    A=M
    M=-1
    @R7
    M=M+1
    D=M
    @255
    D=D-A
    @D3
    D;JLE
    @rng
    D=M
    D=D+M
    @13
    D=D+A
    @rng
    M=D
    @63
    D=D&A
    @R7
    M=D

(D3)
    // ── Process drop 3 (col 27) ──
    @R8
    D=M
    @t
    M=D
    @t
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    D=M
    M=D+M
    @SCREEN
    D=A
    @t
    D=D+M
    @27
    D=D+A
    @addr
    M=D
    @addr
    A=M
    M=-1
    @R8
    M=M+1
    D=M
    @255
    D=D-A
    @DELAY
    D;JLE
    @rng
    D=M
    D=D+M
    @3
    D=D+A
    @rng
    M=D
    @127
    D=D&A
    @R8
    M=D

(DELAY)
    @200
    D=A
    @dly
    M=D
(DL)
    @dly
    M=M-1
    D=M
    @FRAME
    D;JEQ
    @DL
    0;JMP
`}],D=new Pt;let L=[],Tt=[],f=!1,I=1,J=new Set,S=0,m=null;const Ot=[{label:"1/s",cycles:1},{label:"10/s",cycles:10},{label:"100/s",cycles:100},{label:"1K/s",cycles:1e3},{label:"10K/s",cycles:1e4},{label:"MAX",cycles:1e5}];performance.now();let at="registers";const b=new Float32Array(32768),h=new Float32Array(32768),Y=.04,It=document.getElementById("app");It.innerHTML=`
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
`;const c=t=>document.getElementById(t),A=c("code-editor"),rt=c("gutter"),F=c("disasm-body"),$=c("screen-canvas"),_=c("memmap-canvas"),T=c("explain-body"),$t=c("reg-body"),j=c("instruction-body"),k=c("alu-body"),_t=c("ram-body"),it=$.getContext("2d"),ot=_.getContext("2d"),V=it.createImageData(512,256),z=ot.createImageData(256,128),B=c("sample-select");let q="";for(let t=0;t<y.length;t++){const e=y[t];if(e.category!==q){const s=document.createElement("optgroup");s.label=e.category,q=e.category;for(let a=t;a<y.length&&y[a].category===e.category;a++){const n=document.createElement("option");n.value=String(a),n.textContent=y[a].title,s.appendChild(n)}B.appendChild(s)}}B.addEventListener("change",()=>{const t=parseInt(B.value);!isNaN(t)&&y[t]&&(A.value=y[t].code,G())});const X=c("speed-group");Ot.forEach((t,e)=>{const s=document.createElement("button");s.className="btn speed-btn"+(e===0?" active":""),s.textContent=t.label,s.addEventListener("click",()=>{I=t.cycles,X.querySelectorAll(".speed-btn").forEach((a,n)=>{a.classList.toggle("active",n===e)})}),X.appendChild(s)});A.value=y[0].code;function G(){const t=A.value.split(`
`);let e="";for(let s=0;s<t.length;s++)e+=`<div class="gutter-line" data-line="${s}">${s+1}</div>`;rt.innerHTML=e}A.addEventListener("input",G);A.addEventListener("scroll",()=>{rt.scrollTop=A.scrollTop});A.addEventListener("keyup",()=>{const t=A.selectionStart,e=A.value.substring(0,t).split(`
`).length;c("line-info").textContent=`Ln ${e}`});G();c("btn-assemble").addEventListener("click",lt);function lt(){try{Tt=A.value.split(`
`);const t=xt(A.value);L=t.sourceMap,D.reset(),D.loadROM(t.rom),J.clear(),S=0,f=!1,m=null,b.fill(0),h.fill(0),Ft(),T.innerHTML='<div class="explain-placeholder">Program assembled! Click <strong>STEP</strong> to begin.</div>',c("rom-count").textContent=`${L.length} instructions`}catch(t){T.innerHTML=`<div class="explain-error">❌ Assembly Error: ${H(t.message)}</div>`}}function Ft(){F.innerHTML="";const t=document.createDocumentFragment();for(let e=0;e<L.length;e++){const s=L[e],a=document.createElement("div");a.className="dline",a.dataset.addr=String(e);const r=parseInt(s.bin,2).toString(16).toUpperCase().padStart(4,"0"),o=s.bin;a.innerHTML=`<span class="bp-dot" title="Click to toggle breakpoint">●</span><span class="d-addr">${e.toString(16).toUpperCase().padStart(4,"0")}</span><span class="d-hex">${r}</span><span class="d-bin">${o.substring(0,3)} <em>${o.substring(3,10)}</em> ${o.substring(10,13)} ${o.substring(13)}</span><span class="d-src">${H(s.src)}</span>`,a.addEventListener("click",()=>kt(a,e)),t.appendChild(a)}F.appendChild(t)}function H(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function kt(t,e){J.has(e)?(J.delete(e),t.classList.remove("breakpoint")):(J.add(e),t.classList.add("breakpoint"))}function Bt(){const t=F.children;for(let e=0;e<t.length;e++){const s=t[e];if(parseInt(s.dataset.addr)===D.PC){s.classList.add("current");const n=F,r=s.offsetTop,o=r+s.offsetHeight,i=n.scrollTop,M=i+n.clientHeight;(r<i||o>M)&&(n.scrollTop=r-n.clientHeight/3)}else s.classList.remove("current")}}c("btn-step").addEventListener("click",()=>{f=!1,Dt()});c("btn-run").addEventListener("click",()=>{f=!0});c("btn-pause").addEventListener("click",()=>{f=!1});c("btn-reset").addEventListener("click",()=>{f=!1,D.reset(),S=0,m=null,b.fill(0),h.fill(0),T.innerHTML='<div class="explain-placeholder">CPU reset. Click <strong>STEP</strong> to begin.</div>'});c("chk-micro").addEventListener("change",t=>{t.target.checked});function Dt(){var e;D.readAddrs.clear(),D.writeAddrs.clear(),m=D.stepDetailed(),S++;const t=((e=L[m.prevPC])==null?void 0:e.src)??"?";T.innerHTML=nt(m,t),Gt(m.prevPC)}function Gt(t){var o;const e=L[t];if(!e)return;const s=e.lineIdx,a=A.value.split(`
`);let n=0;for(let i=0;i<s&&i<a.length;i++)n+=a[i].length+1;const r=n+(((o=a[s])==null?void 0:o.length)??0);A.focus(),A.setSelectionRange(n,r),A.blur()}const Z={Enter:128,Backspace:129,ArrowLeft:130,ArrowUp:131,ArrowRight:132,ArrowDown:133,Home:134,End:135,PageUp:136,PageDown:137,Insert:138,Delete:139,Escape:140,F1:141,F2:142,F3:143,F4:144,F5:145,F6:146,F7:147,F8:148,F9:149,F10:150,F11:151,F12:152};document.addEventListener("keydown",t=>{if(document.activeElement===A)return;if(t.key===" "){t.preventDefault(),Dt();return}if(t.key==="r"&&!t.ctrlKey){f=!0;return}if(t.key==="p"){f=!1;return}let e=0;Z[t.key]!==void 0?e=Z[t.key]:t.key.length===1&&(e=t.key.charCodeAt(0)),e&&(D.ram[24576]=e)});document.addEventListener("keyup",t=>{document.activeElement!==A&&(D.ram[24576]=0)});c("ram-tabs").addEventListener("click",t=>{const e=t.target;e.classList.contains("tab")&&(at=e.dataset.tab,c("ram-tabs").querySelectorAll(".tab").forEach(s=>s.classList.remove("active")),e.classList.add("active"))});let O=!1;c("alu-toggle").addEventListener("click",()=>{O=!O,k.style.display=O?"none":"",c("alu-toggle").textContent=O?"▶":"▼"});function C(t){return((t&65535)>>>0).toString(16).toUpperCase().padStart(4,"0")}function N(t){return t=t&65535,t>=32768?t-65536:t}let tt=0,et=0,st=0;function Ht(){const t=D.A&65535,e=N(D.D),s=D.PC,a=D.A&32767,n=N(D.ram[a]),r=t!==tt?" flash":"",o=e!==N(et)?" flash":"",i=s!==st?" flash":"";$t.innerHTML=`
    <div class="reg-row">
      <div class="reg-box${r}">
        <div class="reg-name">A</div>
        <div class="reg-val">${N(t)}</div>
        <div class="reg-sub">0x${C(t)}</div>
      </div>
      <div class="reg-box${o}">
        <div class="reg-name">D</div>
        <div class="reg-val">${e}</div>
        <div class="reg-sub">0x${C(D.D)}</div>
      </div>
      <div class="reg-box${i}">
        <div class="reg-name">PC</div>
        <div class="reg-val">${s}</div>
        <div class="reg-sub">0x${C(s)}</div>
      </div>
    </div>
    <div class="m-ribbon">
      <span class="m-label">M ≡ RAM[A]</span>
      <span class="m-detail">RAM[${a}] = <strong>${n}</strong> (0x${C(n)})</span>
    </div>`,tt=t,et=D.D,st=s}function Ut(){var n;const t=D.PC,e=D.rom[t],s=((e&65535)>>>0).toString(2).padStart(16,"0"),a=((n=L[t])==null?void 0:n.src)??"—";if((e&32768)===0){const r=e&32767;j.innerHTML=`
        <div class="inst-type a-type">A-Instruction</div>
        <div class="inst-src"><code>@${r}</code></div>
        <div class="inst-binary">
          <span class="bit-a">0</span><span class="bit-value">${s.substring(1)}</span>
        </div>
        <div class="inst-fields">
          <span class="field-label">value</span> = ${r}
        </div>`}else{const r=e>>12&1;j.innerHTML=`
        <div class="inst-type c-type">C-Instruction</div>
        <div class="inst-src"><code>${H(a)}</code></div>
        <div class="inst-binary">
          <span class="bit-c">111</span><span class="bit-a">${r}</span> <span class="bit-comp">${s.substring(4,10)}</span> <span class="bit-dest">${s.substring(10,13)}</span> <span class="bit-jump">${s.substring(13)}</span>
        </div>
        <div class="inst-fields">
          <span class="field-label">a</span>=${r} (${r?"use M":"use A"})
          <span class="field-label">comp</span>=${s.substring(4,10)}
          <span class="field-label">dest</span>=${s.substring(10,13)}
          <span class="field-label">jump</span>=${s.substring(13)}
        </div>`}}function Wt(){if(!m||m.isA||!m.alu){k.innerHTML='<div class="alu-empty">No C-instruction yet — step through one to see the ALU.</div>';return}const t=m.alu,e=(s,a)=>`<div class="alu-bit"><span class="alu-bit-name">${s}</span><span class="alu-bit-val ${a?"on":"off"}">${a}</span></div>`;k.innerHTML=`
    <div class="alu-control-bits">
      ${e("zx",t.zx)}${e("nx",t.nx)}${e("zy",t.zy)}${e("ny",t.ny)}${e("f",t.f)}${e("no",t.no)}
    </div>
    <div class="alu-pipeline">
      <div class="alu-stage"><span class="alu-label">x (D)</span><span class="alu-val">${t.xIn}</span></div>
      <div class="alu-arrow">→</div>
      <div class="alu-stage"><span class="alu-label">after zx,nx</span><span class="alu-val">${t.xAfter}</span></div>
      <div class="alu-stage"><span class="alu-label">y (${m.aFlag?"M":"A"})</span><span class="alu-val">${t.yIn}</span></div>
      <div class="alu-arrow">→</div>
      <div class="alu-stage"><span class="alu-label">after zy,ny</span><span class="alu-val">${t.yAfter}</span></div>
    </div>
    <div class="alu-result-row">
      <div class="alu-stage"><span class="alu-label">${t.f?"x+y":"x&y"}</span><span class="alu-val">${t.fOut}</span></div>
      <div class="alu-arrow">→ ${t.no?"!":""} →</div>
      <div class="alu-stage result"><span class="alu-label">out</span><span class="alu-val">${t.result}</span></div>
      <div class="alu-flags">
        <span class="alu-flag ${t.zr?"on":""}">zr=${t.zr?"1":"0"}</span>
        <span class="alu-flag ${t.ng?"on":""}">ng=${t.ng?"1":"0"}</span>
      </div>
    </div>`}function Kt(){let t="";const e=(s,a,n=!1)=>{const r=N(D.ram[s&32767]),o=n?' class="ram-highlight"':"",i=a??`RAM[${s}]`,M=h[s]>.3?" ram-written":"",l=b[s]>.3?" ram-read":"";return`<div class="ram-row${M}${l}"${o}><span class="ram-addr">${i}</span><span class="ram-val">${r}</span><span class="ram-hex">0x${C(r)}</span></div>`};switch(at){case"registers":t+='<div class="ram-section-label">Special Pointers</div>',t+=e(0,"SP (R0)"),t+=e(1,"LCL (R1)"),t+=e(2,"ARG (R2)"),t+=e(3,"THIS (R3)"),t+=e(4,"THAT (R4)"),t+='<div class="ram-section-label">Temp Registers</div>';for(let s=5;s<=12;s++)t+=e(s,`R${s}`);t+='<div class="ram-section-label">R13–R15 (static)</div>';for(let s=13;s<=15;s++)t+=e(s,`R${s}`);break;case"aroundA":{const s=D.A&32767,a=Math.max(0,s-8),n=Math.min(32767,s+8);for(let r=a;r<=n;r++)t+=e(r,`RAM[${r}]`,r===s);break}case"stack":{const s=D.ram[0];t+=`<div class="ram-section-label">SP = ${s}</div>`;const a=Math.max(256,s-4);for(let n=a;n<a+16&&n<32768;n++)t+=e(n,`RAM[${n}]`,n===s);break}case"screen":{t+='<div class="ram-section-label">Screen (first 16 words)</div>';for(let s=0;s<16;s++){const a=16384+s;t+=e(a,`SCR[${s}]`)}t+='<div class="ram-section-label">KBD</div>',t+=e(24576,"KBD");break}}_t.innerHTML=t}function Qt(){const t=V.data;for(let e=0;e<256;e++)for(let s=0;s<32;s++){const a=D.ram[At+e*32+s];for(let n=0;n<16;n++){const r=s*16+n,o=(e*512+r)*4,i=a>>n&1;t[o]=i?160:15,t[o+1]=i?230:18,t[o+2]=i?180:25,t[o+3]=255}}it.putImageData(V,0,0)}function Yt(){const t=z.data;for(let e=0;e<32768;e++)b[e]>0&&(b[e]-=Y,b[e]<0&&(b[e]=0)),h[e]>0&&(h[e]-=Y,h[e]<0&&(h[e]=0));for(const e of D.readAddrs)b[e]=1;for(const e of D.writeAddrs)h[e]=1;for(let e=0;e<32768;e++){const s=e%256,n=((e/256|0)*256+s)*4,r=D.ram[e],o=h[e],i=b[e];let M=r!==0?25:8,l=r!==0?28:10,p=r!==0?35:14;o>.01&&(M+=o*220,l+=o*40),i>.01&&(l+=i*180,p+=i*120),t[n]=Math.min(255,M)|0,t[n+1]=Math.min(255,l)|0,t[n+2]=Math.min(255,p)|0,t[n+3]=255}ot.putImageData(z,0,0)}function jt(){c("stat-cycles").textContent=`${S.toLocaleString()} cycles`;const t=c("stat-state");t.textContent=f?"RUNNING":"STOPPED",t.className="stat-pill "+(f?"running":"stopped")}function Mt(t){var e;if(requestAnimationFrame(Mt),f){if(D.readAddrs.clear(),D.writeAddrs.clear(),I<=100){for(let s=0;s<I;s++)if(m=D.stepDetailed(),S++,J.has(D.PC)){f=!1;break}if(m){const s=((e=L[m.prevPC])==null?void 0:e.src)??"?";T.innerHTML=nt(m,s)}}else for(let s=0;s<I;s++)if(D.step(),S++,J.has(D.PC)){f=!1;break}}Ht(),Ut(),Wt(),Kt(),Yt(),Qt(),Bt(),jt()}function ct(){const t=$.parentElement,e=t.clientWidth-4,s=t.clientHeight-4,a=Math.max(.5,Math.min(e/512,s/256));$.style.width=Math.floor(512*a)+"px",$.style.height=Math.floor(256*a)+"px";const n=_.parentElement,r=n.clientWidth-4,o=n.clientHeight-4,i=Math.max(1,Math.min(Math.floor(r/256),Math.floor(o/128)));_.style.width=256*i+"px",_.style.height=128*i+"px"}window.addEventListener("resize",ct);setTimeout(ct,100);lt();requestAnimationFrame(Mt);
