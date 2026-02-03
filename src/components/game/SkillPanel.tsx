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
    // Collect status effects for display
    const positiveEffects = unit.buffs?.filter(b => b.type === 'defense_boost') || [];
    const negativeEffects: Array<{ type: string; name: string }> = []; // Placeholder for future debuffs
    const allEffects = [...positiveEffects.map(e => ({ ...e, positive: true })), ...negativeEffects.map(e => ({ ...e, positive: false }))];
    
    return (
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-3 py-3 px-4">
          {/* Hero avatar & name */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-default min-w-[100px]">
                <span className="text-3xl">{unit.avatar}</span>
                <div>
                  <h3 className="font-display font-bold text-foreground text-sm leading-tight">{unit.name}</h3>
                  <p className="text-[9px] text-muted-foreground">{unit.title || 'Герой'}</p>
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
          <div className="w-px h-14 bg-border/50" />

          {/* Status Effects - 2 columns grid, shrink as needed */}
          <div className="grid grid-cols-2 gap-0.5 min-w-[40px] max-w-[56px]">
            {allEffects.length > 0 ? (
              allEffects.slice(0, 6).map((effect, idx) => (
                <Tooltip key={idx}>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "w-5 h-5 rounded flex items-center justify-center cursor-default",
                      effect.positive 
                        ? "bg-green-900/40 border border-green-500/60" 
                        : "bg-red-900/40 border border-red-500/60"
                    )}>
                      <ShieldPlus className={cn("w-3 h-3", effect.positive ? "text-green-400" : "text-red-400")} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className={effect.positive ? "text-green-400" : "text-red-400"}>Готовность</p>
                    <p className="text-xs text-muted-foreground">+1 к обеим защитам</p>
                  </TooltipContent>
                </Tooltip>
              ))
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[10px] text-muted-foreground/30 col-span-2 text-center cursor-default">—</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Статус-эффекты</p>
                  <p className="text-xs text-muted-foreground">Нет активных эффектов</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-14 bg-border/50" />

          {/* Skills and Actions - all same size */}
          <div className="flex gap-1.5 items-center">
            {/* Active skill - framed */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onUseSkill('active')}
                  disabled={unit.hasActed}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-lg border-2 transition-all',
                    isActiveMode 
                      ? 'bg-amber-700/40 border-amber-400 ring-2 ring-amber-400/50 text-amber-300' 
                      : !unit.hasActed 
                        ? 'bg-amber-900/20 border-amber-500/50 hover:bg-amber-900/40 cursor-pointer text-amber-400'
                        : 'bg-amber-900/10 border-amber-500/20 opacity-50 cursor-not-allowed text-amber-400/50'
                  )}
                >
                  {getSkillIcon(unit.skills.active.id, 'md')}
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
                    'w-9 h-9 flex items-center justify-center rounded-lg border-2 transition-all relative overflow-hidden',
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
                    {getSkillIcon(unit.skills.ultimate.id, 'md')}
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

            {/* Passive - no frame, same size */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'w-9 h-9 flex items-center justify-center transition-all cursor-default',
                    isPassiveActive 
                      ? 'text-sky-300' 
                      : 'text-sky-300/30'
                  )}
                >
                  {getSkillIcon(unit.skills.passive.id, 'md')}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold text-sky-300">{unit.skills.passive.name}</p>
                <p className="text-xs text-muted-foreground">Пассивный навык</p>
                <p className="text-xs mt-1">{unit.skills.passive.description}</p>
              </TooltipContent>
            </Tooltip>

            {/* Small divider */}
            <div className="w-px h-8 bg-border/40 mx-0.5" />

            {/* Wait action */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onWait}
                  disabled={!onWait}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-lg border-2 transition-all',
                    onWait
                      ? 'bg-slate-900/30 border-slate-500/50 hover:bg-slate-900/50 cursor-pointer text-slate-300'
                      : 'bg-slate-900/10 border-slate-500/20 opacity-50 cursor-not-allowed text-slate-400/50'
                  )}
                >
                  <Clock className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold text-slate-300">Ждать</p>
                <p className="text-xs text-muted-foreground">Герой перемещается в конец очереди инициативы</p>
                <p className="text-xs mt-1">Зеркально относительно середины: если ходил первым — станет последним.</p>
              </TooltipContent>
            </Tooltip>

            {/* Defend action */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onDefend}
                  disabled={!onDefend || unit.hasActed}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-lg border-2 transition-all',
                    onDefend && !unit.hasActed
                      ? 'bg-cyan-900/30 border-cyan-500/50 hover:bg-cyan-900/50 cursor-pointer text-cyan-300'
                      : 'bg-cyan-900/10 border-cyan-500/20 opacity-50 cursor-not-allowed text-cyan-400/50'
                  )}
                >
                  <ShieldPlus className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold text-cyan-300">Готовность</p>
                <p className="text-xs text-muted-foreground">Расходует очко действия</p>
                <p className="text-xs mt-1">Получить +10 энергии и +1 к обеим защитам до следующего хода.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Divider */}
          <div className="w-px h-14 bg-border/50" />

          {/* Action Points - same size as skills */}
          <div className="flex gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-lg border-2 transition-all cursor-default",
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
                  {!unit.hasMoved ? 'Доступно — можно переместиться' : 'Использовано'}
                </p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-lg border-2 transition-all cursor-default",
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
                  {!unit.hasActed ? 'Доступно — можно атаковать или использовать способность' : 'Использовано'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Divider */}
          <div className="w-px h-14 bg-border/50" />

          {/* Stats - 2 rows layout */}
          <div className="grid grid-rows-2 grid-flow-col gap-x-1.5 gap-y-1 text-xs">
            {/* Row 1: HP, Energy, Attack */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default">
                  <Heart className="w-3 h-3 text-health" />
                  <span className="text-health font-medium text-[11px]">{unit.currentHealth}/{unit.maxHealth}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Здоровье</p>
                <p className="text-xs text-muted-foreground">Текущее / Максимальное</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default">
                  <Zap className="w-3 h-3 text-energy" />
                  <span className="text-energy font-medium text-[11px]">{unit.currentEnergy}/{unit.maxEnergy}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Энергия</p>
                <p className="text-xs text-muted-foreground">Для ультимативной способности</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default">
                  {unit.attackType === 'physical' ? (
                    <Swords className="w-3 h-3 text-orange-400" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-violet-400" />
                  )}
                  <span className={cn("font-medium text-[11px]", unit.attackType === 'physical' ? 'text-orange-400' : 'text-violet-400')}>
                    {unit.attack}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Атака ({unit.attackType === 'physical' ? 'физическая' : 'магическая'})</p>
                <p className="text-xs text-muted-foreground">Базовый урон атаки</p>
              </TooltipContent>
            </Tooltip>

            {/* Row 2: Defense (combined), Range, Speed, Initiative */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default">
                  <Shield className="w-3 h-3 text-orange-400" />
                  <span className="text-orange-400 font-medium text-[11px]">{unit.physicalDefense + (hasDefenseBuff ? 1 : 0)}</span>
                  <span className="text-muted-foreground/50">/</span>
                  <span className="text-violet-400 font-medium text-[11px]">{unit.magicalDefense + (hasDefenseBuff ? 1 : 0)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Защита (Физ. / Маг.)</p>
                <p className="text-xs text-muted-foreground">Снижение урона: защита × 10%</p>
                {hasDefenseBuff && <p className="text-xs text-green-400 mt-1">+1 от Готовности</p>}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default">
                  <Target className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium text-[11px]">{unit.attackRange === 'melee' ? '1' : unit.range}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Дальность атаки</p>
                <p className="text-xs text-muted-foreground">
                  {unit.attackRange === 'melee' ? 'Ближний бой' : `Дальний бой (${unit.range} гексов)`}
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default">
                  <Wind className="w-3 h-3 text-support" />
                  <span className="text-support font-medium text-[11px]">{unit.speed}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Скорость</p>
                <p className="text-xs text-muted-foreground">Гексов за ход</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default">
                  <Gauge className="w-3 h-3 text-primary" />
                  <span className="text-primary font-medium text-[11px]">{unit.initiative}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Инициатива</p>
                <p className="text-xs text-muted-foreground">Порядок хода в раунде</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Divider */}
          <div className="w-px h-14 bg-border/50" />

          {/* Placeholder for two future stats - vertical column */}
          <div className="flex flex-col gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted/30 rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default border border-dashed border-muted-foreground/20">
                  <Plus className="w-3 h-3 text-muted-foreground/30" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Новый стат</p>
                <p className="text-xs text-muted-foreground">Будет добавлен позже</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted/30 rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default border border-dashed border-muted-foreground/20">
                  <Plus className="w-3 h-3 text-muted-foreground/30" />
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
