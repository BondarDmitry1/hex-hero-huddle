import { useState } from 'react';
import { heroes, Hero, HeroRole, AttackRange } from '@/data/heroes';
import { useGameStore } from '@/store/gameStore';
import { HeroCard } from './HeroCard';
import { HeroDetail } from './HeroDetail';
import { ArrowLeft } from 'lucide-react';

export const HeroesGallery = () => {
  const { setPhase } = useGameStore();
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [filterRole, setFilterRole] = useState<HeroRole | 'all'>('all');
  const [filterRange, setFilterRange] = useState<AttackRange | 'all'>('all');

  const filteredHeroes = heroes.filter(h => {
    const roleMatch = filterRole === 'all' || h.role === filterRole;
    const rangeMatch = filterRange === 'all' || h.attackRange === filterRange;
    return roleMatch && rangeMatch;
  });

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
            <p className="text-muted-foreground">Коллекция доступных героев ({heroes.length})</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Role filter */}
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground self-center mr-2">Роль:</span>
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
                  className={`px-3 py-1.5 rounded-lg font-display text-sm transition-all ${
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

          {/* Range filter */}
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground self-center mr-2">Дальность:</span>
            {(['all', 'melee', 'ranged'] as const).map((range) => {
              const label = {
                all: 'Все',
                melee: '⚔️ Ближний',
                ranged: '🎯 Дальний',
              }[range];

              return (
                <button
                  key={range}
                  onClick={() => setFilterRange(range)}
                  className={`px-3 py-1.5 rounded-lg font-display text-sm transition-all ${
                    filterRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
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
            Нет героев с выбранными фильтрами
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
