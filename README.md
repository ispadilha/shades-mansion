# 🏰 **Shades Mansion**

**Shades Mansion** is a minimalist tactics game that blends **board strategy** with a **dark, dungeon-like atmosphere**.  
Three sides — **light**, **gray** and **dark** — are shut inside a mansion that redraws its own floor plan every match. Only one of them leaves.

---

## 🎮 **Gameplay Overview**
- Turn-based tactics on a grid, inside a **procedurally generated maze** of rooms and corridors  
- **Three teams** of four pieces each  
- **Special items** lie on the floor and can be collected  
- The match ends when a single team still has pieces on the board  

---

## ♟️ **The pieces**

Every team fields the same four types: Agile, Balanced, Champion, and Distance shooter  

Melee pieces walk to a free cell next to the target — the eight neighbours count, diagonals included — and strike on arrival.  
The shooter attacks from where it stands, along its row, column and diagonals.

---

## 🕯️ **Special items**

The mansion holds one item per piece (twelve in total), with a couple of copies of each scattered over free cells at the start of the match. Items go to the **team's** inventory, not to the piece that picked them up, and what they do depends on their colour:

- **Your own colour — healing.** Restores the matching piece of your team to full HP, and is consumed.  
- **Another team's colour — manipulation.** Takes the matching enemy piece over for a **single action** — one move or one attack — using its ranges and its attack style, but none of its loyalties: it can be turned against its own team. The item is spent when the forced action happens.

---

## 🎲 **Commanding a side**

Before the match you choose what to command:

- **One team** — the other two are played by the AI  
- **All of them** — local multiplayer  
- **None** — spectate a match between three AI teams  

---

## 📖 **Library**

An in-game library holds the lore: one entry per **character** (the twelve pieces) and one per **rule** of the game. The character texts are provisional placeholders for now — the definitive lore is still being written.

---

## ⚙️ **Options**

- **Language**: English (US) or Portuguese (BR) — the whole interface, log and library are translated  
- **Maze**: board side, and the smallest and largest room sides. The settings adjust each other so the combination is always valid  

---

## 🧰 **Tech Stack**
- **React + TypeScript**  
- **Vite** (for fast development)  
- **Material UI (MUI)** for interface components  
- **Phaser** for the pieces, items and movement animations drawn over the board  
- **React Router** for screen navigation  

---

## 🗂️ **Project structure**

```
src/
├── screens/     # One file per screen (home, library, options, choose side, game, end)
├── components/  # Board, cells, HUD, modals
├── contexts/    # Language, settings and game state
├── hooks/       # useLanguage, useSettings, useGame, useEdgeScroll
├── logic/       # Maze generation, movement, setup, AI, types
├── game/        # Phaser scene rendering pieces and items
└── constants/   # Game rules and the text files (UI, characters, rules)
```

Texts are split by purpose: `texts_ui.ts` for interface labels, `texts_characters.ts` and `texts_rules.ts` for the library entries. Every entry carries both languages side by side.

---

## ▶️ **Running locally**

```bash
yarn install
yarn dev      # development server
yarn build    # type-check and production build
yarn lint     # eslint
```

---

## 🧠 **Future Plans**
- Write the **definitive lore** behind the library's provisional texts  
- Give the AI more depth than its current heuristics  
- Proper arts for the mansion and its pieces  

---

## 🕹️ **About**
This project was created for learning and experimentation with **React**, **TypeScript**, and **game logic design**.  
It focuses on simplicity, modularity, and clean architecture while remaining fully functional and extensible.
