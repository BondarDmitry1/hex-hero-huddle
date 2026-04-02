export interface GridPosition {
  q: number;
  r: number;
}

interface CubePosition {
  x: number;
  y: number;
  z: number;
}

export interface CubeStepDirection {
  x: number;
  y: number;
  z: number;
}

const offsetToCube = (q: number, r: number): CubePosition => {
  const x = q - Math.floor(r / 2);
  const z = r;
  const y = -x - z;
  return { x, y, z };
};

const cubeToOffset = ({ x, z }: CubePosition): GridPosition => ({
  q: x + Math.floor(z / 2),
  r: z,
});

const cubeLerp = (a: CubePosition, b: CubePosition, t: number): CubePosition => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: a.z + (b.z - a.z) * t,
});

const cubeRound = ({ x, y, z }: CubePosition): CubePosition => {
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);

  const xDiff = Math.abs(rx - x);
  const yDiff = Math.abs(ry - y);
  const zDiff = Math.abs(rz - z);

  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { x: rx, y: ry, z: rz };
};

export const isWithinBoard = (position: GridPosition, width: number, height: number): boolean => {
  return position.q >= 0 && position.q < width && position.r >= 0 && position.r < height;
};

export const getHexLine = (from: GridPosition, to: GridPosition): GridPosition[] => {
  const start = offsetToCube(from.q, from.r);
  const end = offsetToCube(to.q, to.r);
  const distance = Math.max(
    Math.abs(start.x - end.x),
    Math.abs(start.y - end.y),
    Math.abs(start.z - end.z)
  );

  if (distance === 0) return [from];

  const line: GridPosition[] = [];
  for (let step = 0; step <= distance; step++) {
    const cube = cubeRound(cubeLerp(start, end, step / distance));
    line.push(cubeToOffset(cube));
  }

  return line;
};

export const hasObstacleBetween = (from: GridPosition, to: GridPosition, obstacles: Set<string>): boolean => {
  if (obstacles.size === 0) return false;

  return getHexLine(from, to)
    .slice(1, -1)
    .some((hex) => obstacles.has(`${hex.q},${hex.r}`));
};

export const getCubeStepDirection = (from: GridPosition, to: GridPosition): CubeStepDirection | null => {
  const start = offsetToCube(from.q, from.r);
  const end = offsetToCube(to.q, to.r);
  const direction = {
    x: end.x - start.x,
    y: end.y - start.y,
    z: end.z - start.z,
  };

  const magnitude = Math.max(Math.abs(direction.x), Math.abs(direction.y), Math.abs(direction.z));
  return magnitude === 1 ? direction : null;
};

export const applyCubeStep = (position: GridPosition, direction: CubeStepDirection): GridPosition => {
  const cube = offsetToCube(position.q, position.r);
  return cubeToOffset({
    x: cube.x + direction.x,
    y: cube.y + direction.y,
    z: cube.z + direction.z,
  });
};

export const getLinearKnockbackPosition = (from: GridPosition, to: GridPosition): GridPosition | null => {
  const direction = getCubeStepDirection(from, to);
  return direction ? applyCubeStep(to, direction) : null;
};