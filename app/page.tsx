"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

const faces = ["front", "right", "back", "left", "top", "bottom"] as const;
type Face = (typeof faces)[number];
type StickerColor = "white" | "red" | "blue" | "orange" | "green" | "yellow";
type CubeMode = "ready" | "scrambled" | "solving";

const faceColors: Record<Face, StickerColor> = {
  front: "white",
  right: "red",
  back: "blue",
  left: "orange",
  top: "yellow",
  bottom: "green",
};

const palette: StickerColor[] = [
  "white",
  "red",
  "blue",
  "orange",
  "green",
  "yellow",
];

const moveFaces = ["R", "U", "F", "L", "D", "B"];

const guide = [
  {
    label: "01 / Foundation",
    title: "Build the white cross",
    body: "Match the four white edge pieces to their side-center colors. Keep white facing you while the cube makes the first structure.",
  },
  {
    label: "02 / First layer",
    title: "Set the white corners",
    body: "Use the right-hand insertion to seat each corner without undoing your cross. The first face now becomes complete.",
  },
  {
    label: "03 / Middle layer",
    title: "Route the middle edges",
    body: "Find an edge with no yellow sticker, align it with its center, then send it left or right into place.",
  },
  {
    label: "04 / Last layer",
    title: "Make the yellow cross",
    body: "The top changes from dot to line to cross. Hold the cube as shown and repeat the short sequence when needed.",
  },
  {
    label: "05 / Last layer",
    title: "Turn the yellow face",
    body: "Keep the solved pieces safe underneath while the top stickers all face upward. Orientation comes before position.",
  },
  {
    label: "06 / Finish",
    title: "Cycle the final pieces",
    body: "One last sequence trades the remaining corners and edges. Your cube returns to the same calm state where it began.",
  },
];

function makeScramble() {
  const scramble: string[] = [];

  while (scramble.length < 12) {
    const face = moveFaces[Math.floor(Math.random() * moveFaces.length)];
    const modifier = ["", "'", "2"][Math.floor(Math.random() * 3)];

    if (scramble.at(-1)?.startsWith(face)) {
      continue;
    }

    scramble.push(face + modifier);
  }

  return scramble;
}

function reverseMove(move: string) {
  if (move.endsWith("2")) {
    return move;
  }

  return move.endsWith("'") ? move[0] : move + "'";
}

function stickerColor(
  face: Face,
  sticker: number,
  solveProgress: number,
  seed: number,
) {
  const mixedColor =
    sticker === 4
      ? faceColors[face]
      : palette[(seed + faces.indexOf(face) * 11 + sticker * 7) % palette.length];

  if (solveProgress === 0) {
    return mixedColor;
  }

  if (
    face === "front" &&
    (solveProgress >= 2 ||
      (solveProgress >= 1 && [1, 3, 4, 5, 7].includes(sticker)))
  ) {
    return "white";
  }

  if (
    solveProgress >= 3 &&
    ((face === "right" && [3, 4, 5].includes(sticker)) ||
      (face === "left" && [3, 4, 5].includes(sticker)))
  ) {
    return faceColors[face];
  }

  if (
    face === "top" &&
    (solveProgress >= 5 ||
      (solveProgress >= 4 && [1, 3, 4, 5, 7].includes(sticker)))
  ) {
    return "yellow";
  }

  if (solveProgress >= 6) {
    return faceColors[face];
  }

  return mixedColor;
}

function Cube({
  mode,
  solveProgress,
  seed,
  onScramble,
}: {
  mode: CubeMode;
  solveProgress: number;
  seed: number;
  onScramble: () => void;
}) {
  const [tilt, setTilt] = useState({ x: -22, y: -38 });
  const cubeStyle = {
    "--cube-rx": tilt.x + "deg",
    "--cube-ry": tilt.y + "deg",
  } as CSSProperties;

  return (
    <button
      className={"cube-interaction " + (mode === "ready" ? "is-clickable" : "")}
      type="button"
      onClick={mode === "ready" ? onScramble : undefined}
      onMouseMove={(event) => {
        if (mode !== "ready") {
          return;
        }

        const bounds = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        setTilt({ x: -22 - y * 10, y: -38 + x * 16 });
      }}
      onMouseLeave={() => setTilt({ x: -22, y: -38 })}
      aria-label={
        mode === "ready" ? "Scramble the solved Rubik's Cube" : "Rubik's Cube"
      }
      disabled={mode !== "ready"}
    >
      <span
        className={
          "cube " + (mode === "scrambled" ? "cube--scrambling" : "")
        }
        style={cubeStyle}
        aria-hidden="true"
      >
        {faces.map((face) => (
          <span className={"cube__face cube__face--" + face} key={face}>
            {Array.from({ length: 9 }, (_, sticker) => (
              <span
                className={
                  "sticker sticker--" +
                  stickerColor(face, sticker, solveProgress, seed)
                }
                key={face + sticker}
              />
            ))}
          </span>
        ))}
      </span>
    </button>
  );
}

