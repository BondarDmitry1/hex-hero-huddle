import { useMemo, useState, useEffect } from 'react';
import { BattleUnit, hexDistance } from '@/store/gameStore';
import { cn } from '@/lib/utils';

interface DamagePopup {
  id: string;
  x: number;
  y: number;
  damage: number;
  isCrit: boolean;
  isHealing?: boolean;
}

interface AttackAnimation {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: 'melee' | 'ranged';
  emoji: string;
}

interface MeleeShakeUnit {
  id: string;
  unitId: string;
}

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
  skillRange?: Set<string>;
  skillMode?: 'active' | 'ultimate' | null;
  hoveredEnemy: BattleUnit | null;
  damagePopups: DamagePopup[];
  attackAnimations: AttackAnimation[];
  meleeShakeUnits?: MeleeShakeUnit[];
  isRangedBlocked?: boolean;
}

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
  skillRange = new Set(),
  skillMode = null,
  hoveredEnemy,
  damagePopups = [],
  attackAnimations = [],
  meleeShakeUnits = [],
  isRangedBlocked = false,
}: HexGridProps) => {
  // Calculate hex size based on grid dimensions to make it visually square
  const HEX_SIZE = 36;
  const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
  const HEX_HEIGHT = 2 * HEX_SIZE;

  const hexToPixel = (q: number, r: number) => {
    // Смещаем чётные ряды вправо на пол-гекса для выравнивания
    const offset = r % 2 === 0 ? 0 : HEX_WIDTH / 2;
    const x = q * HEX_WIDTH + offset;
    const y = r * HEX_HEIGHT * 0.75;
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

  const hexes = useMemo(() => {
    const result = [];
    for (let r = 0; r < height; r++) {
      for (let q = 0; q < width; q++) {
        const key = `${q},${r}`;
        const { x, y } = hexToPixel(q, r);
        const isObstacle = obstacles.has(key);
        const isMovement = movementRange.has(key);
        const isSkillTarget = skillRange.has(key);
        const unit = units.find(u => u.position?.q === q && u.position?.r === r && !u.isDead);
        const isSelected = selectedUnit?.position?.q === q && selectedUnit?.position?.r === r;
        const isCurrent = currentUnit?.position?.q === q && currentUnit?.position?.r === r;

        let isInAttackRange = false;
        let attackDistancePenalty = false;
        let forcedMeleeAttack = false;
        if (unit && currentUnit && unit.owner !== currentUnit.owner && currentUnit.position && !currentUnit.hasActed && !skillMode) {
          const distance = hexDistance(currentUnit.position, { q, r });
          if (currentUnit.attackRange === 'melee') {
            isInAttackRange = distance <= currentUnit.range;
          } else {
            // Стрелок заблокирован - может атаковать только вплотную
            if (isRangedBlocked) {
              isInAttackRange = distance === 1;
              if (distance === 1) {
                forcedMeleeAttack = true;
              }
            } else {
              // Стрелок свободен - дальняя атака
              isInAttackRange = true;
              if (distance > 5) {
                attackDistancePenalty = true;
              }
            }
          }
        }

        result.push({
          q, r, x, y, key, isObstacle, isMovement, isSkillTarget, unit, isSelected, isCurrent, isInAttackRange, attackDistancePenalty, forcedMeleeAttack,
        });
      }
    }
    return result;
  }, [width, height, obstacles, units, selectedUnit, currentUnit, movementRange, skillRange, skillMode, hexToPixel, isRangedBlocked]);

  const svgWidth = (width + 0.5) * HEX_WIDTH + HEX_WIDTH;
  const svgHeight = height * HEX_HEIGHT * 0.75 + HEX_HEIGHT;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Glow filter for attacks */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Attack trail gradient */}
        <linearGradient id="attackTrail" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(0 70% 50%)" stopOpacity="0"/>
          <stop offset="100%" stopColor="hsl(0 70% 50%)" stopOpacity="1"/>
        </linearGradient>
      </defs>

      {/* Grid hexes */}
      {hexes.map(({ q, r, x, y, key, isObstacle, isMovement, isSkillTarget, unit, isSelected, isCurrent, isInAttackRange, attackDistancePenalty, forcedMeleeAttack }) => (
        <g 
          key={key} 
          onClick={() => onHexClick(q, r)}
          onMouseEnter={() => onHexHover(q, r, unit || null)}
          onMouseLeave={() => onHexHover(q, r, null)}
          style={{ cursor: (isMovement || isInAttackRange || isSkillTarget) ? 'pointer' : 'default' }}
        >
          <polygon
            points={hexPoints(x, y)}
            className={cn(
              'hex-tile',
              isObstacle && 'hex-obstacle',
              isSelected && 'hex-selected',
              isCurrent && !isSelected && 'hex-current',
              isMovement && !unit && !skillMode && 'hex-movement',
              isInAttackRange && hoveredEnemy?.id === unit?.id && 'hex-attack',
              isSkillTarget && (skillMode === 'ultimate' ? 'hex-ultimate' : 'hex-skill')
            )}
          />
          
          {/* Unit display */}
          {unit && (
            <g className={cn(
              'transition-transform duration-200',
              meleeShakeUnits.some(s => s.unitId === unit.id) && 'melee-shake'
            )}>
              {/* Unit shadow */}
              <ellipse
                cx={x}
                cy={y + HEX_SIZE * 0.6}
                rx={HEX_SIZE * 0.5}
                ry={HEX_SIZE * 0.15}
                className="fill-black/30"
              />
              
              {/* Unit background circle */}
              <circle
                cx={x}
                cy={y}
                r={HEX_SIZE * 0.8}
                className={cn(
                  'fill-card stroke-[3px] transition-all',
                  unit.owner === 'player' ? 'stroke-health' : 'stroke-destructive',
                  isCurrent && 'stroke-primary stroke-[4px] filter drop-shadow-lg'
                )}
              />
              
              {/* Unit avatar */}
              <text
                x={x}
                y={y + 6}
                textAnchor="middle"
                className="text-xl select-none pointer-events-none"
              >
                {unit.avatar}
              </text>
              
              {/* Attack indicator - static, type-based */}
              {isInAttackRange && hoveredEnemy?.id === unit.id && (
                <g>
                  <circle
                    cx={x + HEX_SIZE * 0.6}
                    cy={y - HEX_SIZE * 0.6}
                    r={14}
                    className={cn(
                      forcedMeleeAttack ? "fill-orange-600" : "fill-destructive"
                    )}
                    filter="url(#glow)"
                  />
                  <text
                    x={x + HEX_SIZE * 0.6}
                    y={y - HEX_SIZE * 0.6 + 5}
                    textAnchor="middle"
                    className="text-sm fill-white font-bold select-none pointer-events-none"
                  >
                    {forcedMeleeAttack ? '⚔' : attackDistancePenalty ? '🏹½' : currentUnit?.attackRange === 'melee' ? '⚔' : '🏹'}
                  </text>
                </g>
              )}
              
              {/* Health bar */}
              <g transform={`translate(${x - 16}, ${y + HEX_SIZE * 0.65})`}>
                <rect width={32} height={5} rx={2.5} className="fill-muted" />
                <rect
                  width={32 * (unit.currentHealth / unit.maxHealth)}
                  height={5}
                  rx={2.5}
                  className={cn(
                    'transition-all duration-300',
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
                <g transform={`translate(${x - 16}, ${y + HEX_SIZE * 0.65 + 6})`}>
                  <rect
                    width={32 * (unit.currentEnergy / unit.maxEnergy)}
                    height={3}
                    rx={1.5}
                    className="fill-energy transition-all duration-300"
                  />
                </g>
              )}
            </g>
          )}
          
          {/* Obstacle display - diverse types */}
          {isObstacle && (
            <text
              x={x}
              y={y + 6}
              textAnchor="middle"
              className="text-lg select-none pointer-events-none"
            >
              {(() => {
                const hash = (q * 7 + r * 13) % 5;
                const obstacles = ['🪨', '🌲', '🏔️', '🌳', '⛰️'];
                return obstacles[hash];
              })()}
            </text>
          )}
        </g>
      ))}
      
      {/* Attack animations - smooth projectile */}
      {attackAnimations.map((anim) => {
        const dx = anim.toX - anim.fromX;
        const dy = anim.toY - anim.fromY;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        return (
          <g key={anim.id}>
            {anim.type === 'ranged' ? (
              <>
                {/* Smooth trail */}
                <line
                  x1={anim.fromX}
                  y1={anim.fromY}
                  x2={anim.toX}
                  y2={anim.toY}
                  stroke="url(#attackTrail)"
                  strokeWidth="3"
                  className="projectile-trail"
                  strokeLinecap="round"
                />
                {/* Projectile with direction */}
                <g className="projectile-move" style={{ 
                  '--start-x': `${anim.fromX}px`, 
                  '--start-y': `${anim.fromY}px`,
                  '--end-x': `${anim.toX}px`,
                  '--end-y': `${anim.toY}px`,
                } as React.CSSProperties}>
                  <text
                    x={anim.toX}
                    y={anim.toY}
                    textAnchor="middle"
                    className="text-2xl"
                    filter="url(#glow)"
                  >
                    {anim.emoji}
                  </text>
                </g>
              </>
            ) : (
              <g className="melee-impact">
                <text
                  x={anim.toX}
                  y={anim.toY}
                  textAnchor="middle"
                  className="text-3xl"
                  filter="url(#glow)"
                >
                  💥
                </text>
              </g>
            )}
          </g>
        );
      })}
      
      {/* Damage/Healing popups - smooth fly up from center */}
      {damagePopups.map((popup) => (
        <g key={popup.id} className="damage-popup-smooth">
          <text
            x={popup.x}
            y={popup.y}
            textAnchor="middle"
            className={cn(
              'font-display font-bold select-none pointer-events-none',
              popup.isHealing 
                ? 'text-xl fill-green-400' 
                : popup.isCrit 
                  ? 'text-2xl fill-amber-400' 
                  : 'text-xl fill-destructive'
            )}
            filter="url(#glow)"
          >
            {popup.isHealing ? `+${popup.damage}` : popup.isCrit ? `💥${popup.damage}` : `-${popup.damage}`}
          </text>
        </g>
      ))}
    </svg>
  );
};

