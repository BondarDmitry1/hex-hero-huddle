import { useState } from 'react';
import { heroes, Hero, HeroRole } from '@/data/heroes';
import { useGameStore } from '@/store/gameStore';
import { HeroCard } from './HeroCard';
import { HeroDetail } from './HeroDetail';
import { ArrowLeft } from 'lucide-react';

export const HeroesGallery = () => {
  const { setPhase } = useGameStore();
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [filterRole, setFilterRole] = useState<HeroRole | 'all'>('all');

  const filteredHeroes = filterRole === 'all' 
    ? heroes 
    : heroes.filter(h => h.role === filterRole);

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setPhase('menu')}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold text-primary">Герои</h1>
            <p className="text-muted-foreground">Коллекция доступных героев</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'tank', 'attack', 'support'] as const).map((role) => {
            const label = {
              all: 'Все',
              tank: '🛡️ Танки',
              attack: '⚔️ Атака',
              support: '✨ Поддержка',
            }[role];

            return (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-4 py-2 rounded-lg font-display text-sm transition-all ${
                  filterRole === role
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Heroes grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredHeroes.map((hero) => (
            <HeroCard
              key={hero.id}
              hero={hero}
              onClick={() => setSelectedHero(hero)}
            />
          ))}
        </div>

        {filteredHeroes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Нет героев с выбранной ролью
          </div>
        )}
      </div>

      {/* Hero detail modal */}
      {selectedHero && (
        <HeroDetail hero={selectedHero} onClose={() => setSelectedHero(null)} />
      )}
    </div>
  );
};
