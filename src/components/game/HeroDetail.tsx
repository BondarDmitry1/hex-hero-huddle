import { Hero, calculateDamageReduction } from '@/data/heroes';
import { cn } from '@/lib/utils';
import { X, Heart, Swords, Shield, Zap, Move, Target, Crosshair, Sparkles } from 'lucide-react';

interface HeroDetailProps {
  hero: Hero;
  onClose: () => void;
}

export const HeroDetail = ({ hero, onClose }: HeroDetailProps) => {
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

  const attackTypeLabel = hero.attackType === 'physical' ? 'Физический' : 'Магический';
  const rangeLabel = hero.attackRange === 'melee' ? 'Ближний бой' : 'Дальний бой';

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="fantasy-border bg-card max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-b from-secondary to-card flex items-center justify-center">
          <span className="text-7xl">{hero.avatar}</span>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className={cn('role-badge', roleClass)}>{roleLabel}</span>
            <span className="role-badge bg-muted text-foreground border-border">
              {hero.attackRange === 'melee' ? '⚔️' : '🎯'} {rangeLabel}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Name and title */}
          <div className="mb-6">
            <h2 className="text-3xl font-display font-bold text-primary">{hero.name}</h2>
            <p className="text-lg text-muted-foreground">{hero.title}</p>
            <p className="mt-2 text-sm text-foreground/80">{hero.description}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <StatBox icon={<Heart className="w-5 h-5 text-health" />} label="Здоровье" value={hero.health} />
            <StatBox 
              icon={hero.attackType === 'physical' 
                ? <Swords className="w-5 h-5 text-orange-400" /> 
                : <Sparkles className="w-5 h-5 text-violet-400" />
              } 
              label={`Атака (${attackTypeLabel})`} 
              value={hero.attack} 
            />
            <StatBox 
              icon={hero.attackRange === 'melee' 
                ? <Target className="w-5 h-5 text-primary" /> 
                : <Crosshair className="w-5 h-5 text-primary" />
              } 
              label="Дальность" 
              value={`${hero.range} ${hero.range === 1 ? 'гекс' : 'гексов'}`} 
            />
            <StatBox 
              icon={<Shield className="w-5 h-5 text-orange-400" />} 
              label="Физ. Защита" 
              value={`${hero.physicalDefense} (${calculateDamageReduction(hero.physicalDefense)}%)`} 
            />
            <StatBox 
              icon={<Shield className="w-5 h-5 text-violet-400" />} 
              label="Маг. Защита" 
              value={`${hero.magicalDefense} (${calculateDamageReduction(hero.magicalDefense)}%)`} 
            />
            <StatBox icon={<Zap className="w-5 h-5 text-primary" />} label="Инициатива" value={hero.initiative} />
            <StatBox icon={<Move className="w-5 h-5 text-support" />} label="Скорость" value={`${hero.speed} гексов`} />
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <h3 className="text-xl font-display font-semibold text-primary">Навыки</h3>
            
            <SkillBox skill={hero.skills.passive} type="passive" />
            <SkillBox skill={hero.skills.active} type="active" />
            <SkillBox skill={hero.skills.ultimate} type="ultimate" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="bg-muted rounded-lg p-3 flex items-center gap-3">
    {icon}
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  </div>
);

const SkillBox = ({ skill, type }: { skill: { name: string; description: string; energyCost?: number }; type: 'passive' | 'active' | 'ultimate' }) => {
  const typeLabel = {
    passive: 'Пассивный',
    active: 'Активный',
    ultimate: 'Ультимативный',
  }[type];

  const typeClass = {
    passive: 'skill-passive',
    active: 'skill-active',
    ultimate: 'skill-ultimate',
  }[type];

  const typeIcon = {
    passive: '🔵',
    active: '🟡',
    ultimate: '🟣',
  }[type];

  return (
    <div className="bg-muted/50 rounded-lg p-4 border border-border">
      <div className="flex items-start gap-3">
        <div className={cn('skill-icon', typeClass)}>
          <span className="text-xl">{typeIcon}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-display font-semibold">{skill.name}</h4>
            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
              {typeLabel}
            </span>
            {skill.energyCost && (
              <span className="text-xs text-energy px-2 py-0.5 bg-energy/10 rounded">
                ⚡ {skill.energyCost}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground/80">{skill.description}</p>
        </div>
      </div>
    </div>
  );
};
