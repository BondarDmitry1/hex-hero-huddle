import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useGameStore, BattleUnit, hexDistance } from '@/store/gameStore';
import { HexGrid, generateObstacles, getMovementRange, DamagePopup, AttackAnimation } from './HexGrid';
import { SkillPanel } from './SkillPanel';
import { cn } from '@/lib/utils';
import { ArrowLeft, SkipForward } from 'lucide-react';

// Grid dimensions optimized for visual square (accounting for hex offset)
const GRID_WIDTH = 10;
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
    attackUnit,
    useSkill,
    endTurn,
    battleLog,
    hoveredUnit,
    setHoveredUnit,
    skillMode,
    setSkillMode,
    skillRange,
    setSkillRange,
  } = useGameStore();

  const [obstacles] = useState(() => generateObstacles(GRID_WIDTH, GRID_HEIGHT, 8));
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [attackAnimations, setAttackAnimations] = useState<AttackAnimation[]>([]);
  const popupIdRef = useRef(0);
  
  const allUnits = useMemo(() => [...playerUnits, ...enemyUnits], [playerUnits, enemyUnits]);
  const currentUnit = turnOrder[currentUnitIndex];
  const alivePlayerUnits = playerUnits.filter(u => !u.isDead);
  const aliveEnemyUnits = enemyUnits.filter(u => !u.isDead);
  
  const gameOver = alivePlayerUnits.length === 0 || aliveEnemyUnits.length === 0;
  const playerWon = aliveEnemyUnits.length === 0;
  
  const movementRange = useMemo(() => {
    if (selectedUnit && !selectedUnit.hasMoved && currentUnit?.id === selectedUnit.id) {
      return getMovementRange(selectedUnit, allUnits, obstacles, GRID_WIDTH, GRID_HEIGHT);
    }
    return new Set<string>();
  }, [selectedUnit, allUnits, obstacles, currentUnit]);

  // Helper to convert hex to pixel for animations (must match HexGrid)
  const hexToPixel = useCallback((q: number, r: number) => {
    const HEX_SIZE = 36;
    const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
    const HEX_HEIGHT = 2 * HEX_SIZE;
    // Match HexGrid: offset rows for staggered alignment
    const offset = r % 2 === 0 ? 0 : HEX_WIDTH / 2;
    const x = q * HEX_WIDTH + offset + HEX_WIDTH;
    const y = r * HEX_HEIGHT * 0.75 + HEX_HEIGHT;
    return { x, y };
  }, []);

  // Show damage popup
  const showDamagePopup = useCallback((targetPos: { q: number; r: number }, damage: number, isCrit: boolean) => {
    const { x, y } = hexToPixel(targetPos.q, targetPos.r);
    const id = `popup-${popupIdRef.current++}`;
    
    setDamagePopups(prev => [...prev, { id, x, y: y - 20, damage, isCrit }]);
    
    setTimeout(() => {
      setDamagePopups(prev => prev.filter(p => p.id !== id));
    }, 1000);
  }, [hexToPixel]);

  // Show attack animation
  const showAttackAnimation = useCallback((
    attacker: BattleUnit, 
    target: BattleUnit, 
    onComplete: () => void
  ) => {
    if (!attacker.position || !target.position) {
      onComplete();
      return;
    }

    const from = hexToPixel(attacker.position.q, attacker.position.r);
    const to = hexToPixel(target.position.q, target.position.r);
    const id = `attack-${popupIdRef.current++}`;
    
    // Choose emoji based on attack type
    let emoji = '💥';
    if (attacker.attackRange === 'ranged') {
      if (attacker.attackType === 'magical') {
        emoji = attacker.id.includes('fire') ? '🔥' : 
                attacker.id.includes('frost') ? '❄️' : 
                attacker.id.includes('necro') ? '💀' :
                attacker.id.includes('shaman') ? '⚡' : '✨';
      } else {
        emoji = '🏹';
      }
    }
    
    setAttackAnimations(prev => [...prev, {
      id,
      fromX: from.x,
      fromY: from.y,
      toX: to.x,
      toY: to.y,
      type: attacker.attackRange,
      emoji,
    }]);
    
    setTimeout(() => {
      setAttackAnimations(prev => prev.filter(a => a.id !== id));
      onComplete();
    }, 300);
  }, [hexToPixel]);

  // Auto-select current unit
  useEffect(() => {
    if (currentUnit && currentUnit.owner === 'player' && !currentUnit.isDead) {
      setSelectedUnit(currentUnit);
    }
  }, [currentUnit, setSelectedUnit]);

  // AI for enemy turns
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
            const target = targets.sort((a, b) => a.currentHealth - b.currentHealth)[0];
            
            showAttackAnimation(currentUnit, target, () => {
              const result = attackUnit(currentUnit, target);
              if (target.position) {
                showDamagePopup(target.position, result.damage, result.isCrit);
              }
            });
            
            setTimeout(() => {
              if (!currentUnit.hasMoved) {
                const range = getMovementRange(currentUnit, allUnits, obstacles, GRID_WIDTH, GRID_HEIGHT);
                if (range.size > 0) {
                  const rangeArray = Array.from(range);
                  let bestPos = rangeArray[0];
                  let bestDist = Infinity;
                  
                  for (const pos of rangeArray) {
                    const [q, r] = pos.split(',').map(Number);
                    for (const t of alivePlayerUnits) {
                      if (t.position) {
                        const dist = hexDistance({ q, r }, t.position);
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
              
              setTimeout(() => endTurn(), 400);
            }, 500);
            return;
          }
        }
        
        // Move towards player if can't attack
        if (!currentUnit.hasMoved) {
          const range = getMovementRange(currentUnit, allUnits, obstacles, GRID_WIDTH, GRID_HEIGHT);
          if (range.size > 0) {
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
        
        setTimeout(() => endTurn(), 500);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [currentUnit, allUnits, obstacles, moveUnit, endTurn, attackUnit, alivePlayerUnits, gameOver, showAttackAnimation, showDamagePopup]);

  const handleHexClick = useCallback((q: number, r: number) => {
    if (!currentUnit || currentUnit.owner !== 'player' || gameOver) return;

    const key = `${q},${r}`;
    const clickedUnit = allUnits.find(u => u.position?.q === q && u.position?.r === r && !u.isDead);
    
    // Handle skill targeting
    if (skillMode && skillRange.has(key)) {
      const targetPos = { q, r };
      
      // Show skill animation
      if (currentUnit.position) {
        const from = hexToPixel(currentUnit.position.q, currentUnit.position.r);
        const to = hexToPixel(q, r);
        const id = `skill-${popupIdRef.current++}`;
        
        // Choose skill emoji
        const skillEmoji = skillMode === 'ultimate' ? '💫' : 
          currentUnit.role === 'support' ? '✨' : 
          currentUnit.attackType === 'magical' ? '🔮' : '⚡';
        
        setAttackAnimations(prev => [...prev, {
          id,
          fromX: from.x,
          fromY: from.y,
          toX: to.x,
          toY: to.y,
          type: 'ranged',
          emoji: skillEmoji,
        }]);
        
        setTimeout(() => {
          setAttackAnimations(prev => prev.filter(a => a.id !== id));
          
          const result = useSkill(currentUnit, targetPos, skillMode);
          if (result) {
            // Show damage/heal popups for each target
            result.targets.forEach((t, index) => {
              setTimeout(() => {
                if (t.unit.position) {
                  showDamagePopup(t.unit.position, t.value, result.type === 'heal');
                }
              }, index * 100);
            });
          }
        }, 400);
      }
      return;
    }
    
    // Cancel skill mode on clicking elsewhere
    if (skillMode) {
      setSkillMode(null);
      setSkillRange(new Set());
      return;
    }
    
    // Attack enemy
    if (clickedUnit && clickedUnit.owner === 'enemy' && !currentUnit.hasActed && currentUnit.position) {
      const distance = hexDistance(currentUnit.position, { q, r });
      const canAttack = currentUnit.attackRange === 'melee' 
        ? distance <= currentUnit.range 
        : true;
      
      if (canAttack) {
        showAttackAnimation(currentUnit, clickedUnit, () => {
          const result = attackUnit(currentUnit, clickedUnit);
          showDamagePopup({ q, r }, result.damage, result.isCrit);
        });
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
  }, [currentUnit, allUnits, selectedUnit, movementRange, moveUnit, attackUnit, setSelectedUnit, gameOver, showAttackAnimation, showDamagePopup, skillMode, skillRange, setSkillMode, setSkillRange, useSkill, hexToPixel]);

  const handleHexHover = useCallback((q: number, r: number, unit: BattleUnit | null) => {
    if (unit && unit.owner === 'enemy' && currentUnit && currentUnit.owner === 'player' && !currentUnit.hasActed) {
      setHoveredUnit(unit);
    } else {
      setHoveredUnit(null);
    }
  }, [currentUnit, setHoveredUnit]);

  const handleEndTurn = () => endTurn();

  const handleUseSkill = useCallback((skillType: 'active' | 'ultimate') => {
    if (!currentUnit || currentUnit.hasActed) return;
    
    // Check energy for ultimate
    if (skillType === 'ultimate') {
      const energyCost = currentUnit.skills.ultimate.energyCost || 100;
      if (currentUnit.currentEnergy < energyCost) return;
    }
    
    // Toggle skill mode
    if (skillMode === skillType) {
      setSkillMode(null);
      setSkillRange(new Set());
      return;
    }
    
    setSkillMode(skillType);
    
    // Calculate skill range based on hero type
    const newRange = new Set<string>();
    if (currentUnit.position) {
      const isSupport = currentUnit.role === 'support';
      const isSelfBuff = ['ironclad', 'stone_giant', 'paladin', 'berserker'].includes(currentUnit.id);
      
      // Different range logic for different skills
      if (isSupport && skillType === 'active' && currentUnit.id === 'light_priestess') {
        // Healer can target allies
        playerUnits.filter(u => !u.isDead && u.position).forEach(u => {
          if (u.position) {
            const dist = hexDistance(currentUnit.position!, u.position);
            if (dist <= 3) {
              newRange.add(`${u.position.q},${u.position.r}`);
            }
          }
        });
      } else if (isSelfBuff && skillType === 'ultimate') {
        // Self-targeting
        newRange.add(`${currentUnit.position.q},${currentUnit.position.r}`);
      } else {
        // Default: target enemies
        const skillRange = skillType === 'ultimate' ? 6 : (currentUnit.attackRange === 'ranged' ? 5 : 2);
        enemyUnits.filter(u => !u.isDead && u.position).forEach(u => {
          if (u.position) {
            const dist = hexDistance(currentUnit.position!, u.position);
            if (dist <= skillRange) {
              newRange.add(`${u.position.q},${u.position.r}`);
            }
          }
        });
      }
    }
    
    setSkillRange(newRange);
  }, [currentUnit, skillMode, setSkillMode, setSkillRange, playerUnits, enemyUnits]);

  if (gameOver) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="text-8xl mb-6">{playerWon ? '🏆' : '💀'}</div>
          <h1 className={cn(
            "text-5xl font-display font-bold mb-4",
            playerWon ? "text-health" : "text-destructive"
          )}>
            {playerWon ? 'Победа!' : 'Поражение'}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {playerWon ? 'Вы одержали славную победу!' : 'Ваша армия повержена...'}
          </p>
          <button onClick={() => setPhase('menu')} className="fantasy-button">
            В главное меню
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-card border-b border-border px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPhase('menu')}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-display font-bold text-primary">Арена Битвы</h1>
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
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left sidebar */}
        <div className="w-32 flex-shrink-0 bg-secondary/20 border-r border-border p-2 overflow-y-auto">
          <h3 className="font-display text-xs text-health mb-2">Ваша команда</h3>
          <div className="space-y-1">
            {playerUnits.map((unit) => (
              <UnitMiniCard key={unit.id} unit={unit} isActive={currentUnit?.id === unit.id} />
            ))}
          </div>
        </div>

        {/* Center - Hex grid */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex items-center justify-center p-2 min-h-0">
            <HexGrid
              width={GRID_WIDTH}
              height={GRID_HEIGHT}
              obstacles={obstacles}
              units={allUnits}
              selectedUnit={selectedUnit}
              currentUnit={currentUnit}
              onHexClick={handleHexClick}
              onHexHover={handleHexHover}
              movementRange={movementRange}
              skillRange={skillRange}
              skillMode={skillMode}
              hoveredEnemy={hoveredUnit}
              damagePopups={damagePopups}
              attackAnimations={attackAnimations}
            />
          </div>
          
          {/* Battle log */}
          <div className="flex-shrink-0 h-16 bg-card/50 border-t border-border px-3 py-2 overflow-y-auto">
            <div className="space-y-0.5">
              {battleLog.slice(-3).map((log, i) => (
                <p key={i} className="text-xs text-muted-foreground">{log}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-56 flex-shrink-0 bg-secondary/20 border-l border-border p-2 overflow-y-auto flex flex-col gap-3">
          {currentUnit && currentUnit.owner === 'player' && (
            <SkillPanel unit={currentUnit} onUseSkill={handleUseSkill} skillMode={skillMode} />
          )}
          
          <div>
            <h3 className="font-display text-xs text-destructive mb-2">Враги</h3>
            <div className="space-y-1">
              {enemyUnits.map((unit) => (
                <UnitMiniCard key={unit.id} unit={unit} isActive={currentUnit?.id === unit.id} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Turn order bar */}
      <div className="flex-shrink-0 bg-card border-t border-border px-4 py-2">
        <div className="flex gap-1 overflow-x-auto">
          {turnOrder.filter(u => !u.isDead).map((unit, index) => (
            <div
              key={`${unit.id}-${index}`}
              className={cn(
                'flex-shrink-0 w-9 h-9 rounded flex items-center justify-center border-2 transition-all',
                turnOrder.indexOf(unit) === currentUnitIndex && 'ring-2 ring-primary scale-110',
                unit.owner === 'player' 
                  ? 'bg-health/10 border-health/50' 
                  : 'bg-destructive/10 border-destructive/50'
              )}
            >
              <span className="text-base">{unit.avatar}</span>
            </div>
          ))}
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
      isActive && 'border-primary ring-1 ring-primary',
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
