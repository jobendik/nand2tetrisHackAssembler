// ─── Sample Programs ─────────────────────────────────────────────────────
// Progressive difficulty: Beginner → Intermediate → Screen → Advanced

export interface SampleProgram {
    title: string;
    category: string;
    code: string;
}

export const SAMPLES: SampleProgram[] = [
    // ── Beginner ─────────────────────────────────────────────────────────
    {
        title: 'Hello: Set R0 = 42',
        category: 'Beginner',
        code: `// Hello Hack! — Set R0 to the value 42
// This is the simplest possible program.
// Step through it to see @value and D=A;M=D in action.

    @42       // Load 42 into the A register
    D=A       // Copy A into D register
    @R0       // Point A at RAM[0] (a.k.a. R0)
    M=D       // Write D into RAM[0]  →  R0 = 42

(END)
    @END
    0;JMP     // Infinite loop — program done
`,
    },
    {
        title: 'Add Two Numbers',
        category: 'Beginner',
        code: `// Add R0 + R1, store result in R2
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
`,
    },
    {
        title: 'Subtract',
        category: 'Beginner',
        code: `// Compute R2 = R0 - R1
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
`,
    },
    // ── Intermediate ─────────────────────────────────────────────────────
    {
        title: 'Absolute Value',
        category: 'Intermediate',
        code: `// R1 = |R0|  (absolute value)
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
`,
    },
    {
        title: 'Countdown Loop',
        category: 'Intermediate',
        code: `// Count from 5 down to 0 in R0
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
`,
    },
    {
        title: 'Sum 1..N',
        category: 'Intermediate',
        code: `// Compute R1 = 1 + 2 + ... + R0
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
`,
    },
    {
        title: 'Max of Two',
        category: 'Intermediate',
        code: `// R2 = max(R0, R1)
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
`,
    },
    {
        title: 'Multiply R0 × R1',
        category: 'Intermediate',
        code: `// R2 = R0 × R1 via repeated addition
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
`,
    },
    // ── Screen ───────────────────────────────────────────────────────────
    {
        title: 'Draw One Pixel',
        category: 'Screen',
        code: `// Draw a single pixel at (0,0)
// The screen starts at RAM[16384].
// Each word = 16 pixels, bit 0 = leftmost.

    @SCREEN   // A = 16384
    M=1       // Set bit 0 → pixel (0,0) is on

(END)
    @END
    0;JMP
`,
    },
    {
        title: 'Draw Horizontal Line',
        category: 'Screen',
        code: `// Draw a 512-pixel horizontal line (top row)
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
`,
    },
    {
        title: 'Draw Rectangle',
        category: 'Screen',
        code: `// Draw a filled rectangle: 16px wide × 32px tall
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
`,
    },
    {
        title: 'Fill Entire Screen',
        category: 'Screen',
        code: `// Fill the entire 512×256 screen (8192 words)
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
`,
    },
    // ── Advanced ─────────────────────────────────────────────────────────
    {
        title: 'Fibonacci',
        category: 'Advanced',
        code: `// Compute Fibonacci numbers in R0..R4
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
`,
    },
    {
        title: 'Integer Division',
        category: 'Advanced',
        code: `// R2 = R0 / R1  (integer division, quotient only)
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
`,
    },
    {
        title: 'Keyboard Input Echo',
        category: 'Advanced',
        code: `// Read keyboard and show key code in R0.
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
`,
    },
    // ── Animation & Games ────────────────────────────────────────────────
    {
        title: 'Bouncing Box',
        category: 'Animation',
        code: `// Bouncing Box — 16×16 block slides left and right
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
`,
    },
    {
        title: 'Spiral Fill',
        category: 'Animation',
        code: `// Spiral Fill — fills the screen from edges inward
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
`,
    },
    {
        title: 'Dino Jump',
        category: 'Animation',
        code: `// Dinosaur Jump — Press any key to jump over obstacles!
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
`,
    },
    {
        title: 'Pong',
        category: 'Animation',
        code: `// Pong — Move the paddle with arrow keys to keep
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
`,
    },
    {
        title: 'Drawing Pad',
        category: 'Animation',
        code: `// Drawing Pad — Use arrow keys to move a cursor,
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
`,
    },
    {
        title: 'Gravity Ball',
        category: 'Animation',
        code: `// Gravity Ball — A ball falls under gravity, bounces
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
`,
    },
    {
        title: 'Snake Trail',
        category: 'Animation',
        code: `// Snake Trail — A dot moves continuously in the
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
`,
    },
    {
        title: 'Scrolling Bars',
        category: 'Animation',
        code: `// Scrolling Bars — Animated horizontal bar pattern
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
`,
    },
    {
        title: 'Pixel Rain',
        category: 'Animation',
        code: `// Pixel Rain — Droplets fall from the top of the
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
`,
    },
];
