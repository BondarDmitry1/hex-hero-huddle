import { useMemo } from 'react';
import { BattleUnit, hexDistance } from '@/store/gameStore';
import { cn } from '@/lib/utils';

interface HexGridProps {
  width: number;
  height: number;
  obstacles: Set<string>;
  units: BattleUnit[];
  selectedUnit: BattleUnit | null;
  currentUnit: BattleUnit | null;
  onHexClick: (q: number, r: number) => void;
  onHexHover: (q: number, r: number, unit: BattleUnit | null) => void;
  movementRange?: Set<string>;
  hoveredEnemy: BattleUnit | null;
}

const HEX_SIZE = 28;
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
const HEX_HEIGHT = 2 * HEX_SIZE;

const hexToPixel = (q: number, r: number) => {
  const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
  const y = HEX_SIZE * (3 / 2) * r;
  return { x: x + HEX_WIDTH, y: y + HEX_HEIGHT };
};

const hexPoints = (cx: number, cy: number) => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + HEX_SIZE * Math.cos(angle);
    const y = cy + HEX_SIZE * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
};

export const HexGrid = ({
  width,
  height,
  obstacles,
  units,
  selectedUnit,
  currentUnit,
  onHexClick,
  onHexHover,
  movementRange = new Set(),
  hoveredEnemy,
}: HexGridProps) => {
  const hexes = useMemo(() => {
    const result = [];
    for (let r = 0; r < height; r++) {
      for (let q = 0; q < width; q++) {
        const key = `${q},${r}`;
        const { x, y } = hexToPixel(q, r);
        const isObstacle = obstacles.has(key);
        const isMovement = movementRange.has(key);
        const unit = units.find(u => u.position?.q === q && u.position?.r === r && !u.isDead);
        const isSelected = selectedUnit?.position?.q === q && selectedUnit?.position?.r === r;
        const isCurrent = currentUnit?.position?.q === q && currentUnit?.position?.r === r;

        // Check if this enemy is in attack range
        let isInAttackRange = false;
        let attackDistancePenalty = false;
        if (unit && currentUnit && unit.owner !== currentUnit.owner && currentUnit.position && !currentUnit.hasActed) {
          const distance = hexDistance(currentUnit.position, { q, r });
          if (currentUnit.attackRange === 'melee') {
            isInAttackRange = distance <= currentUnit.range;
          } else {
            isInAttackRange = true; // Ranged can attack anywhere
            attackDistancePenalty = distance > 5;
          }
        }

        result.push({
          q,
          r,
          x,
          y,
          key,
          isObstacle,
          isMovement,
          unit,
          isSelected,
          isCurrent,
          isInAttackRange,
          attackDistancePenalty,
        });
      }
    }
    return result;
  }, [width, height, obstacles, units, selectedUnit, currentUnit, movementRange]);

  const svgWidth = (width + 0.5) * HEX_WIDTH + HEX_WIDTH;
  const svgHeight = height * HEX_HEIGHT * 0.75 + HEX_HEIGHT;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-full"
      style={{ maxWidth: svgWidth, maxHeight: svgHeight }}
    >
      {/* Grid hexes */}
      {hexes.map(({ q, r, x, y, key, isObstacle, isMovement, unit, isSelected, isCurrent, isInAttackRange, attackDistancePenalty }) => (
        <g 
          key={key} 
          onClick={() => onHexClick(q, r)}
          onMouseEnter={() => onHexHover(q, r, unit || null)}
          onMouseLeave={() => onHexHover(q, r, null)}
          style={{ cursor: (isMovement || isInAttackRange) ? 'pointer' : 'default' }}
        >
          <polygon
            points={hexPoints(x, y)}
            className={cn(
              'hex-tile',
              isObstacle && 'hex-obstacle',
              isSelected && 'hex-selected',
              isCurrent && !isSelected && 'hex-current',
              isMovement && !unit && 'hex-movement',
              isInAttackRange && hoveredEnemy?.id === unit?.id && 'hex-attack'
            )}
          />
          
          {/* Unit display */}
          {unit && (
            <>
              {/* Unit background circle */}
              <circle
                cx={x}
                cy={y}
                r={HEX_SIZE * 0.75}
                className={cn(
                  'fill-card stroke-2 transition-all',
                  unit.owner === 'player' ? 'stroke-health' : 'stroke-destructive',
                  isCurrent && 'stroke-primary stroke-[3px]',
                  isInAttackRange && hoveredEnemy?.id === unit.id && 'stroke-accent stroke-[3px]'
                )}
              />
              
              {/* Unit avatar */}
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                className="text-base select-none pointer-events-none"
              >
                {unit.avatar}
              </text>
              
              {/* Attack indicator */}
              {isInAttackRange && hoveredEnemy?.id === unit.id && (
                <g>
                  <circle
                    cx={x + HEX_SIZE * 0.5}
                    cy={y - HEX_SIZE * 0.5}
                    r={10}
                    className="fill-destructive"
                  />
                  <text
                    x={x + HEX_SIZE * 0.5}
                    y={y - HEX_SIZE * 0.5 + 4}
                    textAnchor="middle"
                    className="text-xs fill-white select-none pointer-events-none"
                  >
                    {attackDistancePenalty ? '½' : '⚔'}
                  </text>
                </g>
              )}
              
              {/* Health bar */}
              <g transform={`translate(${x - 12}, ${y + HEX_SIZE * 0.55})`}>
                <rect
                  width={24}
                  height={4}
                  rx={2}
                  className="fill-muted"
                />
                <rect
                  width={24 * (unit.currentHealth / unit.maxHealth)}
                  height={4}
                  rx={2}
                  className={cn(
                    unit.currentHealth / unit.maxHealth > 0.5 
                      ? 'fill-health' 
                      : unit.currentHealth / unit.maxHealth > 0.25 
                        ? 'fill-amber-500' 
                        : 'fill-destructive'
                  )}
                />
              </g>
              
              {/* Energy bar */}
              {unit.currentEnergy > 0 && (
                <g transform={`translate(${x - 12}, ${y + HEX_SIZE * 0.55 + 5})`}>
                  <rect
                    width={24 * (unit.currentEnergy / unit.maxEnergy)}
                    height={2}
                    rx={1}
                    className="fill-energy"
                  />
                </g>
              )}
            </>
          )}
          
          {/* Obstacle display */}
          {isObstacle && (
            <text
              x={x}
              y={y + 4}
              textAnchor="middle"
              className="text-sm select-none pointer-events-none fill-muted-foreground/50"
            >
              🪨
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};

// Generate symmetric obstacles
export const generateObstacles = (width: number, height: number, count: number): Set<string> => {
  const obstacles = new Set<string>();
  const midQ = Math.floor(width / 2);
  
  // Avoid spawn zones (left 2 columns and right 2 columns)
  const validQRange = { min: 2, max: width - 3 };
  
  let placed = 0;
  let attempts = 0;
  const maxAttempts = count * 20;
  
  while (placed < count && attempts < maxAttempts) {
    attempts++;
    
    // Generate random position in left half
    const q = Math.floor(Math.random() * (midQ - validQRange.min)) + validQRange.min;
    const r = Math.floor(Math.random() * height);
    
    const key1 = `${q},${r}`;
    const mirrorQ = width - 1 - q;
    const key2 = `${mirrorQ},${r}`;
    
    if (!obstacles.has(key1) && !obstacles.has(key2)) {
      obstacles.add(key1);
      obstacles.add(key2);
      placed += 2;
    }
  }
  
  return obstacles;
};

// Calculate movement range
export const getMovementRange = (
  unit: BattleUnit,
  units: BattleUnit[],
  obstacles: Set<string>,
  width: number,
  height: number
): Set<string> => {
  if (!unit.position) return new Set();
  
  const range = new Set<string>();
  const visited = new Map<string, number>();
  const queue: { q: number; r: number; distance: number }[] = [
    { q: unit.position.q, r: unit.position.r, distance: 0 },
  ];
  
  const directions = [
    { q: 1, r: 0 }, { q: -1, r: 0 },
    { q: 0, r: 1 }, { q: 0, r: -1 },
    { q: 1, r: -1 }, { q: -1, r: 1 },
  ];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.q},${current.r}`;
    
    if (visited.has(key) && visited.get(key)! <= current.distance) continue;
    visited.set(key, current.distance);
    
    if (current.distance > 0 && current.distance <= unit.speed) {
      const hasUnit = units.some(
        u => u.position?.q === current.q && u.position?.r === current.r && !u.isDead
      );
      if (!hasUnit && !obstacles.has(key)) {
        range.add(key);
      }
    }
    
    if (current.distance < unit.speed) {
      for (const dir of directions) {
        const nq = current.q + dir.q;
        const nr = current.r + dir.r;
        const nKey = `${nq},${nr}`;
        
        if (nq >= 0 && nq < width && nr >= 0 && nr < height && !obstacles.has(nKey)) {
          queue.push({ q: nq, r: nr, distance: current.distance + 1 });
        }
      }
    }
  }
  
  return range;
};
