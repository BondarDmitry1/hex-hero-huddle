import { BattleUnit, SkillMode } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { 
  Zap, Target, Shield, Footprints, Hand, Swords, Sparkles, 
  Wind, Heart, Gauge, Clock, ShieldPlus, Plus
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getSkillIcon } from './SkillIcons';

interface SkillPanelProps {
  unit: BattleUnit;
  onUseSkill: (skillType: 'active' | 'ultimate') => void;
  onWait?: () => void;
  onDefend?: () => void;
  skillMode?: SkillMode;
  isViewOnly?: boolean;
  isCompact?: boolean;
}

export const SkillPanel = ({ 
  unit, 
  onUseSkill, 
  onWait,
  onDefend,
  skillMode, 
  isViewOnly = false, 
  isCompact = false 
}: SkillPanelProps) => {
  const canUseUltimate = unit.currentEnergy >= (unit.skills.ultimate.energyCost || 100);
  const isActiveMode = skillMode === 'active';
  const isUltimateMode = skillMode === 'ultimate';
  const isPassiveActive = true; // По умолчанию пассивка всегда активна
  
  // Check for temporary defense buff
  const hasDefenseBuff = unit.buffs?.some(b => b.type === 'defense_boost');
  
  // Compact horizontal layout for bottom panel
  if (isCompact) {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-4 py-2 px-4">
          {/* Hero avatar & name */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-default min-w-[120px]">
                <span className="text-4xl">{unit.avatar}</span>
                <div>
                  <h3 className="font-display font-bold text-foreground text-base">{unit.name}</h3>
                  <p className="text-[10px] text-muted-foreground">{unit.title || 'Герой'}</p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">{unit.name}</p>
              <p className="text-xs text-muted-foreground">{unit.title || 'Герой'}</p>
              <p className="text-xs mt-1">{unit.role === 'tank' ? 'Танк' : unit.role === 'attack' ? 'Атакующий' : 'Поддержка'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Divider */}
          <div className="w-px h-12 bg-border" />

          {/* Status Effects placeholder - red for negative, green for positive */}
          <div className="flex gap-1 min-w-[80px] items-center justify-center">
            {hasDefenseBuff && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-7 h-7 rounded-full bg-green-900/40 border border-green-500/60 flex items-center justify-center cursor-default">
                    <ShieldPlus className="w-4 h-4 text-green-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-green-400 font-semibold">Готовность</p>
                  <p className="text-xs text-muted-foreground">+1 к обеим защитам до следующего хода</p>
                </TooltipContent>
              </Tooltip>
            )}
            {!hasDefenseBuff && unit.buffs?.length === 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground/40 cursor-default">—</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Статус-эффекты</p>
                  <p className="text-xs text-muted-foreground">Нет активных эффектов</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-border" />

          {/* Skills and Actions */}
          <div className="flex gap-2 items-center">
            {/* Active skill - framed */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onUseSkill('active')}
                  disabled={unit.hasActed}
                  className={cn(
                    'w-12 h-12 flex items-center justify-center rounded-lg border-2 transition-all',
                    isActiveMode 
                      ? 'bg-amber-700/40 border-amber-400 ring-2 ring-amber-400/50 text-amber-300' 
                      : !unit.hasActed 
                        ? 'bg-amber-900/20 border-amber-500/50 hover:bg-amber-900/40 cursor-pointer text-amber-400'
                        : 'bg-amber-900/10 border-amber-500/20 opacity-50 cursor-not-allowed text-amber-400/50'
                  )}
                >
                  {getSkillIcon(unit.skills.active.id, 'lg')}
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
                    'w-12 h-12 flex items-center justify-center rounded-lg border-2 transition-all relative overflow-hidden',
                    isUltimateMode
                      ? 'bg-purple-700/40 border-purple-400 ring-2 ring-purple-400/50'
                      : canUseUltimate && !unit.hasActed
                        ? 'bg-purple-900/30 border-purple-500/50 hover:bg-purple-900/50 cursor-pointer'
                        : 'bg-purple-900/10 border-purple-500/20 opacity-50 cursor-not-allowed'
                  )}
                >
                  <div 
                    className="absolute inset-0 bg-purple-500/30 transition-all duration-500"
                    style={{ 
                      height: `${(unit.currentEnergy / unit.maxEnergy) * 100}%`,
                      bottom: 0,
                      top: 'auto'
                    }}
                  />
                  <span className={cn(
                    "relative z-10",
                    canUseUltimate ? "text-purple-300" : "text-purple-400/50"
                  )}>
                    {getSkillIcon(unit.skills.ultimate.id, 'lg')}
                  </span>
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

            {/* Passive - no frame */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'w-10 h-10 flex items-center justify-center transition-all cursor-default',
                    isPassiveActive 
                      ? 'text-sky-300' 
                      : 'text-sky-300/30'
                  )}
                >
                  {getSkillIcon(unit.skills.passive.id, 'lg')}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold text-sky-300">{unit.skills.passive.name}</p>
                <p className="text-xs text-muted-foreground">Пассивный навык</p>
                <p className="text-xs mt-1">{unit.skills.passive.description}</p>
              </TooltipContent>
            </Tooltip>

            {/* Divider */}
            <div className="w-px h-10 bg-border mx-1" />

            {/* Wait action */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onWait}
                  disabled={!onWait}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all',
                    onWait
                      ? 'bg-slate-900/30 border-slate-500/50 hover:bg-slate-900/50 cursor-pointer text-slate-300'
                      : 'bg-slate-900/10 border-slate-500/20 opacity-50 cursor-not-allowed text-slate-400/50'
                  )}
                >
                  <Clock className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold text-slate-300">Ждать</p>
                <p className="text-xs text-muted-foreground">Герой перемещается в конец очереди инициативы</p>
                <p className="text-xs mt-1">Зеркально относительно середины: если ходил первым — станет последним, если вторым — предпоследним.</p>
              </TooltipContent>
            </Tooltip>

            {/* Defend action */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onDefend}
                  disabled={!onDefend || unit.hasActed}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all',
                    onDefend && !unit.hasActed
                      ? 'bg-cyan-900/30 border-cyan-500/50 hover:bg-cyan-900/50 cursor-pointer text-cyan-300'
                      : 'bg-cyan-900/10 border-cyan-500/20 opacity-50 cursor-not-allowed text-cyan-400/50'
                  )}
                >
                  <ShieldPlus className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold text-cyan-300">Готовность</p>
                <p className="text-xs text-muted-foreground">Расходует очко действия</p>
                <p className="text-xs mt-1">Получить +10 энергии и +1 к физической и магической защите до начала своего следующего хода.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-border" />

          {/* Action Points */}
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all cursor-default",
                    !unit.hasMoved 
                      ? "bg-green-900/40 border-green-500/60 text-green-300" 
                      : "bg-muted/50 border-muted-foreground/20 text-muted-foreground/50"
                  )}
                >
                  <Footprints className="w-5 h-5" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Очко перемещения</p>
                <p className="text-xs text-muted-foreground">
                  {!unit.hasMoved ? 'Доступно — можно переместиться' : 'Использовано'}
                </p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all cursor-default",
                    !unit.hasActed 
                      ? "bg-orange-900/40 border-orange-500/60 text-orange-300" 
                      : "bg-muted/50 border-muted-foreground/20 text-muted-foreground/50"
                  )}
                >
                  <Hand className="w-5 h-5" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Очко действия</p>
                <p className="text-xs text-muted-foreground">
                  {!unit.hasActed ? 'Доступно — можно атаковать или использовать способность' : 'Использовано'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-border" />

          {/* All Stats */}
          <div className="flex gap-2 text-sm">
            {/* Health */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 cursor-default">
                  <Heart className="w-4 h-4 text-health" />
                  <span className="text-health font-medium">{unit.currentHealth}/{unit.maxHealth}</span>
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
                <div className="bg-muted rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 cursor-default">
                  <Zap className="w-4 h-4 text-energy" />
                  <span className="text-energy font-medium">{unit.currentEnergy}/{unit.maxEnergy}</span>
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
                <div className="bg-muted rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 cursor-default">
                  {unit.attackType === 'physical' ? (
                    <Swords className="w-4 h-4 text-orange-400" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-violet-400" />
                  )}
                  <span className={cn("font-medium", unit.attackType === 'physical' ? 'text-orange-400' : 'text-violet-400')}>
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
                <div className="bg-muted rounded-lg px-2.5 py-1.5 flex items-center gap-2 cursor-default">
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-orange-400" />
                    <span className="text-orange-400 font-medium">
                      {unit.physicalDefense + (hasDefenseBuff ? 1 : 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-violet-400" />
                    <span className="text-violet-400 font-medium">
                      {unit.magicalDefense + (hasDefenseBuff ? 1 : 0)}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Защита</p>
                <p className="text-xs text-muted-foreground">Физическая / Магическая</p>
                <p className="text-xs text-muted-foreground">Снижение урона: защита × 10%</p>
                {hasDefenseBuff && <p className="text-xs text-green-400 mt-1">+1 от Готовности</p>}
              </TooltipContent>
            </Tooltip>

            {/* Range */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 cursor-default">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{unit.attackRange === 'melee' ? '1' : unit.range}</span>
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
                <div className="bg-muted rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 cursor-default">
                  <Wind className="w-4 h-4 text-support" />
                  <span className="text-support font-medium">{unit.speed}</span>
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
                <div className="bg-muted rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 cursor-default">
                  <Gauge className="w-4 h-4 text-primary" />
                  <span className="text-primary font-medium">{unit.initiative}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Инициатива</p>
                <p className="text-xs text-muted-foreground">Порядок хода в раунде</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-border" />

          {/* Placeholder for two future stats */}
          <div className="flex gap-2 min-w-[80px]">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted/30 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 cursor-default border border-dashed border-muted-foreground/20">
                  <Plus className="w-4 h-4 text-muted-foreground/30" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Новый стат</p>
                <p className="text-xs text-muted-foreground">Будет добавлен позже</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted/30 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 cursor-default border border-dashed border-muted-foreground/20">
                  <Plus className="w-4 h-4 text-muted-foreground/30" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Новый стат</p>
                <p className="text-xs text-muted-foreground">Будет добавлен позже</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    );
  }
  
  // Full view panel (for right sidebar inspection)
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
            <span className="text-lg">{getSkillIcon(unit.skills.passive.id, 'md')}</span>
            <span className="font-display text-sm text-sky-300">{unit.skills.passive.name}</span>
            <span className="text-[10px] text-sky-400 ml-auto">ПАССИВНЫЙ</span>
          </div>
          <p className="text-xs text-muted-foreground">{unit.skills.passive.description}</p>
        </div>

        {/* Active */}
        {isViewOnly ? (
          <div className="w-full bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getSkillIcon(unit.skills.active.id, 'md')}</span>
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
              'w-full text-left rounded-lg p-3 transition-all border',
              isActiveMode 
                ? 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-400/50' 
                : !unit.hasActed 
                  ? 'bg-amber-900/20 border-amber-500/30 hover:bg-amber-900/40 cursor-pointer'
                  : 'bg-amber-900/10 border-amber-500/20 opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getSkillIcon(unit.skills.active.id, 'md')}</span>
              <span className="font-display text-sm text-amber-300">{unit.skills.active.name}</span>
              <span className="text-[10px] text-amber-400 ml-auto">АКТИВНЫЙ</span>
            </div>
            <p className="text-xs text-muted-foreground">{unit.skills.active.description}</p>
          </button>
        )}

        {/* Ultimate */}
        {isViewOnly ? (
          <div className="w-full bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getSkillIcon(unit.skills.ultimate.id, 'md')}</span>
              <span className="font-display text-sm text-purple-300">{unit.skills.ultimate.name}</span>
              <span className="text-[10px] text-purple-400 ml-auto">УЛЬТИМАТИВНЫЙ • {unit.skills.ultimate.energyCost} ⚡</span>
            </div>
            <p className="text-xs text-muted-foreground">{unit.skills.ultimate.description}</p>
          </div>
        ) : (
          <button
            onClick={() => onUseSkill('ultimate')}
            disabled={!canUseUltimate || unit.hasActed}
            className={cn(
              'w-full text-left rounded-lg p-3 transition-all border relative overflow-hidden',
              isUltimateMode 
                ? 'bg-purple-500/30 border-purple-400 ring-2 ring-purple-400/50' 
                : canUseUltimate && !unit.hasActed
                  ? 'bg-purple-900/20 border-purple-500/30 hover:bg-purple-900/40 cursor-pointer'
                  : 'bg-purple-900/10 border-purple-500/20 opacity-50 cursor-not-allowed'
            )}
          >
            <div 
              className="absolute inset-y-0 left-0 bg-purple-500/20 transition-all duration-500"
              style={{ width: `${(unit.currentEnergy / unit.maxEnergy) * 100}%` }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{getSkillIcon(unit.skills.ultimate.id, 'md')}</span>
                <span className="font-display text-sm text-purple-300">{unit.skills.ultimate.name}</span>
                <span className="text-[10px] text-purple-400 ml-auto">УЛЬТИМАТИВНЫЙ • {unit.skills.ultimate.energyCost} ⚡</span>
              </div>
              <p className="text-xs text-muted-foreground">{unit.skills.ultimate.description}</p>
              {!canUseUltimate && (
                <p className="text-[10px] text-purple-400 mt-1">
                  Энергия: {unit.currentEnergy}/{unit.skills.ultimate.energyCost}
                </p>
              )}
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
