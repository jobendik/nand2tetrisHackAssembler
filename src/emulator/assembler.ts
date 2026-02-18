import { PREDEFINED_SYMBOLS, type AssemblyResult } from './types';

const COMP_TABLE: Record<string, string> = {
    '0': '0101010', '1': '0111111', '-1': '0111010',
    'D': '0001100', 'A': '0110000', '!D': '0001101', '!A': '0110001',
    '-D': '0001111', '-A': '0110011', 'D+1': '0011111', 'A+1': '0110111',
    'D-1': '0001110', 'A-1': '0110010', 'D+A': '0000010', 'A+D': '0000010',
    'D-A': '0010011', 'A-D': '0000111', 'D&A': '0000000', 'A&D': '0000000',
    'D|A': '0010101', 'A|D': '0010101',
    'M': '1110000', '!M': '1110001', '-M': '1110011', 'M+1': '1110111',
    'M-1': '1110010', 'D+M': '1000010', 'M+D': '1000010', 'D-M': '1010011',
    'M-D': '1000111', 'D&M': '1000000', 'M&D': '1000000', 'D|M': '1010101', 'M|D': '1010101',
};

const DEST_TABLE: Record<string, string> = {
    '': '000', 'M': '001', 'D': '010', 'MD': '011', 'DM': '011',
    'A': '100', 'AM': '101', 'MA': '101', 'AD': '110', 'DA': '110',
    'AMD': '111', 'ADM': '111', 'MAD': '111', 'MDA': '111', 'DMA': '111', 'DAM': '111',
};

const JUMP_TABLE: Record<string, string> = {
    '': '000', 'JGT': '001', 'JEQ': '010', 'JGE': '011',
    'JLT': '100', 'JNE': '101', 'JLE': '110', 'JMP': '111',
};

export function assemble(source: string): AssemblyResult {
    const rawLines = source.split('\n');
    const cleaned: { text: string; lineNum: number; lineIdx: number }[] = [];

    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i].replace(/\/\/.*/, '').trim();
        if (line.length > 0) cleaned.push({ text: line, lineNum: i + 1, lineIdx: i });
    }

    // First pass: labels
    const symbols: Record<string, number> = { ...PREDEFINED_SYMBOLS };
    let romAddr = 0;
    const instructions: { text: string; lineNum: number; lineIdx: number }[] = [];

    for (const item of cleaned) {
        const m = item.text.match(/^\(([A-Za-z_.$:][A-Za-z0-9_.$:]*)\)$/);
        if (m) {
            symbols[m[1]] = romAddr;
        } else {
            instructions.push(item);
            romAddr++;
        }
    }

    // Second pass: generate binary
    let nextVarAddr = 16;
    const rom: number[] = [];
    const sourceMap: AssemblyResult['sourceMap'] = [];

    for (const item of instructions) {
        const line = item.text;

        if (line.startsWith('@')) {
            const val = line.substring(1);
            let num: number;
            if (/^\d+$/.test(val)) {
                num = parseInt(val, 10);
            } else {
                if (!(val in symbols)) symbols[val] = nextVarAddr++;
                num = symbols[val];
            }
            const bin = (num & 0x7FFF).toString(2).padStart(16, '0');
            rom.push(parseInt(bin, 2));
            sourceMap.push({ src: line, lineNum: item.lineNum, lineIdx: item.lineIdx, bin });
        } else {
            let dest = '', comp = '', jump = '';
            let rest = line;
            if (rest.includes('=')) {
                const parts = rest.split('=');
                dest = parts[0].trim();
                rest = parts[1].trim();
            }
            if (rest.includes(';')) {
                const parts = rest.split(';');
                comp = parts[0].trim();
                jump = parts[1].trim();
            } else {
                comp = rest.trim();
            }

            const compBits = COMP_TABLE[comp];
            if (!compBits) throw new Error(`Unknown comp "${comp}" at line ${item.lineNum}`);
            const destBits = DEST_TABLE[dest];
            if (destBits === undefined) throw new Error(`Unknown dest "${dest}" at line ${item.lineNum}`);
            const jumpBits = JUMP_TABLE[jump];
            if (jumpBits === undefined) throw new Error(`Unknown jump "${jump}" at line ${item.lineNum}`);

            const bin = '111' + compBits + destBits + jumpBits;
            rom.push(parseInt(bin, 2));
            sourceMap.push({ src: line, lineNum: item.lineNum, lineIdx: item.lineIdx, bin });
        }
    }

    return { rom, sourceMap };
}
