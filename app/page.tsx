"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

const faces = ["front", "right", "back", "left", "top", "bottom"] as const;
type Face = (typeof faces)[number];
type StickerColor = "white" | "red" | "blue" | "orange" | "green" | "yellow";
type CubeMode = "ready" | "scrambled" | "solving";
type Axis = "x" | "y" | "z";

type Vector = {
  x: number;
  y: number;
  z: number;
};

type Sticker = {
  color: StickerColor;
  id: string;
  normal: Vector;
  position: Vector;
};

type TurnAnimation = {
  move: string;
  reverseDouble: boolean;
  sourceCube: Sticker[];
};

type LessonCase = {
  title: string;
  detail: string;
  moves: string[];
};

type LessonStage = {
  label: string;
  name: string;
  title: string;
  description: string;
  moves: string[];
  algorithmNote: string;
  orientation: string;
  caseGuides: LessonCase[];
  handoff?: string;
  view: { x: number; y: number };
};

const faceColors: Record<Face, StickerColor> = {
  front: "red",
  right: "blue",
  back: "orange",
  left: "green",
  top: "yellow",
  bottom: "white",
};

const moveFaces = ["R", "U", "F", "L", "D", "B"] as const;
type MoveFace = (typeof moveFaces)[number];

const moveDefinitions: Record<
  MoveFace,
  { axis: Axis; layer: number; clockwiseDirection: number }
> = {
  R: { axis: "x", layer: 1, clockwiseDirection: -1 },
  L: { axis: "x", layer: -1, clockwiseDirection: 1 },
  U: { axis: "y", layer: 1, clockwiseDirection: -1 },
  D: { axis: "y", layer: -1, clockwiseDirection: 1 },
  F: { axis: "z", layer: 1, clockwiseDirection: -1 },
  B: { axis: "z", layer: -1, clockwiseDirection: 1 },
};

const cubieFaces: Array<{ face: Face; normal: Vector }> = [
  { face: "front", normal: { x: 0, y: 0, z: 1 } },
  { face: "right", normal: { x: 1, y: 0, z: 0 } },
  { face: "back", normal: { x: 0, y: 0, z: -1 } },
  { face: "left", normal: { x: -1, y: 0, z: 0 } },
  { face: "top", normal: { x: 0, y: 1, z: 0 } },
  { face: "bottom", normal: { x: 0, y: -1, z: 0 } },
];

const cubiePositions = [-1, 0, 1].flatMap((x) =>
  [-1, 0, 1].flatMap((y) =>
    [-1, 0, 1]
      .filter((z) => x !== 0 || y !== 0 || z !== 0)
      .map((z) => ({ x, y, z })),
  ),
);

