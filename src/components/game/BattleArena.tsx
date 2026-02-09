import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useGameStore, BattleUnit, hexDistance } from '@/store/gameStore';
import { HexGrid, generateObstacles, getMovementRange, DamagePopup, AttackAnimation, MeleeShakeUnit, ReactionPopup } from './HexGrid';
import { SkillPanel } from './SkillPanel';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

// Grid dimensions - 12 horizontal x 11 vertical
const GRID_WIDTH = 12;
const GRID_HEIGHT = 11;

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
    waitAction,
    defendAction,
    battleLog,
    hoveredUnit,
    setHoveredUnit,
    skillMode,
    setSkillMode,
    skillRange,
    setSkillRange,
    markUnitActed,
  } = useGameStore();

  const [obstacles, setObstacles] = useState(() => generateObstacles(GRID_WIDTH, GRID_HEIGHT));
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [attackAnimations, setAttackAnimations] = useState<AttackAnimation[]>([]);
  const [meleeShakeUnits, setMeleeShakeUnits] = useState<MeleeShakeUnit[]>([]);
  const [reactionPopups, setReactionPopups] = useState<ReactionPopup[]>([]);
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

  // Check if ranged unit is blocked (started turn adjacent to enemy - debuff)
  const isRangedBlocked = useMemo(() => {
    if (!currentUnit || currentUnit.attackRange !== 'ranged') return false;
    return currentUnit.rangedBlocked;
  }, [currentUnit]);

  // Helper to convert hex to pixel for animations (must match HexGrid)
  const hexToPixel = useCallback((q: number, r: number) => {
    const HEX_SIZE = 36;
    const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
    const HEX_HEIGHT = 2 * HEX_SIZE;
    const offset = r % 2 === 0 ? 0 : HEX_WIDTH / 2;
    const x = q * HEX_WIDTH + offset + HEX_WIDTH;
    const y = r * HEX_HEIGHT * 0.75 + HEX_HEIGHT;
    return { x, y };
  }, []);

  // Show damage popup (supports healing)
  const showDamagePopup = useCallback((targetPos: { q: number; r: number }, damage: number, isCrit: boolean, isHealing: boolean = false) => {
    const { x, y } = hexToPixel(targetPos.q, targetPos.r);
    const id = `popup-${popupIdRef.current++}`;
    
    setDamagePopups(prev => [...prev, { id, x, y, damage, isCrit, isHealing }]);
    
    setTimeout(() => {
      setDamagePopups(prev => prev.filter(p => p.id !== id));
    }, 1400);
  }, [hexToPixel]);

  // Show melee shake effect on attacker
  const showMeleeShake = useCallback((unitId: string) => {
    const id = `shake-${popupIdRef.current++}`;
    setMeleeShakeUnits(prev => [...prev, { id, unitId }]);
    setTimeout(() => {
      setMeleeShakeUnits(prev => prev.filter(s => s.id !== id));
    }, 600);
  }, []);

  // Skill emoji mapping
  const getSkillEmoji = useCallback((skillId: string): string => {
    const map: Record<string, string> = {
      shield_wall: '🛡️', fortress: '🏰', earthquake: '🌍', mountain_form: '⛰️',
      holy_strike: '⚜️', divine_judgement: '⚡', shadow_step: '🗡️', dance_of_blades: '⚔️',
      fireball: '🔥', meteor_storm: '☄️', piercing_shot: '🏹', arrow_rain: '🌧️',
      whirlwind: '🌪️', rampage: '🪓', ice_lance: '❄️', blizzard: '🌨️',
      healing_light: '✨', divine_intervention: '👼', war_cry: '📯', drums_of_war: '🥁',
      dark_pact: '💀', army_of_dead: '☠️', totem_of_protection: '🌩️', storm_call: '⚡',
    };
    return map[skillId] || '✨';
  }, []);

  // Show attack animation - projectile flies from attacker center to target center
  const showAttackAnimation = useCallback((
    attacker: BattleUnit, 
    target: BattleUnit, 
    onComplete: () => void,
    isForcedMelee: boolean = false,
    customEmoji?: string
  ) => {
    if (!attacker.position || !target.position) {
      onComplete();
      return;
    }

    const from = hexToPixel(attacker.position.q, attacker.position.r);
    const to = hexToPixel(target.position.q, target.position.r);
    const id = `attack-${popupIdRef.current++}`;
    
    const isMeleeAttack = attacker.attackRange === 'melee' || isForcedMelee;
    const projectileAvatar = customEmoji || attacker.avatar;
    
    if (isMeleeAttack) {
      showMeleeShake(attacker.id);
    }
    
    setAttackAnimations(prev => [...prev, {
      id,
      fromX: from.x, fromY: from.y, toX: to.x, toY: to.y,
      type: isMeleeAttack ? 'melee' : 'ranged',
      emoji: projectileAvatar,
      attackerAvatar: projectileAvatar,
    }]);
    
    // Ranged: 600ms flight, Melee: 400ms impact
    const duration = isMeleeAttack ? 400 : 600;
    setTimeout(() => {
      setAttackAnimations(prev => prev.filter(a => a.id !== id));
      onComplete();
    }, duration);
  }, [hexToPixel, showMeleeShake]);

  // Show reaction popup (universal icon floating up from hero center)
  const showReactionPopup = useCallback((pos: { q: number; r: number }) => {
    const { x, y } = hexToPixel(pos.q, pos.r);
    const id = `reaction-${popupIdRef.current++}`;
    setReactionPopups(prev => [...prev, { id, x, y, emoji: '🔄' }]);
    setTimeout(() => {
      setReactionPopups(prev => prev.filter(p => p.id !== id));
    }, 1200);
  }, [hexToPixel]);

  // Helper for reaction attack animation (counterattack, return shot, provoked attack)
  const showReactionAttackAnimation = useCallback((
    fromPos: { q: number; r: number },
    toPos: { q: number; r: number },
    isMelee: boolean,
    attackerId: string,
    damage: number,
    attackerAvatar?: string
  ) => {
    const from = hexToPixel(fromPos.q, fromPos.r);
    const to = hexToPixel(toPos.q, toPos.r);
    const id = `reaction-atk-${popupIdRef.current++}`;
    const emoji = attackerAvatar || (isMelee ? '⚔️' : '🏹');
    
    if (isMelee) showMeleeShake(attackerId);
    
    setAttackAnimations(prev => [...prev, {
      id, fromX: from.x, fromY: from.y, toX: to.x, toY: to.y,
      type: isMelee ? 'melee' : 'ranged', emoji,
      attackerAvatar: emoji,
    }]);
    
    const duration = isMelee ? 400 : 600;
    setTimeout(() => {
      setAttackAnimations(prev => prev.filter(a => a.id !== id));
      showDamagePopup(toPos, damage, false, false);
    }, duration);
  }, [hexToPixel, showMeleeShake, showDamagePopup]);

  // Handle full attack result with proper sequencing:
  // 1. Damage number immediately (projectile just arrived)
  // 2. After damage floats up (~1200ms), show reaction icon
  // 3. After reaction icon (~1000ms), trigger reaction effect
  const handleAttackResult = useCallback((
    result: { damage: number; isCrit: boolean; parryTriggered?: boolean; reaction?: { type: string; reactorId: string; damage?: number; isMelee?: boolean; reactorPos?: { q: number; r: number }; targetPos?: { q: number; r: number } } },
    targetPos: { q: number; r: number },
    allUnitsRef: BattleUnit[]
  ) => {
    if (result.parryTriggered) {
      // Parry: show 🔄 first, then reduced damage
      showReactionPopup(targetPos);
      setTimeout(() => {
        showDamagePopup(targetPos, result.damage, result.isCrit, false);
      }, 800);
    } else {
      // Normal: damage immediately from target center upward
      showDamagePopup(targetPos, result.damage, result.isCrit, false);
      
      // Then reaction after damage finishes floating
      if (result.reaction && result.reaction.reactorPos) {
        setTimeout(() => {
          showReactionPopup(result.reaction!.reactorPos!);
          
          // Then reaction attack after icon floats
          if (result.reaction!.damage && result.reaction!.reactorPos && result.reaction!.targetPos) {
            const reactor = allUnitsRef.find(u => u.id === result.reaction!.reactorId);
            setTimeout(() => {
              showReactionAttackAnimation(
                result.reaction!.reactorPos!, result.reaction!.targetPos!,
                !!result.reaction!.isMelee, result.reaction!.reactorId, result.reaction!.damage!,
                reactor?.avatar
              );
            }, 800);
          }
        }, 1200);
      }
    }
  }, [showReactionPopup, showDamagePopup, showReactionAttackAnimation]);

  // Handle provoked attack animation from move result  
  const handleProvokedAnimation = useCallback((provokedAttack: { attackerId: string; damage: number; attackerPos: { q: number; r: number }; targetPos: { q: number; r: number } }) => {
    const allUnitsNow = [...useGameStore.getState().playerUnits, ...useGameStore.getState().enemyUnits];
    const provoker = allUnitsNow.find(u => u.id === provokedAttack.attackerId);
    showReactionPopup(provokedAttack.attackerPos);
    setTimeout(() => {
      showReactionAttackAnimation(
        provokedAttack.attackerPos, provokedAttack.targetPos,
        true, provokedAttack.attackerId, provokedAttack.damage,
        provoker?.avatar
      );
    }, 800);
  }, [showReactionPopup, showReactionAttackAnimation]);

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
        // Check if enemy ranged unit is blocked by debuff
        const enemyIsBlocked = currentUnit.rangedBlocked;
        
        // Try to attack first
        if (!currentUnit.hasActed && currentUnit.position) {
          const targets = alivePlayerUnits.filter(u => {
            if (!u.position || !currentUnit.position) return false;
            const distance = hexDistance(currentUnit.position, u.position);
            if (currentUnit.attackRange === 'melee') {
              return distance <= currentUnit.range;
            }
            // Ranged - if blocked by debuff, only adjacent
            if (enemyIsBlocked) {
              return distance === 1;
            }
            return true;
          });
          
          if (targets.length > 0) {
            const target = targets.sort((a, b) => a.currentHealth - b.currentHealth)[0];
            const isForcedMelee = (enemyIsBlocked || currentUnit.hasMoved) && target.position && 
              hexDistance(currentUnit.position!, target.position) === 1;
            
            showAttackAnimation(currentUnit, target, () => {
              const result = attackUnit(currentUnit, target);
              if (target.position) {
                const freshAll = [...useGameStore.getState().playerUnits, ...useGameStore.getState().enemyUnits];
                handleAttackResult(result, target.position, freshAll);
              }
            }, !!isForcedMelee);
            
            setTimeout(() => {
              // Use fresh state to check if can still move (ranged attack consumes movement)
              const freshState = useGameStore.getState();
              const freshUnit = freshState.turnOrder[freshState.currentUnitIndex];
              if (freshUnit && !freshUnit.hasMoved) {
                const freshAllUnits = [...freshState.playerUnits, ...freshState.enemyUnits];
                const range = getMovementRange(freshUnit, freshAllUnits, obstacles, GRID_WIDTH, GRID_HEIGHT);
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
                  const moveResult = moveUnit(freshUnit, { q, r });
                  if (moveResult?.provokedAttack) {
                    handleProvokedAnimation(moveResult.provokedAttack);
                  }
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
            const moveResult = moveUnit(currentUnit, { q, r });
            if (moveResult?.provokedAttack) {
              handleProvokedAnimation(moveResult.provokedAttack);
            }
          }
        }
        
        setTimeout(() => endTurn(), 500);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [currentUnit, allUnits, obstacles, moveUnit, endTurn, attackUnit, alivePlayerUnits, gameOver, showAttackAnimation, showDamagePopup, handleAttackResult, handleProvokedAnimation]);

  const handleHexClick = useCallback((q: number, r: number) => {
    if (!currentUnit || currentUnit.owner !== 'player' || gameOver) return;

    const key = `${q},${r}`;
    const clickedUnit = allUnits.find(u => u.position?.q === q && u.position?.r === r && !u.isDead);
    
    // Handle skill targeting
    if (skillMode && skillRange.has(key)) {
      const targetPos = { q, r };
      
      if (currentUnit.position) {
        const skill = skillMode === 'active' ? currentUnit.skills.active : currentUnit.skills.ultimate;
        const skillEmoji = getSkillEmoji(skill.id);
        const from = hexToPixel(currentUnit.position.q, currentUnit.position.r);
        const to = hexToPixel(q, r);
        const id = `skill-${popupIdRef.current++}`;
        
        setAttackAnimations(prev => [...prev, {
          id,
          fromX: from.x, fromY: from.y, toX: to.x, toY: to.y,
          type: 'ranged',
          emoji: skillEmoji,
          attackerAvatar: skillEmoji,
        }]);
        
        setTimeout(() => {
          setAttackAnimations(prev => prev.filter(a => a.id !== id));
          
          const result = useSkill(currentUnit, targetPos, skillMode);
          if (result) {
            result.targets.forEach((t, index) => {
              setTimeout(() => {
                if (t.unit.position) {
                  const isHeal = result.type === 'heal';
                  showDamagePopup(t.unit.position, t.value, false, isHeal);
                }
              }, index * 150);
            });
          }
        }, 600);
      }
      return;
    }
    
    // Cancel skill mode on clicking elsewhere
    if (skillMode) {
      setSkillMode(null);
      setSkillRange(new Set());
      return;
    }
    
    // Siege attack on obstacle
    if (obstacles.has(key) && currentUnit.trait === 'siege' && !currentUnit.hasActed && currentUnit.position) {
      const distance = hexDistance(currentUnit.position, { q, r });
      let canAttackObstacle = false;
      let needsMovementPoint = false;
      
      if (currentUnit.attackRange === 'melee') {
        canAttackObstacle = distance <= currentUnit.range;
      } else {
        if (distance === 1) {
          canAttackObstacle = true;
        } else if (!currentUnit.hasMoved) {
          canAttackObstacle = true;
          needsMovementPoint = true;
        }
      }
      
      if (canAttackObstacle) {
        const isMelee = currentUnit.attackRange === 'melee' || distance === 1;
        const from = hexToPixel(currentUnit.position.q, currentUnit.position.r);
        const to = hexToPixel(q, r);
        const animId = `siege-${popupIdRef.current++}`;
        
        if (isMelee) showMeleeShake(currentUnit.id);
        
        setAttackAnimations(prev => [...prev, {
          id: animId, fromX: from.x, fromY: from.y, toX: to.x, toY: to.y,
          type: isMelee ? 'melee' : 'ranged', emoji: isMelee ? '💥' : '🏹',
        }]);
        
        setTimeout(() => {
          setAttackAnimations(prev => prev.filter(a => a.id !== animId));
          setObstacles(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
          markUnitActed(currentUnit.id, needsMovementPoint);
        }, 700);
        return;
      }
    }
    
    // Attack enemy
    if (clickedUnit && clickedUnit.owner === 'enemy' && !currentUnit.hasActed && currentUnit.position) {
      const distance = hexDistance(currentUnit.position, { q, r });
      
      let canAttack = false;
      let isForcedMelee = false;
      
      if (currentUnit.attackRange === 'melee') {
        canAttack = distance <= currentUnit.range;
      } else {
        if (isRangedBlocked) {
          // Blocked by debuff - only melee
          canAttack = distance === 1;
          isForcedMelee = true;
        } else {
          // Free to shoot
          canAttack = true;
        }
      }
      
      if (canAttack) {
        showAttackAnimation(currentUnit, clickedUnit, () => {
          const result = attackUnit(currentUnit, clickedUnit);
          const freshAll = [...useGameStore.getState().playerUnits, ...useGameStore.getState().enemyUnits];
          handleAttackResult(result, { q, r }, freshAll);
        }, isForcedMelee);
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
      const moveResult = moveUnit(selectedUnit, { q, r });
      
      // Show provoked attack animation
      if (moveResult?.provokedAttack) {
        handleProvokedAnimation(moveResult.provokedAttack);
      }
    }
  }, [currentUnit, allUnits, selectedUnit, movementRange, moveUnit, attackUnit, setSelectedUnit, gameOver, showAttackAnimation, showDamagePopup, skillMode, skillRange, setSkillMode, setSkillRange, useSkill, hexToPixel, isRangedBlocked, obstacles, markUnitActed, handleAttackResult, handleProvokedAnimation, showMeleeShake, getSkillEmoji]);

  const handleHexHover = useCallback((q: number, r: number, unit: BattleUnit | null) => {
    // Set hovered unit for showing info panel on right
    if (unit && !unit.isDead) {
      setHoveredUnit(unit);
    } else if (!unit) {
      setHoveredUnit(null);
    }
  }, [setHoveredUnit]);

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
      
      if (isSupport && skillType === 'active' && currentUnit.id === 'light_priestess') {
        playerUnits.filter(u => !u.isDead && u.position).forEach(u => {
          if (u.position) {
            const dist = hexDistance(currentUnit.position!, u.position);
            if (dist <= 3) {
              newRange.add(`${u.position.q},${u.position.r}`);
            }
          }
        });
      } else if (isSelfBuff && skillType === 'ultimate') {
        newRange.add(`${currentUnit.position.q},${currentUnit.position.r}`);
      } else {
        const skillRangeVal = skillType === 'ultimate' ? 6 : (currentUnit.attackRange === 'ranged' ? 5 : 2);
        enemyUnits.filter(u => !u.isDead && u.position).forEach(u => {
          if (u.position) {
            const dist = hexDistance(currentUnit.position!, u.position);
            if (dist <= skillRangeVal) {
              newRange.add(`${u.position.q},${u.position.r}`);
            }
          }
        });
      }
    }
    
    setSkillRange(newRange);
  }, [currentUnit, skillMode, setSkillMode, setSkillRange, playerUnits, enemyUnits]);

  const handleWait = useCallback(() => {
    if (currentUnit && currentUnit.owner === 'player') {
      waitAction(currentUnit);
    }
  }, [currentUnit, waitAction]);

  const handleDefend = useCallback(() => {
    if (currentUnit && currentUnit.owner === 'player' && !currentUnit.hasActed && !currentUnit.hasMoved) {
      defendAction(currentUnit);
    }
  }, [currentUnit, defendAction]);

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
      {/* Header with turn order */}
      <div className="flex-shrink-0 bg-card border-b border-border px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPhase('menu')}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-lg font-display font-bold text-primary">Арена Битвы</h1>
          </div>

          {/* Turn order bar */}
          <div className="flex-1 flex justify-center mx-4">
            <div className="flex gap-1 overflow-hidden">
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
          </div>
        </div>
      </div>

      {/* Battle area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left sidebar - Battle log */}
        <div className="w-48 flex-shrink-0 bg-secondary/20 border-r border-border p-2 overflow-y-auto">
          <h3 className="font-display text-xs text-muted-foreground mb-2">📜 Журнал боя</h3>
          <div className="space-y-1">
            {battleLog.slice(-15).map((log, i) => (
              <p key={i} className="text-xs text-muted-foreground/80 border-b border-border/30 pb-1">{log}</p>
            ))}
            {battleLog.length === 0 && (
              <p className="text-xs text-muted-foreground/50 italic">Бой начинается...</p>
            )}
          </div>
        </div>

        {/* Center - Hex grid + skill panel */}
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
              meleeShakeUnits={meleeShakeUnits}
              isRangedBlocked={isRangedBlocked}
              reactionPopups={reactionPopups}
            />
          </div>
          
          {/* Bottom - Active hero skills */}
          <div className="flex-shrink-0 bg-card border-t border-border">
            {currentUnit ? (
              <SkillPanel 
                unit={currentUnit} 
                onUseSkill={currentUnit.owner === 'player' ? handleUseSkill : () => {}} 
                onWait={currentUnit.owner === 'player' ? handleWait : undefined}
                onDefend={currentUnit.owner === 'player' ? handleDefend : undefined}
                onEndTurn={currentUnit.owner === 'player' ? handleEndTurn : undefined}
                skillMode={skillMode} 
                isCompact 
                isViewOnly={currentUnit.owner !== 'player'}
              />
            ) : (
              <div className="text-muted-foreground text-sm py-4 text-center">Загрузка...</div>
            )}
          </div>
        </div>

        {/* Right sidebar - Hovered unit info */}
        <div className="w-60 flex-shrink-0 bg-secondary/20 border-l border-border p-2 overflow-y-auto">
          {hoveredUnit ? (
            <SkillPanel unit={hoveredUnit} onUseSkill={() => {}} skillMode={null} isViewOnly />
          ) : (
            <div className="text-center text-muted-foreground text-sm py-8">
              <p>Наведите на героя</p>
              <p className="text-xs mt-1">чтобы увидеть его характеристики</p>
            </div>
          )}
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
