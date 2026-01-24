import { useState, useEffect, useMemo } from 'react';
import { useGameStore, BattleUnit } from '@/store/gameStore';
import { HexGrid, generateObstacles, getMovementRange } from './HexGrid';
import { cn } from '@/lib/utils';
import { ArrowLeft, SkipForward } from 'lucide-react';

const GRID_WIDTH = 12;
const GRID_HEIGHT = 12;

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
    endTurn,
  } = useGameStore();

  const [obstacles] = useState(() => generateObstacles(GRID_WIDTH, GRID_HEIGHT, 12));
  
  const allUnits = useMemo(() => [...playerUnits, ...enemyUnits], [playerUnits, enemyUnits]);
  const currentUnit = turnOrder[currentUnitIndex];
  
  const movementRange = useMemo(() => {
    if (selectedUnit && !selectedUnit.hasMoved) {
      return getMovementRange(selectedUnit, allUnits, obstacles, GRID_WIDTH, GRID_HEIGHT);
    }
    return new Set<string>();
  }, [selectedUnit, allUnits, obstacles]);

  // Auto-select current unit at start of turn
  useEffect(() => {
    if (currentUnit && currentUnit.owner === 'player') {
      setSelectedUnit(currentUnit);
    }
  }, [currentUnit, setSelectedUnit]);

  // Simple AI for enemy turns
  useEffect(() => {
    if (currentUnit && currentUnit.owner === 'enemy' && !currentUnit.hasMoved) {
      const timer = setTimeout(() => {
        // Simple AI: move towards nearest player unit
        const range = getMovementRange(currentUnit, allUnits, obstacles, GRID_WIDTH, GRID_HEIGHT);
        if (range.size > 0) {
          const rangeArray = Array.from(range);
          const randomPos = rangeArray[Math.floor(Math.random() * rangeArray.length)];
          const [q, r] = randomPos.split(',').map(Number);
          moveUnit(currentUnit, { q, r });
        }
        
        setTimeout(() => {
          endTurn();
        }, 500);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentUnit, allUnits, obstacles, moveUnit, endTurn]);

  const handleHexClick = (q: number, r: number) => {
    if (!currentUnit || currentUnit.owner !== 'player') return;

    const key = `${q},${r}`;
    
    // Check if clicking on a unit
    const clickedUnit = allUnits.find(u => u.position?.q === q && u.position?.r === r);
    
    if (clickedUnit && clickedUnit.owner === 'player') {
      setSelectedUnit(clickedUnit);
      return;
    }

    // Check if moving to a valid hex
    if (selectedUnit && !selectedUnit.hasMoved && movementRange.has(key)) {
      moveUnit(selectedUnit, { q, r });
    }
  };

  const handleEndTurn = () => {
    endTurn();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPhase('menu')}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-display font-bold text-primary">Арена Битвы</h1>
              <p className="text-xs text-muted-foreground">
                Раунд {Math.floor(currentUnitIndex / turnOrder.length) + 1}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Current turn indicator */}
            {currentUnit && (
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg',
                currentUnit.owner === 'player' 
                  ? 'bg-health/20 text-health' 
                  : 'bg-destructive/20 text-destructive'
              )}>
                <span className="text-xl">{currentUnit.avatar}</span>
                <span className="font-display text-sm">{currentUnit.name}</span>
              </div>
            )}

            {currentUnit?.owner === 'player' && (
              <button
                onClick={handleEndTurn}
                className="fantasy-button flex items-center gap-2 py-2 px-4 text-sm"
              >
                <SkipForward className="w-4 h-4" />
                Завершить ход
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Battle area */}
      <div className="flex-1 flex">
        {/* Player units sidebar */}
        <div className="w-44 bg-secondary/20 border-r border-border p-3 overflow-y-auto">
          <h3 className="font-display text-sm text-health mb-2">Ваши герои</h3>
          <div className="space-y-2">
            {playerUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                isActive={currentUnit?.id === unit.id}
                isSelected={selectedUnit?.id === unit.id}
                onClick={() => currentUnit?.owner === 'player' && setSelectedUnit(unit)}
              />
            ))}
          </div>
        </div>

        {/* Hex grid */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <HexGrid
            width={GRID_WIDTH}
            height={GRID_HEIGHT}
            obstacles={obstacles}
            units={allUnits}
            selectedUnit={selectedUnit}
            onHexClick={handleHexClick}
            movementRange={movementRange}
          />
        </div>

        {/* Enemy units sidebar */}
        <div className="w-44 bg-secondary/20 border-l border-border p-3 overflow-y-auto">
          <h3 className="font-display text-sm text-destructive mb-2">Враги</h3>
          <div className="space-y-2">
            {enemyUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                isActive={currentUnit?.id === unit.id}
                isSelected={false}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Turn order bar */}
      <div className="bg-card border-t border-border p-3">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs text-muted-foreground mb-2">Порядок хода</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {turnOrder.map((unit, index) => (
              <div
                key={`${unit.id}-${index}`}
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all',
                  index === currentUnitIndex && 'ring-2 ring-primary scale-110',
                  unit.owner === 'player' 
                    ? 'bg-health/10 border-health/50' 
                    : 'bg-destructive/10 border-destructive/50',
                  index < currentUnitIndex && 'opacity-50'
                )}
              >
                <span className="text-lg">{unit.avatar}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface UnitCardProps {
  unit: BattleUnit;
  isActive: boolean;
  isSelected: boolean;
  onClick?: () => void;
}

const UnitCard = ({ unit, isActive, isSelected, onClick }: UnitCardProps) => (
  <div
    onClick={onClick}
    className={cn(
      'bg-card rounded-lg p-2 border-2 transition-all',
      onClick && 'cursor-pointer hover:border-primary/50',
      isActive && 'border-primary animate-pulse',
      isSelected && !isActive && 'border-primary/70',
      !isActive && !isSelected && 'border-border'
    )}
  >
    <div className="flex items-center gap-2 mb-1">
      <span className="text-lg">{unit.avatar}</span>
      <span className="text-xs font-display truncate">{unit.name}</span>
    </div>
    
    {/* Health bar */}
    <div className="stat-bar mb-1">
      <div
        className="stat-bar-health h-full transition-all"
        style={{ width: `${(unit.currentHealth / unit.maxHealth) * 100}%` }}
      />
    </div>
    <div className="flex justify-between text-[10px] text-muted-foreground">
      <span>❤️ {unit.currentHealth}/{unit.maxHealth}</span>
      <span>⚡ {unit.currentEnergy}/{unit.maxEnergy}</span>
    </div>
  </div>
);