const tutorialStages: LessonStage[] = [
  {
    label: "01 / First layer",
    name: "The Daisy",
    title: "Build the Daisy",
    description:
      "Keep the yellow center in the middle of the top face, then place four white edge pieces around it like petals.",
    moves: ["R'", "U", "F'"],
    algorithmNote:
      "The Daisy is a placement step, not one universal formula. If placing a white edge feels difficult, put it on the right face and use the Daisy rescue sequence R′ U F′.",
    orientation: "Hold the cube with the yellow center in the middle of the top face while you build the petals.",
    caseGuides: [
      {
        title: "Know the target",
        detail:
          "Ignore every piece except the four white edge pieces. You are finished when four white edges surround the yellow center like petals.",
        moves: [],
      },
      {
        title: "A white edge is already touching yellow",
        detail:
          "Leave that petal where it is. Before lifting another white edge, turn the Up face only when you need to make an empty space beside the yellow center.",
        moves: ["U"],
      },
      {
        title: "The white edge is on the bottom layer",
        detail:
          "First protect any petals already made by rotating the Up face to open space. Then turn the face holding the white edge twice to lift it into the Daisy.",
        moves: ["U", "F2"],
      },
      {
        title: "The white sticker faces you",
        detail:
          "Put that edge on the right face, then use this exact three-turn flip. It moves the piece out, makes the correct space, and flips it into the Daisy.",
        moves: ["R'", "U", "F'"],
      },
      {
        title: "Use the Daisy algorithm when you get stuck",
        detail:
          "If it is hard to move a white edge into an open petal spot by yourself, first put that edge on the right face. Then follow R′ U F′ slowly. Keep the yellow center in the middle of the top face.",
        moves: ["R'", "U", "F'"],
      },
    ],
    view: { x: -28, y: -40 },
  },
  {
    label: "02 / First layer",
    name: "White Cross",
    title: "Make the White Cross",
    description:
      "Match one white edge to its side-center color, then turn that matched face twice. Repeat this same F2 action for each petal.",
    moves: ["F2"],
    algorithmNote:
      "This stage uses one turn: F2. First rotate the Up face by hand only until a petal’s side color matches its center. Then treat that matched side as the front and turn it twice. Repeat F2 separately for every petal.",
    orientation: "Keep the yellow center on top while matching each petal.",
    caseGuides: [
      {
        title: "Match the color before turning",
        detail:
          "Pick one white petal and look at its other color. Rotate the Up face only until that color makes a vertical line with its matching center. Treat that matched side as the front.",
        moves: [],
      },
      {
        title: "Send the matched petal down",
        detail:
          "Once the colors match, turn that same face twice. The white edge lands next to the white center without disturbing the other matched petals.",
        moves: ["F2"],
      },
      {
        title: "Repeat for all four petals",
        detail:
          "For example, match white-green with green, then white-orange with orange, white-red with red, and white-blue with blue. Use F2 after each match. A correct cross has every edge color matching its side center.",
        moves: ["F2"],
      },
    ],
    handoff:
      "Turn the whole cube so the completed white cross is on top before you begin the white-corner lesson.",
    view: { x: -28, y: -40 },
  },
  {
    label: "03 / First layer",
    name: "White Corners",
    title: "Finish the White Corners",
    description:
      "Bring every white corner below its destination, then choose the right or left insertion based on which side of the front face its home is on.",
    moves: ["D'", "R'", "D", "R", "D", "L", "D'", "L'"],
    algorithmNote:
      "This scroll demonstrates both choices: the right insertion D′ R′ D R, then the left insertion D L D′ L′. On a real cube, use only one: choose right when the corner belongs at the front-right, or left when it belongs at the front-left.",
    orientation: "Work on one corner at a time; keep its destination on the front, then choose whether it belongs on the right or left.",
    caseGuides: [
      {
        title: "Choose right or left before turning",
        detail:
          "Look at the two non-white stickers on the corner and line them up with their centers. If its destination is on the right of the front face, use the right insertion. If its destination is on the left, use the left insertion.",
        moves: [],
      },
      {
        title: "Corner is wrong in the top layer",
        detail:
          "Move the incorrect corner down first. Keep white on the Up face while you do this, then inspect its two other colors to find its correct slot.",
        moves: ["R'", "D'", "R"],
      },
      {
        title: "Corner belongs on the bottom-right",
        detail:
          "Turn the Down face until both non-white colors line up with their centers. Keep the white sticker facing you, then use the right insertion.",
        moves: ["D'", "R'", "D", "R"],
      },
      {
        title: "Corner belongs on the bottom-left",
        detail:
          "Line up the corner’s two colors with their centers and keep the white sticker facing you. Use the mirrored left insertion.",
        moves: ["D", "L", "D'", "L'"],
      },
      {
        title: "White sticker points down",
        detail:
          "Use the corner’s two side colors to place it between the matching centers. This setup moves it to the front so you can finish with the right insertion.",
        moves: ["F", "D'", "F'", "D2"],
      },
      {
        title: "White sticker faces you in the top layer",
        detail:
          "Use this short setup to place the corner at the lower-right position. It will already be lined up with one center; then use the right insertion above.",
        moves: ["R'", "D", "R"],
      },
    ],
    handoff:
      "Flip the entire cube upside down before the next lesson: keep the completed white layer on the bottom and the yellow center on top.",
    view: { x: -28, y: -40 },
  },
  {
    label: "04 / Second layer",
    name: "Middle Layer",
    title: "Solve the Middle Layer",
    description:
      "Find an edge with no yellow sticker, align it to its center, then use the right or left insertion depending on which side its second color belongs.",
    moves: [
      "U", "R", "U'", "R'", "U'", "F'", "U", "F",
      "U'", "L'", "U", "L", "U", "F", "U'", "F'",
    ],
    algorithmNote:
      "The scroll first demonstrates the right insertion U R U′ R′ U′ F′ U F, then the mirrored left insertion U′ L′ U L U F U′ F′. Use only the one that matches the edge’s destination on a real cube.",
    orientation: "After the flip, keep white on the bottom and yellow on the top for the rest of the solve.",
    caseGuides: [
      {
        title: "Choose the right or left algorithm",
        detail:
          "After the front color matches its center, inspect the edge’s other color. If that center is on the right, use the right insertion. If it is on the left, use the left insertion. Never use both for the same edge.",
        moves: [],
      },
      {
        title: "Choose the correct edge",
        detail:
          "Look around the top layer for an edge with no yellow sticker. Turn U until its front color makes a vertical line with the matching center. Ignore every top edge that contains yellow.",
        moves: ["U"],
      },
      {
        title: "The edge needs to go right",
        detail:
          "After matching the front color, check the other color. If its home is to the right, use this exact right insertion. It protects the solved white layer.",
        moves: ["U", "R", "U'", "R'", "U'", "F'", "U", "F"],
      },
      {
        title: "The edge needs to go left",
        detail:
          "If the other color belongs to the left, use the mirrored left insertion instead. Keep white down and yellow up throughout the sequence.",
        moves: ["U'", "L'", "U", "L", "U", "F", "U'", "F'"],
      },
      {
        title: "Every top edge has yellow",
        detail:
          "Find a middle-layer edge that is in the wrong slot. Run either insertion once to bring it up, then match it with its center and insert it correctly using the appropriate side.",
        moves: ["U", "R", "U'", "R'", "U'", "F'", "U", "F"],
      },
    ],
    view: { x: -24, y: -42 },
  },
  {
    label: "05 / Final layer",
    name: "Yellow Cross",
    title: "Make the Yellow Cross",
    description:
      "Four yellow edge stickers begin around the side of the third layer. Ignore the yellow corners for now—this step turns those edges upward into a cross.",
    moves: ["F", "U", "R", "U'", "R'", "F'"],
    algorithmNote: "Official sequence: F U R U′ R′ F′. Repeat it as needed for the dot, L-shape, or line case shown in the lesson.",
    orientation: "Keep white on the bottom and yellow on the top.",
    caseGuides: [
      {
        title: "Position the pattern first",
        detail:
          "Ignore yellow corners for now. If you have an L, place it in the top-left. If you have a line, make it horizontal. The dot needs no special rotation.",
        moves: [],
      },
      {
        title: "One algorithm for dot, L, and line",
        detail:
          "Use this exact six-turn algorithm. Run it again after each new pattern appears until the four yellow edges make a cross.",
        moves: ["F", "U", "R", "U'", "R'", "F'"],
      },
    ],
    view: { x: -30, y: -40 },
  },
  {
    label: "06 / Final layer",
    name: "Yellow Corners",
    title: "Orient the Yellow Corners",
    description:
      "Repeat the same algorithm, re-checking the pattern each time, until every yellow corner faces upward and the full yellow side is complete.",
    moves: ["R", "U", "R'", "U", "R", "U2", "R'"],
    algorithmNote: "Official sequence: R U R′ U R U2 R′. Run it, check the new yellow pattern, reposition the cube as shown, and use the same sequence again until the full yellow side faces up.",
    orientation: "Keep white on the bottom and yellow on the top.",
    caseGuides: [
      {
        title: "No yellow corners face up",
        detail:
          "Rotate the whole cube so a yellow corner is visible on the left face, then run the algorithm. Re-check and repeat the same sequence until the yellow side is complete.",
        moves: ["R", "U", "R'", "U", "R", "U2", "R'"],
      },
      {
        title: "One yellow corner: the fish case",
        detail:
          "Hold the cube so the fish shape points down toward the left. Run the same algorithm, re-check the pattern, and repeat if needed.",
        moves: ["R", "U", "R'", "U", "R", "U2", "R'"],
      },
      {
        title: "Two yellow corners face up",
        detail:
          "Place a yellow corner on the front face at the top-left. Use the same algorithm, re-check, and repeat until all four yellow corners face up. The Up face always turns clockwise; the Right face alternates directions.",
        moves: ["R", "U", "R'", "U", "R", "U2", "R'"],
      },
    ],
    view: { x: -30, y: -40 },
  },
  {
    label: "07 / Final layer",
    name: "Yellow Side",
    title: "Position the Yellow Corners",
    description:
      "Repeat the same algorithm until every yellow corner matches its side centers. The yellow face stays complete while the corner positions change.",
    moves: ["R'", "F", "R'", "B2", "R", "F'", "R'", "B2", "R2"],
    algorithmNote: "Use the exact corner-positioning sequence: R′ F R′ B2 R F′ R′ B2 R2. Run it, check whether the corners match their centers, position any matched pair as instructed, then repeat the same sequence until all four corners are correct.",
    orientation: "Keep white on the bottom and yellow on the top.",
    caseGuides: [
      {
        title: "Find a correctly placed pair",
        detail:
          "Turn U until two corners match their side centers. If that pair sits on the same face, put it at the back like a car’s tail lights. If the pair is diagonal, place one at the front and one at the back.",
        moves: ["U"],
      },
      {
        title: "Cycle the corners into place",
        detail:
          "With yellow facing up and the matched pair positioned correctly, run this full sequence. Then turn U only as needed to re-match the next pair and repeat the same sequence until every corner matches its centers.",
        moves: ["R'", "F", "R'", "B2", "R", "F'", "R'", "B2", "R2"],
      },
      {
        title: "No pair is correct yet",
        detail:
          "Choose any orientation and run the sequence once. It will create a pair to work with; then position that pair as described above and repeat until all four corners match their centers.",
        moves: ["R'", "F", "R'", "B2", "R", "F'", "R'", "B2", "R2"],
      },
    ],
    view: { x: -24, y: -42 },
  },
  {
    label: "08 / Finish",
    name: "Final Layer",
    title: "Finish the Yellow Edges",
    description:
      "Cycle the last edges into place. When their side colors align with the centers, the whole cube is solved.",
    moves: ["F2", "U", "L", "R'", "F2", "L'", "R", "U", "F2"],
    algorithmNote: "Official edge-positioning sequence: F2 U L R′ F2 L′ R U F2. Run it with the correctly placed edge at the back.",
    orientation: "Keep white on the bottom and yellow on the top.",
    caseGuides: [
      {
        title: "A side is already complete",
        detail:
          "Put the fully solid side at the back before you begin. This makes the unsolved edges cycle toward the left while protecting the finished side.",
        moves: [],
      },
      {
        title: "No side is complete",
        detail:
          "That is okay—choose any side to start at the back. After one run, check again; as soon as a solid side appears, move it to the back before repeating.",
        moves: [],
      },
      {
        title: "Cycle the last yellow edges",
        detail:
          "Run this exact sequence up to three times. It moves the unsolved edges to the left; after each run, put any completed side at the back and check the centers again.",
        moves: ["F2", "U", "L", "R'", "F2", "L'", "R", "U", "F2"],
      },
    ],
    view: { x: -24, y: -42 },
  },
];

