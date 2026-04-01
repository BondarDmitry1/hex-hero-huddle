import { create } from 'zustand';
import { Hero, heroes, calculateDamage, HeroTrait, HeroReaction, StatusEffect, StatusEffectType, SkillEffect, Skill } from '@/data/heroes';

export type GamePhase = 'menu' | 'heroes' | 'draft' | 'placement' | 'battle';
export type Player = 'player' | 'enemy';
export type SkillMode = null | 'active' | 'ultimate';

export interface TemporaryBuff {
  stat: 'attack' | 'speed' | 'physicalDefense' | 'magicalDefense' | 'initiative';
  value: number;
  isPercent?: boolean;
  duration: number;
  sourceSkillId?: string;
}

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
  temporaryBuffs: TemporaryBuff[];
  skillCooldowns: Record<string, number>;
  /** Flag for guaranteed crit on next attack */
  guaranteedCrit?: boolean;
  /** Flag to ignore range penalty on next attack */
  ignoreRangePenalty?: boolean;
  /** Counter for passives like divine shield */
  hitCounter?: number;
}

export interface SkillResult {
  type: 'damage' | 'heal' | 'buff' | 'area' | 'status';
  targets: { unit: BattleUnit; value: number; statusApplied?: StatusEffectType }[];
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

// ===== UNIVERSAL SKILL EFFECT SYSTEM =====

/** Get effective stat value including temporary buffs */
export const getEffectiveStat = (unit: BattleUnit, stat: 'attack' | 'speed' | 'physicalDefense' | 'magicalDefense' | 'initiative'): number => {
  let base = unit[stat] as number;
  let percentBonus = 0;
  let flatBonus = 0;
  
  for (const buff of unit.temporaryBuffs) {
    if (buff.stat === stat) {
      if (buff.isPercent) {
        percentBonus += buff.value;
      } else {
        flatBonus += buff.value;
      }
    }
  }
  
  return Math.max(0, Math.floor(base * (1 + percentBonus / 100) + flatBonus));
};

/** Apply a status effect to a unit */
const applyStatusToUnit = (unit: BattleUnit, statusType: StatusEffectType, duration: number, stacks?: number, sourceId?: string): BattleUnit => {
  const existingIdx = unit.statusEffects.findIndex(s => s.type === statusType);
  let newEffects = [...unit.statusEffects];
  
  if (statusType === 'acid') {
    // Acid stacks up to 3
    if (existingIdx >= 0) {
      const existing = newEffects[existingIdx];
      newEffects[existingIdx] = {
        ...existing,
        stacks: Math.min(3, (existing.stacks || 1) + (stacks || 1)),
        duration: duration,
      };
    } else {
      newEffects.push({ type: statusType, duration, stacks: stacks || 1, sourceId, turnsActive: 0 });
    }
  } else if (statusType === 'burning') {
    // Burning refreshes duration
    if (existingIdx >= 0) {
      newEffects[existingIdx] = { ...newEffects[existingIdx], duration };
    } else {
      newEffects.push({ type: statusType, duration, sourceId, turnsActive: 0 });
    }
  } else if (statusType === 'bleeding') {
    // Bleeding extends duration
    if (existingIdx >= 0) {
      newEffects[existingIdx] = { ...newEffects[existingIdx], duration: newEffects[existingIdx].duration + duration };
    } else {
      newEffects.push({ type: statusType, duration, sourceId, turnsActive: 0 });
    }
  } else {
    // Default: replace if exists, otherwise add
    if (existingIdx >= 0) {
      newEffects[existingIdx] = { type: statusType, duration, stacks, sourceId, turnsActive: 0 };
    } else {
      newEffects.push({ type: statusType, duration, stacks, sourceId, turnsActive: 0 });
    }
  }
  
  return { ...unit, statusEffects: newEffects };
};

/** Process status effects at start of a unit's turn. Returns updated unit and damage taken. */
const processStatusEffectsTick = (unit: BattleUnit): { unit: BattleUnit; tickDamage: number; skipTurn: boolean; messages: string[] } => {
  let updatedUnit = { ...unit };
  let tickDamage = 0;
  let skipTurn = false;
  const messages: string[] = [];
  let newEffects = [...updatedUnit.statusEffects];
  
  for (let i = newEffects.length - 1; i >= 0; i--) {
    const effect = newEffects[i];
    
    switch (effect.type) {
      case 'acid': {
        const acidDmg = 10 * (effect.stacks || 1);
        tickDamage += acidDmg;
        // Reduce physical defense by 1 per stack
        updatedUnit = { ...updatedUnit, physicalDefense: Math.max(0, updatedUnit.physicalDefense - (effect.stacks || 1)) };
        messages.push(`🧪 ${unit.avatar} получает ${acidDmg} урона от кислоты, физ. защита -${effect.stacks || 1}`);
        break;
      }
      case 'burning': {
        tickDamage += 15;
        messages.push(`🔥 ${unit.avatar} получает 15 урона от горения`);
        break;
      }
      case 'bleeding': {
        const turnsActive = (effect.turnsActive || 0) + 1;
        const bleedPercent = turnsActive === 1 ? 0.09 : turnsActive === 2 ? 0.12 : 0.15;
        const bleedDmg = Math.floor(unit.maxHealth * bleedPercent);
        tickDamage += bleedDmg;
        newEffects[i] = { ...effect, turnsActive };
        messages.push(`🩸 ${unit.avatar} теряет ${bleedDmg} HP от кровотечения (${Math.floor(bleedPercent * 100)}%)`);
        break;
      }
      case 'frozen':
        skipTurn = true;
        messages.push(`🧊 ${unit.avatar} заморожен — пропускает ход`);
        break;
      case 'stunned':
        skipTurn = true;
        messages.push(`⚡ ${unit.avatar} оглушён — пропускает ход`);
        break;
      case 'sleep':
        skipTurn = true;
        messages.push(`💤 ${unit.avatar} спит — пропускает ход`);
        break;
      case 'fear':
        skipTurn = true;
        messages.push(`😱 ${unit.avatar} в страхе — пропускает ход`);
        break;
      case 'taunt':
        // Handled in AI/movement logic
        break;
      case 'immobilized':
      case 'silenced':
      case 'suppressed':
      case 'distracted':
      case 'powerless':
      case 'ranged_blocked':
        // These are checked during actions, not on tick
        break;
    }
    
    // Decrease duration
    newEffects[i] = { ...newEffects[i], duration: newEffects[i].duration - 1 };
  }
  
  // Remove expired effects
  newEffects = newEffects.filter(e => e.duration > 0);
  
  updatedUnit = { ...updatedUnit, statusEffects: newEffects };
  
  // Apply tick damage
  if (tickDamage > 0) {
    updatedUnit.currentHealth = Math.max(0, updatedUnit.currentHealth - tickDamage);
    if (updatedUnit.currentHealth === 0) {
      updatedUnit.isDead = true;
    }
  }
  
  return { unit: updatedUnit, tickDamage, skipTurn, messages };
};

/** Tick temporary buffs — decrease duration, remove expired */
const tickTemporaryBuffs = (unit: BattleUnit): BattleUnit => {
  const newBuffs = unit.temporaryBuffs
    .map(b => ({ ...b, duration: b.duration - 1 }))
    .filter(b => b.duration > 0);
  return { ...unit, temporaryBuffs: newBuffs };
};

/** Tick skill cooldowns */
const tickSkillCooldowns = (unit: BattleUnit): BattleUnit => {
  const newCooldowns: Record<string, number> = {};
  for (const [key, val] of Object.entries(unit.skillCooldowns)) {
    if (val > 1) newCooldowns[key] = val - 1;
  }
  return { ...unit, skillCooldowns: newCooldowns };
};

/** Check if unit has a status effect */
export const hasStatus = (unit: BattleUnit, status: StatusEffectType): boolean => {
  return unit.statusEffects.some(e => e.type === status);
};

/** Check if unit has any crowd control effect */
export const hasAnyCrowdControl = (unit: BattleUnit): boolean => {
  const ccTypes: StatusEffectType[] = ['frozen', 'stunned', 'sleep', 'fear', 'immobilized'];
  return unit.statusEffects.some(e => ccTypes.includes(e.type));
};

// ===== STORE =====

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
  
