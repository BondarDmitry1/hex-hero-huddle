import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGameStore, BattleUnit, hexDistance } from '@/store/gameStore';
import { HexGrid, generateObstacles, getMovementRange } from './HexGrid';
import { SkillPanel } from './SkillPanel';
import { cn } from '@/lib/utils';
import { ArrowLeft, SkipForward } from 'lucide-react';

const GRID_SIZE = 12;

export const BattleArena = () => {
  const {
    setPhase,
    playerUnits,
    enemyUnits,
    turnOrder,
    currentUnitIndex,
    selectedUnit,
    setSelectedUnit,
    moveUnit,
    attackUnit,
    endTurn,
    battleLog,
    hoveredUnit,
    setHoveredUnit,
  } = useGameStore();

  const [obstacles] = useState(() => generateObstacles(GRID_SIZE, GRID_SIZE, 10));
  
  const allUnits = useMemo(() => [...playerUnits, ...enemyUnits], [playerUnits, enemyUnits]);
  const currentUnit = turnOrder[currentUnitIndex];
  const alivePlayerUnits = playerUnits.filter(u => !u.isDead);
  const aliveEnemyUnits = enemyUnits.filter(u => !u.isDead);
  
  // Check win/lose conditions
  const gameOver = alivePlayerUnits.length === 0 || aliveEnemyUnits.length === 0;
  const playerWon = aliveEnemyUnits.length === 0;
  
  const movementRange = useMemo(() => {
    if (selectedUnit && !selectedUnit.hasMoved && currentUnit?.id === selectedUnit.id) {
      return getMovementRange(selectedUnit, allUnits, obstacles, GRID_SIZE, GRID_SIZE);
    }
    return new Set<string>();
  }, [selectedUnit, allUnits, obstacles, currentUnit]);

  // Auto-select current unit at start of turn
  useEffect(() => {
    if (currentUnit && currentUnit.owner === 'player' && !currentUnit.isDead) {
      setSelectedUnit(currentUnit);
    }
  }, [currentUnit, setSelectedUnit]);

  // Simple AI for enemy turns
  useEffect(() => {
    if (currentUnit && currentUnit.owner === 'enemy' && !currentUnit.isDead && !gameOver) {
      const timer = setTimeout(() => {
        // Try to attack first
        if (!currentUnit.hasActed && currentUnit.position) {
          const targets = alivePlayerUnits.filter(u => {
            if (!u.position || !currentUnit.position) return false;
            const distance = hexDistance(currentUnit.position, u.position);
            if (currentUnit.attackRange === 'melee') {
              return distance <= currentUnit.range;
            }
            return true;
          });
          
          if (targets.length > 0) {
            // Attack lowest health target
            const target = targets.sort((a, b) => a.currentHealth - b.currentHealth)[0];
            attackUnit(currentUnit, target);
          }
        }
        
        // Then move if haven't attacked
        if (!currentUnit.hasMoved) {
          const range = getMovementRange(currentUnit, allUnits, obstacles, GRID_SIZE, GRID_SIZE);
          if (range.size > 0) {
            // Move towards nearest player unit
            const rangeArray = Array.from(range);
            let bestPos = rangeArray[0];
            let bestDist = Infinity;
            
            for (const pos of rangeArray) {
              const [q, r] = pos.split(',').map(Number);
              for (const target of alivePlayerUnits) {
                if (target.position) {
                  const dist = hexDistance({ q, r }, target.position);
                  if (dist < bestDist) {
                    bestDist = dist;
                    bestPos = pos;
                  }
                }
              }
            }
            
            const [q, r] = bestPos.split(',').map(Number);
            moveUnit(currentUnit, { q, r });
          }
        }
        
        setTimeout(() => {
          endTurn();
        }, 500);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [currentUnit, allUnits, obstacles, moveUnit, endTurn, attackUnit, alivePlayerUnits, gameOver]);

  const handleHexClick = useCallback((q: number, r: number) => {
    if (!currentUnit || currentUnit.owner !== 'player' || gameOver) return;

    const key = `${q},${r}`;
    
    // Check if clicking on a unit
    const clickedUnit = allUnits.find(u => u.position?.q === q && u.position?.r === r && !u.isDead);
    
    // Attack enemy
    if (clickedUnit && clickedUnit.owner === 'enemy' && !currentUnit.hasActed && currentUnit.position) {
      const distance = hexDistance(currentUnit.position, { q, r });
      const canAttack = currentUnit.attackRange === 'melee' 
        ? distance <= currentUnit.range 
        : true;
      
      if (canAttack) {
        attackUnit(currentUnit, clickedUnit);
        return;
      }
    }
    
    // Select own unit
    if (clickedUnit && clickedUnit.owner === 'player' && clickedUnit.id === currentUnit.id) {
      setSelectedUnit(clickedUnit);
      return;
    }

    // Move to valid hex
    if (selectedUnit && !selectedUnit.hasMoved && movementRange.has(key) && currentUnit.id === selectedUnit.id) {
      moveUnit(selectedUnit, { q, r });
    }
  }, [currentUnit, allUnits, selectedUnit, movementRange, moveUnit, attackUnit, setSelectedUnit, gameOver]);

  const handleHexHover = useCallback((q: number, r: number, unit: BattleUnit | null) => {
    if (unit && unit.owner === 'enemy' && currentUnit && currentUnit.owner === 'player' && !currentUnit.hasActed) {
      setHoveredUnit(unit);
    } else {
      setHoveredUnit(null);
    }
  }, [currentUnit, setHoveredUnit]);

  const handleEndTurn = () => {
    endTurn();
  };

  const handleUseSkill = (skillType: 'active' | 'ultimate') => {
    // TODO: Implement skill usage
    console.log('Use skill:', skillType);
  };

  if (gameOver) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h1 className={cn(
            "text-5xl font-display font-bold mb-4",
            playerWon ? "text-health" : "text-destructive"
          )}>
            {playerWon ? '🏆 Победа!' : '💀 Поражение'}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {playerWon ? 'Вы одержали славную победу!' : 'Ваша армия повержена...'}
          </p>
          <button
            onClick={() => setPhase('menu')}
            className="fantasy-button"
          >
            В главное меню
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPhase('menu')}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-display font-bold text-primary">Арена Битвы</h1>
              <p className="text-xs text-muted-foreground">
                Раунд {Math.floor(currentUnitIndex / turnOrder.length) + 1}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUnit && (
              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
                currentUnit.owner === 'player' 
                  ? 'bg-health/20 text-health' 
                  : 'bg-destructive/20 text-destructive'
              )}>
                <span className="text-lg">{currentUnit.avatar}</span>
                <span className="font-display">{currentUnit.name}</span>
              </div>
            )}

            {currentUnit?.owner === 'player' && (
              <button
                onClick={handleEndTurn}
                className="fantasy-button flex items-center gap-2 py-1.5 px-3 text-sm"
              >
                <SkipForward className="w-4 h-4" />
                Завершить
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Battle area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Player units */}
        <div className="w-36 bg-secondary/20 border-r border-border p-2 overflow-y-auto">
          <h3 className="font-display text-xs text-health mb-2">Ваши герои</h3>
          <div className="space-y-1">
            {playerUnits.map((unit) => (
              <UnitMiniCard
                key={unit.id}
                unit={unit}
                isActive={currentUnit?.id === unit.id}
              />
            ))}
          </div>
        </div>

        {/* Center - Hex grid (square) */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center p-2 overflow-auto">
            <div className="aspect-square max-w-full max-h-full flex items-center justify-center">
              <HexGrid
                width={GRID_SIZE}
                height={GRID_SIZE}
                obstacles={obstacles}
                units={allUnits}
                selectedUnit={selectedUnit}
                currentUnit={currentUnit}
                onHexClick={handleHexClick}
                onHexHover={handleHexHover}
                movementRange={movementRange}
                hoveredEnemy={hoveredUnit}
              />
            </div>
          </div>
          
          {/* Battle log */}
          <div className="h-20 bg-card/50 border-t border-border p-2 overflow-y-auto">
            <div className="space-y-0.5">
              {battleLog.slice(-5).map((log, i) => (
                <p key={i} className="text-xs text-muted-foreground">{log}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar - Skills & Enemy units */}
        <div className="w-64 bg-secondary/20 border-l border-border p-2 overflow-y-auto flex flex-col gap-4">
          {/* Skill panel for current player unit */}
          {currentUnit && currentUnit.owner === 'player' && (
            <SkillPanel unit={currentUnit} onUseSkill={handleUseSkill} />
          )}
          
          {/* Enemy units */}
          <div>
            <h3 className="font-display text-xs text-destructive mb-2">Враги</h3>
            <div className="space-y-1">
              {enemyUnits.map((unit) => (
                <UnitMiniCard
                  key={unit.id}
                  unit={unit}
                  isActive={currentUnit?.id === unit.id}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Turn order bar */}
      <div className="bg-card border-t border-border p-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {turnOrder.filter(u => !u.isDead).map((unit, index) => (
              <div
                key={`${unit.id}-${index}`}
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded flex items-center justify-center border-2 transition-all',
                  turnOrder.indexOf(unit) === currentUnitIndex && 'ring-2 ring-primary scale-110',
                  unit.owner === 'player' 
                    ? 'bg-health/10 border-health/50' 
                    : 'bg-destructive/10 border-destructive/50'
                )}
              >
                <span className="text-sm">{unit.avatar}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface UnitMiniCardProps {
  unit: BattleUnit;
  isActive: boolean;
}

const UnitMiniCard = ({ unit, isActive }: UnitMiniCardProps) => (
  <div
    className={cn(
      'bg-card rounded p-1.5 border transition-all',
      isActive && 'border-primary',
      unit.isDead && 'opacity-40',
      !isActive && !unit.isDead && 'border-border'
    )}
  >
    <div className="flex items-center gap-1.5">
      <span className="text-base">{unit.avatar}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-display truncate">{unit.name}</p>
        <div className="stat-bar h-1.5">
          <div
            className={cn(
              "h-full transition-all rounded-full",
              unit.currentHealth / unit.maxHealth > 0.5 
                ? 'bg-health' 
                : unit.currentHealth / unit.maxHealth > 0.25 
                  ? 'bg-amber-500' 
                  : 'bg-destructive'
            )}
            style={{ width: `${(unit.currentHealth / unit.maxHealth) * 100}%` }}
          />
        </div>
      </div>
    </div>
  </div>
);