const initialScramble = [
  "R", "U", "F2", "L'", "D", "B2", "R'", "U2", "F", "L2", "D'", "B",
  "R2", "U'", "F2", "L", "D2", "B'",
];

function makeScramble() {
  const scramble: string[] = [];

  while (scramble.length < 18) {
    const face = moveFaces[Math.floor(Math.random() * moveFaces.length)];
    const modifier = ["", "'", "2"][Math.floor(Math.random() * 3)];
    const previousFace = scramble[scramble.length - 1]?.[0];

    if (face === previousFace) continue;
    scramble.push(face + modifier);
  }

  return scramble;
}

function createSolvedCube() {
  const cube: Sticker[] = [];

  faces.forEach((face) => {
    for (let index = 0; index < 9; index += 1) {
      const row = Math.floor(index / 3);
      const column = index % 3;
      const high = 1 - row;
      const low = column - 1;
      const sticker = {
        color: faceColors[face],
        id: face + index,
        normal: { x: 0, y: 0, z: 0 },
        position: { x: 0, y: 0, z: 0 },
      };

      if (face === "front") {
        sticker.normal.z = 1;
        sticker.position = { x: low, y: high, z: 1 };
      } else if (face === "back") {
        sticker.normal.z = -1;
        sticker.position = { x: -low, y: high, z: -1 };
      } else if (face === "right") {
        sticker.normal.x = 1;
        sticker.position = { x: 1, y: high, z: -low };
      } else if (face === "left") {
        sticker.normal.x = -1;
        sticker.position = { x: -1, y: high, z: low };
      } else if (face === "top") {
        sticker.normal.y = 1;
        sticker.position = { x: low, y: 1, z: row - 1 };
      } else {
        sticker.normal.y = -1;
        sticker.position = { x: low, y: -1, z: 1 - row };
      }

      cube.push(sticker);
    }
  });

  return cube;
}

const solvedCube = createSolvedCube();

function rotateVector(vector: Vector, axis: Axis, direction: number): Vector {
  if (axis === "x") {
    return direction === 1
      ? { x: vector.x, y: -vector.z, z: vector.y }
      : { x: vector.x, y: vector.z, z: -vector.y };
  }

  if (axis === "y") {
    return direction === 1
      ? { x: vector.z, y: vector.y, z: -vector.x }
      : { x: -vector.z, y: vector.y, z: vector.x };
  }

  return direction === 1
    ? { x: -vector.y, y: vector.x, z: vector.z }
    : { x: vector.y, y: -vector.x, z: vector.z };
}

function applyQuarterTurn(cube: Sticker[], move: string, direction: number) {
  const definition = moveDefinitions[move as keyof typeof moveDefinitions];

  return cube.map((sticker) => {
    if (sticker.position[definition.axis] !== definition.layer) {
      return sticker;
    }

    return {
      ...sticker,
      normal: rotateVector(sticker.normal, definition.axis, direction),
      position: rotateVector(sticker.position, definition.axis, direction),
    };
  });
}

function applyMove(cube: Sticker[], move: string) {
  const baseMove = move[0] as MoveFace;
  const definition = moveDefinitions[baseMove];
  const direction = move.endsWith("'")
    ? -definition.clockwiseDirection
    : definition.clockwiseDirection;
  const turns = move.endsWith("2") ? 2 : 1;
  let nextCube = cube;

  for (let turn = 0; turn < turns; turn += 1) {
    nextCube = applyQuarterTurn(nextCube, baseMove, direction);
  }

  return nextCube;
}

function inverseMove(move: string) {
  if (move.endsWith("2")) return move;
  return move.endsWith("'") ? move.slice(0, -1) : move + "'";
}

