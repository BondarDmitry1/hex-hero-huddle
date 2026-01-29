import { BattleUnit, SkillMode } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Zap, Target, X, Shield } from 'lucide-react';

interface SkillPanelProps {
  unit: BattleUnit;
  onUseSkill: (skillType: 'active' | 'ultimate') => void;
  skillMode?: SkillMode;
  isViewOnly?: boolean;
  isCompact?: boolean;
}

export const SkillPanel = ({ unit, onUseSkill, skillMode, isViewOnly = false, isCompact = false }: SkillPanelProps) => {
  const canUseUltimate = unit.currentEnergy >= (unit.skills.ultimate.energyCost || 100);
  const isActiveMode = skillMode === 'active';
  const isUltimateMode = skillMode === 'ultimate';
  
  // Compact horizontal layout for bottom panel
  if (isCompact) {
    return (
      <div className="flex items-center gap-4">
        {/* Hero info */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">{unit.avatar}</span>
          <div>
            <h3 className="font-display font-semibold text-foreground">{unit.name}</h3>
            <div className="flex gap-2 text-xs">
              <span className="text-health">❤️ {unit.currentHealth}/{unit.maxHealth}</span>
              <span className="text-energy">⚡ {unit.currentEnergy}/{unit.maxEnergy}</span>
            </div>
          </div>
        </div>

        {/* Stats compact */}
        <div className="flex gap-2 text-xs">
          <div className="bg-muted rounded px-2 py-1">
            <span className={cn(
              unit.attackType === 'physical' ? 'text-orange-400' : 'text-violet-400'
            )}>
              {unit.attackType === 'physical' ? '⚔️' : '✨'} {unit.attack}
            </span>
          </div>
          <div className="bg-muted rounded px-2 py-1 flex items-center gap-1">
            <Shield className="w-3 h-3 text-orange-400" />
            <span className="text-orange-400">{unit.physicalDefense}</span>
            <Shield className="w-3 h-3 text-violet-400 ml-1" />
            <span className="text-violet-400">{unit.magicalDefense}</span>
          </div>
        </div>

        {/* Skills row */}
        <div className="flex-1 flex gap-2">
          {/* Active */}
          <button
            onClick={() => onUseSkill('active')}
            disabled={unit.hasActed}
            className={cn(
              'flex-1 border rounded-lg px-3 py-2 text-left transition-all',
              isActiveMode 
                ? 'bg-amber-700/40 border-amber-400 ring-2 ring-amber-400/50' 
                : !unit.hasActed 
                  ? 'bg-amber-900/20 border-amber-500/30 hover:bg-amber-900/40 cursor-pointer'
                  : 'bg-amber-900/10 border-amber-500/20 opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-2">
              <span>🟡</span>
              <span className="font-display text-sm text-amber-300">{unit.skills.active.name}</span>
              {isActiveMode && <X className="w-3 h-3 ml-auto text-amber-400" />}
            </div>
          </button>

          {/* Ultimate */}
          <button
            onClick={() => onUseSkill('ultimate')}
            disabled={!canUseUltimate || unit.hasActed}
            className={cn(
              'flex-1 border rounded-lg px-3 py-2 text-left transition-all relative overflow-hidden',
              isUltimateMode
                ? 'bg-purple-700/40 border-purple-400 ring-2 ring-purple-400/50'
                : canUseUltimate && !unit.hasActed
                  ? 'bg-purple-900/30 border-purple-500/50 hover:bg-purple-900/50 cursor-pointer'
                  : 'bg-purple-900/10 border-purple-500/20 opacity-50 cursor-not-allowed'
            )}
          >
            <div 
              className="absolute inset-0 bg-purple-500/10 transition-all duration-500"
              style={{ width: `${(unit.currentEnergy / unit.maxEnergy) * 100}%` }}
            />
            <div className="relative flex items-center gap-2">
              <span>🟣</span>
              <span className="font-display text-sm text-purple-300">{unit.skills.ultimate.name}</span>
              <span className="text-[10px] text-purple-400 ml-auto flex items-center gap-1">
                {isUltimateMode ? <X className="w-3 h-3" /> : <><Zap className="w-3 h-3" />{unit.skills.ultimate.energyCost}</>}
              </span>
            </div>
          </button>
        </div>

        {/* Status */}
        {(unit.hasMoved || unit.hasActed) && (
          <div className="flex gap-2 text-xs">
            {unit.hasMoved && <span className="px-2 py-1 bg-muted rounded">✓ Перемещён</span>}
            {unit.hasActed && <span className="px-2 py-1 bg-muted rounded">✓ Действие</span>}
          </div>
        )}
      </div>
    );
  }
  
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
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="bg-muted rounded p-2 text-center">
          <p className="text-muted-foreground">Атака</p>
          <p className={cn(
            "font-semibold flex items-center justify-center gap-1",
            unit.attackType === 'physical' ? 'text-orange-400' : 'text-violet-400'
          )}>
            {unit.attackType === 'physical' ? '⚔️' : '✨'}
            {unit.attack}
          </p>
        </div>
        <div className="bg-muted rounded p-2 text-center">
          <p className="text-muted-foreground">Защита</p>
          <p className="font-semibold flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-orange-400" />
            <span className="text-orange-400">{unit.physicalDefense}</span>
            <Shield className="w-3 h-3 text-violet-400 ml-1" />
            <span className="text-violet-400">{unit.magicalDefense}</span>
          </p>
        </div>
        <div className="bg-muted rounded p-2 text-center">
          <p className="text-muted-foreground">Дальность</p>
          <p className="font-semibold">{unit.attackRange === 'melee' ? '⚔️ 1' : `🏹 ${unit.range}`}</p>
        </div>
        <div className="bg-muted rounded p-2 text-center">
          <p className="text-muted-foreground">Скорость</p>
          <p className="font-semibold text-support">{unit.speed}</p>
        </div>
      </div>

      {/* Skill mode indicator */}
      {skillMode && !isViewOnly && (
        <div className={cn(
          'mb-3 px-3 py-2 rounded-lg text-center text-sm font-display animate-pulse',
          isActiveMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
          'bg-purple-500/20 text-purple-300 border border-purple-500/50'
        )}>
          <Target className="w-4 h-4 inline mr-2" />
          Выберите цель для {isActiveMode ? 'способности' : 'ульты'}
        </div>
      )}

      {/* Skills */}
      <div className="space-y-2">
        {/* Passive */}
        <div className="bg-sky-900/20 border border-sky-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔵</span>
            <span className="font-display text-sm text-sky-300">{unit.skills.passive.name}</span>
            <span className="text-[10px] text-sky-400 ml-auto">ПАССИВНЫЙ</span>
          </div>
          <p className="text-xs text-muted-foreground">{unit.skills.passive.description}</p>
        </div>

        {/* Active */}
        {isViewOnly ? (
          <div className="w-full bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🟡</span>
              <span className="font-display text-sm text-amber-300">{unit.skills.active.name}</span>
              <span className="text-[10px] text-amber-400 ml-auto">АКТИВНЫЙ</span>
            </div>
            <p className="text-xs text-muted-foreground">{unit.skills.active.description}</p>
          </div>
        ) : (
          <button
            onClick={() => onUseSkill('active')}
            disabled={unit.hasActed}
            className={cn(
              'w-full border rounded-lg p-3 text-left transition-all relative overflow-hidden',
              isActiveMode 
                ? 'bg-amber-700/40 border-amber-400 ring-2 ring-amber-400/50' 
                : !unit.hasActed 
                  ? 'bg-amber-900/20 border-amber-500/30 hover:bg-amber-900/40 hover:border-amber-500/50 cursor-pointer'
                  : 'bg-amber-900/10 border-amber-500/20 opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🟡</span>
              <span className="font-display text-sm text-amber-300">{unit.skills.active.name}</span>
              <span className="text-[10px] text-amber-400 ml-auto flex items-center gap-1">
                {isActiveMode ? (
                  <>
                    <X className="w-3 h-3" />
                    ОТМЕНА
                  </>
                ) : (
                  'АКТИВНЫЙ'
                )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{unit.skills.active.description}</p>
          </button>
        )}

        {/* Ultimate */}
        {isViewOnly ? (
          <div className="w-full bg-purple-900/30 border border-purple-500/50 rounded-lg p-3 relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-purple-500/10 transition-all duration-500"
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
          </div>
        ) : (
          <button
            onClick={() => onUseSkill('ultimate')}
            disabled={!canUseUltimate || unit.hasActed}
            className={cn(
              'w-full border rounded-lg p-3 text-left transition-all relative overflow-hidden',
              isUltimateMode
                ? 'bg-purple-700/40 border-purple-400 ring-2 ring-purple-400/50'
                : canUseUltimate && !unit.hasActed
                  ? 'bg-purple-900/30 border-purple-500/50 hover:bg-purple-900/50 cursor-pointer'
                  : 'bg-purple-900/10 border-purple-500/20 opacity-50 cursor-not-allowed'
            )}
          >
            {/* Energy fill indicator */}
            <div 
              className="absolute inset-0 bg-purple-500/10 transition-all duration-500"
              style={{ width: `${(unit.currentEnergy / unit.maxEnergy) * 100}%` }}
            />
            
            <div className="relative flex items-center gap-2 mb-1">
              <span className="text-lg">🟣</span>
              <span className="font-display text-sm text-purple-300">{unit.skills.ultimate.name}</span>
              <span className="text-[10px] text-purple-400 ml-auto flex items-center gap-1">
                {isUltimateMode ? (
                  <>
                    <X className="w-3 h-3" />
                    ОТМЕНА
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    {unit.skills.ultimate.energyCost}
                  </>
                )}
              </span>
            </div>
            <p className="relative text-xs text-muted-foreground">{unit.skills.ultimate.description}</p>
          </button>
        )}
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
