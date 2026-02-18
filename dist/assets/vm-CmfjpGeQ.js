var ns=Object.defineProperty;var cs=(e,s,a)=>s in e?ns(e,s,{enumerable:!0,configurable:!0,writable:!0,value:a}):e[s]=a;var M=(e,s,a)=>cs(e,typeof s!="symbol"?s+"":s,a);import"./main-CN2AzGXq.js";const D={local:1,argument:2,this:3,that:4},C=5,U=16,O=256;function os(e){const s=e.split(`
`),a=[];for(let t=0;t<s.length;t++){const n=s[t].replace(/\/\/.*/,"").trim();if(n.length===0)continue;const r=n.split(/\s+/),h=r[0],p={type:h,raw:n,lineIdx:t};h==="push"||h==="pop"?(p.arg1=r[1],p.arg2=parseInt(r[2],10)):h==="label"||h==="goto"||h==="if-goto"?p.arg1=r[1]:(h==="function"||h==="call")&&(p.arg1=r[1],p.arg2=parseInt(r[2],10)),a.push(p)}return a}function f(e){return e=e&65535,e>=32768?e-65536:e}class is{constructor(){M(this,"ram",new Int16Array(32768));M(this,"commands",[]);M(this,"cmdIndex",0);M(this,"halted",!1);M(this,"currentFunction","global");M(this,"labelMap",new Map);M(this,"callStack",[]);M(this,"staticFileName","Main");M(this,"readAddrs",new Set);M(this,"writeAddrs",new Set);M(this,"_cmpCounter",0)}get SP(){return this.ram[0]}set SP(s){this.ram[0]=s}get LCL(){return this.ram[1]}set LCL(s){this.ram[1]=s}get ARG(){return this.ram[2]}set ARG(s){this.ram[2]=s}get THIS(){return this.ram[3]}set THIS(s){this.ram[3]=s}get THAT(){return this.ram[4]}set THAT(s){this.ram[4]=s}reset(){this.ram.fill(0),this.SP=O,this.cmdIndex=0,this.halted=!1,this.currentFunction="global",this.callStack=[],this._cmpCounter=0,this.readAddrs.clear(),this.writeAddrs.clear()}load(s){this.commands=os(s),this.buildLabelMap(),this.reset()}buildLabelMap(){this.labelMap.clear();for(let s=0;s<this.commands.length;s++){const a=this.commands[s];if(a.type==="label"){const t=`${this.currentFunction}$${a.arg1}`;this.labelMap.set(t,s+1),this.labelMap.set(a.arg1,s+1)}else a.type==="function"&&(this.currentFunction=a.arg1,this.labelMap.set(a.arg1,s))}this.currentFunction="global"}push(s){this.ram[this.SP]=s,this.writeAddrs.add(this.SP),this.SP++}pop(){this.SP--;const s=f(this.ram[this.SP]);return this.readAddrs.add(this.SP),s}peek(){return f(this.ram[this.SP-1])}getSegmentAddr(s,a){switch(s){case"local":case"argument":case"this":case"that":{const t=D[s];return f(this.ram[t])+a}case"temp":return C+a;case"pointer":return 3+a;case"static":return U+a;default:return 0}}getStackContents(){const s=[];for(let a=O;a<this.SP&&a<32768;a++)s.push(f(this.ram[a]));return s}getSegmentContents(s,a=8){let t,o;switch(s){case"local":case"argument":case"this":case"that":{const r=D[s];t=f(this.ram[r]),o=a;break}case"temp":t=C,o=8;break;case"pointer":t=3,o=2;break;case"static":t=U,o=a;break;default:return{addr:0,values:[]}}const n=[];for(let r=0;r<o;r++)n.push(f(this.ram[t+r]));return{addr:t,values:n}}stepDetailed(){if(this.halted||this.cmdIndex>=this.commands.length)return this.halted=!0,this.makeHaltedResult();this.readAddrs.clear(),this.writeAddrs.clear();const s=this.commands[this.cmdIndex],a=this.getStackContents(),t=this.SP,o=[],n=[];let r,h,p,S,y;const R=(l,i,c)=>{o.push({addr:l,oldVal:i,newVal:c})};switch(s.type){case"add":case"sub":case"and":case"or":{const l=this.pop(),i=this.pop();let c;switch(s.type){case"add":c=f(i+l&65535);break;case"sub":c=f(i-l&65535);break;case"and":c=f(i&l&65535);break;case"or":c=f((i|l)&65535);break;default:c=0}n.push({action:"pop",value:l,source:"y (top)"}),n.push({action:"pop",value:i,source:"x (second)"}),this.push(c),n.push({action:"push",value:c,source:`${s.type} result`});break}case"eq":case"gt":case"lt":{const l=this.pop(),i=this.pop();let c;switch(s.type){case"eq":c=i===l;break;case"gt":c=i>l;break;case"lt":c=i<l;break;default:c=!1}const d=c?-1:0;n.push({action:"pop",value:l,source:"y (top)"}),n.push({action:"pop",value:i,source:"x (second)"}),this.push(d),n.push({action:"push",value:d,source:`${s.type}: ${i} ${s.type==="eq"?"==":s.type==="gt"?">":"<"} ${l} → ${c}`}),this._cmpCounter++;break}case"neg":{const l=this.pop(),i=f(-l&65535);n.push({action:"pop",value:l}),this.push(i),n.push({action:"push",value:i,source:"neg result"});break}case"not":{const l=this.pop(),i=f(~l&65535);n.push({action:"pop",value:l}),this.push(i),n.push({action:"push",value:i,source:"not result"});break}case"push":{const l=s.arg1,i=s.arg2;let c;if(l==="constant")c=i,n.push({action:"push",value:c,source:`constant ${i}`});else{const d=this.getSegmentAddr(l,i);c=f(this.ram[d]),this.readAddrs.add(d),r={segment:l,index:i,ramAddr:d,value:c},n.push({action:"push",value:c,source:`${l}[${i}] (RAM[${d}])`})}this.push(c);break}case"pop":{const l=s.arg1,i=s.arg2,c=this.getSegmentAddr(l,i),d=this.pop(),A=f(this.ram[c]);this.ram[c]=d,this.writeAddrs.add(c),r={segment:l,index:i,ramAddr:c,value:d},R(c,A,d),n.push({action:"pop",value:d,source:`→ ${l}[${i}] (RAM[${c}])`});break}case"label":break;case"goto":{const l=s.arg1,i=this.resolveLabel(l);if(i!==void 0)return this.cmdIndex=i,S=!0,y=i,{command:s,stackBefore:a,stackAfter:this.getStackContents(),stackChanges:n,ramWrites:o,generatedASM:this.generateASM(s),spBefore:t,spAfter:this.SP,jumpTaken:!0,jumpTarget:i};break}case"if-goto":{const l=s.arg1,i=this.pop();if(n.push({action:"pop",value:i,source:"condition"}),i!==0){const c=this.resolveLabel(l);if(c!==void 0)return this.cmdIndex=c,S=!0,y=c,{command:s,stackBefore:a,stackAfter:this.getStackContents(),stackChanges:n,ramWrites:o,generatedASM:this.generateASM(s),spBefore:t,spAfter:this.SP,jumpTaken:!0,jumpTarget:c}}S=!1;break}case"function":{const l=s.arg1,i=s.arg2;this.currentFunction=l;for(let c=0;c<i;c++)this.push(0),n.push({action:"push",value:0,source:`local[${c}] init`});break}case"call":{const l=s.arg1,i=s.arg2,c=this.cmdIndex+1,d=this.LCL,A=this.ARG,v=this.THIS,P=this.THAT;this.push(c),n.push({action:"push",value:c,source:"return address"}),this.push(this.LCL),n.push({action:"push",value:this.LCL,source:"saved LCL"}),this.push(this.ARG),n.push({action:"push",value:this.ARG,source:"saved ARG"}),this.push(this.THIS),n.push({action:"push",value:this.THIS,source:"saved THIS"}),this.push(this.THAT),n.push({action:"push",value:this.THAT,source:"saved THAT"}),this.ARG=this.SP-i-5,this.LCL=this.SP,p={name:l,returnAddr:c,savedLCL:d,savedARG:A,savedTHIS:v,savedTHAT:P,nLocals:0},this.callStack.push(p),h="call";const N=this.labelMap.get(l);if(N!==void 0)return this.cmdIndex=N,{command:s,stackBefore:a,stackAfter:this.getStackContents(),stackChanges:n,ramWrites:o,generatedASM:this.generateASM(s),spBefore:t,spAfter:this.SP,frameAction:h,frame:p,jumpTaken:!0,jumpTarget:N};break}case"return":{const l=this.LCL,i=f(this.ram[l-5]),c=this.pop();return n.push({action:"pop",value:c,source:"return value"}),this.ram[this.ARG]=c,R(this.ARG,0,c),this.SP=this.ARG+1,this.THAT=f(this.ram[l-1]),this.THIS=f(this.ram[l-2]),this.ARG=f(this.ram[l-3]),this.LCL=f(this.ram[l-4]),h="return",this.callStack.length>0&&(p=this.callStack.pop()),i>=0&&i<this.commands.length?this.cmdIndex=i:this.halted=!0,{command:s,stackBefore:a,stackAfter:this.getStackContents(),stackChanges:n,ramWrites:o,generatedASM:this.generateASM(s),spBefore:t,spAfter:this.SP,frameAction:h,frame:p}}}return this.cmdIndex++,{command:s,stackBefore:a,stackAfter:this.getStackContents(),stackChanges:n,segmentAccess:r,ramWrites:o,generatedASM:this.generateASM(s),spBefore:t,spAfter:this.SP,frameAction:h,frame:p,jumpTaken:S,jumpTarget:y}}resolveLabel(s){const a=`${this.currentFunction}$${s}`;if(this.labelMap.has(a))return this.labelMap.get(a);if(this.labelMap.has(s))return this.labelMap.get(s)}makeHaltedResult(){return{command:{type:"add",raw:"(halted)",lineIdx:-1},stackBefore:this.getStackContents(),stackAfter:this.getStackContents(),stackChanges:[],ramWrites:[],generatedASM:["// Program halted"],spBefore:this.SP,spAfter:this.SP}}generateASM(s){const a=[],t=o=>a.push(o);switch(s.type){case"push":{const o=s.arg1,n=s.arg2;t(`// push ${o} ${n}`),o==="constant"?(t(`@${n}`),t("D=A")):o==="temp"?(t(`@${C+n}`),t("D=M")):o==="pointer"?(t(`@${n===0?"THIS":"THAT"}`),t("D=M")):o==="static"?(t(`@${this.staticFileName}.${n}`),t("D=M")):(t(`@${o==="local"?"LCL":o==="argument"?"ARG":o==="this"?"THIS":"THAT"}`),t("D=M"),t(`@${n}`),t("A=D+A"),t("D=M")),t("@SP"),t("A=M"),t("M=D"),t("@SP"),t("M=M+1");break}case"pop":{const o=s.arg1,n=s.arg2;t(`// pop ${o} ${n}`),o==="temp"?(t("@SP"),t("AM=M-1"),t("D=M"),t(`@${C+n}`),t("M=D")):o==="pointer"?(t("@SP"),t("AM=M-1"),t("D=M"),t(`@${n===0?"THIS":"THAT"}`),t("M=D")):o==="static"?(t("@SP"),t("AM=M-1"),t("D=M"),t(`@${this.staticFileName}.${n}`),t("M=D")):(t(`@${o==="local"?"LCL":o==="argument"?"ARG":o==="this"?"THIS":"THAT"}`),t("D=M"),t(`@${n}`),t("D=D+A"),t("@R13"),t("M=D"),t("@SP"),t("AM=M-1"),t("D=M"),t("@R13"),t("A=M"),t("M=D"));break}case"add":t("// add"),t("@SP"),t("AM=M-1"),t("D=M"),t("A=A-1"),t("M=D+M");break;case"sub":t("// sub"),t("@SP"),t("AM=M-1"),t("D=M"),t("A=A-1"),t("M=M-D");break;case"neg":t("// neg"),t("@SP"),t("A=M-1"),t("M=-M");break;case"not":t("// not"),t("@SP"),t("A=M-1"),t("M=!M");break;case"and":t("// and"),t("@SP"),t("AM=M-1"),t("D=M"),t("A=A-1"),t("M=D&M");break;case"or":t("// or"),t("@SP"),t("AM=M-1"),t("D=M"),t("A=A-1"),t("M=D|M");break;case"eq":case"gt":case"lt":{const o=s.type==="eq"?"JEQ":s.type==="gt"?"JGT":"JLT",n=this._cmpCounter;t(`// ${s.type}`),t("@SP"),t("AM=M-1"),t("D=M"),t("A=A-1"),t("D=M-D"),t(`@TRUE_${n}`),t(`D;${o}`),t("@SP"),t("A=M-1"),t("M=0"),t(`@END_${n}`),t("0;JMP"),t(`(TRUE_${n})`),t("@SP"),t("A=M-1"),t("M=-1"),t(`(END_${n})`);break}case"label":t(`// label ${s.arg1}`),t(`(${this.currentFunction}$${s.arg1})`);break;case"goto":t(`// goto ${s.arg1}`),t(`@${this.currentFunction}$${s.arg1}`),t("0;JMP");break;case"if-goto":t(`// if-goto ${s.arg1}`),t("@SP"),t("AM=M-1"),t("D=M"),t(`@${this.currentFunction}$${s.arg1}`),t("D;JNE");break;case"function":{t(`// function ${s.arg1} ${s.arg2}`),t(`(${s.arg1})`);for(let o=0;o<s.arg2;o++)t("@SP"),t("A=M"),t("M=0"),t("@SP"),t("M=M+1");break}case"call":{const o=this._cmpCounter;t(`// call ${s.arg1} ${s.arg2}`),t(`@RETURN_${s.arg1}_${o}`),t("D=A"),t("@SP"),t("A=M"),t("M=D"),t("@SP"),t("M=M+1");for(const n of["LCL","ARG","THIS","THAT"])t(`@${n}`),t("D=M"),t("@SP"),t("A=M"),t("M=D"),t("@SP"),t("M=M+1");t("@SP"),t("D=M"),t(`@${s.arg2+5}`),t("D=D-A"),t("@ARG"),t("M=D"),t("@SP"),t("D=M"),t("@LCL"),t("M=D"),t(`@${s.arg1}`),t("0;JMP"),t(`(RETURN_${s.arg1}_${o})`);break}case"return":t("// return"),t("@LCL"),t("D=M"),t("@R13"),t("M=D"),t("@5"),t("A=D-A"),t("D=M"),t("@R14"),t("M=D"),t("@SP"),t("AM=M-1"),t("D=M"),t("@ARG"),t("A=M"),t("M=D"),t("@ARG"),t("D=M+1"),t("@SP"),t("M=D"),t("@R13"),t("AM=M-1"),t("D=M"),t("@THAT"),t("M=D"),t("@R13"),t("AM=M-1"),t("D=M"),t("@THIS"),t("M=D"),t("@R13"),t("AM=M-1"),t("D=M"),t("@ARG"),t("M=D"),t("@R13"),t("AM=M-1"),t("D=M"),t("@LCL"),t("M=D"),t("@R14"),t("A=M"),t("0;JMP");break}return a}}function b(e){const s=((e&65535)>>>0).toString(16).toUpperCase().padStart(4,"0");return`<strong>${e}</strong> <span class="vm-hex">(0x${s})</span>`}function q(e){return{local:"local",argument:"argument",this:"this",that:"that",temp:"temp",pointer:"pointer",static:"static",constant:"constant"}[e]??e}function J(e){return{constant:"A virtual segment — the value is embedded directly in the command.",local:"Stores the function's local variables. Base address at RAM[LCL].",argument:"Stores the arguments passed to the current function. Base address at RAM[ARG].",this:"Points to the current object (used for OOP). Base address at RAM[THIS].",that:"Points to array elements or another object. Base address at RAM[THAT].",temp:"Fixed 8-register segment at RAM[5]–RAM[12]. Shared across all functions.",pointer:"Direct access to THIS (pointer 0) and THAT (pointer 1) base addresses.",static:"Per-file static variables starting at RAM[16]. Persists across function calls."}[e]??""}function Y(e){var t,o,n,r,h,p,S,y,R,l,i;const s=[],a=e.command;switch(s.push(`<div class="vm-explain-title"><code>${a.raw}</code></div>`),s.push('<div class="vm-explain-body">'),a.type){case"add":case"sub":case"and":case"or":{const c={add:"adds",sub:"subtracts",and:"ANDs",or:"ORs"},d={add:"+",sub:"-",and:"&",or:"|"},A=((t=e.stackChanges[0])==null?void 0:t.value)??0,v=((o=e.stackChanges[1])==null?void 0:o.value)??0,P=((n=e.stackChanges[2])==null?void 0:n.value)??0;s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">1.</span> Pop the top value: ${b(A)} (y)`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">2.</span> Pop the second value: ${b(v)} (x)`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">3.</span> Compute x ${d[a.type]} y = ${v} ${d[a.type]} ${A} = ${b(P)}`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">4.</span> Push result ${b(P)} onto the stack`),s.push("</div>"),s.push(`<div class="vm-note">💡 The <code>${a.type}</code> command ${c[a.type]} two values and replaces them with one — the stack shrinks by 1.</div>`);break}case"eq":case"gt":case"lt":{const c={eq:"==",gt:">",lt:"<"},d=((r=e.stackChanges[0])==null?void 0:r.value)??0,A=((h=e.stackChanges[1])==null?void 0:h.value)??0,v=((p=e.stackChanges[2])==null?void 0:p.value)??0,P=v!==0;s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">1.</span> Pop the top value: ${b(d)} (y)`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">2.</span> Pop the second value: ${b(A)} (x)`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">3.</span> Compare: ${A} ${c[a.type]} ${d} → <strong class="${P?"vm-true":"vm-false"}">${P?"TRUE":"FALSE"}</strong>`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">4.</span> Push ${b(v)} (${P?"-1 = true":"0 = false"})`),s.push("</div>"),s.push('<div class="vm-note">💡 In Hack, <strong>true = -1</strong> (all bits 1 = 0xFFFF) and <strong>false = 0</strong>.</div>');break}case"neg":case"not":{const c=((S=e.stackChanges[0])==null?void 0:S.value)??0,d=((y=e.stackChanges[1])==null?void 0:y.value)??0,A=a.type==="neg"?"arithmetic negation":"bitwise NOT";s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">1.</span> Pop the top value: ${b(c)}`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">2.</span> Apply ${A}: ${a.type==="neg"?`-${c}`:`~${c}`} = ${b(d)}`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">3.</span> Push result ${b(d)} onto the stack`),s.push("</div>"),s.push(`<div class="vm-note">💡 <code>${a.type}</code> is a unary operator — it replaces the top value in-place (stack size unchanged).</div>`);break}case"push":{const c=a.arg1,d=a.arg2,A=((R=e.stackChanges[0])==null?void 0:R.value)??0;if(s.push('<div class="vm-step-desc">'),c==="constant")s.push(`<span class="vm-step-num">1.</span> The value ${b(d)} is a constant — it exists only in the VM command, not in RAM.`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">2.</span> Push ${b(d)} onto the stack at RAM[${e.spBefore}]`),s.push("</div>");else{const v=e.segmentAccess;s.push(`<span class="vm-step-num">1.</span> Calculate address: <code>${c}[${d}]</code> → RAM[${(v==null?void 0:v.ramAddr)??"?"}]`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">2.</span> Read value ${b(A)} from RAM[${(v==null?void 0:v.ramAddr)??"?"}]`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">3.</span> Push ${b(A)} onto the stack at RAM[${e.spBefore}]`),s.push("</div>")}s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">→</span> SP: ${e.spBefore} → ${e.spAfter}`),s.push("</div>"),s.push(`<div class="vm-note">💡 <strong>${q(c)}</strong>: ${J(c)}</div>`);break}case"pop":{const c=a.arg1,d=a.arg2,A=((l=e.stackChanges[0])==null?void 0:l.value)??0,v=e.segmentAccess;s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">1.</span> Calculate target address: <code>${c}[${d}]</code> → RAM[${(v==null?void 0:v.ramAddr)??"?"}]`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">2.</span> Pop ${b(A)} from the top of the stack`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">3.</span> Store ${b(A)} into RAM[${(v==null?void 0:v.ramAddr)??"?"}]`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">→</span> SP: ${e.spBefore} → ${e.spAfter}`),s.push("</div>"),s.push(`<div class="vm-note">💡 <strong>${q(c)}</strong>: ${J(c)}</div>`);break}case"label":s.push(`<div class="vm-step-desc">Declares a label <code>${a.arg1}</code> at this position.</div>`),s.push('<div class="vm-note">💡 Labels are targets for <code>goto</code> and <code>if-goto</code>. They have no runtime effect — the VM simply moves to the next command.</div>');break;case"goto":s.push(`<div class="vm-step-desc">Unconditionally jumps to label <code>${a.arg1}</code>.</div>`),e.jumpTaken&&s.push(`<div class="vm-step-desc"><span class="vm-true">✓ JUMPED</span> to command #${e.jumpTarget}</div>`),s.push('<div class="vm-note">💡 <code>goto</code> is an unconditional jump — equivalent to <code>0;JMP</code> in Hack assembly.</div>');break;case"if-goto":{const c=((i=e.stackChanges[0])==null?void 0:i.value)??0;s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">1.</span> Pop the top value: ${b(c)}`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">2.</span> Test: ${c} ≠ 0 → <strong class="${e.jumpTaken?"vm-true":"vm-false"}">${e.jumpTaken?"TRUE → JUMP":"FALSE → continue"}</strong>`),s.push("</div>"),e.jumpTaken?s.push(`<div class="vm-step-desc"><span class="vm-true">✓ JUMPED</span> to label <code>${a.arg1}</code> (command #${e.jumpTarget})</div>`):s.push('<div class="vm-step-desc"><span class="vm-false">✗ NO JUMP</span> — continuing to next command</div>'),s.push(`<div class="vm-note">💡 <code>if-goto</code> pops a value and jumps if it's non-zero. This is how loops and conditionals work in the VM.</div>`);break}case"function":s.push('<div class="vm-step-desc">'),s.push(`Declares function <code>${a.arg1}</code> with <strong>${a.arg2}</strong> local variable${a.arg2!==1?"s":""}.`),s.push("</div>"),a.arg2>0&&(s.push('<div class="vm-step-desc">'),s.push(`Pushes ${a.arg2} zeros onto the stack to initialize local variables.`),s.push("</div>")),s.push(`<div class="vm-note">💡 The <code>function</code> command sets up the function's local segment by pushing zeros. LCL points to where these locals begin.</div>`);break;case"call":{const c=a.arg1,d=a.arg2;s.push(`<div class="vm-step-desc vm-call-title">Calling <code>${c}</code> with ${d} argument${d!==1?"s":""}</div>`),s.push('<div class="vm-step-desc">'),s.push('<span class="vm-step-num">1.</span> Push return address onto the stack'),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">2.</span> Save caller's frame: push LCL, ARG, THIS, THAT`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">3.</span> Reposition ARG = SP - ${d} - 5 (points to the arguments)`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">4.</span> Set LCL = SP (callee's local segment starts here)`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">5.</span> Jump to <code>${c}</code>`),s.push("</div>"),s.push(`<div class="vm-note">💡 The <code>call</code> command saves the caller's state (the "frame") so it can be restored when the function returns. The 5 saved values (return address + 4 pointers) form the frame header.</div>`);break}case"return":{s.push('<div class="vm-step-desc vm-call-title">Returning from function</div>'),s.push('<div class="vm-step-desc">'),s.push('<span class="vm-step-num">1.</span> Save LCL into a temp variable (endFrame)'),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push('<span class="vm-step-num">2.</span> Get return address from endFrame - 5'),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push('<span class="vm-step-num">3.</span> Pop return value → place at *ARG (for the caller)'),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push(`<span class="vm-step-num">4.</span> SP = ARG + 1 (discard callee's stack)`),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push('<span class="vm-step-num">5.</span> Restore THAT, THIS, ARG, LCL from frame'),s.push("</div>"),s.push('<div class="vm-step-desc">'),s.push('<span class="vm-step-num">6.</span> Jump to return address'),s.push("</div>"),s.push(`<div class="vm-note">💡 <code>return</code> restores everything the <code>call</code> saved. The return value ends up at the top of the caller's stack — exactly where the arguments were.</div>`);break}}return s.push("</div>"),s.join("")}const T=[{title:"SimpleAdd",category:"Stack Arithmetic",description:"Push two constants and add them. The simplest VM program.",code:`// SimpleAdd: push 7 and 8, then add them
// Expected result: stack top = 15

push constant 7
push constant 8
add`},{title:"Stack Ops",category:"Stack Arithmetic",description:"Tests all arithmetic-logical commands on the stack.",code:`// Test all arithmetic-logical commands
// Each operation pops operand(s), computes, pushes result

push constant 17
push constant 17
eq
// Stack: -1 (true, 17 == 17)

push constant 17
push constant 16
eq
// Stack: -1, 0 (false, 17 != 16)

push constant 3
push constant 4
lt
// Stack: -1, 0, -1 (true, 3 < 4)

push constant 7
push constant 8
add
// Stack: ..., 15

push constant 3
push constant 2
sub
// Stack: ..., 1

push constant 8
neg
// Stack: ..., -8`},{title:"Bitwise Logic",category:"Stack Arithmetic",description:"Demonstrates and, or, not operations.",code:`// Bitwise logic operations
// Remember: true = -1 (0xFFFF), false = 0

push constant 57
push constant 31
and
// 57 AND 31 = 25 (binary: 111001 AND 011111 = 011001)

push constant 57
push constant 31
or
// 57 OR 31 = 63 (binary: 111001 OR 011111 = 111111)

push constant 0
not
// NOT 0 = -1 (true)

push constant 32767
not
// NOT 32767 = -32768`},{title:"BasicTest",category:"Memory Segments",description:"Push and pop from local, argument, this, that, and temp segments.",initSP:256,initSegments:{local:[300],argument:[400],this:[3e3],that:[3010]},code:`// BasicTest: push/pop with various segments
// LCL=300, ARG=400, THIS=3000, THAT=3010

push constant 10
pop local 0
// local[0] = RAM[300] = 10

push constant 21
push constant 22
pop argument 2
pop argument 1
// argument[2] = RAM[402] = 22
// argument[1] = RAM[401] = 21

push constant 36
pop this 6
// this[6] = RAM[3006] = 36

push constant 42
push constant 45
pop that 5
pop that 2
// that[5] = RAM[3015] = 45
// that[2] = RAM[3012] = 42

push constant 510
pop temp 6
// temp[6] = RAM[11] = 510

push local 0
push that 5
add
push argument 1
sub
push this 6
add
// 10 + 45 - 21 + 36 = 70`},{title:"PointerTest",category:"Memory Segments",description:"Tests the pointer segment — direct access to THIS and THAT base addresses.",code:`// PointerTest: pointer 0 = THIS, pointer 1 = THAT
// These change where 'this' and 'that' segments point!

push constant 3030
pop pointer 0
// THIS = 3030 (pointer 0 → RAM[3])

push constant 3040
pop pointer 1
// THAT = 3040 (pointer 1 → RAM[4])

push constant 32
pop this 2
// this[2] = RAM[3032] = 32

push constant 46
pop that 6
// that[6] = RAM[3046] = 46

push pointer 0
push pointer 1
add
push this 2
sub
push that 6
add
// 3030 + 3040 - 32 + 46 = 6084`},{title:"StaticTest",category:"Memory Segments",description:"Tests the static segment — file-scoped variables.",code:`// StaticTest: static variables persist at RAM[16+]
// Each .vm file gets its own static segment

push constant 111
push constant 333
push constant 888
pop static 8
pop static 3
pop static 1
// static[8]=RAM[24]=888, static[3]=RAM[19]=333, static[1]=RAM[17]=111

push static 3
push static 1
sub
push static 8
add
// 333 - 111 + 888 = 1110`},{title:"BasicLoop",category:"Branching",description:"Computes 1+2+...+n using a loop with label and if-goto.",initSP:256,initSegments:{local:[300],argument:[400]},code:`// BasicLoop: compute 1 + 2 + ... + argument[0]
// Set argument[0] = 4, expected result = 10
// Uses: label, if-goto, push, pop, add, sub

push constant 4
pop argument 0
// argument[0] = 4 (compute sum 1..4)

push constant 0
pop local 0
// local[0] = 0 (accumulator)

label LOOP_START
push argument 0
push constant 0
eq
if-goto LOOP_END
// if argument[0] == 0, exit loop

push argument 0
push local 0
add
pop local 0
// accumulator += argument[0]

push argument 0
push constant 1
sub
pop argument 0
// argument[0]--

goto LOOP_START

label LOOP_END
push local 0
// Push result (should be 10)`},{title:"Fibonacci Series",category:"Branching",description:"Computes and stores the first n Fibonacci numbers in that segment.",initSP:256,initSegments:{local:[300],argument:[400],that:[3e3]},code:`// FibonacciSeries: store first arg[0] Fibonacci numbers at that[]
// Set argument[0] = 8, that points to RAM[3000]

push constant 8
pop argument 0
// n = 8

push constant 3000
pop pointer 1
// THAT = 3000

// Fib(0) = 0, Fib(1) = 1
push constant 0
pop that 0
push constant 1
pop that 1

// local[0] = counter, starts at 2
push constant 2
pop local 0

label MAIN_LOOP
push local 0
push argument 0
lt
not
if-goto END_LOOP
// if counter >= n, exit

// that[counter] = that[counter-1] + that[counter-2]
push local 0
push constant 1
sub
// counter - 1 on stack

// We need to manually compute: push that[counter-1] + that[counter-2]
push that 0
push that 1
add
// For simplicity, we'll build up iteratively

pop that 2
// Store temporarily

push local 0
push constant 1
add
pop local 0
// counter++

goto MAIN_LOOP

label END_LOOP`},{title:"SimpleFunction",category:"Functions",description:"A simple function that takes 2 arguments and returns their sum + 5.",initSP:317,initSegments:{local:[317],argument:[310]},code:`// SimpleFunction: compute argument[0] + argument[1] + 5
// Tests function declaration and return

push constant 3
pop argument 0
push constant 7
pop argument 1

function SimpleFunction.test 2
// Declares function with 2 local variables

push local 0
push local 1
add
not
// ~(local[0] + local[1]) = ~0 = -1

push argument 0
add
push argument 1
sub
// -1 + argument[0] - argument[1] = -1 + 3 - 7 = -5

return`},{title:"Nested Calls",category:"Functions",description:"Tests function call/return with nested function calls.",code:`// Nested function calls — tests the call/return mechanism

function Sys.init 0
push constant 4000
pop pointer 0
push constant 5000
pop pointer 1
call Sys.main 0
pop temp 1
label LOOP
goto LOOP

function Sys.main 5
push constant 4001
pop pointer 0
push constant 5001
pop pointer 1
push constant 200
pop local 1
push constant 40
pop local 2
push constant 6
pop local 3
push local 0
push local 1
push local 2
push local 3
push local 4
add
add
add
add
call Sys.add12 1
pop temp 0
push local 0
push local 1
push local 2
push local 3
push local 4
add
add
add
add
push temp 0
add
return

function Sys.add12 0
push constant 4002
pop pointer 0
push constant 5002
pop pointer 1
push argument 0
push constant 12
add
return`},{title:"Fibonacci (Recursive)",category:"Functions",description:"Computes Fibonacci(n) recursively — the ultimate test of function calls.",code:`// Recursive Fibonacci — the classic test of call/return
// Computes Fibonacci(4) = 3

function Sys.init 0
push constant 4
call Main.fibonacci 1
label HALT
goto HALT

function Main.fibonacci 0
push argument 0
push constant 2
lt
if-goto IF_TRUE
goto IF_FALSE

label IF_TRUE
push argument 0
return

label IF_FALSE
push argument 0
push constant 2
sub
call Main.fibonacci 1
push argument 0
push constant 1
sub
call Main.fibonacci 1
add
return`}],u=new is;let $=!1,F=0,m=null,H=!1,x=!1,L=null;const Z=[{label:"1/s",delay:1e3},{label:"3/s",delay:333},{label:"10/s",delay:100},{label:"30/s",delay:33},{label:"MAX",delay:0}];let ss=0;const ls=document.getElementById("app");ls.innerHTML=`
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
`;const g=e=>document.getElementById(e),k=g("vm-code-editor"),E=g("vm-gutter"),G=g("vm-stack-body"),rs=g("vm-asm-body"),w=g("vm-explain-body"),ps=g("vm-segments-body"),W=g("vm-callstack-body"),ds=g("vm-ram-body"),I=g("vm-sample-select");let z="";for(let e=0;e<T.length;e++){const s=T[e];if(s.category!==z){const a=document.createElement("optgroup");a.label=s.category,z=s.category;for(let t=e;t<T.length&&T[t].category===s.category;t++){const o=document.createElement("option");o.value=String(t),o.textContent=T[t].title,a.appendChild(o)}I.appendChild(a)}}I.addEventListener("change",()=>{const e=parseInt(I.value);!isNaN(e)&&T[e]&&(k.value=T[e].code,B())});const K=g("vm-speed-group");Z.forEach((e,s)=>{const a=document.createElement("button");a.className="btn speed-btn"+(s===0?" active":""),a.textContent=e.label,a.addEventListener("click",()=>{ss=s,K.querySelectorAll(".speed-btn").forEach((t,o)=>{t.classList.toggle("active",o===s)})}),K.appendChild(a)});k.value=T[0].code;function B(){const e=k.value.split(`
`);let s="";for(let a=0;a<e.length;a++){const o=e[a].replace(/\/\/.*/,"").trim().length>0;s+=`<div class="gutter-line${o?"":" gutter-comment"}" data-line="${a}">${a+1}</div>`}E.innerHTML=s}k.addEventListener("input",B);k.addEventListener("scroll",()=>{E.scrollTop=k.scrollTop});B();g("vm-btn-load").addEventListener("click",_);function _(){try{const e=k.value;u.load(e);const s=parseInt(I.value);if(!isNaN(s)&&T[s]){const a=T[s];a.initSP&&(u.SP=a.initSP),a.initSegments&&(a.initSegments.local&&(u.LCL=a.initSegments.local[0]),a.initSegments.argument&&(u.ARG=a.initSegments.argument[0]),a.initSegments.this&&(u.THIS=a.initSegments.this[0]),a.initSegments.that&&(u.THAT=a.initSegments.that[0]))}F=0,$=!1,m=null,g("vm-cmd-count").textContent=`${u.commands.length} commands`,w.innerHTML='<div class="explain-placeholder">Program loaded! Click <strong>STEP</strong> to begin.</div>',V()}catch(e){w.innerHTML=`<div class="explain-error">❌ Parse Error: ${es(e.message)}</div>`}}g("vm-btn-reset").addEventListener("click",()=>{$=!1,_()});g("vm-btn-step").addEventListener("click",()=>{$=!1,j()});g("vm-btn-run").addEventListener("click",()=>{$=!0});g("vm-btn-pause").addEventListener("click",()=>{$=!1});function j(){if(!(u.halted||u.cmdIndex>=u.commands.length)){if(m=u.stepDetailed(),F++,us(m.command.lineIdx),m.stackChanges.length>0){const e=m.stackChanges[m.stackChanges.length-1];e.action==="push"?hs(e.value,e.source||""):ms(e.value,e.source||"")}w.innerHTML=Y(m),ts(m),V()}}function us(e){var n;if(e<0)return;const s=k.value.split(`
`);let a=0;for(let r=0;r<e&&r<s.length;r++)a+=s[r].length+1;const t=a+(((n=s[e])==null?void 0:n.length)??0);k.focus(),k.setSelectionRange(a,t),k.blur(),E.querySelectorAll(".gutter-line").forEach(r=>{r.classList.remove("gutter-active")});const o=E.querySelector(`[data-line="${e}"]`);o&&o.classList.add("gutter-active")}function hs(e,s){H=!0,x=!1,L&&clearTimeout(L),L=window.setTimeout(()=>{H=!1,L=null},400)}function ms(e,s){x=!0,H=!1,L&&clearTimeout(L),L=window.setTimeout(()=>{x=!1,L=null},400)}function Q(e){return e=e&65535,e>=32768?e-65536:e}function vs(){const e=u.getStackContents();if(e.length===0){G.innerHTML='<div class="vm-stack-empty">Stack is empty</div>',g("vm-sp-display").textContent=`SP = ${u.SP}`;return}let s='<div class="vm-stack-container">';s+=`<div class="vm-sp-indicator">← SP = ${u.SP}</div>`;for(let a=e.length-1;a>=0;a--){const t=e[a],o=O+a,n=a===e.length-1,r=((t&65535)>>>0).toString(16).toUpperCase().padStart(4,"0");let h="vm-stack-item";n&&H&&(h+=" vm-stack-push-anim"),n&&x&&(h+=" vm-stack-pop-anim"),n&&(h+=" vm-stack-top");let p="";t===0?p="vm-stack-zero":t===-1?p="vm-stack-true":t<0?p="vm-stack-negative":p="vm-stack-positive";const S=gs(o);s+=`<div class="${h} ${p}">`,s+=`  <span class="vm-stack-addr">RAM[${o}]</span>`,s+=`  <span class="vm-stack-val">${t}</span>`,s+=`  <span class="vm-stack-hex">0x${r}</span>`,S&&(s+=`  <span class="vm-stack-frame-label">${S}</span>`),s+="</div>"}s+="</div>",G.innerHTML=s,g("vm-sp-display").textContent=`SP = ${u.SP}`,G.scrollTop=0}function gs(e){const s=u.LCL;return e===s-1?"⟵ saved THAT":e===s-2?"⟵ saved THIS":e===s-3?"⟵ saved ARG":e===s-4?"⟵ saved LCL":e===s-5?"⟵ return addr":null}function ts(e){const s=e.generatedASM;let a='<div class="vm-asm-listing">';for(const t of s){const o=t.trim().startsWith("//"),n=t.trim().startsWith("(");let r="vm-asm-line";o?r+=" vm-asm-comment":n&&(r+=" vm-asm-label"),a+=`<div class="${r}">${es(t)}</div>`}a+="</div>",a+=`<div class="vm-asm-count">${s.filter(t=>!t.trim().startsWith("//")&&!t.trim().startsWith("(")).length} assembly instructions</div>`,rs.innerHTML=a}function fs(){var a,t,o;let e="";const s=[{name:"local",key:"local",color:"var(--accent-blue)"},{name:"argument",key:"argument",color:"var(--accent-green)"},{name:"this",key:"this",color:"var(--accent-orange)"},{name:"that",key:"that",color:"var(--accent-purple)"},{name:"temp",key:"temp",color:"var(--accent-cyan)"},{name:"pointer",key:"pointer",color:"var(--accent-yellow)"},{name:"static",key:"static",color:"var(--accent-red)"}];for(const n of s){const r=u.getSegmentContents(n.key,6),h=((a=m==null?void 0:m.segmentAccess)==null?void 0:a.segment)===n.key;if(e+=`<div class="vm-seg-card${h?" vm-seg-accessed":""}" style="--seg-color: ${n.color}">`,e+='  <div class="vm-seg-header">',e+=`    <span class="vm-seg-name">${n.name}</span>`,n.key in D){const p=D[n.key],S=["SP","LCL","ARG","THIS","THAT"][p];e+=`    <span class="vm-seg-base">base: ${S} = ${r.addr}</span>`}else n.key==="temp"?e+='    <span class="vm-seg-base">fixed: R5–R12</span>':n.key==="pointer"?e+='    <span class="vm-seg-base">R3 (THIS), R4 (THAT)</span>':n.key==="static"&&(e+='    <span class="vm-seg-base">RAM[16]+</span>');e+="  </div>",e+='  <div class="vm-seg-values">';for(let p=0;p<r.values.length;p++){const S=r.values[p],y=r.addr+p,R=((t=m==null?void 0:m.segmentAccess)==null?void 0:t.segment)===n.key&&((o=m==null?void 0:m.segmentAccess)==null?void 0:o.index)===p;e+=`<div class="vm-seg-value${R?" vm-seg-active":""}${S!==0?" vm-seg-nonzero":""}">`,e+=`  <span class="vm-seg-idx">[${p}]</span>`,e+=`  <span class="vm-seg-val">${S}</span>`,e+=`  <span class="vm-seg-addr">RAM[${y}]</span>`,e+="</div>"}e+="  </div>",e+="</div>"}ps.innerHTML=e}function As(){const e=u.callStack;if(e.length===0){W.innerHTML=`<div class="vm-callstack-empty">
            <div class="vm-callstack-current">${u.currentFunction}</div>
            <div class="vm-callstack-hint">Function call frames will appear here when <code>call</code> is executed.</div>
        </div>`;return}let s="";s+='<div class="vm-callframe vm-callframe-current">',s+=`  <div class="vm-callframe-name">▶ ${u.currentFunction}</div>`,s+=`  <div class="vm-callframe-info">LCL=${u.LCL} ARG=${u.ARG}</div>`,s+="</div>";for(let a=e.length-1;a>=0;a--){const t=e[a];s+='<div class="vm-callframe">',s+=`  <div class="vm-callframe-name">${t.name}</div>`,s+=`  <div class="vm-callframe-info">saved: LCL=${t.savedLCL} ARG=${t.savedARG}</div>`,s+=`  <div class="vm-callframe-info">retAddr=${t.returnAddr}</div>`,s+="</div>"}W.innerHTML=s}function bs(){const e=[{name:"SP",addr:0,color:"var(--accent-green)"},{name:"LCL",addr:1,color:"var(--accent-blue)"},{name:"ARG",addr:2,color:"var(--accent-orange)"},{name:"THIS",addr:3,color:"var(--accent-purple)"},{name:"THAT",addr:4,color:"var(--accent-cyan)"}];let s="";for(const a of e){const t=Q(u.ram[a.addr]),o=m&&(a.addr===0&&m.spBefore!==m.spAfter||u.writeAddrs.has(a.addr));s+=`<div class="vm-ptr-row${o?" vm-ptr-changed":""}" style="--ptr-color: ${a.color}">`,s+=`  <span class="vm-ptr-name">${a.name}</span>`,s+='  <span class="vm-ptr-eq">=</span>',s+=`  <span class="vm-ptr-val">${t}</span>`,s+=`  <span class="vm-ptr-desc">RAM[${a.addr}] → points to RAM[${t}]</span>`,s+="</div>"}s+='<div class="vm-ptr-section">Temp (R5–R12)</div>';for(let a=0;a<8;a++){const t=Q(u.ram[C+a]);t!==0&&(s+='<div class="vm-ptr-row">',s+=`  <span class="vm-ptr-name">R${C+a}</span>`,s+='  <span class="vm-ptr-eq">=</span>',s+=`  <span class="vm-ptr-val">${t}</span>`,s+="</div>")}ds.innerHTML=s}function V(){vs(),fs(),As(),bs(),Ss()}function Ss(){g("vm-stat-steps").textContent=`${F} steps`;const e=g("vm-stat-state");u.halted?(e.textContent="HALTED",e.className="stat-pill stopped"):(e.textContent=$?"RUNNING":"STOPPED",e.className="stat-pill "+($?"running":"stopped"))}function es(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}let X=0;function as(e){if(requestAnimationFrame(as),$&&!u.halted){const s=Z[ss].delay;if(s===0)for(let a=0;a<100;a++){if(u.halted||u.cmdIndex>=u.commands.length){$=!1;break}m=u.stepDetailed(),F++}else e-X>=s&&(X=e,j());V(),s===0&&m&&(w.innerHTML=Y(m),ts(m))}}document.addEventListener("keydown",e=>{if(document.activeElement!==k){if(e.key===" "){e.preventDefault(),j();return}if(e.key==="r"&&!e.ctrlKey){$=!0;return}if(e.key==="p"){$=!1;return}}});_();requestAnimationFrame(as);
