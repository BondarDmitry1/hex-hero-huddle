import { Hero, traitLabels, reactionLabels } from '@/data/heroes';
import { cn } from '@/lib/utils';
import { Swords, Sparkles, Shield, Heart, Zap, Wind, Gauge, Eye, RefreshCcw } from 'lucide-react';
import { getSkillIcon } from './SkillIcons';

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
      <div className="h-20 bg-gradient-to-b from-muted to-card flex items-center justify-center relative overflow-hidden">
        <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
          {hero.avatar}
        </span>
        <div className="absolute top-1.5 right-1.5">
          <span className={cn('role-badge text-[9px]', roleClass)}>{roleLabel}</span>
        </div>
        <div className="absolute top-1.5 left-1.5">
          <span className="text-[9px] bg-muted/80 px-1 py-0.5 rounded" title={rangeLabel}>
            {rangeIcon} {hero.range}
          </span>
        </div>
      </div>

      {/* Info section */}
      <div className="p-2">
        <h3 className="font-display font-semibold text-foreground text-xs leading-tight">{hero.name}</h3>
        <p className="text-[9px] text-muted-foreground mb-1.5">{hero.title}</p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-0.5 text-[9px] mb-1.5">
          <div className="flex items-center gap-0.5">
            <Heart className="w-2.5 h-2.5 text-health flex-shrink-0" />
            <span>{hero.health}</span>
          </div>
          <div className="flex items-center gap-0.5">
            {hero.attackType === 'physical' ? (
              <Swords className="w-2.5 h-2.5 text-orange-400 flex-shrink-0" />
            ) : (
              <Sparkles className="w-2.5 h-2.5 text-violet-400 flex-shrink-0" />
            )}
            <span>{hero.attack}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Shield className="w-2.5 h-2.5 text-orange-400 flex-shrink-0" />
            <span>{hero.physicalDefense}</span>
            <span className="text-muted-foreground/50">/</span>
            <Shield className="w-2.5 h-2.5 text-violet-400 flex-shrink-0" />
            <span>{hero.magicalDefense}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Gauge className="w-2.5 h-2.5 text-primary flex-shrink-0" />
            <span>{hero.initiative}</span>
            <Wind className="w-2.5 h-2.5 text-support flex-shrink-0 ml-0.5" />
            <span>{hero.speed}</span>
          </div>
        </div>

        {/* Trait & Reaction */}
        <div className="flex gap-1 text-[8px] mb-1.5">
          {hero.trait !== 'none' && (
            <span className="flex items-center gap-0.5 px-1 py-0.5 bg-amber-900/20 border border-amber-500/30 rounded text-amber-400">
              <Eye className="w-2 h-2" />
              {traitLabels[hero.trait]}
            </span>
          )}
          {hero.reaction !== 'none' && (
            <span className="flex items-center gap-0.5 px-1 py-0.5 bg-yellow-900/20 border border-yellow-500/30 rounded text-yellow-400">
              <RefreshCcw className="w-2 h-2" />
              {reactionLabels[hero.reaction]}
            </span>
          )}
        </div>

        {/* Skills */}
        <div className="flex gap-1 items-center">
          <div className="flex items-center gap-0.5 text-sky-300" title={hero.skills.passive.name}>
            {getSkillIcon(hero.skills.passive.id, 'sm')}
          </div>
          <div className="flex items-center gap-0.5 text-amber-400" title={hero.skills.active.name}>
            {getSkillIcon(hero.skills.active.id, 'sm')}
          </div>
          <div className="flex items-center gap-0.5 text-purple-400" title={hero.skills.ultimate.name}>
            {getSkillIcon(hero.skills.ultimate.id, 'sm')}
          </div>
          <span className="text-[8px] text-muted-foreground ml-auto">{hero.skills.ultimate.energyCost}⚡</span>
        </div>
      </div>
    </div>
  );
};
