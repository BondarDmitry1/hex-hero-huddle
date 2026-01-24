import { BattleUnit } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface SkillPanelProps {
  unit: BattleUnit;
  onUseSkill: (skillType: 'active' | 'ultimate') => void;
}

export const SkillPanel = ({ unit, onUseSkill }: SkillPanelProps) => {
  const canUseUltimate = unit.currentEnergy >= (unit.skills.ultimate.energyCost || 100);
  
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{unit.avatar}</span>
        <div>
          <h3 className="font-display font-semibold text-foreground">{unit.name}</h3>
          <div className="flex gap-2 text-xs">
            <span className="text-health">❤️ {unit.currentHealth}/{unit.maxHealth}</span>
            <span className="text-energy">⚡ {unit.currentEnergy}/{unit.maxEnergy}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div className="bg-muted rounded p-2 text-center">
          <p className="text-muted-foreground">Атака</p>
          <p className="font-semibold text-destructive">{unit.attack}</p>
        </div>
        <div className="bg-muted rounded p-2 text-center">
          <p className="text-muted-foreground">Дальность</p>
          <p className="font-semibold">{unit.attackRange === 'melee' ? '⚔️ 1' : `🎯 ${unit.range}`}</p>
        </div>
        <div className="bg-muted rounded p-2 text-center">
          <p className="text-muted-foreground">Скорость</p>
          <p className="font-semibold text-support">{unit.speed}</p>
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-2">
        {/* Passive */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔵</span>
            <span className="font-display text-sm text-blue-300">{unit.skills.passive.name}</span>
            <span className="text-[10px] text-blue-400 ml-auto">ПАССИВНЫЙ</span>
          </div>
          <p className="text-xs text-muted-foreground">{unit.skills.passive.description}</p>
        </div>

        {/* Active */}
        <button
          onClick={() => onUseSkill('active')}
          disabled={unit.hasActed}
          className={cn(
            'w-full bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 text-left transition-all',
            !unit.hasActed && 'hover:bg-amber-900/40 hover:border-amber-500/50 cursor-pointer',
            unit.hasActed && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🟡</span>
            <span className="font-display text-sm text-amber-300">{unit.skills.active.name}</span>
            <span className="text-[10px] text-amber-400 ml-auto">АКТИВНЫЙ</span>
          </div>
          <p className="text-xs text-muted-foreground">{unit.skills.active.description}</p>
        </button>

        {/* Ultimate */}
        <button
          onClick={() => onUseSkill('ultimate')}
          disabled={!canUseUltimate || unit.hasActed}
          className={cn(
            'w-full border rounded-lg p-3 text-left transition-all relative overflow-hidden',
            canUseUltimate && !unit.hasActed
              ? 'bg-purple-900/30 border-purple-500/50 hover:bg-purple-900/50 cursor-pointer'
              : 'bg-purple-900/10 border-purple-500/20 opacity-50 cursor-not-allowed'
          )}
        >
          {/* Energy fill indicator */}
          <div 
            className="absolute inset-0 bg-purple-500/10 transition-all"
            style={{ width: `${(unit.currentEnergy / unit.maxEnergy) * 100}%` }}
          />
          
          <div className="relative flex items-center gap-2 mb-1">
            <span className="text-lg">🟣</span>
            <span className="font-display text-sm text-purple-300">{unit.skills.ultimate.name}</span>
            <span className="text-[10px] text-purple-400 ml-auto flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {unit.skills.ultimate.energyCost}
            </span>
          </div>
          <p className="relative text-xs text-muted-foreground">{unit.skills.ultimate.description}</p>
        </button>
      </div>

      {/* Status indicators */}
      <div className="flex gap-2 mt-4 text-xs">
        {unit.hasMoved && (
          <span className="px-2 py-1 bg-muted rounded text-muted-foreground">
            ✓ Перемещён
          </span>
        )}
        {unit.hasActed && (
          <span className="px-2 py-1 bg-muted rounded text-muted-foreground">
            ✓ Действие
          </span>
        )}
      </div>
    </div>
  );
};