function stickerAt(cube: Sticker[], position: Vector, normal: Vector) {
  return cube.find(
    (sticker) =>
      sticker.position.x === position.x &&
      sticker.position.y === position.y &&
      sticker.position.z === position.z &&
      sticker.normal.x === normal.x &&
      sticker.normal.y === normal.y &&
      sticker.normal.z === normal.z,
  )?.color;
}

function sameVector(first: Vector, second: Vector) {
  return first.x === second.x && first.y === second.y && first.z === second.z;
}

function faceIndex(face: Face, position: Vector) {
  if (face === "front") return (1 - position.y) * 3 + position.x + 1;
  if (face === "back") return (1 - position.y) * 3 + (1 - position.x);
  if (face === "right") return (1 - position.y) * 3 + (1 - position.z);
  if (face === "left") return (1 - position.y) * 3 + position.z + 1;
  if (face === "top") return (position.z + 1) * 3 + position.x + 1;
  return (1 - position.z) * 3 + position.x + 1;
}

function paintFace(
  cube: Sticker[],
  face: Face,
  cells: number[],
  color: StickerColor,
) {
  const normal = cubieFaces.find((item) => item.face === face)?.normal;
  if (!normal) return cube;

  return cube.map((sticker) =>
    sameVector(sticker.normal, normal) && cells.includes(faceIndex(face, sticker.position))
      ? { ...sticker, color }
      : sticker,
  );
}

function paintSideRows(cube: Sticker[], cells: number[]) {
  return (["front", "right", "back", "left"] as Face[]).reduce(
    (painted, face) => paintFace(painted, face, cells, faceColors[face]),
    cube,
  );
}

function paintFaceCells(
  cube: Sticker[],
  face: Face,
  colors: Array<StickerColor | undefined>,
) {
  const normal = cubieFaces.find((item) => item.face === face)?.normal;
  if (!normal) return cube;

  return cube.map((sticker) => {
    if (!sameVector(sticker.normal, normal)) return sticker;

    const color = colors[faceIndex(face, sticker.position)];
    return color ? { ...sticker, color } : sticker;
  });
}

function paintSideTopRow(
  cube: Sticker[],
  state:
    | "mixed"
    | "corners-positioned"
    | "yellow-edges-unoriented"
    | "yellow-corners-unoriented",
) {
  const colors: Record<
    "mixed" | "corners-positioned" | "yellow-edges-unoriented" | "yellow-corners-unoriented",
    Record<Face, StickerColor[]>
  > = {
    mixed: {
      front: ["green", "blue", "orange"],
      right: ["red", "orange", "green"],
      back: ["blue", "red", "green"],
      left: ["orange", "blue", "red"],
      top: [],
      bottom: [],
    },
    "corners-positioned": {
      front: ["red", "blue", "red"],
      right: ["blue", "orange", "blue"],
      back: ["orange", "green", "orange"],
      left: ["green", "red", "green"],
      top: [],
      bottom: [],
    },
    "yellow-edges-unoriented": {
      front: ["yellow", "yellow", "red"],
      right: ["blue", "yellow", "yellow"],
      back: ["yellow", "orange", "yellow"],
      left: ["yellow", "yellow", "green"],
      top: [],
      bottom: [],
    },
    "yellow-corners-unoriented": {
      front: ["yellow", "blue", "orange"],
      right: ["yellow", "orange", "green"],
      back: ["yellow", "red", "green"],
      left: ["yellow", "blue", "red"],
      top: [],
      bottom: [],
    },
  };

  return (["front", "right", "back", "left"] as Face[]).reduce(
    (painted, face) => paintFaceCells(painted, face, colors[state][face]),
    cube,
  );
}

function paintSideUpperRowsMixed(cube: Sticker[]) {
  const colors: Record<Face, Array<StickerColor | undefined>> = {
    front: ["green", "blue", "orange", "blue", "red", "green"],
    right: ["red", "orange", "green", "orange", "blue", "red"],
    back: ["blue", "red", "green", "red", "orange", "blue"],
    left: ["orange", "blue", "red", "green", "green", "orange"],
    top: [],
    bottom: [],
  };

  return (["front", "right", "back", "left"] as Face[]).reduce(
    (painted, face) => paintFaceCells(painted, face, colors[face]),
    cube,
  );
}

function paintTopPattern(cube: Sticker[], yellowCells: number[]) {
  const topNormal = cubieFaces.find((item) => item.face === "top")?.normal;
  const nonYellowColors: StickerColor[] = [
    "green", "blue", "red",
    "orange", "yellow", "blue",
    "red", "green", "orange",
  ];

  if (!topNormal) return cube;

  return cube.map((sticker) => {
    if (!sameVector(sticker.normal, topNormal)) return sticker;

    const index = faceIndex("top", sticker.position);
    return {
      ...sticker,
      color: yellowCells.includes(index) ? "yellow" : nonYellowColors[index],
    };
  });
}

function paintTopCells(cube: Sticker[], colors: StickerColor[]) {
  return paintFaceCells(cube, "top", colors);
}

function paintDaisyTop(cube: Sticker[]) {
  return paintFaceCells(cube, "top", [
    "green", "white", "red",
    "white", "yellow", "white",
    "blue", "white", "orange",
  ]);
}

type LockedCells = Partial<Record<Face, number[]>>;

const allFaceCells = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const sideFaces: Face[] = ["front", "right", "back", "left"];

function lockAllSides(cells: number[]): LockedCells {
  return sideFaces.reduce<LockedCells>(
    (locks, face) => ({ ...locks, [face]: cells }),
    {},
  );
}

