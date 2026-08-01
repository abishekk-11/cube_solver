# Cube Atlas

Cube Atlas is an interactive 3×3 Rubik's Cube lesson. Click the solved cube to
create a valid scramble, then scroll through eight visual teaching stages. Its
teaching path follows the Daisy-first order: Daisy, white cross, white corners,
middle layer, yellow cross, yellow corners, yellow side, and final layer. Every
move has its own long scroll panel: scrolling down applies one turn and
scrolling back reverses it. A stage must be completed before its “Move on”
button unlocks the next stage.

Every chapter also includes a modern turn map: each move is colour-coded by
face, shows its direction, and highlights as the scroll reaches it. Expand the
position checks beneath a chapter to see the colour-matching reminders and the
specific fix for common situations, such as a white corner on the bottom face
or a completed yellow edge face that needs to be held at the back.

## Run locally in VS Code

Open the integrated terminal in this folder and run:

\`\`\`bash
npm run dev
\`\`\`

The local address will be shown in the terminal. Click the cube to scramble it,
or drag across it to inspect every side. Select **Start the Daisy-first lesson**,
then scroll through the Daisy-first method, one move at a time. Scroll back up
at any point to reverse the move you just made; use each stage’s “Move on”
button when it is complete. Each stage includes a holding-orientation reminder,
an interactive-looking move diagram, and the relevant algorithm or setup
explanation.

## Useful commands

- \`npm run dev\` — start the local development site
- \`npm run build\` — create a production build
- \`npm run lint\` — check the code style
