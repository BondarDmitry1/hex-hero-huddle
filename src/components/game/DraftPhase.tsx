import { useGameStore } from '@/store/gameStore';
import { HeroCard } from './HeroCard';
import { ArrowLeft } from 'lucide-react';

export const DraftPhase = () => {
  const { 
    setPhase, 
    playerDraft, 
    enemyDraft, 
    availableHeroes, 
    currentDrafter, 
    addToDraft 
  } = useGameStore();

  const isPlayerTurn = currentDrafter === 'player';
  const isDraftComplete = playerDraft.length === 5 && enemyDraft.length === 5;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPhase('menu')}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold text-primary">Драфт</h1>
              <p className="text-sm text-muted-foreground">
                Выберите 5 героев для битвы
              </p>
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-lg font-display ${
            isDraftComplete 
              ? 'bg-health/20 text-health' 
              : isPlayerTurn 
                ? 'bg-primary/20 text-primary animate-pulse' 
                : 'bg-destructive/20 text-destructive'
          }`}>
            {isDraftComplete 
              ? '✓ Готово к бою!' 
              : isPlayerTurn 
                ? 'Ваш выбор' 
                : 'Противник выбирает...'}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Player draft */}
        <div className="w-48 bg-secondary/30 border-r border-border p-4 flex flex-col">
          <h2 className="font-display font-semibold text-health mb-4 text-center">
            Ваша команда
          </h2>
          <div className="space-y-2 flex-1">
            {playerDraft.map((hero) => (
              <HeroCard key={hero.id} hero={hero} compact />
            ))}
            {Array.from({ length: 5 - playerDraft.length }).map((_, i) => (
              <div
                key={`empty-player-${i}`}
                className="h-14 rounded-lg border-2 border-dashed border-health/30 flex items-center justify-center text-health/50"
              >
                ?
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-muted-foreground mt-4">
            {playerDraft.length}/5
          </div>
        </div>

        {/* Hero pool */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {availableHeroes.map((hero) => (
              <HeroCard
                key={hero.id}
                hero={hero}
                onClick={() => addToDraft(hero, 'player')}
                disabled={!isPlayerTurn || playerDraft.length >= 5}
              />
            ))}
          </div>
          
          {availableHeroes.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground font-display text-lg">
                Все герои выбраны!
              </p>
            </div>
          )}
        </div>

        {/* Enemy draft */}
        <div className="w-48 bg-secondary/30 border-l border-border p-4 flex flex-col">
          <h2 className="font-display font-semibold text-destructive mb-4 text-center">
            Команда врага
          </h2>
          <div className="space-y-2 flex-1">
            {enemyDraft.map((hero) => (
              <HeroCard key={hero.id} hero={hero} compact />
            ))}
            {Array.from({ length: 5 - enemyDraft.length }).map((_, i) => (
              <div
                key={`empty-enemy-${i}`}
                className="h-14 rounded-lg border-2 border-dashed border-destructive/30 flex items-center justify-center text-destructive/50"
              >
                ?
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-muted-foreground mt-4">
            {enemyDraft.length}/5
          </div>
        </div>
      </div>
    </div>
  );
};