function balanceStickerInventory(cube: Sticker[], lockedCells: LockedCells) {
  const isLocked = (sticker: Sticker) =>
    faces.some((face) => {
      const cells = lockedCells[face];
      const normal = cubieFaces.find((item) => item.face === face)?.normal;

      return Boolean(
        cells &&
          normal &&
          sameVector(sticker.normal, normal) &&
          cells.includes(faceIndex(face, sticker.position)),
      );
    });

  const colors: StickerColor[] = [
    "white",
    "yellow",
    "red",
    "orange",
    "blue",
    "green",
  ];
  const lockedCounts = colors.reduce<Record<StickerColor, number>>(
    (counts, color) => ({
      ...counts,
      [color]: cube.filter(
        (sticker) => sticker.color === color && isLocked(sticker),
      ).length,
    }),
    {} as Record<StickerColor, number>,
  );
  const remainingCounts = colors.reduce<Record<StickerColor, number>>(
    (counts, color) => ({ ...counts, [color]: 0 }),
    {} as Record<StickerColor, number>,
  );
  const requiredCounts = colors.reduce<Record<StickerColor, number>>(
    (counts, color) => ({ ...counts, [color]: 9 - lockedCounts[color] }),
    {} as Record<StickerColor, number>,
  );

  return cube.map((sticker) => {
    if (isLocked(sticker)) return sticker;

    if (remainingCounts[sticker.color] < requiredCounts[sticker.color]) {
      remainingCounts[sticker.color] += 1;
      return sticker;
    }

    const neededColor = colors.find(
      (color) => remainingCounts[color] < requiredCounts[color],
    );
    if (!neededColor) return sticker;

    remainingCounts[neededColor] += 1;
    return { ...sticker, color: neededColor };
  });
}

