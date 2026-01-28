import { Hero } from '@/data/heroes';
import { cn } from '@/lib/utils';
import { Swords, Sparkles, Shield } from 'lucide-react';

interface HeroCardProps {
  hero: Hero;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

export const HeroCard = ({ hero, onClick, selected, disabled, compact }: HeroCardProps) => {
  const roleClass = {
    tank: 'role-tank',
    attack: 'role-attack',
    support: 'role-support',
  }[hero.role];

  const roleLabel = {
    tank: 'Танк',
    attack: 'Атака',
    support: 'Поддержка',
  }[hero.role];

  const rangeIcon = hero.attackRange === 'melee' ? '⚔️' : '🎯';
  const rangeLabel = hero.attackRange === 'melee' ? 'Ближний' : `Дальний (${hero.range})`;

  if (compact) {
    return (
      <div
        onClick={disabled ? undefined : onClick}
        className={cn(
          'hero-card p-2 flex items-center gap-2 cursor-pointer',
          selected && 'ring-2 ring-primary',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="text-2xl">{hero.avatar}</span>
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm truncate">{hero.name}</p>
          <div className="flex gap-1">
            <span className={cn('role-badge text-[10px]', roleClass)}>{roleLabel}</span>
            <span className="text-[10px] text-muted-foreground">{rangeIcon}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        'hero-card cursor-pointer group',
        selected && 'ring-2 ring-primary',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Avatar section */}
      <div className="h-24 bg-gradient-to-b from-muted to-card flex items-center justify-center relative overflow-hidden">
        <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
          {hero.avatar}
        </span>
        <div className="absolute top-2 right-2">
          <span className={cn('role-badge', roleClass)}>{roleLabel}</span>
        </div>
        <div className="absolute top-2 left-2">
          <span className="text-xs bg-muted/80 px-1.5 py-0.5 rounded" title={rangeLabel}>
            {rangeIcon} {hero.range}
          </span>
        </div>
      </div>

      {/* Info section */}
      <div className="p-3">
        <h3 className="font-display font-semibold text-foreground text-sm">{hero.name}</h3>
        <p className="text-xs text-muted-foreground mb-2">{hero.title}</p>

        {/* Stats preview */}
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-health">❤️</span>
            <span>{hero.health}</span>
          </div>
          <div className="flex items-center gap-1">
            {hero.attackType === 'physical' ? (
              <Swords className="w-3 h-3 text-orange-400" />
            ) : (
              <Sparkles className="w-3 h-3 text-violet-400" />
            )}
            <span>{hero.attack}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-orange-400" />
            <span>{hero.physicalDefense}</span>
            <Shield className="w-3 h-3 text-violet-400 ml-1" />
            <span>{hero.magicalDefense}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-primary">⚡</span>
            <span>{hero.initiative}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
