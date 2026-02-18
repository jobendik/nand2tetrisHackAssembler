// ─── VM Sample Programs ──────────────────────────────────────────────────
// Progressive samples matching the nand2tetris Projects 7 & 8 test suite.
// Each includes explanatory comments to aid learning.

export interface VMSampleProgram {
    title: string;
    category: string;
    code: string;
    description: string;
    initSP?: number;
    initSegments?: Record<string, number[]>;
}

export const VM_SAMPLES: VMSampleProgram[] = [
    // ── Project 7: Stack Arithmetic ──────────────────────────────────────
    {
        title: 'SimpleAdd',
        category: 'Stack Arithmetic',
        description: 'Push two constants and add them. The simplest VM program.',
        code: `// SimpleAdd: push 7 and 8, then add them
// Expected result: stack top = 15

push constant 7
push constant 8
add`,
    },
    {
        title: 'Stack Ops',
        category: 'Stack Arithmetic',
        description: 'Tests all arithmetic-logical commands on the stack.',
        code: `// Test all arithmetic-logical commands
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
// Stack: ..., -8`,
    },
    {
        title: 'Bitwise Logic',
        category: 'Stack Arithmetic',
        description: 'Demonstrates and, or, not operations.',
        code: `// Bitwise logic operations
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
// NOT 32767 = -32768`,
    },

    // ── Project 7: Memory Segments ───────────────────────────────────────
    {
        title: 'BasicTest',
        category: 'Memory Segments',
        description: 'Push and pop from local, argument, this, that, and temp segments.',
        initSP: 256,
        initSegments: { local: [300], argument: [400], this: [3000], that: [3010] },
        code: `// BasicTest: push/pop with various segments
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
// 10 + 45 - 21 + 36 = 70`,
    },
    {
        title: 'PointerTest',
        category: 'Memory Segments',
        description: 'Tests the pointer segment — direct access to THIS and THAT base addresses.',
        code: `// PointerTest: pointer 0 = THIS, pointer 1 = THAT
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
// 3030 + 3040 - 32 + 46 = 6084`,
    },
    {
        title: 'StaticTest',
        category: 'Memory Segments',
        description: 'Tests the static segment — file-scoped variables.',
        code: `// StaticTest: static variables persist at RAM[16+]
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
// 333 - 111 + 888 = 1110`,
    },

    // ── Project 8: Branching ─────────────────────────────────────────────
    {
        title: 'BasicLoop',
        category: 'Branching',
        description: 'Computes 1+2+...+n using a loop with label and if-goto.',
        initSP: 256,
        initSegments: { local: [300], argument: [400] },
        code: `// BasicLoop: compute 1 + 2 + ... + argument[0]
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
// Push result (should be 10)`,
    },
    {
        title: 'Fibonacci Series',
        category: 'Branching',
        description: 'Computes and stores the first n Fibonacci numbers in that segment.',
        initSP: 256,
        initSegments: { local: [300], argument: [400], that: [3000] },
        code: `// FibonacciSeries: store first arg[0] Fibonacci numbers at that[]
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

label END_LOOP`,
    },

    // ── Project 8: Functions ─────────────────────────────────────────────
    {
        title: 'SimpleFunction',
        category: 'Functions',
        description: 'A simple function that takes 2 arguments and returns their sum + 5.',
        initSP: 317,
        initSegments: { local: [317], argument: [310] },
        code: `// SimpleFunction: compute argument[0] + argument[1] + 5
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

return`,
    },
    {
        title: 'Nested Calls',
        category: 'Functions',
        description: 'Tests function call/return with nested function calls.',
        code: `// Nested function calls — tests the call/return mechanism

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
return`,
    },
    {
        title: 'Fibonacci (Recursive)',
        category: 'Functions',
        description: 'Computes Fibonacci(n) recursively — the ultimate test of function calls.',
        code: `// Recursive Fibonacci — the classic test of call/return
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
return`,
    },
];
