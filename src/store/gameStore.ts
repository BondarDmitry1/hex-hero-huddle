import { create } from 'zustand';
import { Hero, heroes } from '@/data/heroes';

export type GamePhase = 'menu' | 'heroes' | 'draft' | 'placement' | 'battle';
export type Player = 'player' | 'enemy';

export interface BattleUnit extends Hero {
  owner: Player;
  position: { q: number; r: number } | null;
  currentHealth: number;
  currentEnergy: number;
  hasMoved: boolean;
  hasActed: boolean;
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
  
  initializeBattle: () => void;
  setSelectedUnit: (unit: BattleUnit | null) => void;
  moveUnit: (unit: BattleUnit, position: { q: number; r: number }) => void;
  endTurn: () => void;
  
  // Hero detail view
  selectedHeroId: string | null;
  setSelectedHeroId: (id: string | null) => void;
}

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
  }),
  
  // Battle
  playerUnits: [],
  enemyUnits: [],
  currentTurn: 'player',
  turnOrder: [],
  currentUnitIndex: 0,
  selectedUnit: null,
  
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
    }));
    
    const enemyUnits: BattleUnit[] = state.enemyDraft.map((hero, index) => ({
      ...hero,
      owner: 'enemy' as Player,
      position: { q: 11, r: 2 + index * 2 },
      currentHealth: hero.health,
      currentEnergy: 0,
      hasMoved: false,
      hasActed: false,
    }));
    
    const allUnits = [...playerUnits, ...enemyUnits];
    const turnOrder = allUnits.sort((a, b) => b.initiative - a.initiative);
    
    set({
      playerUnits,
      enemyUnits,
      turnOrder,
      currentUnitIndex: 0,
      phase: 'battle',
    });
  },
  
  setSelectedUnit: (unit) => set({ selectedUnit: unit }),
  
  moveUnit: (unit, position) => {
    const state = get();
    const updateUnits = (units: BattleUnit[]) =>
      units.map(u => u.id === unit.id ? { ...u, position, hasMoved: true } : u);
    
    if (unit.owner === 'player') {
      set({ playerUnits: updateUnits(state.playerUnits) });
    } else {
      set({ enemyUnits: updateUnits(state.enemyUnits) });
    }
    
    // Update turn order
    set({
      turnOrder: state.turnOrder.map(u => u.id === unit.id ? { ...u, position, hasMoved: true } : u),
    });
  },
  
  endTurn: () => {
    const state = get();
    const nextIndex = (state.currentUnitIndex + 1) % state.turnOrder.length;
    
    // Reset all units when round completes
    if (nextIndex === 0) {
      const resetUnits = (units: BattleUnit[]) =>
        units.map(u => ({ ...u, hasMoved: false, hasActed: false }));
      
      set({
        playerUnits: resetUnits(state.playerUnits),
        enemyUnits: resetUnits(state.enemyUnits),
        turnOrder: resetUnits(state.turnOrder),
      });
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