  skillMode: null,
  setSkillMode: (mode) => set({ skillMode: mode }),
  skillRange: new Set<string>(),
  setSkillRange: (range) => set({ skillRange: range }),
  
  addBattleLog: (message) => {
    set(state => ({ battleLog: [...state.battleLog.slice(-19), message] }));
  },
  
  initializeBattle: () => {
    const state = get();
    
    const createBattleUnit = (hero: Hero, owner: Player, position: { q: number; r: number }): BattleUnit => ({
      ...hero,
      owner,
      position,
      currentHealth: hero.health,
      currentEnergy: 0,
      hasMoved: false,
      hasActed: false,
      isDead: false,
      reactionAvailable: hero.reaction !== 'none',
      rangedBlocked: false,
      statusEffects: [],
      temporaryBuffs: [],
      skillCooldowns: {},
      hitCounter: 0,
    });
    
    const playerUnits: BattleUnit[] = state.playerDraft.map((hero, index) =>
      createBattleUnit(hero, 'player', { q: 0, r: 1 + index * 2 })
    );
    
    const enemyUnits: BattleUnit[] = state.enemyDraft.map((hero, index) =>
      createBattleUnit(hero, 'enemy', { q: 11, r: 1 + index * 2 })
    );
    
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
      } else if (distance > attacker.range && !attacker.ignoreRangePenalty) {
        hasDamagePenalty = true;
      }
    }
    
    const isMeleeAttack = attacker.attackRange === 'melee' || forcedMelee;
    
    let effectivePhysDef = target.physicalDefense;
    let effectiveMagDef = target.magicalDefense;
    // Apply temporary defense buffs
    for (const buff of target.temporaryBuffs) {
      if (buff.stat === 'physicalDefense') {
        effectivePhysDef += buff.isPercent ? Math.floor(target.physicalDefense * buff.value / 100) : buff.value;
      }
      if (buff.stat === 'magicalDefense') {
        effectiveMagDef += buff.isPercent ? Math.floor(target.magicalDefense * buff.value / 100) : buff.value;
      }
    }
    if (target.buffs?.some(b => b.type === 'defense_boost')) { effectivePhysDef += 1; effectiveMagDef += 1; }
    if (target.buffs?.some(b => b.type === 'parry_phys')) effectivePhysDef += 2;
    if (target.buffs?.some(b => b.type === 'parry_mag')) effectiveMagDef += 2;
    
    // Check PARRY reaction BEFORE damage calculation
    let parryTriggered = false;
    if (!target.isDead && target.reactionAvailable && target.reaction === 'parry' && attacker.trait !== 'ignores_reactions' && !hasStatus(target, 'distracted')) {
      if (Math.random() < 0.5) {
        parryTriggered = true;
        if (attacker.attackType === 'physical') effectivePhysDef += 2;
        else effectiveMagDef += 2;
      }
    }
    
    // Use effective attack stat (includes temp buffs)
    const effectiveAttack = getEffectiveStat(attacker, 'attack');
    let damage = calculateDamage(effectiveAttack, attacker.attackType, effectivePhysDef, effectiveMagDef);
    
    // Knight aura: 30% ranged damage reduction for allies near a knight with shield_wall aura
    if (!isMeleeAttack && target.position) {
      const targetAllies = target.owner === 'player' ? state.playerUnits : state.enemyUnits;
      const hasAuraProtection = targetAllies.some(ally => {
        if (ally.isDead || !ally.position || hasStatus(ally, 'suppressed')) return false;
        const passive = ally.skills.passive.passiveEffect;
        if (!passive || passive.trigger !== 'aura' || !passive.rangedDamageReduction) return false;
        const dist = hexDistance(target.position!, ally.position);
        return dist <= (passive.area || 1);
      });
      if (hasAuraProtection) {
        damage = Math.floor(damage * 0.7);
        get().addBattleLog(`🛡️ ${target.avatar} защищён аурой: -30% урона от стрел`);
      }
    }
    
    // Ranged penalties
    if (attacker.attackRange === 'ranged' && forcedMelee && attacker.trait !== 'no_melee_penalty') {
      damage = Math.floor(damage / 3);
    } else if (attacker.attackRange === 'ranged' && !forcedMelee && hasDamagePenalty) {
      damage = Math.floor(damage / 2);
    }
    
    // Sleep bonus damage
    if (hasStatus(target, 'sleep')) {
      damage = Math.floor(damage * 1.15);
      // Wake up
      const newEffects = target.statusEffects.filter(e => e.type !== 'sleep');
      const updateUnit = (units: BattleUnit[], unitId: string, updates: Partial<BattleUnit>) =>
        units.map(u => u.id === unitId ? { ...u, ...updates } : u);
      set(s => ({
        playerUnits: updateUnit(s.playerUnits, target.id, { statusEffects: newEffects }),
        enemyUnits: updateUnit(s.enemyUnits, target.id, { statusEffects: newEffects }),
        turnOrder: updateUnit(s.turnOrder, target.id, { statusEffects: newEffects }),
      }));
      get().addBattleLog(`💤 ${target.avatar} разбужен! (+15% урона)`);
    }
    
    // Crit check
    const isCrit = attacker.guaranteedCrit || Math.random() < 0.15;
    if (isCrit) {
      damage = Math.floor(damage * 1.5);
    }
    
    // Clear guaranteed crit flag after use
    if (attacker.guaranteedCrit) {
      const clearCrit = (units: BattleUnit[]) =>
        units.map(u => u.id === attacker.id ? { ...u, guaranteedCrit: false, ignoreRangePenalty: false } : u);
      set(s => ({
        playerUnits: clearCrit(s.playerUnits),
        enemyUnits: clearCrit(s.enemyUnits),
        turnOrder: clearCrit(s.turnOrder),
      }));
    }
    
    const newHealth = Math.max(0, target.currentHealth - damage);
    const isDead = newHealth === 0;
    
    // Energy economy
    let attackerEnergyGain: number;
    let targetEnergyGain: number;
    if (hasDamagePenalty) {
      attackerEnergyGain = 5;
      targetEnergyGain = 10;
    } else if (isMeleeAttack) {
      attackerEnergyGain = 15;
      targetEnergyGain = 20;
    } else {
      attackerEnergyGain = 10;
      targetEnergyGain = 15;
    }
    
    const attackerEnergy = Math.min(attacker.maxEnergy, attacker.currentEnergy + attackerEnergyGain);
    const targetEnergy = isDead ? 0 : Math.min(target.maxEnergy, target.currentEnergy + targetEnergyGain);
    
    const updateUnit = (units: BattleUnit[], unitId: string, updates: Partial<BattleUnit>) =>
      units.map(u => u.id === unitId ? { ...u, ...updates } : u);
    
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
    
    // Handle parry result
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
      
      // Knight passive: on parry +1 initiative
      if (target.skills.passive.passiveEffect?.special === 'on_parry_initiative') {
        const initBuff: TemporaryBuff = { stat: 'initiative', value: 1, duration: 1 };
        targetUpdates.temporaryBuffs = [...(target.temporaryBuffs || []), initBuff];
        get().addBattleLog(`🛡️ ${target.avatar} +1 инициатива от парирования`);
      }
    }
    
    // Post-damage reactions (counter, return, retreat)
    if (!isDead && !parryTriggered && target.reactionAvailable && target.reaction !== 'none' && target.reaction !== 'parry' && attacker.trait !== 'ignores_reactions' && !hasStatus(target, 'distracted')) {
      const reactionType = target.reaction;
      
      switch (reactionType) {
        case 'counterattack': {
          if (isMeleeAttack && target.position && attacker.position && hexDistance(target.position, attacker.position) === 1) {
            const counterDamage = calculateDamage(
              getEffectiveStat(target, 'attack'),
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
          if (!isMeleeAttack && target.attackRange === 'ranged' && target.position && attacker.position) {
            const shotDamage = calculateDamage(
              getEffectiveStat(target, 'attack'),
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
          if (isMeleeAttack && target.position && attacker.position) {
            const dq = target.position.q - attacker.position.q;
            const dr = target.position.r - attacker.position.r;
            
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
      }
    }
    
    // Apply passive on-attack effects (burning from fire mage, frostbite, etc.)
    if (!isDead && attacker.skills.passive.passiveEffect?.trigger === 'on_attack') {
      const passive = attacker.skills.passive.passiveEffect;
      
      if (passive.status && !hasStatus(attacker, 'suppressed')) {
        const updatedTarget = applyStatusToUnit(
          { ...target, ...targetUpdates } as BattleUnit,
          passive.status,
          passive.statusDuration || 2,
          undefined,
          attacker.id
        );
        targetUpdates.statusEffects = updatedTarget.statusEffects;
        get().addBattleLog(`${attacker.avatar} накладывает ${passive.status === 'burning' ? '🔥 горение' : '❄️ замедление'} на ${target.avatar}`);
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
      } else if (distance > attacker.range && !attacker.ignoreRangePenalty) {
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
      
      // Restore reaction charge
      if (currentUnit.reaction !== 'none' && !currentUnit.reactionAvailable) {
        // Check if stunned — reaction unavailable for 1 turn after stun
        const wasStunned = currentUnit.statusEffects.some(e => e.type === 'stunned' && e.duration <= 1);
        if (!wasStunned) {
          const restoreReaction = (units: BattleUnit[]) =>
            units.map(u => u.id === currentUnit.id ? { ...u, reactionAvailable: true } : u);
          
          set(s => ({
            playerUnits: restoreReaction(s.playerUnits),
            enemyUnits: restoreReaction(s.enemyUnits),
            turnOrder: restoreReaction(s.turnOrder),
          }));
        }
      }
    }
    
    let nextIndex = state.currentUnitIndex;
    let attempts = 0;
    do {
      nextIndex = (nextIndex + 1) % state.turnOrder.length;
      attempts++;
    } while (state.turnOrder[nextIndex]?.isDead && attempts < state.turnOrder.length);
    
    if (nextIndex <= state.currentUnitIndex || attempts >= state.turnOrder.length) {
      // New round
      const allAliveUnits = [...state.playerUnits, ...state.enemyUnits].filter(u => !u.isDead);
      
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
      
      const allUnitsForOrder = [...newPlayerUnits, ...newEnemyUnits];
      const newTurnOrder = [...allUnitsForOrder].sort((a, b) => {
        const aInit = getEffectiveStat(a, 'initiative');
        const bInit = getEffectiveStat(b, 'initiative');
        return bInit - aInit;
      });
      
      set({
        playerUnits: newPlayerUnits,
        enemyUnits: newEnemyUnits,
        turnOrder: newTurnOrder,
      });
      
      nextIndex = 0;
      while (newTurnOrder[nextIndex]?.isDead && nextIndex < newTurnOrder.length) {
        nextIndex++;
      }
      
      get().addBattleLog('🔄 Новый раунд!');
    } else {
      // Check rangedBlocked for next unit
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
    
    // Process start-of-turn effects for the next unit
    const updatedState = get();
    const nextUnit = updatedState.turnOrder[nextIndex];
    if (nextUnit && !nextUnit.isDead) {
      // Tick temporary buffs and cooldowns
      let processed = tickTemporaryBuffs(nextUnit);
      processed = tickSkillCooldowns(processed);
      
      // Process status effect ticks (damage, skip turn, etc.)
      const { unit: tickedUnit, tickDamage, skipTurn, messages } = processStatusEffectsTick(processed);
      
      // Process healing auras
      const allies = tickedUnit.owner === 'player' ? updatedState.playerUnits : updatedState.enemyUnits;
      for (const ally of allies) {
        if (ally.isDead || !ally.position || !tickedUnit.position) continue;
        const passive = ally.skills.passive.passiveEffect;
        if (!passive || passive.trigger !== 'aura' || !passive.heal) continue;
        if (hasStatus(ally, 'suppressed')) continue;
        const dist = hexDistance(tickedUnit.position, ally.position);
        if (passive.area && dist <= passive.area) {
          const healAmount = passive.heal;
          if (tickedUnit.currentHealth < tickedUnit.maxHealth) {
            const newHp = Math.min(tickedUnit.maxHealth, tickedUnit.currentHealth + healAmount);
            tickedUnit.currentHealth = newHp;
            get().addBattleLog(`✨ ${tickedUnit.avatar} восстанавливает ${healAmount} HP от ауры ${ally.avatar}`);
          }
        }
      }
      
      messages.forEach(m => get().addBattleLog(m));
      
      const updateAll = (units: BattleUnit[]) =>
        units.map(u => u.id === nextUnit.id ? { ...tickedUnit } : u);
      
      set(s => ({
        playerUnits: updateAll(s.playerUnits),
        enemyUnits: updateAll(s.enemyUnits),
        turnOrder: updateAll(s.turnOrder),
      }));
    }
    
    set({
      currentUnitIndex: nextIndex,
      selectedUnit: null,
      skillMode: null,
      skillRange: new Set<string>(),
    });
  },
  
  waitAction: (unit) => {
    const state = get();
    
    if (unit.hasWaited || unit.hasMoved || unit.hasActed) return;
    
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
  
  defendAction: (unit) => {
    const state = get();
    
    if (unit.hasMoved || unit.hasActed) return;
    
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
  
  // ===== UNIVERSAL SKILL SYSTEM =====
  useSkill: (caster, targetPos, skillType) => {
    const state = get();
    const skill = skillType === 'active' ? caster.skills.active : caster.skills.ultimate;
    const effect = skill.effect;
    
    // Energy check for ultimate
    if (skillType === 'ultimate' && caster.currentEnergy < (skill.energyCost || 100)) {
      return null;
    }
    
    // Cooldown check for active skills
    if (skillType === 'active' && caster.skillCooldowns[skill.id] > 0) {
      return null;
    }
    
    // Silence check
    if (hasStatus(caster, 'silenced')) {
      return null;
    }
    
    // No effect defined — fallback to basic damage
    if (!effect) {
      const allUnits = [...state.playerUnits, ...state.enemyUnits];
      const target = allUnits.find(u => 
        u.position?.q === targetPos.q && u.position?.r === targetPos.r && !u.isDead
      );
      if (!target) return null;
      
      const damage = Math.floor(getEffectiveStat(caster, 'attack') * (skillType === 'ultimate' ? 1.5 : 1.0));
      const targets = [{ unit: target, value: damage }];
      const result: SkillResult = { type: 'damage', targets, message: `${caster.avatar} использует ${skill.name}!` };
      
      applySkillResults(get, set, caster, skill, skillType, result);
      return result;
    }
    
    const allUnits = [...state.playerUnits, ...state.enemyUnits];
    const enemies = caster.owner === 'player' ? state.enemyUnits : state.playerUnits;
    const allies = caster.owner === 'player' ? state.playerUnits : state.enemyUnits;
    
    const targets: { unit: BattleUnit; value: number; statusApplied?: StatusEffectType }[] = [];
    let resultType: SkillResult['type'] = 'damage';
    let message = `${caster.avatar} использует ${skill.name}!`;
    
    // Determine target units based on effect.target
    let targetUnits: BattleUnit[] = [];
    
    switch (effect.target) {
      case 'enemy': {
        if (effect.area) {
          // Area effect centered on targetPos
          targetUnits = enemies.filter(e => 
            e.position && !e.isDead && hexDistance(targetPos, e.position) <= effect.area!
          );
        } else {
          const target = allUnits.find(u => 
            u.position?.q === targetPos.q && u.position?.r === targetPos.r && !u.isDead
          );
          if (target) targetUnits = [target];
        }
        break;
      }
      case 'ally': {
        if (effect.area) {
          targetUnits = allies.filter(a => 
            a.position && !a.isDead && hexDistance(caster.position!, a.position) <= effect.area!
          );
          // Include self in ally area
          if (!targetUnits.find(u => u.id === caster.id)) {
            const self = allies.find(a => a.id === caster.id);
            if (self && !self.isDead) targetUnits.push(self);
          }
        } else {
          // Single ally target (can also be self)
          const target = [...allies].find(u => 
            u.position?.q === targetPos.q && u.position?.r === targetPos.r && !u.isDead
          );
          if (target) targetUnits = [target];
        }
        break;
      }
      case 'self': {
        targetUnits = [caster];
        break;
      }
      case 'all_enemies': {
        targetUnits = enemies.filter(e => !e.isDead);
        break;
      }
      case 'all_allies': {
        targetUnits = allies.filter(a => !a.isDead);
        break;
      }
    }
    
    if (targetUnits.length === 0 && effect.target !== 'self') return null;
    
    // Handle special effects that need custom logic
    if (effect.special === 'random_3_targets') {
      const alive = enemies.filter(e => !e.isDead);
      const shuffled = [...alive].sort(() => Math.random() - 0.5);
      targetUnits = shuffled.slice(0, 3);
    } else if (effect.special === 'random_5_hits') {
      const alive = enemies.filter(e => !e.isDead);
      targetUnits = [];
      for (let i = 0; i < 5; i++) {
        if (alive.length > 0) {
          targetUnits.push(alive[Math.floor(Math.random() * alive.length)]);
        }
      }
    } else if (effect.special === 'percent_lost_hp_damage') {
      const alive = enemies.filter(e => !e.isDead);
      for (const enemy of alive) {
        const lostHp = enemy.maxHealth - enemy.currentHealth;
        const damage = Math.floor(lostHp * 0.2);
        targets.push({ unit: enemy, value: damage });
      }
      resultType = 'area';
      message = `${caster.avatar} обрушивает ${skill.name}!`;
      const result: SkillResult = { type: resultType, targets, message };
      applySkillResults(get, set, caster, skill, skillType, result);
      return result;
    } else if (effect.special === 'knockback') {
      // Shield Bash: damage + knockback + stun
      const target = allUnits.find(u => 
        u.position?.q === targetPos.q && u.position?.r === targetPos.r && !u.isDead
      );
      if (target && target.position && caster.position) {
        const dmg = calculateDamage(effect.damage || 50, effect.damageType || caster.attackType, target.physicalDefense, target.magicalDefense);
        targets.push({ unit: target, value: dmg, statusApplied: effect.status });
        resultType = 'damage';
        message = `${caster.avatar} ${skill.name} → ${target.avatar}: ${dmg} урона + отбрасывание!`;
        
        const result: SkillResult = { type: resultType, targets, message };
        applySkillResults(get, set, caster, skill, skillType, result, effect);
        
        // Knockback logic: push target 1 hex away from caster
        const freshTarget = [...get().playerUnits, ...get().enemyUnits].find(u => u.id === target.id);
        if (freshTarget && freshTarget.position && caster.position) {
          const dq = freshTarget.position.q - caster.position.q;
          const dr = freshTarget.position.r - caster.position.r;
          const knockQ = freshTarget.position.q + Math.sign(dq);
          const knockR = freshTarget.position.r + Math.sign(dr);
          
          const allNow = [...get().playerUnits, ...get().enemyUnits];
          const isOccupied = (q: number, r: number) =>
            allNow.some(u => u.position?.q === q && u.position?.r === r && !u.isDead && u.id !== freshTarget.id) ||
            q < 0 || q >= 12 || r < 0 || r >= 11;
          
          let knockPos: { q: number; r: number } | null = null;
          if (!isOccupied(knockQ, knockR)) {
            knockPos = { q: knockQ, r: knockR };
          } else {
            const neighbors = getHexNeighbors(freshTarget.position.q, freshTarget.position.r);
            for (const n of neighbors) {
              if (!isOccupied(n.q, n.r) && hexDistance(n, caster.position) > 1) {
                knockPos = n;
                break;
              }
            }
          }
          
          if (knockPos) {
            const knockUpdate = { position: knockPos };
            const updateUnit = (units: BattleUnit[], unitId: string, updates: Partial<BattleUnit>) =>
              units.map(u => u.id === unitId ? { ...u, ...updates } : u);
            if (freshTarget.owner === 'player') {
              set(s => ({ playerUnits: updateUnit(s.playerUnits, freshTarget.id, knockUpdate) }));
            } else {
              set(s => ({ enemyUnits: updateUnit(s.enemyUnits, freshTarget.id, knockUpdate) }));
            }
            set(s => ({ turnOrder: updateUnit(s.turnOrder, freshTarget.id, knockUpdate) }));
            get().addBattleLog(`💨 ${freshTarget.avatar} отброшен!`);
          }
        }
        
        return result;
      }
    }
    
    // Calculate values for each target
    for (const target of targetUnits) {
      let value = 0;
      let statusApplied: StatusEffectType | undefined;
      
      // Damage calculation
      if (effect.damage || effect.damageMultiplier) {
        const baseDamage = effect.damage || Math.floor(getEffectiveStat(caster, 'attack') * (effect.damageMultiplier || 1));
        const dmgType = effect.damageType || caster.attackType;
        value = calculateDamage(baseDamage, dmgType, target.physicalDefense, target.magicalDefense);
        resultType = effect.area ? 'area' : 'damage';
      }
      
      // Heal
      if (effect.heal) {
        value = effect.heal;
        resultType = 'heal';
      }
      if (effect.healPercent) {
        value = Math.floor(target.maxHealth * effect.healPercent / 100);
        resultType = 'heal';
      }
      
      // Status effect
      if (effect.status) {
        statusApplied = effect.status;
        if (!value && !effect.damage && !effect.damageMultiplier && !effect.heal && !effect.healPercent) {
          resultType = 'status';
        }
      }
      
      // Stat buffs (no damage value, it's a buff)
      if (effect.statBuffs && !effect.damage && !effect.damageMultiplier && !effect.heal && !effect.healPercent) {
        resultType = 'buff';
      }
      
      // Self-targeting buffs
      if (effect.guaranteedCrit || effect.ignoreRangePenalty) {
        resultType = 'buff';
      }
      
      targets.push({ unit: target, value, statusApplied });
    }
    
    // Determine message
    if (resultType === 'heal') {
      const targetName = targetUnits.length === 1 ? targetUnits[0].name : 'союзников';
      message = `${caster.avatar} исцеляет ${targetName}!`;
    } else if (resultType === 'buff' || resultType === 'status') {
      message = `${caster.avatar} активирует ${skill.name}!`;
    } else if (resultType === 'area') {
      message = `${caster.avatar} выпускает ${skill.name}!`;
    } else {
      message = `${caster.avatar} наносит ${skill.name}!`;
    }
    
    const result: SkillResult = { type: resultType, targets, message };
    applySkillResults(get, set, caster, skill, skillType, result, effect);
    return result;
  },
  
  selectedHeroId: null,
  setSelectedHeroId: (id) => set({ selectedHeroId: id }),
}));

// ===== UNIVERSAL RESULT APPLICATION =====
// This function applies skill results without knowing which hero used it

function applySkillResults(
  get: () => GameState,
  set: (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void,
  caster: BattleUnit,
  skill: Skill,
  skillType: 'active' | 'ultimate',
  result: SkillResult,
  effect?: SkillEffect
) {
  const updateUnit = (units: BattleUnit[], unitId: string, updates: Partial<BattleUnit>) =>
    units.map(u => u.id === unitId ? { ...u, ...updates } : u);
  
  // Process each target
  for (const { unit: target, value, statusApplied } of result.targets) {
    const updates: Partial<BattleUnit> = {};
    
    if (result.type === 'damage' || result.type === 'area') {
      const newHealth = Math.max(0, target.currentHealth - value);
      const isDead = newHealth === 0;
      updates.currentHealth = newHealth;
      updates.isDead = isDead;
      
      if (isDead) {
        get().addBattleLog(`☠️ ${target.name} повержен!`);
      }
    } else if (result.type === 'heal') {
      // Check frozen — can't heal frozen units
      if (!hasStatus(target, 'frozen')) {
        const newHealth = Math.min(target.maxHealth, target.currentHealth + value);
        updates.currentHealth = newHealth;
        
        // Healing removes bleeding
        if (hasStatus(target, 'bleeding')) {
          updates.statusEffects = target.statusEffects.filter(e => e.type !== 'bleeding');
          get().addBattleLog(`🩸 Кровотечение снято с ${target.avatar} лечением`);
        }
      }
    }
    
    // Apply status effect
    if (statusApplied && effect) {
      const updatedTarget = applyStatusToUnit(
        { ...target, ...updates } as BattleUnit,
        statusApplied,
        effect.statusDuration || 1,
        effect.statusStacks,
        caster.id
      );
      updates.statusEffects = updatedTarget.statusEffects;
    }
    
    // Apply stat buffs to target
    if (effect?.statBuffs) {
      const newBuffs = [...(target.temporaryBuffs || [])];
      for (const buff of effect.statBuffs) {
        newBuffs.push({
          stat: buff.stat,
          value: buff.value,
          isPercent: buff.isPercent,
          duration: buff.duration,
          sourceSkillId: skill.id,
        });
      }
      updates.temporaryBuffs = newBuffs;
    }
    
    // Apply guaranteed crit / ignore range penalty flags
    if (effect?.guaranteedCrit) {
      updates.guaranteedCrit = true;
    }
    if (effect?.ignoreRangePenalty) {
      updates.ignoreRangePenalty = true;
    }
    
    if (Object.keys(updates).length > 0) {
      if (target.owner === 'player') {
        set(s => ({ playerUnits: updateUnit(s.playerUnits, target.id, updates) }));
      } else {
        set(s => ({ enemyUnits: updateUnit(s.enemyUnits, target.id, updates) }));
      }
      set(s => ({ turnOrder: updateUnit(s.turnOrder, target.id, updates) }));
    }
  }
  
  // Apply self-damage to caster
  if (effect?.selfDamage || effect?.selfDamagePercent) {
    const dmg = effect.selfDamage || Math.floor(caster.maxHealth * (effect.selfDamagePercent || 0) / 100);
    const newHealth = Math.max(1, caster.currentHealth - dmg); // Don't kill self
    const casterDmgUpdates = { currentHealth: newHealth };
    if (caster.owner === 'player') {
      set(s => ({ playerUnits: updateUnit(s.playerUnits, caster.id, casterDmgUpdates) }));
    } else {
      set(s => ({ enemyUnits: updateUnit(s.enemyUnits, caster.id, casterDmgUpdates) }));
    }
    set(s => ({ turnOrder: updateUnit(s.turnOrder, caster.id, casterDmgUpdates) }));
    get().addBattleLog(`💔 ${caster.avatar} теряет ${dmg} HP`);
  }
  
  // Update caster energy and action state
  let casterEnergy = caster.currentEnergy;
  if (skillType === 'ultimate') {
    casterEnergy = Math.max(0, caster.currentEnergy - (skill.energyCost || 100));
  } else {
    casterEnergy = Math.min(caster.maxEnergy, caster.currentEnergy + 10);
  }
  
  const casterUpdates: Partial<BattleUnit> = { 
    hasActed: true, 
    currentEnergy: casterEnergy,
  };
  
  // Costs movement point (e.g. Precise Shot)
  if (effect?.costsMovementPoint) {
    casterUpdates.hasMoved = true;
    casterUpdates.hasActed = false; // Doesn't cost action point
  }
  
  // Set cooldown
  if (skill.cooldown && skillType === 'active') {
    casterUpdates.skillCooldowns = { ...(caster.skillCooldowns || {}), [skill.id]: skill.cooldown };
  }
  
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
}