export default function Home() {
  const [mode, setMode] = useState<CubeMode>("ready");
  const [scramble, setScramble] = useState(() => makeScramble());
  const [seed, setSeed] = useState(17);
  const [activeStep, setActiveStep] = useState(-1);

  const solution = useMemo(
    () => [...scramble].reverse().map(reverseMove),
    [scramble],
  );

  const stages = useMemo(
    () =>
      guide.map((stage, index) => ({
        ...stage,
        moves: solution.slice(index * 2, index * 2 + 2),
      })),
    [solution],
  );

  useEffect(() => {
    if (mode !== "solving") {
      return;
    }

    const sections = document.querySelectorAll<HTMLElement>("[data-step]");
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          setActiveStep(Number(visible.target.dataset.step));
        }
      },
      { threshold: [0.45, 0.65] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [mode]);

  function scrambleCube() {
    setScramble(makeScramble());
    setSeed(Math.floor(Math.random() * 999));
    setActiveStep(-1);
    setMode("scrambled");
  }

  function startGuidedSolve() {
    setActiveStep(0);
    setMode("solving");
    window.setTimeout(() => {
      document
        .getElementById("walkthrough")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function resetCube() {
    setMode("ready");
    setActiveStep(-1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const solveProgress =
    mode === "ready" ? 6 : mode === "scrambled" ? 0 : activeStep + 1;
  const displayedStage = stages[Math.max(activeStep, 0)];
  const displayedMoves =
    mode === "ready"
      ? ["READY"]
      : mode === "scrambled"
        ? scramble
        : displayedStage.moves;

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Cube Atlas home">
          CUBE <span>/</span> ATLAS
        </a>
        <p className="header-status">
          <span className="status-light" />
          {mode === "ready"
            ? "SOLVED"
            : mode === "scrambled"
              ? "SCRAMBLED"
              : "GUIDED SOLVE"}
        </p>
      </header>

      <aside className="move-console" aria-live="polite">
        <p className="console-kicker">
          {mode === "ready"
            ? "State"
            : mode === "scrambled"
              ? "Your scramble"
              : displayedStage.label}
        </p>
        <div className="move-row">
          {displayedMoves.map((move, index) => (
            <span className="move-token" key={move + index}>
              {move}
            </span>
          ))}
        </div>
        <p className="console-note">
          {mode === "ready"
            ? "Click the cube to begin."
            : mode === "scrambled"
              ? "These are the moves you just made."
              : displayedStage.title}
        </p>
      </aside>

      <section className="hero" id="top">
        <div className="hero__copy">
          <p className="eyebrow">A scroll-led cube lesson</p>
          <h1>
            The solve
            <br />
            starts with
            <br />
            one move.
          </h1>
          <p className="hero__description">
            An interactive guide that turns a mixed 3×3 into a sequence you can
            see, feel, and repeat on your own cube.
          </p>
        </div>

        <div className="hero__cube">
          <Cube
            mode={mode}
            solveProgress={solveProgress}
            seed={seed}
            onScramble={scrambleCube}
          />
          <p className="cube-prompt">
            {mode === "ready"
              ? "Click the cube to scramble it"
              : mode === "scrambled"
                ? "Scramble locked"
                : activeStep === 5
                  ? "Solved"
                  : "Scroll to make the next move"}
          </p>
        </div>

        <div className="hero__action">
          {mode === "ready" && (
            <p>
              No timer. No pressure.
              <br />
              Just turn, watch, and learn.
            </p>
          )}
          {mode === "scrambled" && (
            <button className="primary-button" type="button" onClick={startGuidedSolve}>
              Start the guided solve <span>↓</span>
            </button>
          )}
          {mode === "solving" && activeStep === 5 && (
            <button className="secondary-button" type="button" onClick={resetCube}>
              Reset cube
            </button>
          )}
        </div>

        <p className="hero__index">03 × 03</p>
      </section>

      {mode === "solving" && (
        <section className="walkthrough" id="walkthrough">
          <div className="walkthrough__cube">
            <Cube
              mode={mode}
              solveProgress={solveProgress}
              seed={seed}
              onScramble={scrambleCube}
            />
          </div>

          <div className="steps">
            {stages.map((stage, index) => (
              <article
                className={
                  "step " + (index === activeStep ? "step--active" : "")
                }
                data-step={index}
                key={stage.label}
              >
                <p className="step__label">{stage.label}</p>
                <h2>{stage.title}</h2>
                <p className="step__body">{stage.body}</p>
                <div className="step__moves" aria-label={"Moves for " + stage.title}>
                  {stage.moves.map((move) => (
                    <span key={move}>{move}</span>
                  ))}
                </div>
                <p className="step__instruction">
                  {index === 5 ? "You did it. Your cube is solved." : "Keep scrolling for the next move."}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