// Generate symmetric obstacles
export const generateObstacles = (width: number, height: number, count: number): Set<string> => {
  const obstacles = new Set<string>();
  const midQ = Math.floor(width / 2);
  const validQRange = { min: 2, max: width - 3 };
  
  let placed = 0;
  let attempts = 0;
  const maxAttempts = count * 20;
  
  while (placed < count && attempts < maxAttempts) {
    attempts++;
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

// Get neighbors for offset grid (odd-r offset layout)
// В odd-r layout нечётные ряды сдвинуты вправо
const getNeighbors = (q: number, r: number): { q: number; r: number }[] => {
  // Для odd-r offset grid:
  // - Чётные ряды (r % 2 === 0): сдвига нет
  // - Нечётные ряды (r % 2 === 1): сдвиг вправо на половину гекса
  const isOddRow = r % 2 === 1;
  
  if (isOddRow) {
    // Нечётный ряд (сдвинут вправо)
    return [
      { q: q + 1, r: r },     // right
      { q: q - 1, r: r },     // left
      { q: q, r: r - 1 },     // top-left
      { q: q + 1, r: r - 1 }, // top-right
      { q: q, r: r + 1 },     // bottom-left
      { q: q + 1, r: r + 1 }, // bottom-right
    ];
  } else {
    // Чётный ряд (без сдвига)
    return [
      { q: q + 1, r: r },     // right
      { q: q - 1, r: r },     // left
      { q: q - 1, r: r - 1 }, // top-left
      { q: q, r: r - 1 },     // top-right
      { q: q - 1, r: r + 1 }, // bottom-left
      { q: q, r: r + 1 },     // bottom-right
    ];
  }
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
      const neighbors = getNeighbors(current.q, current.r);
      for (const n of neighbors) {
        const nKey = `${n.q},${n.r}`;
        
        if (n.q >= 0 && n.q < width && n.r >= 0 && n.r < height && !obstacles.has(nKey)) {
          queue.push({ q: n.q, r: n.r, distance: current.distance + 1 });
        }
      }
    }
  }
  
  return range;
};

export type { DamagePopup, AttackAnimation, MeleeShakeUnit };
