# 🎯 FRIENDS BINGO

> **Arrange. Call. Complete. BINGO!**
> A modern, responsive real-time multiplayer Bingo web application with custom turn-based rules.

---

## 🌟 Game Concept & Custom Rules

1. **5×5 Board (Numbers 1–25)**:
   - Every player receives the exact same set of numbers: `1, 2, 3, ... 25`.
   - **NO randomized boards**: Players manually arrange their 25 numbers in any order before the match begins.
2. **Turn-Based Number Calling**:
   - **NO automated or random number generator caller**.
   - Players take turns calling an uncalled number between 1 and 25.
   - When a number is called, it is automatically marked on **every player's card**.
3. **The 5-Line B-I-N-G-O Rule**:
   - A player does **NOT** win with 1 line.
   - Players must complete **5 unique lines** (out of 12 possible: 5 horizontal rows, 5 vertical columns, 2 diagonals).
   - Each completed line crosses out one letter in **B - I - N - G - O**.
   - The first player to complete 5 unique lines triggers **BINGO** and wins!

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Unit Tests
We include automated tests for all 15 core game logic cases (lines, diagonals, duplicate prevention, card validation, turns, win conditions):
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## ⚡ Multiplayer Sync: Dual-Engine Architecture

This project works out of the box in two modes:

1. **Instant Local / Multi-Tab Mode (Zero Setup Required)**:
   - Uses `BroadcastChannel` and `localStorage` to synchronize game state across multiple browser tabs and windows in real-time.
   - In the Lobby, click **"Open Player 2 in New Tab"** to simulate and play with multiple players immediately!
2. **Supabase Realtime Cloud Mode (Production)**:
   - Easily connect Supabase PostgreSQL and Realtime broadcast for internet multiplayer across separate devices.
   - Copy `.env.example` to `.env.local`:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     ```
   - Execute the schema file in your Supabase SQL Editor:
     `supabase/schema.sql`

---

## 📂 Project Structure

```
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with modern gaming dark theme & fonts
│   │   ├── page.tsx           # Home landing page with live demo board
│   │   ├── create/page.tsx    # Create game room screen
│   │   ├── join/page.tsx      # Join game room screen
│   │   └── room/[code]/page.tsx # Room orchestrator (Lobby -> Setup -> Game -> Winner)
│   ├── components/
│   │   ├── BingoBoard.tsx     # 5x5 board: Drag & Drop + Tap-to-Swap + Highlight lines
│   │   ├── BingoProgress.tsx  # B-I-N-G-O letter cards with neon strikethroughs
│   │   ├── NumberSelector.tsx # Turn-based interactive 1-25 button matrix
│   │   ├── CalledNumbers.tsx  # Stream of called numbers with latest spotlight
│   │   ├── PlayerList.tsx     # Player cards with Host crowns and turn rings
│   │   ├── CallAnnouncement.tsx # Animated pop-up banner when numbers are called
│   │   ├── WinnerModal.tsx    # Confetti celebration modal & final leaderboard
│   │   ├── RulesModal.tsx     # Interactive custom rules explanation modal
│   │   └── RoomHeader.tsx     # Header with copy code, sound toggle, & share
│   ├── lib/
│   │   ├── bingo.ts           # Authoritative line calculations & validation
│   │   ├── game-engine.ts     # Authoritative room state & realtime synchronizer
│   │   ├── sounds.ts          # Web Audio API synthesizer for retro/arcade audio
│   │   └── supabase.ts        # Supabase client connector with fallback detection
│   └── types/
│       └── game.ts            # Full TypeScript domain types
├── supabase/
│   └── schema.sql             # PostgreSQL schema with Realtime publication
├── tests/
│   └── bingo.test.ts          # 15 unit tests verifying all rules
└── .env.example               # Supabase environment variables template
```

---

## 🧪 Verified Test Suite (15/15 Passed)

- [x] 1. Horizontal line completion (`row-0`...`row-4`)
- [x] 2. Vertical line completion (`col-0`...`col-4`)
- [x] 3. Main diagonal completion (`diag-main`)
- [x] 4. Opposite diagonal completion (`diag-anti`)
- [x] 5. Multiple lines simultaneous calculation
- [x] 6. Overlapping lines intersecting at a shared cell
- [x] 7. Duplicate line prevention (unique line IDs)
- [x] 8. Exactly 5 lines = winner
- [x] 9. Less than 5 lines = no winner
- [x] 10. Number cannot be called twice
- [x] 11. Wrong player cannot call out of turn
- [x] 12. Card contains exactly numbers 1–25
- [x] 13. Duplicate numbers rejected on card
- [x] 14. Missing numbers rejected on card
- [x] 15. Card cannot be modified after game starts