function createGuideStates(scrambledCube: Sticker[]) {
  const states: Sticker[][] = [];
  const saveState = (cube: Sticker[], lockedCells: LockedCells) => {
    const balancedCube = balanceStickerInventory(cube, lockedCells);
    states.push(balancedCube);
    return balancedCube;
  };

  let current = paintDaisyTop(scrambledCube);
  current = saveState(current, { top: allFaceCells });

  current = paintFace(current, "top", [1, 3, 4, 5, 7], "white");
  current = paintSideRows(current, [1]);
  current = saveState(current, {
    top: allFaceCells,
    ...lockAllSides([1]),
  });

  current = paintFace(current, "top", [0, 1, 2, 3, 4, 5, 6, 7, 8], "white");
  current = paintSideRows(current, [0, 1, 2]);
  current = saveState(current, {
    top: allFaceCells,
    ...lockAllSides([0, 1, 2]),
  });

  let middleStart = paintFace(
    current,
    "bottom",
    [0, 1, 2, 3, 4, 5, 6, 7, 8],
    "white",
  );
  middleStart = paintSideUpperRowsMixed(middleStart);
  middleStart = paintSideRows(middleStart, [6, 7, 8]);
  middleStart = paintTopPattern(middleStart, [0, 2, 4, 6, 8]);
  middleStart = balanceStickerInventory(middleStart, {
    top: allFaceCells,
    bottom: allFaceCells,
    ...lockAllSides([6, 7, 8]),
  });

  current = middleStart;
  current = paintSideRows(current, [3, 4, 5, 6, 7, 8]);
  current = paintSideTopRow(current, "mixed");
  current = paintTopPattern(current, [4]);
  current = paintSideTopRow(current, "yellow-edges-unoriented");
  current = saveState(current, {
    top: allFaceCells,
    bottom: allFaceCells,
    ...lockAllSides(allFaceCells),
  });

  current = paintTopCells(current, [
    "green", "yellow", "blue",
    "yellow", "yellow", "yellow",
    "red", "yellow", "orange",
  ]);
  current = paintSideTopRow(current, "yellow-corners-unoriented");
  current = saveState(current, {
    top: allFaceCells,
    bottom: allFaceCells,
    ...lockAllSides(allFaceCells),
  });

  current = paintTopPattern(current, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  current = paintSideTopRow(current, "mixed");
  current = saveState(current, {
    top: allFaceCells,
    bottom: allFaceCells,
    ...lockAllSides(allFaceCells),
  });

  current = paintSideTopRow(current, "corners-positioned");
  current = saveState(current, {
    top: allFaceCells,
    bottom: allFaceCells,
    ...lockAllSides(allFaceCells),
  });

  states.push(solvedCube);

  return {
    states,
    starts: [
      scrambledCube,
      states[0],
      states[1],
      middleStart,
      states[3],
      states[4],
      states[5],
      states[6],
    ],
  };
}

function cubeAtGuideProgress(
  scrambledCube: Sticker[],
  guideStates: Sticker[][],
  stageStarts: Sticker[][],
  stages: LessonStage[],
  stageIndex: number,
  moveProgress: number,
) {
  const stage = stages[stageIndex];

  if (moveProgress >= stage.moves.length) {
    return guideStates[stageIndex];
  }

  const startingCube = stageStarts[stageIndex] ??
    (stageIndex === 0 ? scrambledCube : guideStates[stageIndex - 1]);

  return stage.moves
    .slice(0, moveProgress)
    .reduce((cube, move) => applyMove(cube, move), startingCube);
}

function cubieClass(position: Vector) {
  const coordinateName = (value: number) =>
    value === -1 ? "minus" : value === 1 ? "plus" : "zero";

  return (
    "cubie cubie--x-" +
    coordinateName(position.x) +
    " cubie--y-" +
    coordinateName(position.y) +
    " cubie--z-" +
    coordinateName(position.z)
  );
}

function cubieTurnClass(
  position: Vector,
  move?: string,
  reverseDouble = false,
) {
  if (!move) return "";

  const definition = moveDefinitions[move[0] as keyof typeof moveDefinitions];
  if (!definition || position[definition.axis] !== definition.layer) return "";

  const direction = move.endsWith("'")
    ? -definition.clockwiseDirection
    : definition.clockwiseDirection;

  return (
    " cubie--turning cubie--turn-" +
    definition.axis +
    (move.endsWith("2")
      ? " cubie--turn-double" +
        (definition.clockwiseDirection === 1 !== reverseDouble
          ? " cubie--turn-double-reverse"
          : "")
      : direction === 1
        ? " cubie--turn-reverse"
        : "")
  );
}

function Cube({
  activeTurn,
  cube,
  focusView,
  mode,
  onScramble,
  previousCube,
  reverseDouble,
}: {
  activeTurn?: string;
  cube: Sticker[];
  focusView?: { x: number; y: number };
  mode: CubeMode;
  onScramble: () => void;
  previousCube?: Sticker[];
  reverseDouble?: boolean;
}) {
  const initialTilt = focusView ?? { x: -22, y: -38 };
  const [tilt, setTilt] = useState(initialTilt);
  const [displayedCube, setDisplayedCube] = useState(
    activeTurn && previousCube ? previousCube : cube,
  );
  const [isTurning, setIsTurning] = useState(Boolean(activeTurn && previousCube));
  const pointerPosition = useRef<{ x: number; y: number } | null>(null);
  const draggedDistance = useRef(0);
  const cubeStyle = {
    "--cube-rx": tilt.x + "deg",
    "--cube-ry": tilt.y + "deg",
  } as CSSProperties;

  useEffect(() => {
    if (!isTurning) return;

    const finishTurn = window.setTimeout(() => {
      setDisplayedCube(cube);
      setIsTurning(false);
    }, 720);

    return () => window.clearTimeout(finishTurn);
  }, [cube, isTurning]);

  return (
    <button
      className={"cube-interaction " + (mode === "ready" ? "is-clickable" : "")}
      type="button"
      onClick={() => {
        if (mode === "ready" && draggedDistance.current < 8) {
          onScramble();
        }
      }}
      onPointerDown={(event) => {
        pointerPosition.current = { x: event.clientX, y: event.clientY };
        draggedDistance.current = 0;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onMouseMove={(event) => {
        if (pointerPosition.current) return;

        const bounds = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        setTilt({ x: -22 - y * 10, y: -38 + x * 16 });
      }}
      onPointerMove={(event) => {
        if (!pointerPosition.current) return;

        const deltaX = event.clientX - pointerPosition.current.x;
        const deltaY = event.clientY - pointerPosition.current.y;
        draggedDistance.current += Math.abs(deltaX) + Math.abs(deltaY);
        pointerPosition.current = { x: event.clientX, y: event.clientY };
        setTilt((current) => ({
          x: current.x - deltaY * 0.65,
          y: current.y + deltaX * 0.65,
        }));
      }}
      onPointerUp={(event) => {
        pointerPosition.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
        window.setTimeout(() => {
          draggedDistance.current = 0;
        }, 0);
      }}
      aria-label={
        mode === "ready"
          ? "Drag to rotate the cube. Click without dragging to scramble it."
          : "Drag to rotate the Rubik's Cube."
      }
    >
      <span
        className={
          "cube " +
          (mode === "scrambled" ? "cube--scrambling" : "")
        }
        style={cubeStyle}
        aria-hidden="true"
      >
        {cubiePositions.map((position) => (
          <span
            className={
              cubieClass(position) +
              cubieTurnClass(
                position,
                isTurning ? activeTurn : undefined,
                reverseDouble,
              )
            }
            key={"cubie" + position.x + position.y + position.z}
          >
            {cubieFaces.map(({ face, normal }) => {
              const color = stickerAt(displayedCube, position, normal);

              return (
                <span className={"cubie__face cubie__face--" + face} key={face}>
                  {color && <span className={"cubie__sticker sticker--" + color} />}
                </span>
              );
            })}
          </span>
        ))}
      </span>
    </button>
  );
}

const turnFaceNames: Record<MoveFace, string> = {
  R: "Right",
  U: "Up",
  F: "Front",
  L: "Left",
  D: "Down",
  B: "Back",
};

function turnDirection(move: string) {
  if (move.endsWith("2")) return "Turn twice";
  return move.endsWith("'") ? "Counter-clockwise" : "Clockwise";
}

const turnArrowStyles: Record<MoveFace, { clockwise: string; counterClockwise: string }> = {
  R: { clockwise: "up", counterClockwise: "down" },
  U: { clockwise: "left", counterClockwise: "right" },
  F: { clockwise: "clockwise", counterClockwise: "counter-clockwise" },
  L: { clockwise: "down", counterClockwise: "up" },
  D: { clockwise: "right", counterClockwise: "left" },
  B: { clockwise: "counter-clockwise", counterClockwise: "clockwise" },
};

function turnGesture(move: string) {
  const face = move[0] as MoveFace;
  const direction = move.endsWith("'")
    ? turnArrowStyles[face].counterClockwise
    : turnArrowStyles[face].clockwise;

  return move.endsWith("2") ? direction + " turn-map__arrow--double" : direction;
}

function TurnMap({
  activeMoveIndex,
  compact = false,
  label,
  moves,
}: {
  activeMoveIndex?: number;
  compact?: boolean;
  label: string;
  moves: string[];
}) {
  if (!moves.length) return null;

  return (
    <div className={"turn-map " + (compact ? "turn-map--compact" : "")}>
      <p className="turn-map__label">{label}</p>
      <div className="turn-map__sequence" aria-label={label}>
        {moves.map((move, index) => {
          const face = move[0] as MoveFace;
          const direction = turnDirection(move);
          const arrow = turnGesture(move);

          return (
            <div
              aria-label={turnFaceNames[face] + " face, " + direction + ", " + move}
              className={
                "turn-map__tile turn-map__tile--" +
                face.toLowerCase() +
                (activeMoveIndex === index ? " is-active" : "")
              }
              key={move + index}
            >
              <div className="turn-map__tile-top">
                <span>{turnFaceNames[face]}</span>
                <span>{direction}</span>
              </div>
              <div className={"turn-map__face turn-map__face--" + face.toLowerCase()} aria-hidden="true">
                {Array.from({ length: 9 }, (_, cellIndex) => (
                  <i key={cellIndex} />
                ))}
                <span className="turn-map__layer-strip">
                  {Array.from({ length: 3 }, (_, stripIndex) => (
                    <i key={stripIndex} />
                  ))}
                </span>
                <span className={"turn-map__arrow turn-map__arrow--" + arrow} aria-hidden="true" />
              </div>
              <strong>{move}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CaseGuides({ cases, stageName }: { cases: LessonCase[]; stageName: string }) {
  return (
    <div className="case-guides">
      <p className="case-guides__label">Position checks &amp; fixes</p>
      {cases.map((guide, index) => (
        <details className="case-guide" key={guide.title} open={index === 0}>
          <summary>
            <span>{guide.title}</span>
            <small>{guide.moves.length ? guide.moves.join(" ") : "VISUAL CHECK"}</small>
          </summary>
          <p>{guide.detail}</p>
          <TurnMap
            compact
            label={stageName + " · " + guide.title}
            moves={guide.moves}
          />
        </details>
      ))}
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState<CubeMode>("ready");
  const [scramble, setScramble] = useState(initialScramble);
  const [activeStage, setActiveStage] = useState(-1);
  const [stageMoveProgress, setStageMoveProgress] = useState(0);
  const [unlockedStage, setUnlockedStage] = useState(0);
  const [turnAnimation, setTurnAnimation] = useState<TurnAnimation | null>(null);
  const activeSceneRef = useRef({ stage: -1, move: 0 });
  const pendingStageRef = useRef<number | null>(null);
  const scrambledCube = useMemo(
    () => scramble.reduce((cube, move) => applyMove(cube, move), solvedCube),
    [scramble],
  );
  const guideStateSet = useMemo(
    () => createGuideStates(scrambledCube),
    [scrambledCube],
  );
  const guideStates = guideStateSet.states;
  const stageStarts = guideStateSet.starts;
  const activeStages = tutorialStages;

  useEffect(() => {
    if (mode !== "solving") return;

    const sections = document.querySelectorAll<HTMLElement>("[data-stage][data-move]");
    const observer = new IntersectionObserver(
      (entries) => {
        const currentSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (currentSection) {
          const nextStage = Number(currentSection.target.dataset.stage);
          const nextMove = Number(currentSection.target.dataset.move);

          if (
            pendingStageRef.current !== null &&
            nextStage < pendingStageRef.current
          ) {
            return;
          }

          if (
            pendingStageRef.current !== null &&
            nextStage >= pendingStageRef.current
          ) {
            pendingStageRef.current = null;
          }

          if (
            nextStage !== activeSceneRef.current.stage ||
            nextMove !== activeSceneRef.current.move
          ) {
            const previousScene = activeSceneRef.current;
            const moveDelta = nextMove - previousScene.move;
            const changedMoveIndex =
              moveDelta > 0 ? nextMove - 1 : previousScene.move - 1;
            const changedMove = activeStages[nextStage]?.moves[changedMoveIndex];

            if (
              nextStage === previousScene.stage &&
              Math.abs(moveDelta) === 1 &&
              changedMove
            ) {
              setTurnAnimation({
                move: moveDelta > 0 ? changedMove : inverseMove(changedMove),
                reverseDouble: moveDelta < 0 && changedMove.endsWith("2"),
                sourceCube: cubeAtGuideProgress(
                  scrambledCube,
                  guideStates,
                  stageStarts,
                  tutorialStages,
                  previousScene.stage,
                  previousScene.move,
                ),
              });
            } else {
              setTurnAnimation(null);
            }

            activeSceneRef.current = { stage: nextStage, move: nextMove };
            setActiveStage(nextStage);
            setStageMoveProgress(nextMove);
          }
        }
      },
      { rootMargin: "-22% 0px -24% 0px", threshold: [0.35, 0.6] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [
    activeStages,
    guideStates,
    mode,
    scrambledCube,
    stageStarts,
    unlockedStage,
  ]);

  function scrambleCube() {
    setScramble(makeScramble());
    setActiveStage(-1);
    setStageMoveProgress(0);
    setUnlockedStage(0);
    setTurnAnimation(null);
    activeSceneRef.current = { stage: -1, move: 0 };
    pendingStageRef.current = null;
    setMode("scrambled");
  }

  function beginSolve() {
    setActiveStage(0);
    setStageMoveProgress(0);
    setUnlockedStage(0);
    setTurnAnimation(null);
    activeSceneRef.current = { stage: 0, move: 0 };
    pendingStageRef.current = 0;
    setMode("solving");
    window.setTimeout(() => {
      document
        .getElementById("walkthrough")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function startGuidedSolve() {
    beginSolve();
  }

  function resetCube() {
    setActiveStage(-1);
    setStageMoveProgress(0);
    setUnlockedStage(0);
    setTurnAnimation(null);
    activeSceneRef.current = { stage: -1, move: 0 };
    pendingStageRef.current = null;
    setMode("ready");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function unlockNextStage(stageIndex: number) {
    const nextStage = stageIndex + 1;
    if (nextStage >= activeStages.length) return;

    setUnlockedStage((current) => Math.max(current, nextStage));
    setActiveStage(nextStage);
    setStageMoveProgress(0);
    setTurnAnimation(null);
    activeSceneRef.current = { stage: nextStage, move: 0 };
    pendingStageRef.current = nextStage;

    window.setTimeout(() => {
      document
        .getElementById("stage-" + nextStage + "-move-0")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  const currentStage = activeStage >= 0 ? activeStages[activeStage] : null;
  const currentStageComplete =
    Boolean(currentStage) && stageMoveProgress === currentStage?.moves.length;
  const shownCube =
    mode === "ready"
      ? solvedCube
      : mode === "scrambled"
        ? scrambledCube
        : cubeAtGuideProgress(
            scrambledCube,
            guideStates,
            stageStarts,
            tutorialStages,
            Math.max(activeStage, 0),
            stageMoveProgress,
          );
  const consoleMoves = mode === "scrambled" ? scramble : currentStage?.moves ?? [];
  const showMoveConsole =
    mode !== "solving" || stageMoveProgress > 0;

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
              : activeStage === activeStages.length - 1 && currentStageComplete
                ? "SOLVED"
                : "GUIDED SOLVE"}
        </p>
      </header>

      {showMoveConsole && (
        <aside className="move-console" aria-live="polite">
          <p className="console-kicker">
            {mode === "ready"
              ? "Cube state"
              : mode === "scrambled"
                ? "Scramble sequence"
                : currentStage?.label}
          </p>
          <div className="console-current">
            {mode === "ready"
              ? "03×03"
              : mode === "scrambled"
                ? "MIXED"
                : currentStage?.name}
          </div>
          <div className="move-row" aria-label="Moves for the current method">
            {consoleMoves.map((move, index) => (
              <span
                className={
                  "move-token " +
                  (mode === "solving"
                    ? index < stageMoveProgress - 1
                      ? "move-token--done"
                      : index === stageMoveProgress - 1
                        ? "move-token--active"
                        : ""
                    : "")
                }
                key={move + index}
              >
                {move}
              </span>
            ))}
          </div>
          <p className="console-note">
            {mode === "ready"
              ? "Click the cube to create a solvable scramble."
              : mode === "scrambled"
                ? "This exact sequence created the current mix."
                : currentStageComplete
                  ? currentStage?.name + " is complete."
                  : "Scroll slowly to apply the next move; scroll back to reverse it."}
          </p>
        </aside>
      )}

      <section className="hero" id="top">
        <div className="hero__copy">
          <p className="eyebrow">Interactive 3 × 3 system</p>
          <h1>
            Learn every move.
            <br />
            <em>Understand</em> the solve.
          </h1>
          <p className="hero__description">
            Scramble a cube, then learn the classic Daisy-first method as the
            cube completes one meaningful stage at a time.
          </p>
        </div>

        <div className="hero__cube">
          <div className="cube-orbit cube-orbit--one" />
          <div className="cube-orbit cube-orbit--two" />
          <Cube
            activeTurn={turnAnimation?.move}
            cube={shownCube}
            focusView={mode === "solving" ? currentStage?.view : undefined}
            key={"hero-cube-" + mode + activeStage + "-" + stageMoveProgress}
            mode={mode}
            onScramble={scrambleCube}
            previousCube={turnAnimation?.sourceCube}
            reverseDouble={turnAnimation?.reverseDouble}
          />
          <p className="cube-prompt">
            {mode === "ready"
              ? "Click to generate a scramble"
              : mode === "scrambled"
                ? "Your 18-move scramble is ready"
                : activeStage === activeStages.length - 1 && currentStageComplete
                  ? "Sequence complete"
                  : currentStage?.name + " · " + stageMoveProgress + " / " + currentStage?.moves.length + " moves"}
          </p>
        </div>

        <div className="hero__action">
          {mode === "ready" && (
            <p>
              A calm, visual way to learn the
              <br />
              logic behind every turn.
            </p>
          )}
          {mode === "scrambled" && (
            <div className="hero__solve-actions">
              <button className="primary-button" type="button" onClick={startGuidedSolve}>
                Start the Daisy-first lesson <span>↓</span>
              </button>
            </div>
          )}
          {mode === "solving" && activeStage === activeStages.length - 1 && currentStageComplete && (
            <button className="secondary-button" type="button" onClick={resetCube}>
              Scramble another cube
            </button>
          )}
        </div>

        <p className="hero__index">CUBE ATLAS / 01</p>
      </section>

      {mode === "solving" && (
        <section className="walkthrough" id="walkthrough">
          <div className="walkthrough__cube">
            <p className="cube-stage-label">Live cube state</p>
            <p className="cube-stage-orientation">{currentStage?.orientation}</p>
            <Cube
              activeTurn={turnAnimation?.move}
              cube={shownCube}
              focusView={currentStage?.view}
              key={"walkthrough-cube-" + activeStage + "-" + stageMoveProgress}
              mode={mode}
              onScramble={scrambleCube}
              previousCube={turnAnimation?.sourceCube}
              reverseDouble={turnAnimation?.reverseDouble}
            />
            <p className="cube-stage-progress">
              <span>Step {activeStage + 1} of {activeStages.length}</span>
              <span>Move {stageMoveProgress} of {currentStage?.moves.length}</span>
            </p>
          </div>

          <div className="steps">
            {activeStages.slice(0, unlockedStage + 1).map((stage, index) => {
              const isCurrentStage = index === activeStage;
              const sectionProgress = isCurrentStage
                ? stageMoveProgress
                : index < activeStage
                  ? stage.moves.length
                  : 0;

              return (
                <section className="stage" key={stage.name}>
                  <article
                    className={
                      "step step--intro " +
                      (isCurrentStage && stageMoveProgress === 0 ? "step--active" : "")
                    }
                    data-move={0}
                    data-stage={index}
                    id={"stage-" + index + "-move-0"}
                  >
                    <p className="step__label">{stage.label} · {stage.name}</p>
                    <h2>{stage.title}</h2>
                    <p className="step__body">{stage.description}</p>
                    <p className="orientation-note">Hold: {stage.orientation}</p>
                    <div className="step__moves" aria-label={"Moves for " + stage.name}>
                      {stage.moves.map((move, moveIndex) => (
                        <span
                          className={
                            moveIndex < sectionProgress - 1
                              ? "move-token--done"
                              : moveIndex === sectionProgress - 1
                                ? "move-token--active"
                                : ""
                          }
                          key={move + moveIndex}
                        >
                          {move}
                        </span>
                      ))}
                    </div>
                    <TurnMap
                      activeMoveIndex={
                        isCurrentStage && stageMoveProgress > 0
                          ? stageMoveProgress - 1
                          : undefined
                      }
                      label={stage.name + " · scroll sequence"}
                      moves={stage.moves}
                    />
                    <p className="step__instruction">
                      Scroll down to make move 01. Each panel makes one deliberate turn.
                    </p>
                    <p className="algorithm-note">{stage.algorithmNote}</p>
                    <CaseGuides cases={stage.caseGuides} stageName={stage.name} />
                  </article>

                  {stage.moves.map((move, moveIndex) => {
                    const moveProgress = moveIndex + 1;
                    const isCurrentMove =
                      isCurrentStage && stageMoveProgress === moveProgress;
                    const isLastMove = moveProgress === stage.moves.length;
                    const stageComplete = isCurrentMove && isLastMove;
                    const isFinalStage = index === activeStages.length - 1;

                    return (
                      <article
                        className={
                          "step step--move " + (isCurrentMove ? "step--active" : "")
                        }
                        data-move={moveProgress}
                        data-stage={index}
                        id={"stage-" + index + "-move-" + moveProgress}
                        key={stage.name + move}
                      >
                        <p className="step__label">
                          {stage.name} · move {String(moveProgress).padStart(2, "0")} / {String(stage.moves.length).padStart(2, "0")}
                        </p>
                        <h2>
                          Turn <span>{move}</span>
                        </h2>
                        <p className="step__body">
                          Watch the highlighted layer turn. Scroll upward to undo this move, or continue down for the next one.
                        </p>
                        <div className="step__moves" aria-label={"Progress through " + stage.name}>
                          {stage.moves.map((stageMove, stageMoveIndex) => (
                            <span
                              className={
                                stageMoveIndex < moveIndex
                                  ? "move-token--done"
                                  : stageMoveIndex === moveIndex
                                    ? "move-token--active"
                                    : ""
                              }
                              key={stageMove + stageMoveIndex}
                            >
                              {stageMove}
                            </span>
                          ))}
                        </div>
                        {stageComplete && !isFinalStage && (
                          <div className="stage-complete">
                            <p>{stage.name} complete</p>
                            {stage.handoff && <p className="stage-complete__handoff">{stage.handoff}</p>}
                            <button
                              className="primary-button"
                              type="button"
                              onClick={() => unlockNextStage(index)}
                            >
                              Move on to {activeStages[index + 1].name} <span>→</span>
                            </button>
                          </div>
                        )}
                        {stageComplete && isFinalStage && (
                          <div className="stage-complete">
                            <p>The final layer is aligned. Your cube is solved.</p>
                            <button className="secondary-button" type="button" onClick={resetCube}>
                              Solve another scramble
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </section>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
