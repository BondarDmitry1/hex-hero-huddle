import { create } from 'zustand';
import { Hero, heroes, calculateDamage, HeroTrait, HeroReaction, StatusEffect } from '@/data/heroes';

export type GamePhase = 'menu' | 'heroes' | 'draft' | 'placement' | 'battle';
export type Player = 'player' | 'enemy';
export type SkillMode = null | 'active' | 'ultimate';

export interface BattleUnit extends Hero {
  owner: Player;
  position: { q: number; r: number } | null;
  currentHealth: number;
  currentEnergy: number;
  hasMoved: boolean;
  hasActed: boolean;
  isDead: boolean;
  reactionAvailable: boolean;
  rangedBlocked: boolean;
  hasWaited?: boolean;
  buffs?: { type: string; duration: number; value?: number }[];
  statusEffects: StatusEffect[];
}

export interface SkillResult {
  type: 'damage' | 'heal' | 'buff' | 'area';
  targets: { unit: BattleUnit; value: number }[];
  message: string;
}

interface GameState {
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
  
  playerDraft: Hero[];
  enemyDraft: Hero[];
  availableHeroes: Hero[];
  currentDrafter: Player;
  addToDraft: (hero: Hero, player: Player) => void;
  resetDraft: () => void;
  
  playerUnits: BattleUnit[];
  enemyUnits: BattleUnit[];
  currentTurn: Player;
  turnOrder: BattleUnit[];
  currentUnitIndex: number;
  selectedUnit: BattleUnit | null;
  hoveredUnit: BattleUnit | null;
  
  // Skill mode
  skillMode: SkillMode;
  setSkillMode: (mode: SkillMode) => void;
  skillRange: Set<string>;
  setSkillRange: (range: Set<string>) => void;
  
  initializeBattle: () => void;
  setSelectedUnit: (unit: BattleUnit | null) => void;
  setHoveredUnit: (unit: BattleUnit | null) => void;
  moveUnit: (unit: BattleUnit, position: { q: number; r: number }) => { provokedAttack?: { attackerId: string; damage: number; attackerPos: { q: number; r: number }; targetPos: { q: number; r: number } } };
  attackUnit: (attacker: BattleUnit, target: BattleUnit) => { damage: number; isCrit: boolean; parryTriggered?: boolean; reaction?: { type: string; reactorId: string; damage?: number; isMelee?: boolean; reactorPos?: { q: number; r: number }; targetPos?: { q: number; r: number } } };
  markUnitActed: (unitId: string, alsoMoved?: boolean) => void;
  useSkill: (caster: BattleUnit, targetPos: { q: number; r: number }, skillType: 'active' | 'ultimate') => SkillResult | null;
  endTurn: () => void;
  
  // New actions
  waitAction: (unit: BattleUnit) => void;
  defendAction: (unit: BattleUnit) => void;
  
  battleLog: string[];
  addBattleLog: (message: string) => void;
  
  selectedHeroId: string | null;
  setSelectedHeroId: (id: string | null) => void;
}

// Convert offset coordinates to cube coordinates for accurate distance (odd-r layout)
const offsetToCube = (q: number, r: number) => {
  const x = q - Math.floor(r / 2);
  const z = r;
  const y = -x - z;
  return { x, y, z };
};

export const hexDistance = (a: { q: number; r: number }, b: { q: number; r: number }): number => {
  const cubeA = offsetToCube(a.q, a.r);
  const cubeB = offsetToCube(b.q, b.r);
  return Math.max(
    Math.abs(cubeA.x - cubeB.x),
    Math.abs(cubeA.y - cubeB.y),
    Math.abs(cubeA.z - cubeB.z)
  );
};

