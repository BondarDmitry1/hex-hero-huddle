import { create } from 'zustand';
import { Hero, heroes, calculateDamage } from '@/data/heroes';

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
  buffs?: { type: string; duration: number; value?: number }[];
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
  moveUnit: (unit: BattleUnit, position: { q: number; r: number }) => void;
  attackUnit: (attacker: BattleUnit, target: BattleUnit) => { damage: number; isCrit: boolean };
  useSkill: (caster: BattleUnit, targetPos: { q: number; r: number }, skillType: 'active' | 'ultimate') => SkillResult | null;
  endTurn: () => void;
  
  battleLog: string[];
  addBattleLog: (message: string) => void;
  
  selectedHeroId: string | null;
  setSelectedHeroId: (id: string | null) => void;
}

// Convert offset coordinates to cube coordinates for accurate distance (odd-r layout)
const offsetToCube = (q: number, r: number) => {
  // Для odd-r offset: нечётные ряды сдвинуты вправо
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
    
    // Position units on smaller grid (10 wide)
    const playerUnits: BattleUnit[] = state.playerDraft.map((hero, index) => ({
      ...hero,
      owner: 'player' as Player,
      position: { q: 0, r: 1 + index * 2 },
      currentHealth: hero.health,
      currentEnergy: 0,
      hasMoved: false,
      hasActed: false,
      isDead: false,
    }));
    
    const enemyUnits: BattleUnit[] = state.enemyDraft.map((hero, index) => ({
      ...hero,
      owner: 'enemy' as Player,
      position: { q: 9, r: 1 + index * 2 },
      currentHealth: hero.health,
      currentEnergy: 0,
      hasMoved: false,
      hasActed: false,
      isDead: false,
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
    
    let damage = calculateDamage(
      attacker.attack,
      attacker.attackType,
      target.physicalDefense,
      target.magicalDefense
    );
    
    // Стрелки: если враг вплотную (distance === 1), атакуют как ближний бой с уроном /3
    // Если враг далеко (distance > 5), урон /2
    let forcedMelee = false;
    if (attacker.attackRange === 'ranged') {
      if (distance === 1) {
        // Враг вплотную - стрелок атакует в ближнем бою с уроном x1/3
        damage = Math.floor(damage / 3);
        forcedMelee = true;
      } else if (distance > 5) {
        damage = Math.floor(damage / 2);
      }
    }
    
    const isCrit = Math.random() < 0.1;
    if (isCrit) {
      damage = Math.floor(damage * 1.5);
    }
    
    const newHealth = Math.max(0, target.currentHealth - damage);
    const isDead = newHealth === 0;
    
    const attackerEnergy = Math.min(attacker.maxEnergy, attacker.currentEnergy + 15);
    const targetEnergy = isDead ? 0 : Math.min(target.maxEnergy, target.currentEnergy + 10);
    
    const updateUnit = (units: BattleUnit[], unitId: string, updates: Partial<BattleUnit>) =>
      units.map(u => u.id === unitId ? { ...u, ...updates } : u);
    
    const attackerUpdates = { hasActed: true, currentEnergy: attackerEnergy };
    if (attacker.owner === 'player') {
      set({ playerUnits: updateUnit(state.playerUnits, attacker.id, attackerUpdates) });
    } else {
      set({ enemyUnits: updateUnit(state.enemyUnits, attacker.id, attackerUpdates) });
    }
    
    const targetUpdates = { currentHealth: newHealth, currentEnergy: targetEnergy, isDead };
    if (target.owner === 'player') {
      set({ playerUnits: updateUnit(state.playerUnits, target.id, targetUpdates) });
    } else {
      set({ enemyUnits: updateUnit(state.enemyUnits, target.id, targetUpdates) });
    }
    
    set({
      turnOrder: state.turnOrder.map(u => {
        if (u.id === attacker.id) return { ...u, ...attackerUpdates };
        if (u.id === target.id) return { ...u, ...targetUpdates };
        return u;
      }),
      selectedUnit: state.selectedUnit?.id === attacker.id 
        ? { ...state.selectedUnit, ...attackerUpdates } 
        : state.selectedUnit,
    });
    
    const critText = isCrit ? ' 💥КРИТ!' : '';
    let distanceText = '';
    if (attacker.attackRange === 'ranged') {
      if (forcedMelee) {
        distanceText = ' (ближний бой -66%)';
      } else if (distance > 5) {
        distanceText = ' (дальность -50%)';
      }
    }
    const killText = isDead ? ` ☠️ ${target.name} повержен!` : '';
    get().addBattleLog(`${attacker.avatar} → ${target.avatar}: ${damage} урона${critText}${distanceText}${killText}`);
    
    return { damage, isCrit };
  },
  
  endTurn: () => {
    const state = get();
    
    let nextIndex = state.currentUnitIndex;
    let attempts = 0;
    do {
      nextIndex = (nextIndex + 1) % state.turnOrder.length;
      attempts++;
    } while (state.turnOrder[nextIndex]?.isDead && attempts < state.turnOrder.length);
    
    if (nextIndex <= state.currentUnitIndex || attempts >= state.turnOrder.length) {
      const resetUnits = (units: BattleUnit[]) =>
        units.map(u => ({ ...u, hasMoved: false, hasActed: false }));
      
      set({
        playerUnits: resetUnits(state.playerUnits),
        enemyUnits: resetUnits(state.enemyUnits),
        turnOrder: resetUnits(state.turnOrder),
      });
      
      get().addBattleLog('🔄 Новый раунд!');
    }
    
    set({
      currentUnitIndex: nextIndex,
      selectedUnit: null,
      skillMode: null,
      skillRange: new Set<string>(),
    });
  },
  
  useSkill: (caster, targetPos, skillType) => {
    const state = get();
    const skill = skillType === 'active' ? caster.skills.active : caster.skills.ultimate;
    const allUnits = [...state.playerUnits, ...state.enemyUnits];
    
    // Find target at position
    const target = allUnits.find(u => 
      u.position?.q === targetPos.q && u.position?.r === targetPos.r && !u.isDead
    );
    
    // Handle different skill types based on hero
    let result: SkillResult | null = null;
    const targets: { unit: BattleUnit; value: number }[] = [];
    
    // Determine skill effect based on hero and skill
    if (skillType === 'ultimate' && caster.currentEnergy < (skill.energyCost || 100)) {
      return null;
    }
    
    // Get enemies and allies based on caster
    const enemies = caster.owner === 'player' ? state.enemyUnits : state.playerUnits;
    const allies = caster.owner === 'player' ? state.playerUnits : state.enemyUnits;
    
    // Calculate skill effects based on hero type
    switch (caster.id) {
      // Tank skills
      case 'ironclad':
      case 'stone_giant':
      case 'paladin':
        if (skillType === 'active') {
          // Area damage for tanks
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
          // Self buff for ultimate
          targets.push({ unit: caster, value: 50 });
          result = { type: 'buff', targets, message: `${caster.avatar} активирует ${skill.name}!` };
        }
        break;
        
      // Attack skills
      case 'shadow_blade':
      case 'berserker':
        if (skillType === 'active' && target) {
          const damage = Math.floor(caster.attack * 1.2);
          targets.push({ unit: target, value: damage });
          result = { type: 'damage', targets, message: `${caster.avatar} наносит ${skill.name}!` };
        } else if (skillType === 'ultimate') {
          // Hit all nearby enemies
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
          // Area magic damage
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
        
      // Support skills
      case 'light_priestess':
        if (skillType === 'active') {
          // Heal an ally
          const allyTarget = allies.find(a => 
            a.position?.q === targetPos.q && a.position?.r === targetPos.r && !a.isDead
          );
          if (allyTarget) {
            targets.push({ unit: allyTarget, value: 40 });
            result = { type: 'heal', targets, message: `${caster.avatar} исцеляет ${allyTarget.name}!` };
          }
        } else {
          // Heal all allies
          allies.filter(a => !a.isDead).forEach(a => {
            targets.push({ unit: a, value: 30 });
          });
          result = { type: 'heal', targets, message: `${caster.avatar} активирует ${skill.name}!` };
        }
        break;
        
      case 'war_drummer':
      case 'shaman':
        if (skillType === 'active') {
          // Buff allies
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
        // Generic damage skill
        if (target) {
          const damage = Math.floor(caster.attack * (skillType === 'ultimate' ? 1.5 : 1.0));
          targets.push({ unit: target, value: damage });
          result = { type: 'damage', targets, message: `${caster.avatar} использует ${skill.name}!` };
        }
    }
    
    if (!result || targets.length === 0) return null;
    
    // Apply effects
    const updateUnit = (units: BattleUnit[], unitId: string, updates: Partial<BattleUnit>) =>
      units.map(u => u.id === unitId ? { ...u, ...updates } : u);
    
    // Deduct energy for ultimate
    let casterEnergy = caster.currentEnergy;
    if (skillType === 'ultimate') {
      casterEnergy = Math.max(0, caster.currentEnergy - (skill.energyCost || 100));
    }
    
    // Apply to each target
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
    
    // Update caster
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
