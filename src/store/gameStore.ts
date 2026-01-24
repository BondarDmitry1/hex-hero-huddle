import { create } from 'zustand';
import { Hero, heroes, calculateDamage } from '@/data/heroes';

export type GamePhase = 'menu' | 'heroes' | 'draft' | 'placement' | 'battle';
export type Player = 'player' | 'enemy';

export interface BattleUnit extends Hero {
  owner: Player;
  position: { q: number; r: number } | null;
  currentHealth: number;
  currentEnergy: number;
  hasMoved: boolean;
  hasActed: boolean;
  isDead: boolean;
}

interface GameState {
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
  
  // Draft state
  playerDraft: Hero[];
  enemyDraft: Hero[];
  availableHeroes: Hero[];
  currentDrafter: Player;
  addToDraft: (hero: Hero, player: Player) => void;
  resetDraft: () => void;
  
  // Battle state
  playerUnits: BattleUnit[];
  enemyUnits: BattleUnit[];
  currentTurn: Player;
  turnOrder: BattleUnit[];
  currentUnitIndex: number;
  selectedUnit: BattleUnit | null;
  hoveredUnit: BattleUnit | null;
  
  initializeBattle: () => void;
  setSelectedUnit: (unit: BattleUnit | null) => void;
  setHoveredUnit: (unit: BattleUnit | null) => void;
  moveUnit: (unit: BattleUnit, position: { q: number; r: number }) => void;
  attackUnit: (attacker: BattleUnit, target: BattleUnit) => { damage: number; isCrit: boolean };
  endTurn: () => void;
  
  // Battle log
  battleLog: string[];
  addBattleLog: (message: string) => void;
  
  // Hero detail view
  selectedHeroId: string | null;
  setSelectedHeroId: (id: string | null) => void;
}

// Calculate hex distance
export const hexDistance = (a: { q: number; r: number }, b: { q: number; r: number }): number => {
  return Math.max(
    Math.abs(a.q - b.q),
    Math.abs(a.r - b.r),
    Math.abs((a.q + a.r) - (b.q + b.r))
  );
};

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  setPhase: (phase) => set({ phase }),
  
  // Draft
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
    
    // Auto-pick for enemy (simple AI)
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
    
    // Check if draft is complete
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
  
  // Battle
  playerUnits: [],
  enemyUnits: [],
  currentTurn: 'player',
  turnOrder: [],
  currentUnitIndex: 0,
  selectedUnit: null,
  hoveredUnit: null,
  battleLog: [],
  
  addBattleLog: (message) => {
    set(state => ({ battleLog: [...state.battleLog.slice(-19), message] }));
  },
  
  initializeBattle: () => {
    const state = get();
    
    const playerUnits: BattleUnit[] = state.playerDraft.map((hero, index) => ({
      ...hero,
      owner: 'player' as Player,
      position: { q: 0, r: 2 + index * 2 },
      currentHealth: hero.health,
      currentEnergy: 0,
      hasMoved: false,
      hasActed: false,
      isDead: false,
    }));
    
    const enemyUnits: BattleUnit[] = state.enemyDraft.map((hero, index) => ({
      ...hero,
      owner: 'enemy' as Player,
      position: { q: 11, r: 2 + index * 2 },
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
    
    // Update turn order and selected unit
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
    
    // Check if in range
    if (attacker.attackRange === 'melee' && distance > attacker.range) {
      return { damage: 0, isCrit: false };
    }
    
    // Calculate base damage
    let damage = calculateDamage(
      attacker.attack,
      attacker.attackType,
      target.physicalDefense,
      target.magicalDefense
    );
    
    // Ranged penalty: half damage if > 5 hexes
    if (attacker.attackRange === 'ranged' && distance > 5) {
      damage = Math.floor(damage / 2);
    }
    
    // Simple crit chance (10%)
    const isCrit = Math.random() < 0.1;
    if (isCrit) {
      damage = Math.floor(damage * 1.5);
    }
    
    // Apply damage
    const newHealth = Math.max(0, target.currentHealth - damage);
    const isDead = newHealth === 0;
    
    // Energy gain
    const attackerEnergy = Math.min(attacker.maxEnergy, attacker.currentEnergy + 15);
    const targetEnergy = isDead ? 0 : Math.min(target.maxEnergy, target.currentEnergy + 10);
    
    const updateUnit = (units: BattleUnit[], unitId: string, updates: Partial<BattleUnit>) =>
      units.map(u => u.id === unitId ? { ...u, ...updates } : u);
    
    // Update attacker
    const attackerUpdates = { hasActed: true, currentEnergy: attackerEnergy };
    if (attacker.owner === 'player') {
      set({ playerUnits: updateUnit(state.playerUnits, attacker.id, attackerUpdates) });
    } else {
      set({ enemyUnits: updateUnit(state.enemyUnits, attacker.id, attackerUpdates) });
    }
    
    // Update target
    const targetUpdates = { currentHealth: newHealth, currentEnergy: targetEnergy, isDead };
    if (target.owner === 'player') {
      set({ playerUnits: updateUnit(state.playerUnits, target.id, targetUpdates) });
    } else {
      set({ enemyUnits: updateUnit(state.enemyUnits, target.id, targetUpdates) });
    }
    
    // Update turn order
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
    
    // Battle log
    const critText = isCrit ? ' 💥КРИТ!' : '';
    const distanceText = attacker.attackRange === 'ranged' && distance > 5 ? ' (дальность -50%)' : '';
    const killText = isDead ? ` ☠️ ${target.name} повержен!` : '';
    get().addBattleLog(`${attacker.avatar} ${attacker.name} атакует ${target.avatar} ${target.name}: ${damage} урона${critText}${distanceText}${killText}`);
    
    return { damage, isCrit };
  },
  
  endTurn: () => {
    const state = get();
    
    // Find next alive unit
    let nextIndex = state.currentUnitIndex;
    let attempts = 0;
    do {
      nextIndex = (nextIndex + 1) % state.turnOrder.length;
      attempts++;
    } while (state.turnOrder[nextIndex]?.isDead && attempts < state.turnOrder.length);
    
    // Reset all units when round completes
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
    });
  },
  
  // Hero detail
  selectedHeroId: null,
  setSelectedHeroId: (id) => set({ selectedHeroId: id }),
}));
