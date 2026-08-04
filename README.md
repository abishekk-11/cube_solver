# Cube Atlas — Interactive 3×3 Rubik's Cube Guide

Cube Atlas is an interactive browser experience for learning to solve a 3×3 Rubik's Cube with the classic Daisy first beginner method. Start with a solved cube, click it to generate a valid scramble, and work through a guided eight stage lesson where each scroll position corresponds to a deliberate face turn.

Built as a front end portfolio project, Cube Atlas combines a manipulable 3D cube, step by step move animations, visual turn diagrams, and plain language positioning guidance. It is designed to make the logic behind each stage easier to follow and not just present a long list of notation.

> Cube Atlas is an educational guide, not a speedcubing solver or a guarantee that one fixed algorithm applies to every physical cube position. Always follow the positioning instructions before making an algorithmic turn.

## What the project does

- Starts from a solved 3×3 cube and creates a legal 18-move scramble when the cube is clicked.
- Lets users drag the cube to inspect its sides in 3D.
- Teaches the official Daisy first route one stage at a time, with each stage unlocking after the preceding stage is complete.
- Uses long, scroll driven move panels: scroll downward to play the next turn and upward to reverse it.
- Shows face colored diagrams, arrow directions, conventional cube notation, and the active move alongside the live cube.
- Explains important setup decisions, including when to use a left or right insertion, when to flip the cube, and how to handle common edge and corner cases.
- Keeps the lesson focused on one goal at a time—for example, yellow edges for the yellow cross before yellow corners are oriented.

## Daisy-first lesson path

Cube Atlas follows this beginner-friendly progression:

1. **The Daisy** — place four white edge pieces around the yellow top centr.
2. **White Cross** — match each petal to its side centre and move it down.
3. **White Corners** — finish the white face using the appropriate left or right insertion.
4. **Middle Layer** — flip the cube so white is on the bottom, then insert non yellow edges.
5. **Yellow Cross** — orient the four yellow edge pieces without solving the corners yet.
6. **Orient Yellow Corners** — make the full yellow face.
7. **Position Yellow Corners** — match the completed yellow corners to their side center.
8. **Finish Yellow Edges** — cycle the final edges to complete the cube.
   
## Live Demo
Deployed on Vercel: https://cube-solver-ec29-35fvp1do9-abishekk-11s-projects.vercel.app


## Tech stack

| Area | Technologies |
| --- | --- |
| Front end | React 19, TypeScript, CSS |
| 3D interaction | CSS transforms and pointer events |
| Development and build | Vinext, Vite, npm |
| Linting | ESLint |
| Runtime / deployment support | Cloudflare Workers and Wrangler |

## How the interactive cube works

The guide models the cube as individual stickers positioned on cubies. Each face turn updates the affected layer while preserving standard 3×3 notation. The visual lesson then synchronizes that state with its scroll position:

1. Choose a lesson stage and read the cube orientation reminder.
2. Scroll into a move panel to animate and apply that move.
3. Scroll back above the panel to apply the inverse turn and replay the reverse animation.
4. Continue until the stage is complete, then use **Move on** to unlock the next goal.

The cube begins with a fixed solved color layout white opposite yellow, red opposite orange, and blue opposite green. Every state is balanced so that there are nine stickers of each color.

## Cube notation

All moves use standard face notation. A plain letter means a clockwise turn while looking directly at that face; an apostrophe means counter clockwise; and `2` means a 180° turn.

| Notation | Face |
| --- | --- |
| `R`, `L` | Right, Left |
| `U`, `D` | Up, Down |
| `F`, `B` | Front, Back |
| `R′`, `U′`, etc. | Counter-clockwise face turn |
| `F2`, `U2`, etc. | Double face turn |

For example, the yellow-cross sequence is `F U R U′ R′ F′`. Cube Atlas shows the same moves as notation, highlighted diagrams, and animated turns.

## Project structure

```text
app/             React page, layout, cube model, lesson content, and styling
public/          Static browser assets
worker/          Cloudflare Worker entry point
tests/           Automated rendering checks
vite.config.ts   Vinext, Vite, and Cloudflare development configuration
package.json     Scripts and project dependencies
```

## Run locally

### 1. Get the project

```bash
git clone https://github.com/abishekk-11/cube_solver.git
cd cube_solver
```

### 2. Install dependencies

Node.js 22.13 or later is required.

```bash
npm install
```

### 3. Start the development site

```bash
npm run dev
```

Open the local address printed in the terminal. Click the cube to scramble it, drag to inspect it from different angles, then choose **Start the Daisy first lesson**.

## Useful commands

```bash
npm run dev     # Start the local development server
npm run build   # Create a production build
npm run lint    # Check code style
npm test        # Build and run automated checks
```

## Learning references and attribution

The lesson order, positioning reminders, and beginner algorithms are based on [Rubik's official 3×3 solution guides](https://www.rubiks.com/solution-guides). Cube Atlas presents original interface elements and diagrams for educational use; it does not copy or redistribute the official video or image assets.

## Limitations

Cube Atlas is a guided visual learning tool. A real scrambled cube can present different cases at the same stage, so users should use the chapter's setup reminders and repeatable algorithms rather than assuming every physical cube will follow one identical turn sequence. It does not scan a physical cube, calculate an optimal solution, or replace practice with a real cube.