// Get hex neighbors (odd-r layout)
const getHexNeighbors = (q: number, r: number): { q: number; r: number }[] => {
  const isOddRow = r % 2 === 1;
  if (isOddRow) {
    return [
      { q: q + 1, r: r },
      { q: q, r: r - 1 },
      { q: q + 1, r: r - 1 },
      { q: q, r: r + 1 },
      { q: q + 1, r: r + 1 },
      { q: q - 1, r: r },
    ];
  }
  return [
    { q: q + 1, r: r },
    { q: q - 1, r: r - 1 },
    { q: q, r: r - 1 },
    { q: q - 1, r: r + 1 },
    { q: q, r: r + 1 },
    { q: q - 1, r: r },
  ];
};

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  setPhase: (phase) => set({ phase }),
  
  playerDraft: [],
  enemyDraft: [],
  availableHeroes: [...heroes],
  currentDrafter: 'player',
  
  addToDraft: (hero, player) => {
    const state = get();
    if (player === 'player' && state.playerDraft.length < 5) {
      set({
        playerDraft: [...state.playerDraft, hero],
        availableHeroes: state.availableHeroes.filter(h => h.id !== hero.id),
        currentDrafter: 'enemy',
      });
    } else if (player === 'enemy' && state.enemyDraft.length < 5) {
      set({
        enemyDraft: [...state.enemyDraft, hero],
        availableHeroes: state.availableHeroes.filter(h => h.id !== hero.id),
        currentDrafter: 'player',
      });
    }
    
    const newState = get();
    if (newState.currentDrafter === 'enemy' && newState.enemyDraft.length < 5 && newState.availableHeroes.length > 0) {
      setTimeout(() => {
        const available = get().availableHeroes;
        if (available.length > 0) {
          const randomHero = available[Math.floor(Math.random() * available.length)];
          get().addToDraft(randomHero, 'enemy');
        }
      }, 500);
    }
    
    const finalState = get();
    if (finalState.playerDraft.length === 5 && finalState.enemyDraft.length === 5) {
      setTimeout(() => {
        get().initializeBattle();
        set({ phase: 'placement' });
      }, 1000);
    }
  },
  
  resetDraft: () => set({
    playerDraft: [],
    enemyDraft: [],
    availableHeroes: [...heroes],
    currentDrafter: 'player',
    battleLog: [],
  }),
  
  playerUnits: [],
  enemyUnits: [],
  currentTurn: 'player',
  turnOrder: [],
  currentUnitIndex: 0,
  selectedUnit: null,
  hoveredUnit: null,
  battleLog: [],
  
  // Skill mode
  skillMode: null,
  setSkillMode: (mode) => set({ skillMode: mode }),
  skillRange: new Set<string>(),
  setSkillRange: (range) => set({ skillRange: range }),
  
  addBattleLog: (message) => {
    set(state => ({ battleLog: [...state.battleLog.slice(-19), message] }));
  },
  
  initializeBattle: () => {
    const state = get();
    
    const playerUnits: BattleUnit[] = state.playerDraft.map((hero, index) => ({
      ...hero,
      owner: 'player' as Player,
      position: { q: 0, r: 1 + index * 2 },
      currentHealth: hero.health,
      currentEnergy: 0,
      hasMoved: false,
      hasActed: false,
      isDead: false,
      reactionAvailable: hero.reaction !== 'none',
      rangedBlocked: false,
      statusEffects: [],
    }));
    
    const enemyUnits: BattleUnit[] = state.enemyDraft.map((hero, index) => ({
      ...hero,
      owner: 'enemy' as Player,
      position: { q: 11, r: 1 + index * 2 },
      currentHealth: hero.health,
      currentEnergy: 0,
      hasMoved: false,
      hasActed: false,
      isDead: false,
      reactionAvailable: hero.reaction !== 'none',
      rangedBlocked: false,
      statusEffects: [],
    }));
    
    const allUnits = [...playerUnits, ...enemyUnits];
    const turnOrder = [...allUnits].sort((a, b) => b.initiative - a.initiative);
    
    set({
      playerUnits,
      enemyUnits,
      turnOrder,
      currentUnitIndex: 0,
      phase: 'battle',
      battleLog: ['⚔️ Битва началась!'],
    });
  },
  
  setSelectedUnit: (unit) => set({ selectedUnit: unit }),
  setHoveredUnit: (unit) => set({ hoveredUnit: unit }),
  
  moveUnit: (unit, position) => {
    let provokedResult: { attackerId: string; damage: number; attackerPos: { q: number; r: number }; targetPos: { q: number; r: number } } | undefined;
    
    // Check for provoked attacks (Спровоцированная атака) before moving
    if (unit.position) {
      const preState = get();
      const enemies = unit.owner === 'player' ? preState.enemyUnits : preState.playerUnits;
      const provokers = enemies.filter(e => 
        !e.isDead && e.position && e.reactionAvailable && 
        e.reaction === 'provoked_attack' &&
        hexDistance(unit.position!, e.position) === 1
      );
      
      for (const provoker of provokers) {
        const newDist = hexDistance(position, provoker.position!);
        if (newDist > 1) {
          const damage = calculateDamage(provoker.attack, provoker.attackType, unit.physicalDefense, unit.magicalDefense);
          const newHealth = Math.max(0, unit.currentHealth - damage);
          const isDead = newHealth === 0;
          const provokerEnergy = Math.min(provoker.maxEnergy, provoker.currentEnergy + 5);
          
          provokedResult = {
            attackerId: provoker.id,
            damage,
            attackerPos: { ...provoker.position! },
            targetPos: { ...unit.position! },
          };
          
          const updateU = (units: BattleUnit[], unitId: string, updates: Partial<BattleUnit>) =>
            units.map(u => u.id === unitId ? { ...u, ...updates } : u);
          
          const provokerUpdates = { reactionAvailable: false, currentEnergy: provokerEnergy };
          set(s => ({
            playerUnits: updateU(s.playerUnits, provoker.id, provokerUpdates),
            enemyUnits: updateU(s.enemyUnits, provoker.id, provokerUpdates),
            turnOrder: updateU(s.turnOrder, provoker.id, provokerUpdates),
          }));
          
          const unitDmgUpdates: Partial<BattleUnit> = { currentHealth: newHealth, isDead };
          set(s => ({
            playerUnits: updateU(s.playerUnits, unit.id, unitDmgUpdates),
            enemyUnits: updateU(s.enemyUnits, unit.id, unitDmgUpdates),
            turnOrder: updateU(s.turnOrder, unit.id, unitDmgUpdates),
          }));
          
          get().addBattleLog(`⚔️ ${provoker.avatar} спровоцированная атака: ${damage} урона по ${unit.avatar}${isDead ? ` ☠️ ${unit.name} повержен!` : ''}`);
          
          if (isDead) return { provokedAttack: provokedResult };
          break;
        }
      }
    }
    
    // Perform the actual move
    const state = get();
    const updateUnits = (units: BattleUnit[]) =>
      units.map(u => u.id === unit.id ? { ...u, position, hasMoved: true } : u);
    
    if (unit.owner === 'player') {
      set({ playerUnits: updateUnits(state.playerUnits) });
    } else {
      set({ enemyUnits: updateUnits(state.enemyUnits) });
    }
    
    const updatedTurnOrder = state.turnOrder.map(u => 
      u.id === unit.id ? { ...u, position, hasMoved: true } : u
    );
    const updatedSelectedUnit = state.selectedUnit?.id === unit.id 
      ? { ...state.selectedUnit, position, hasMoved: true } 
      : state.selectedUnit;
    
    set({
      turnOrder: updatedTurnOrder,
      selectedUnit: updatedSelectedUnit,
    });
    
    return { provokedAttack: provokedResult };
  },
  
  attackUnit: (attacker, target) => {
    const state = get();
    
    if (!attacker.position || !target.position) {
      return { damage: 0, isCrit: false };
    }
    
    const distance = hexDistance(attacker.position, target.position);
    
    if (attacker.attackRange === 'melee' && distance > attacker.range) {
      return { damage: 0, isCrit: false };
    }
    
    // Determine attack mode and penalties
    let forcedMelee = false;
    let hasDamagePenalty = false;
    if (attacker.attackRange === 'ranged') {
      if (attacker.rangedBlocked) {
        if (distance === 1) {
          if (attacker.trait !== 'no_melee_penalty') hasDamagePenalty = true;
          forcedMelee = true;
        } else {
          return { damage: 0, isCrit: false };
        }
      } else if (distance > attacker.range) {
        hasDamagePenalty = true;
      }
    }
    
    const isMeleeAttack = attacker.attackRange === 'melee' || forcedMelee;
    
    // Calculate effective defense including buffs
    let effectivePhysDef = target.physicalDefense;
    let effectiveMagDef = target.magicalDefense;
    if (target.buffs?.some(b => b.type === 'defense_boost')) { effectivePhysDef += 1; effectiveMagDef += 1; }
    if (target.buffs?.some(b => b.type === 'parry_phys')) effectivePhysDef += 2;
    if (target.buffs?.some(b => b.type === 'parry_mag')) effectiveMagDef += 2;
    
    // Check PARRY reaction BEFORE damage calculation
    let parryTriggered = false;
    if (!target.isDead && target.reactionAvailable && target.reaction === 'parry' && attacker.trait !== 'ignores_reactions') {
      if (Math.random() < 0.5) {
        parryTriggered = true;
        if (attacker.attackType === 'physical') effectivePhysDef += 2;
        else effectiveMagDef += 2;
      }
    }
    
    let damage = calculateDamage(attacker.attack, attacker.attackType, effectivePhysDef, effectiveMagDef);
    
    // Apply ranged penalties after base damage calc
    if (attacker.attackRange === 'ranged' && forcedMelee && attacker.trait !== 'no_melee_penalty') {
      damage = Math.floor(damage / 3);
    } else if (attacker.attackRange === 'ranged' && !forcedMelee && hasDamagePenalty) {
      damage = Math.floor(damage / 2);
    }
    
    const isCrit = Math.random() < 0.1;
    if (isCrit) {
      damage = Math.floor(damage * 1.5);
    }
    
    const newHealth = Math.max(0, target.currentHealth - damage);
    const isDead = newHealth === 0;
    
    // Energy economy based on attack type and penalties
    let attackerEnergyGain: number;
    let targetEnergyGain: number;
    if (hasDamagePenalty) {
      attackerEnergyGain = 5;
      targetEnergyGain = 10;
    } else if (isMeleeAttack) {
      attackerEnergyGain = 15;
      targetEnergyGain = 20;
    } else {
      // Ranged, no penalty
      attackerEnergyGain = 10;
      targetEnergyGain = 15;
    }
    
    const attackerEnergy = Math.min(attacker.maxEnergy, attacker.currentEnergy + attackerEnergyGain);
    const targetEnergy = isDead ? 0 : Math.min(target.maxEnergy, target.currentEnergy + targetEnergyGain);
    
    const updateUnit = (units: BattleUnit[], unitId: string, updates: Partial<BattleUnit>) =>
      units.map(u => u.id === unitId ? { ...u, ...updates } : u);
    
    const isRangedNonMelee = attacker.attackRange === 'ranged' && !forcedMelee;
    const attackerUpdates: Partial<BattleUnit> = { 
      hasActed: true, 
      currentEnergy: attackerEnergy,
    };
    if (attacker.owner === 'player') {
      set({ playerUnits: updateUnit(state.playerUnits, attacker.id, attackerUpdates) });
    } else {
      set({ enemyUnits: updateUnit(state.enemyUnits, attacker.id, attackerUpdates) });
    }
    
    const targetUpdates: Partial<BattleUnit> = { currentHealth: newHealth, currentEnergy: targetEnergy, isDead };
    
    let reactionResult: { type: string; reactorId: string; damage?: number; isMelee?: boolean; reactorPos?: { q: number; r: number }; targetPos?: { q: number; r: number } } | undefined;
    
    // Handle parry result (already triggered before damage)
    if (parryTriggered) {
      const parryBuff = { 
        type: attacker.attackType === 'physical' ? 'parry_phys' : 'parry_mag', 
        duration: 1, value: 2 
      };
      targetUpdates.buffs = [...(target.buffs || []), parryBuff];
      targetUpdates.reactionAvailable = false;
      targetUpdates.currentEnergy = Math.min(target.maxEnergy, targetEnergy + 5);
      const defLabel = attacker.attackType === 'physical' ? 'физ.' : 'маг.';
      get().addBattleLog(`🤺 ${target.avatar} парирование! +2 ${defLabel} защиты`);
      reactionResult = { type: 'parry', reactorId: target.id, reactorPos: target.position ? { ...target.position } : undefined };
    }
    
    // Process post-damage reactions (counter, return, retreat - NOT parry)
    if (!isDead && !parryTriggered && target.reactionAvailable && target.reaction !== 'none' && target.reaction !== 'parry' && attacker.trait !== 'ignores_reactions') {
      const reactionType = target.reaction;
      
      switch (reactionType) {
        case 'counterattack': {
          // Only triggers on melee attacks
          if (isMeleeAttack && target.position && attacker.position && hexDistance(target.position, attacker.position) === 1) {
            const counterDamage = calculateDamage(
              target.attack,
              target.attackType,
              attacker.physicalDefense,
              attacker.magicalDefense
            );
            const newAttackerHealth = Math.max(0, attacker.currentHealth - counterDamage);
            const attackerDead = newAttackerHealth === 0;
            
            const counterUpdates = { ...attackerUpdates, currentHealth: newAttackerHealth, isDead: attackerDead };
            if (attacker.owner === 'player') {
              set(s => ({ playerUnits: updateUnit(s.playerUnits, attacker.id, counterUpdates) }));
            } else {
              set(s => ({ enemyUnits: updateUnit(s.enemyUnits, attacker.id, counterUpdates) }));
            }
            set(s => ({ turnOrder: updateUnit(s.turnOrder, attacker.id, counterUpdates) }));
            
            targetUpdates.reactionAvailable = false;
            targetUpdates.currentEnergy = Math.min(target.maxEnergy, targetEnergy + 5);
            get().addBattleLog(`⚔️ ${target.avatar} контрудар: ${counterDamage} урона${attackerDead ? ` ☠️ ${attacker.name} повержен!` : ''}`);
            reactionResult = { type: 'counterattack', reactorId: target.id, damage: counterDamage, isMelee: true, reactorPos: target.position ? { ...target.position } : undefined, targetPos: attacker.position ? { ...attacker.position } : undefined };
          }
          break;
        }
        case 'return_shot': {
          // Only triggers on ranged attacks
          if (!isMeleeAttack && target.attackRange === 'ranged' && target.position && attacker.position) {
            const shotDamage = calculateDamage(
              target.attack,
              target.attackType,
              attacker.physicalDefense,
              attacker.magicalDefense
            );
            const newAttackerHealth = Math.max(0, attacker.currentHealth - shotDamage);
            const attackerDead = newAttackerHealth === 0;
            
            const shotUpdates = { ...attackerUpdates, currentHealth: newAttackerHealth, isDead: attackerDead };
            if (attacker.owner === 'player') {
              set(s => ({ playerUnits: updateUnit(s.playerUnits, attacker.id, shotUpdates) }));
            } else {
              set(s => ({ enemyUnits: updateUnit(s.enemyUnits, attacker.id, shotUpdates) }));
            }
            set(s => ({ turnOrder: updateUnit(s.turnOrder, attacker.id, shotUpdates) }));
            
            targetUpdates.reactionAvailable = false;
            targetUpdates.currentEnergy = Math.min(target.maxEnergy, targetEnergy + 5);
            get().addBattleLog(`🏹 ${target.avatar} ответный выстрел: ${shotDamage} урона${attackerDead ? ` ☠️ ${attacker.name} повержен!` : ''}`);
            reactionResult = { type: 'return_shot', reactorId: target.id, damage: shotDamage, isMelee: false, reactorPos: target.position ? { ...target.position } : undefined, targetPos: attacker.position ? { ...attacker.position } : undefined };
          }
          break;
        }
        case 'retreat': {
          // Only triggers on melee attacks
          if (isMeleeAttack && target.position && attacker.position) {
            // Find hex opposite to attacker
            const dq = target.position.q - attacker.position.q;
            const dr = target.position.r - attacker.position.r;
            
            // Try direct retreat first
            const retreatQ = target.position.q + Math.sign(dq);
            const retreatR = target.position.r + Math.sign(dr);
            
            const allUnits = [...state.playerUnits, ...state.enemyUnits];
            const isOccupied = (q: number, r: number) => 
              allUnits.some(u => u.position?.q === q && u.position?.r === r && !u.isDead) ||
              q < 0 || q >= 12 || r < 0 || r >= 11;
            
            let retreatPos: { q: number; r: number } | null = null;
            
            if (!isOccupied(retreatQ, retreatR)) {
              retreatPos = { q: retreatQ, r: retreatR };
            } else {
              // Try neighbors of retreat position
              const neighbors = getHexNeighbors(target.position.q, target.position.r);
              for (const n of neighbors) {
                if (!isOccupied(n.q, n.r) && hexDistance(n, attacker.position) > 1) {
                  retreatPos = n;
                  break;
                }
              }
            }
            
            if (retreatPos) {
              targetUpdates.position = retreatPos;
              targetUpdates.reactionAvailable = false;
              targetUpdates.currentEnergy = Math.min(target.maxEnergy, targetEnergy + 5);
              get().addBattleLog(`🏃 ${target.avatar} отходит!`);
              reactionResult = { type: 'retreat', reactorId: target.id, reactorPos: target.position ? { ...target.position } : undefined };
            }
          }
          break;
        }
        // Parry is handled before damage calculation (above)
      }
    }
    
    if (target.owner === 'player') {
      set(s => ({ playerUnits: updateUnit(s.playerUnits, target.id, targetUpdates) }));
    } else {
      set(s => ({ enemyUnits: updateUnit(s.enemyUnits, target.id, targetUpdates) }));
    }
    
    set(s => ({
      turnOrder: s.turnOrder.map(u => {
        if (u.id === attacker.id) return { ...u, ...attackerUpdates };
        if (u.id === target.id) return { ...u, ...targetUpdates };
        return u;
      }),
      selectedUnit: s.selectedUnit?.id === attacker.id 
        ? { ...s.selectedUnit, ...attackerUpdates } 
        : s.selectedUnit,
    }));
    
    const critText = isCrit ? ' 💥КРИТ!' : '';
    let distanceText = '';
    if (attacker.attackRange === 'ranged') {
      if (forcedMelee) {
        distanceText = attacker.trait === 'no_melee_penalty' ? '' : ' (ближний бой -66%)';
      } else if (distance > attacker.range) {
        distanceText = ' (дальность -50%)';
      }
    }
    const killText = isDead ? ` ☠️ ${target.name} повержен!` : '';
    get().addBattleLog(`${attacker.avatar} → ${target.avatar}: ${damage} урона${critText}${distanceText}${killText}`);
    
    return { damage, isCrit, parryTriggered, reaction: reactionResult };
  },
  
  endTurn: () => {
    const state = get();
    const currentUnit = state.turnOrder[state.currentUnitIndex];
    
    // Remove defense buff and parry buffs from unit that just acted
    if (currentUnit) {
      const hasTemporaryBuffs = currentUnit.buffs?.some(b => 
        b.type === 'defense_boost' || b.type === 'parry_phys' || b.type === 'parry_mag'
      );
      
      if (hasTemporaryBuffs) {
        const removeBuff = (units: BattleUnit[]) =>
          units.map(u => u.id === currentUnit.id 
            ? { ...u, buffs: (u.buffs || []).filter(b => 
                b.type !== 'defense_boost' && b.type !== 'parry_phys' && b.type !== 'parry_mag'
              ) }
            : u
          );
        
        set({
          playerUnits: removeBuff(state.playerUnits),
          enemyUnits: removeBuff(state.enemyUnits),
          turnOrder: removeBuff(state.turnOrder),
        });
      }
      
      // Restore reaction charge at start of this unit's next turn
      if (currentUnit.reaction !== 'none' && !currentUnit.reactionAvailable) {
        const restoreReaction = (units: BattleUnit[]) =>
          units.map(u => u.id === currentUnit.id ? { ...u, reactionAvailable: true } : u);
        
        set(s => ({
          playerUnits: restoreReaction(s.playerUnits),
          enemyUnits: restoreReaction(s.enemyUnits),
          turnOrder: restoreReaction(s.turnOrder),
        }));
      }
    }
    
    let nextIndex = state.currentUnitIndex;
    let attempts = 0;
    do {
      nextIndex = (nextIndex + 1) % state.turnOrder.length;
      attempts++;
    } while (state.turnOrder[nextIndex]?.isDead && attempts < state.turnOrder.length);
    
    if (nextIndex <= state.currentUnitIndex || attempts >= state.turnOrder.length) {
      // New round - reset units and restore original initiative order
      const allAliveUnits = [...state.playerUnits, ...state.enemyUnits].filter(u => !u.isDead);
      
      // Check for ranged units starting adjacent to enemies
      const checkRangedBlocked = (unit: BattleUnit, enemies: BattleUnit[]): boolean => {
        if (unit.attackRange !== 'ranged' || !unit.position) return false;
        return enemies.some(e => e.position && !e.isDead && hexDistance(unit.position!, e.position) === 1);
      };
      
      const resetUnits = (units: BattleUnit[], enemies: BattleUnit[]) =>
        units.map(u => ({ 
          ...u, 
          hasMoved: false, 
          hasActed: false, 
          hasWaited: false,
          rangedBlocked: checkRangedBlocked(u, enemies),
        }));
      
      const newPlayerUnits = resetUnits(state.playerUnits, state.enemyUnits);
      const newEnemyUnits = resetUnits(state.enemyUnits, state.playerUnits);
      
      // Restore original initiative order for new round
      const allUnitsForOrder = [...newPlayerUnits, ...newEnemyUnits];
      const newTurnOrder = [...allUnitsForOrder].sort((a, b) => b.initiative - a.initiative);
      
      set({
        playerUnits: newPlayerUnits,
        enemyUnits: newEnemyUnits,
        turnOrder: newTurnOrder,
      });
      
      // Find first alive unit in new order
      nextIndex = 0;
      while (newTurnOrder[nextIndex]?.isDead && nextIndex < newTurnOrder.length) {
        nextIndex++;
      }
      
      get().addBattleLog('🔄 Новый раунд!');
    } else {
      // Check rangedBlocked for next unit at start of their turn
      const nextUnit = state.turnOrder[nextIndex];
      if (nextUnit && nextUnit.attackRange === 'ranged' && nextUnit.position) {
        const enemies = nextUnit.owner === 'player' ? state.enemyUnits : state.playerUnits;
        const isBlocked = enemies.some(e => e.position && !e.isDead && hexDistance(nextUnit.position!, e.position) === 1);
        if (isBlocked !== nextUnit.rangedBlocked) {
          const updateBlocked = (units: BattleUnit[]) =>
            units.map(u => u.id === nextUnit.id ? { ...u, rangedBlocked: isBlocked } : u);
          set(s => ({
            playerUnits: updateBlocked(s.playerUnits),
            enemyUnits: updateBlocked(s.enemyUnits),
            turnOrder: updateBlocked(s.turnOrder),
          }));
        }
      }
    }
    
    set({
      currentUnitIndex: nextIndex,
      selectedUnit: null,
      skillMode: null,
      skillRange: new Set<string>(),
    });
  },
  
  // Wait action - only works once per round
  waitAction: (unit) => {
    const state = get();
    
    if (unit.hasWaited) return; // Already waited this round
    
    const aliveUnits = state.turnOrder.filter(u => !u.isDead);
    const currentPosInAlive = aliveUnits.findIndex(u => u.id === unit.id);
    
    if (currentPosInAlive === -1) return;
    
    const mirroredPos = aliveUnits.length - 1 - currentPosInAlive;
    
    const newAliveOrder = [...aliveUnits];
    newAliveOrder.splice(currentPosInAlive, 1);
    const waitedUnit = { ...unit, hasWaited: true };
    newAliveOrder.splice(mirroredPos, 0, waitedUnit);
    
    const deadUnits = state.turnOrder.filter(u => u.isDead);
    const finalTurnOrder = [...newAliveOrder, ...deadUnits];
    
    // Also update the hasWaited flag in unit arrays
    const updateWaited = (units: BattleUnit[]) =>
      units.map(u => u.id === unit.id ? { ...u, hasWaited: true } : u);
    
    set({ 
      turnOrder: finalTurnOrder,
      playerUnits: updateWaited(state.playerUnits),
      enemyUnits: updateWaited(state.enemyUnits),
    });
    
    get().addBattleLog(`⏳ ${unit.avatar} ${unit.name} ждёт...`);
    get().endTurn();
  },
  
  // Defend action - requires both movement and action points
  defendAction: (unit) => {
    const state = get();
    
    if (unit.hasMoved || unit.hasActed) return; // Needs both points
    
    const newEnergy = Math.min(unit.maxEnergy, unit.currentEnergy + 10);
    const newBuffs = [...(unit.buffs || []), { type: 'defense_boost', duration: 1, value: 1 }];
    
    const updateUnit = (units: BattleUnit[], unitId: string, updates: Partial<BattleUnit>) =>
      units.map(u => u.id === unitId ? { ...u, ...updates } : u);
    
    const updates = { hasMoved: true, hasActed: true, currentEnergy: newEnergy, buffs: newBuffs };
    
    if (unit.owner === 'player') {
      set({ playerUnits: updateUnit(state.playerUnits, unit.id, updates) });
    } else {
      set({ enemyUnits: updateUnit(state.enemyUnits, unit.id, updates) });
    }
    
    set({
      turnOrder: updateUnit(state.turnOrder, unit.id, updates),
      selectedUnit: state.selectedUnit?.id === unit.id 
        ? { ...state.selectedUnit, ...updates } 
        : state.selectedUnit,
    });
    
    get().addBattleLog(`🛡️ ${unit.avatar} ${unit.name} принимает оборонительную стойку (+10⚡, +1🛡️)`);
  },
  
  markUnitActed: (unitId, alsoMoved) => {
    const state = get();
    const updates: Partial<BattleUnit> = { hasActed: true };
    if (alsoMoved) updates.hasMoved = true;
    
    const updateUnit = (units: BattleUnit[]) =>
      units.map(u => u.id === unitId ? { ...u, ...updates } : u);
    
    set({
      playerUnits: updateUnit(state.playerUnits),
      enemyUnits: updateUnit(state.enemyUnits),
      turnOrder: updateUnit(state.turnOrder),
      selectedUnit: state.selectedUnit?.id === unitId 
        ? { ...state.selectedUnit, ...updates } 
        : state.selectedUnit,
    });
  },
  
  useSkill: (caster, targetPos, skillType) => {
    const state = get();
    const skill = skillType === 'active' ? caster.skills.active : caster.skills.ultimate;
    const allUnits = [...state.playerUnits, ...state.enemyUnits];
    
    const target = allUnits.find(u => 
      u.position?.q === targetPos.q && u.position?.r === targetPos.r && !u.isDead
    );
    
    let result: SkillResult | null = null;
    const targets: { unit: BattleUnit; value: number }[] = [];
    
    if (skillType === 'ultimate' && caster.currentEnergy < (skill.energyCost || 100)) {
      return null;
    }
    
    const enemies = caster.owner === 'player' ? state.enemyUnits : state.playerUnits;
    const allies = caster.owner === 'player' ? state.playerUnits : state.enemyUnits;
    
    switch (caster.id) {
      case 'ironclad':
      case 'stone_giant':
      case 'paladin':
        if (skillType === 'active') {
          const areaTargets = enemies.filter(e => {
            if (!e.position || !caster.position) return false;
            return hexDistance(caster.position, e.position) <= 2 && !e.isDead;
          });
          areaTargets.forEach(t => {
            const damage = Math.floor(caster.attack * 0.6);
            targets.push({ unit: t, value: damage });
          });
          result = { type: 'area', targets, message: `${caster.avatar} использует ${skill.name}!` };
        } else {
          targets.push({ unit: caster, value: 50 });
          result = { type: 'buff', targets, message: `${caster.avatar} активирует ${skill.name}!` };
        }
        break;
        
      case 'shadow_blade':
      case 'berserker':
        if (skillType === 'active' && target) {
          const damage = Math.floor(caster.attack * 1.2);
          targets.push({ unit: target, value: damage });
          result = { type: 'damage', targets, message: `${caster.avatar} наносит ${skill.name}!` };
        } else if (skillType === 'ultimate') {
          const nearbyEnemies = enemies.filter(e => {
            if (!e.position || !caster.position) return false;
            return hexDistance(caster.position, e.position) <= 1 && !e.isDead;
          });
          nearbyEnemies.forEach(e => {
            targets.push({ unit: e, value: Math.floor(caster.attack * 0.8) });
          });
          result = { type: 'area', targets, message: `${caster.avatar} активирует ${skill.name}!` };
        }
        break;
        
      case 'fire_mage':
      case 'frost_mage':
        if (target && targetPos) {
          const areaTargets = enemies.filter(e => {
            if (!e.position) return false;
            return hexDistance(targetPos, e.position) <= 2 && !e.isDead;
          });
          const baseDamage = skillType === 'ultimate' ? Math.floor(caster.attack * 1.5) : Math.floor(caster.attack * 0.8);
          areaTargets.forEach(t => {
            targets.push({ unit: t, value: baseDamage });
          });
          result = { type: 'area', targets, message: `${caster.avatar} выпускает ${skill.name}!` };
        }
        break;
        
      case 'ranger':
        if (target) {
          const damage = skillType === 'ultimate' ? Math.floor(caster.attack * 1.3) : Math.floor(caster.attack * 1.1);
          targets.push({ unit: target, value: damage });
          result = { type: 'damage', targets, message: `${caster.avatar} выпускает ${skill.name}!` };
        }
        break;
        
      case 'light_priestess':
        if (skillType === 'active') {
          const allyTarget = allies.find(a => 
            a.position?.q === targetPos.q && a.position?.r === targetPos.r && !a.isDead
          );
          if (allyTarget) {
            targets.push({ unit: allyTarget, value: 40 });
            result = { type: 'heal', targets, message: `${caster.avatar} исцеляет ${allyTarget.name}!` };
          }
        } else {
          allies.filter(a => !a.isDead).forEach(a => {
            targets.push({ unit: a, value: 30 });
          });
          result = { type: 'heal', targets, message: `${caster.avatar} активирует ${skill.name}!` };
        }
        break;
        
      case 'war_drummer':
      case 'shaman':
        if (skillType === 'active') {
          const nearbyAllies = allies.filter(a => {
            if (!a.position || !caster.position) return false;
            return hexDistance(caster.position, a.position) <= 3 && !a.isDead;
          });
          nearbyAllies.forEach(a => {
            targets.push({ unit: a, value: 20 });
          });
          result = { type: 'buff', targets, message: `${caster.avatar} вдохновляет союзников!` };
        } else if (target) {
          targets.push({ unit: target, value: Math.floor(caster.attack * 1.5) });
          result = { type: 'damage', targets, message: `${caster.avatar} обрушивает ${skill.name}!` };
        }
        break;
        
      case 'necromancer':
        if (target) {
          const damage = skillType === 'ultimate' ? Math.floor(caster.attack * 1.8) : Math.floor(caster.attack * 1.0);
          targets.push({ unit: target, value: damage });
          result = { type: 'damage', targets, message: `${caster.avatar} использует ${skill.name}!` };
        }
        break;
        
      default:
        if (target) {
          const damage = Math.floor(caster.attack * (skillType === 'ultimate' ? 1.5 : 1.0));
          targets.push({ unit: target, value: damage });
          result = { type: 'damage', targets, message: `${caster.avatar} использует ${skill.name}!` };
        }
    }
    
    if (!result || targets.length === 0) return null;
    
    const updateUnit = (units: BattleUnit[], unitId: string, updates: Partial<BattleUnit>) =>
      units.map(u => u.id === unitId ? { ...u, ...updates } : u);
    
    let casterEnergy = caster.currentEnergy;
    if (skillType === 'ultimate') {
      casterEnergy = Math.max(0, caster.currentEnergy - (skill.energyCost || 100));
    } else {
      casterEnergy = Math.min(caster.maxEnergy, caster.currentEnergy + 10);
    }
    
    targets.forEach(({ unit, value }) => {
      if (result!.type === 'damage' || result!.type === 'area') {
        const newHealth = Math.max(0, unit.currentHealth - value);
        const isDead = newHealth === 0;
        const updates = { currentHealth: newHealth, isDead };
        
        if (unit.owner === 'player') {
          set(s => ({ playerUnits: updateUnit(s.playerUnits, unit.id, updates) }));
        } else {
          set(s => ({ enemyUnits: updateUnit(s.enemyUnits, unit.id, updates) }));
        }
        set(s => ({ turnOrder: updateUnit(s.turnOrder, unit.id, updates) }));
        
        if (isDead) {
          get().addBattleLog(`☠️ ${unit.name} повержен!`);
        }
      } else if (result!.type === 'heal') {
        const newHealth = Math.min(unit.maxHealth, unit.currentHealth + value);
        const updates = { currentHealth: newHealth };
        
        if (unit.owner === 'player') {
          set(s => ({ playerUnits: updateUnit(s.playerUnits, unit.id, updates) }));
        } else {
          set(s => ({ enemyUnits: updateUnit(s.enemyUnits, unit.id, updates) }));
        }
        set(s => ({ turnOrder: updateUnit(s.turnOrder, unit.id, updates) }));
      }
    });
    
    const casterUpdates = { hasActed: true, currentEnergy: casterEnergy };
    if (caster.owner === 'player') {
      set(s => ({ playerUnits: updateUnit(s.playerUnits, caster.id, casterUpdates) }));
    } else {
      set(s => ({ enemyUnits: updateUnit(s.enemyUnits, caster.id, casterUpdates) }));
    }
    set(s => ({ 
      turnOrder: updateUnit(s.turnOrder, caster.id, casterUpdates),
      selectedUnit: s.selectedUnit?.id === caster.id ? { ...s.selectedUnit, ...casterUpdates } : s.selectedUnit,
      skillMode: null,
      skillRange: new Set<string>(),
    }));
    
    get().addBattleLog(result.message);
    
    return result;
  },
  
  selectedHeroId: null,
  setSelectedHeroId: (id) => set({ selectedHeroId: id }),
}));
