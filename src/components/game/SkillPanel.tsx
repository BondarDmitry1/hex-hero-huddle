import { BattleUnit, SkillMode } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Zap, Target, X, Shield, Footprints, Hand, Swords, Sparkles, Wind, Heart, Gauge } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const isPassiveActive = true; // По умолчанию пассивка всегда активна (условия отключения пропишем позже)
  
  // Compact horizontal layout for bottom panel
  if (isCompact) {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-3">
          {/* Hero avatar & name */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-default">
                <span className="text-3xl">{unit.avatar}</span>
                <div>
                  <h3 className="font-display font-semibold text-foreground text-sm">{unit.name}</h3>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">{unit.name}</p>
              <p className="text-xs text-muted-foreground">{unit.title || 'Герой'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Action Points */}
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-all cursor-default",
                    !unit.hasMoved 
                      ? "bg-green-900/40 border-green-500/60 text-green-300" 
                      : "bg-muted/50 border-muted-foreground/20 text-muted-foreground/50"
                  )}
                >
                  <Footprints className="w-4 h-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Очко перемещения</p>
                <p className="text-xs text-muted-foreground">
                  {!unit.hasMoved ? 'Доступно' : 'Использовано'}
                </p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-all cursor-default",
                    !unit.hasActed 
                      ? "bg-orange-900/40 border-orange-500/60 text-orange-300" 
                      : "bg-muted/50 border-muted-foreground/20 text-muted-foreground/50"
                  )}
                >
                  <Hand className="w-4 h-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Очко действия</p>
                <p className="text-xs text-muted-foreground">
                  {!unit.hasActed ? 'Доступно' : 'Использовано'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-border" />

          {/* All Stats */}
          <div className="flex gap-2 text-xs">
            {/* Health */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-2 py-1 flex items-center gap-1 cursor-default">
                  <Heart className="w-3 h-3 text-health" />
                  <span className="text-health">{unit.currentHealth}/{unit.maxHealth}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Здоровье</p>
                <p className="text-xs text-muted-foreground">Текущее / Максимальное</p>
              </TooltipContent>
            </Tooltip>

            {/* Energy */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-2 py-1 flex items-center gap-1 cursor-default">
                  <Zap className="w-3 h-3 text-energy" />
                  <span className="text-energy">{unit.currentEnergy}/{unit.maxEnergy}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Энергия</p>
                <p className="text-xs text-muted-foreground">Для ультимативной способности</p>
              </TooltipContent>
            </Tooltip>

            {/* Attack */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-2 py-1 flex items-center gap-1 cursor-default">
                  {unit.attackType === 'physical' ? (
                    <Swords className="w-3 h-3 text-orange-400" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-violet-400" />
                  )}
                  <span className={unit.attackType === 'physical' ? 'text-orange-400' : 'text-violet-400'}>
                    {unit.attack}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Атака ({unit.attackType === 'physical' ? 'физическая' : 'магическая'})</p>
                <p className="text-xs text-muted-foreground">Базовый урон атаки</p>
              </TooltipContent>
            </Tooltip>

            {/* Defense */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-2 py-1 flex items-center gap-1.5 cursor-default">
                  <Shield className="w-3 h-3 text-orange-400" />
                  <span className="text-orange-400">{unit.physicalDefense}</span>
                  <Shield className="w-3 h-3 text-violet-400" />
                  <span className="text-violet-400">{unit.magicalDefense}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Защита</p>
                <p className="text-xs text-muted-foreground">Физическая / Магическая</p>
                <p className="text-xs text-muted-foreground">Снижение урона: защита × 10%</p>
              </TooltipContent>
            </Tooltip>

            {/* Range */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-2 py-1 flex items-center gap-1 cursor-default">
                  <Target className="w-3 h-3 text-muted-foreground" />
                  <span>{unit.attackRange === 'melee' ? '1' : unit.range}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Дальность атаки</p>
                <p className="text-xs text-muted-foreground">
                  {unit.attackRange === 'melee' ? 'Ближний бой' : `Дальний бой (${unit.range} гексов)`}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Speed */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-2 py-1 flex items-center gap-1 cursor-default">
                  <Wind className="w-3 h-3 text-support" />
                  <span className="text-support">{unit.speed}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Скорость</p>
                <p className="text-xs text-muted-foreground">Гексов за ход</p>
              </TooltipContent>
            </Tooltip>

            {/* Initiative */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-2 py-1 flex items-center gap-1 cursor-default">
                  <Gauge className="w-3 h-3 text-primary" />
                  <span className="text-primary">{unit.initiative}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Инициатива</p>
                <p className="text-xs text-muted-foreground">Порядок хода в раунде</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-border" />

          {/* Status Effects placeholder */}
          <div className="flex gap-1 min-w-[60px]">
            {/* Здесь будут статус-эффекты */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-muted-foreground/50 cursor-default">
                  {/* Пустое место для эффектов */}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Статус-эффекты</p>
                <p className="text-xs text-muted-foreground">Нет активных эффектов</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-border" />

          {/* Skills as icons */}
          <div className="flex gap-2">
            {/* Passive - no frame */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded transition-all cursor-default',
                    isPassiveActive 
                      ? 'text-sky-300' 
                      : 'text-sky-300/30'
                  )}
                >
                  <span className="text-xl">🔵</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold text-sky-300">{unit.skills.passive.name}</p>
                <p className="text-xs text-muted-foreground">Пассивный навык</p>
                <p className="text-xs mt-1">{unit.skills.passive.description}</p>
              </TooltipContent>
            </Tooltip>

            {/* Active - framed */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onUseSkill('active')}
                  disabled={unit.hasActed}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all',
                    isActiveMode 
                      ? 'bg-amber-700/40 border-amber-400 ring-2 ring-amber-400/50' 
                      : !unit.hasActed 
                        ? 'bg-amber-900/20 border-amber-500/50 hover:bg-amber-900/40 cursor-pointer'
                        : 'bg-amber-900/10 border-amber-500/20 opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="text-xl">🟡</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold text-amber-300">{unit.skills.active.name}</p>
                <p className="text-xs text-muted-foreground">Активный навык</p>
                <p className="text-xs mt-1">{unit.skills.active.description}</p>
                {isActiveMode && <p className="text-xs text-amber-400 mt-1">Выберите цель (или нажмите для отмены)</p>}
              </TooltipContent>
            </Tooltip>

            {/* Ultimate - framed with energy fill */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onUseSkill('ultimate')}
                  disabled={!canUseUltimate || unit.hasActed}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all relative overflow-hidden',
                    isUltimateMode
                      ? 'bg-purple-700/40 border-purple-400 ring-2 ring-purple-400/50'
                      : canUseUltimate && !unit.hasActed
                        ? 'bg-purple-900/30 border-purple-500/50 hover:bg-purple-900/50 cursor-pointer'
                        : 'bg-purple-900/10 border-purple-500/20 opacity-50 cursor-not-allowed'
                  )}
                >
                  <div 
                    className="absolute inset-0 bg-purple-500/20 transition-all duration-500"
                    style={{ 
                      height: `${(unit.currentEnergy / unit.maxEnergy) * 100}%`,
                      bottom: 0,
                      top: 'auto'
                    }}
                  />
                  <span className="text-xl relative z-10">🟣</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold text-purple-300">{unit.skills.ultimate.name}</p>
                <p className="text-xs text-muted-foreground">Ультимативный навык • Требует {unit.skills.ultimate.energyCost} энергии</p>
                <p className="text-xs mt-1">{unit.skills.ultimate.description}</p>
                {!canUseUltimate && <p className="text-xs text-purple-400 mt-1">Недостаточно энергии ({unit.currentEnergy}/{unit.skills.ultimate.energyCost})</p>}
                {isUltimateMode && <p className="text-xs text-purple-400 mt-1">Выберите цель (или нажмите для отмены)</p>}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
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
