import { BattleUnit, SkillMode } from '@/store/gameStore';
import { traitLabels, traitDescriptions, reactionLabels, reactionDescriptions } from '@/data/heroes';
import { cn } from '@/lib/utils';
import { 
  Zap, Target, Shield, Footprints, Hand, Swords, Sparkles, 
  Wind, Heart, Gauge, Clock, ShieldPlus, Eye, RefreshCcw, SkipForward
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
  onEndTurn?: () => void;
  skillMode?: SkillMode;
  isViewOnly?: boolean;
  isCompact?: boolean;
}

export const SkillPanel = ({ 
  unit, 
  onUseSkill, 
  onWait,
  onDefend,
  onEndTurn,
  skillMode, 
  isViewOnly = false, 
  isCompact = false 
}: SkillPanelProps) => {
  const canUseUltimate = unit.currentEnergy >= (unit.skills.ultimate.energyCost || 100);
  const isActiveMode = skillMode === 'active';
  const isUltimateMode = skillMode === 'ultimate';
  const isPassiveActive = true;
  
  const hasDefenseBuff = unit.buffs?.some(b => b.type === 'defense_boost');
  const hasParryPhys = unit.buffs?.some(b => b.type === 'parry_phys');
  const hasParryMag = unit.buffs?.some(b => b.type === 'parry_mag');
  
  // Calculate actual defenses with buffs
  const physDef = unit.physicalDefense + (hasDefenseBuff ? 1 : 0) + (hasParryPhys ? 2 : 0);
  const magDef = unit.magicalDefense + (hasDefenseBuff ? 1 : 0) + (hasParryMag ? 2 : 0);
  
  if (isCompact) {
    const positiveEffects = unit.buffs?.filter(b => 
      b.type === 'defense_boost' || b.type === 'parry_phys' || b.type === 'parry_mag'
    ) || [];
    const negativeEffects: Array<{ type: string; name: string }> = [];
    const allEffects = [
      ...positiveEffects.map(e => ({ ...e, positive: true })), 
      ...negativeEffects.map(e => ({ ...e, positive: false }))
    ];

    const getEffectLabel = (type: string) => {
      if (type === 'defense_boost') return { name: 'Готовность', desc: '+1 к обеим защитам' };
      if (type === 'parry_phys') return { name: 'Парирование', desc: '+2 физ. защиты' };
      if (type === 'parry_mag') return { name: 'Парирование', desc: '+2 маг. защиты' };
      return { name: 'Эффект', desc: '' };
    };
    
    return (
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-3 py-3 px-4">
          {/* Hero avatar & name - fixed width to prevent jitter */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-default flex-shrink-0">
                <span className="text-3xl">{unit.avatar}</span>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-foreground text-sm leading-tight whitespace-nowrap">{unit.name}</h3>
                  <p className="text-[9px] text-muted-foreground truncate">{unit.title || 'Герой'}</p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">{unit.name}</p>
              <p className="text-xs text-muted-foreground">{unit.title || 'Герой'}</p>
              <p className="text-xs mt-1">{unit.role === 'tank' ? 'Танк' : unit.role === 'attack' ? 'Атакующий' : 'Поддержка'}</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-14 bg-border/50 flex-shrink-0" />

          {/* Status Effects - fixed width */}
          <div className="grid grid-cols-2 gap-0.5 w-[44px] flex-shrink-0">
            {allEffects.length > 0 ? (
              allEffects.slice(0, 6).map((effect, idx) => {
                const info = getEffectLabel(effect.type);
                return (
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
                      <p className={effect.positive ? "text-green-400" : "text-red-400"}>{info.name}</p>
                      <p className="text-xs text-muted-foreground">{info.desc}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })
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

          <div className="w-px h-14 bg-border/50 flex-shrink-0" />

          {/* Skills and Actions */}
          <div className="flex gap-1.5 items-center flex-shrink-0">
            {/* Active skill */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onUseSkill('active')}
                  disabled={unit.hasActed}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all flex-shrink-0',
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

            {/* Ultimate */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onUseSkill('ultimate')}
                  disabled={!canUseUltimate || unit.hasActed}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all relative overflow-hidden flex-shrink-0',
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

            {/* Passive */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'w-10 h-10 flex items-center justify-center transition-all cursor-default flex-shrink-0',
                    isPassiveActive ? 'text-sky-300' : 'text-sky-300/30'
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

            <div className="w-px h-8 bg-border/40 mx-0.5 flex-shrink-0" />

            {/* Wait */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onWait}
                  disabled={!onWait || unit.hasWaited}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all flex-shrink-0',
                    onWait && !unit.hasWaited
                      ? 'bg-slate-900/30 border-slate-500/50 hover:bg-slate-900/50 cursor-pointer text-slate-300'
                      : 'bg-slate-900/10 border-slate-500/20 opacity-50 cursor-not-allowed text-slate-400/50'
                  )}
                >
                  <Clock className="w-[18px] h-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold text-slate-300">Ждать</p>
                <p className="text-xs text-muted-foreground">Герой перемещается в конец очереди инициативы</p>
                <p className="text-xs mt-1">Зеркально относительно середины. Действует только в текущем раунде.</p>
                {unit.hasWaited && <p className="text-xs text-red-400 mt-1">Уже использовано в этом раунде</p>}
              </TooltipContent>
            </Tooltip>

            {/* Defend - requires both points */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onDefend}
                  disabled={!onDefend || unit.hasActed || unit.hasMoved}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all flex-shrink-0',
                    onDefend && !unit.hasActed && !unit.hasMoved
                      ? 'bg-cyan-900/30 border-cyan-500/50 hover:bg-cyan-900/50 cursor-pointer text-cyan-300'
                      : 'bg-cyan-900/10 border-cyan-500/20 opacity-50 cursor-not-allowed text-cyan-400/50'
                  )}
                >
                  <ShieldPlus className="w-[18px] h-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold text-cyan-300">Готовность</p>
                <p className="text-xs text-muted-foreground">Расходует очко перемещения и очко действия</p>
                <p className="text-xs mt-1">Получить +10 энергии и +1 к обеим защитам до следующего хода.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="w-px h-14 bg-border/50 flex-shrink-0" />

          {/* Stats - 2 rows, fixed width cells */}
          <div className="grid grid-rows-2 grid-flow-col gap-x-1.5 gap-y-1 text-xs flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default min-w-[60px]">
                  <Heart className="w-3 h-3 text-health flex-shrink-0" />
                  <span className="text-health font-medium text-[11px] tabular-nums">{unit.currentHealth}/{unit.maxHealth}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Здоровье</p>
                <p className="text-xs text-muted-foreground">Текущее / Максимальное</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default min-w-[60px]">
                  <Zap className="w-3 h-3 text-energy flex-shrink-0" />
                  <span className="text-energy font-medium text-[11px] tabular-nums">{unit.currentEnergy}/{unit.maxEnergy}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Энергия</p>
                <p className="text-xs text-muted-foreground">Для ультимативной способности</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default min-w-[40px]">
                  {unit.attackType === 'physical' ? (
                    <Swords className="w-3 h-3 text-orange-400 flex-shrink-0" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0" />
                  )}
                  <span className={cn("font-medium text-[11px] tabular-nums", unit.attackType === 'physical' ? 'text-orange-400' : 'text-violet-400')}>
                    {unit.attack}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Атака ({unit.attackType === 'physical' ? 'физическая' : 'магическая'})</p>
                <p className="text-xs text-muted-foreground">Базовый урон атаки</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default min-w-[55px]">
                  <Shield className="w-3 h-3 text-orange-400 flex-shrink-0" />
                  <span className="text-orange-400 font-medium text-[11px] tabular-nums">{physDef}</span>
                  <span className="text-muted-foreground/50">/</span>
                  <span className="text-violet-400 font-medium text-[11px] tabular-nums">{magDef}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Защита (Физ. / Маг.)</p>
                <p className="text-xs text-muted-foreground">Снижение урона: защита × 10%</p>
                {hasDefenseBuff && <p className="text-xs text-green-400 mt-1">+1 от Готовности</p>}
                {hasParryPhys && <p className="text-xs text-green-400 mt-1">+2 физ. от Парирования</p>}
                {hasParryMag && <p className="text-xs text-green-400 mt-1">+2 маг. от Парирования</p>}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default min-w-[28px]">
                  <Target className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium text-[11px] tabular-nums">{unit.attackRange === 'melee' ? '1' : unit.range}</span>
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
                <div className="bg-muted rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default min-w-[28px]">
                  <Wind className="w-3 h-3 text-support flex-shrink-0" />
                  <span className="text-support font-medium text-[11px] tabular-nums">{unit.speed}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Скорость</p>
                <p className="text-xs text-muted-foreground">Гексов за ход</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default min-w-[28px]">
                  <Gauge className="w-3 h-3 text-primary flex-shrink-0" />
                  <span className="text-primary font-medium text-[11px] tabular-nums">{unit.initiative}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Инициатива</p>
                <p className="text-xs text-muted-foreground">Порядок хода в раунде</p>
              </TooltipContent>
            </Tooltip>

            {/* Trait */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "bg-muted rounded px-1.5 py-0.5 flex items-center gap-1 cursor-default min-w-[28px]",
                  unit.trait !== 'none' ? 'border border-amber-500/30' : ''
                )}>
                  <Eye className={cn(
                    "w-3 h-3 flex-shrink-0",
                    unit.trait !== 'none' ? 'text-amber-400' : 'text-muted-foreground/40'
                  )} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className={unit.trait !== 'none' ? 'text-amber-400' : ''}>
                  Особенность: {traitLabels[unit.trait]}
                </p>
                <p className="text-xs text-muted-foreground">{traitDescriptions[unit.trait]}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="w-px h-14 bg-border/50 flex-shrink-0" />

          {/* Reaction + Movement + Action points - no borders */}
          <div className="flex gap-1 items-center flex-shrink-0">
            {/* Reaction */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "w-8 h-8 flex items-center justify-center rounded transition-all cursor-default flex-shrink-0",
                  unit.reaction === 'none'
                    ? "text-muted-foreground/30"
                    : unit.reactionAvailable
                      ? "text-yellow-300 bg-yellow-900/30"
                      : "text-muted-foreground/40"
                )}>
                  <RefreshCcw className="w-[18px] h-[18px]" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className={unit.reaction !== 'none' && unit.reactionAvailable ? 'text-yellow-400' : ''}>
                  Реакция: {reactionLabels[unit.reaction]}
                </p>
                <p className="text-xs text-muted-foreground">{reactionDescriptions[unit.reaction]}</p>
                {unit.reaction !== 'none' && (
                  <p className={cn("text-xs mt-1", unit.reactionAvailable ? "text-green-400" : "text-red-400")}>
                    {unit.reactionAvailable ? '✓ Заряд доступен' : '✗ Заряд использован (восстановится в начале хода)'}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>

            {/* Movement point */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "w-8 h-8 flex items-center justify-center rounded transition-all cursor-default flex-shrink-0",
                  !unit.hasMoved 
                    ? "text-green-300 bg-green-900/30" 
                    : "text-muted-foreground/40"
                )}>
                  <Footprints className="w-[18px] h-[18px]" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Очко перемещения</p>
                <p className="text-xs text-muted-foreground">
                  {!unit.hasMoved ? 'Доступно — можно переместиться' : 'Использовано'}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Action point */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "w-8 h-8 flex items-center justify-center rounded transition-all cursor-default flex-shrink-0",
                  !unit.hasActed 
                    ? "text-orange-300 bg-orange-900/30" 
                    : "text-muted-foreground/40"
                )}>
                  <Hand className="w-[18px] h-[18px]" />
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

          {/* End Turn button - right edge */}
          {!isViewOnly && onEndTurn && (
            <>
              <div className="flex-1" />
              <button
                onClick={onEndTurn}
                className="fantasy-button flex items-center gap-1.5 py-1.5 px-3 text-sm flex-shrink-0"
              >
                <SkipForward className="w-4 h-4" />
                Завершить
              </button>
            </>
          )}
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
            <span className="text-orange-400">{physDef}</span>
            <Shield className="w-3 h-3 text-violet-400 ml-1" />
            <span className="text-violet-400">{magDef}</span>
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

      {/* Trait & Reaction */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className={cn("rounded p-2 text-center", unit.trait !== 'none' ? "bg-amber-900/20 border border-amber-500/30" : "bg-muted")}>
          <p className="text-muted-foreground">Особенность</p>
          <p className={cn("font-semibold text-[11px]", unit.trait !== 'none' ? 'text-amber-400' : 'text-muted-foreground')}>
            {traitLabels[unit.trait]}
          </p>
        </div>
        <div className={cn(
          "rounded p-2 text-center",
          unit.reaction !== 'none' 
            ? unit.reactionAvailable 
              ? "bg-yellow-900/20 border border-yellow-500/30"
              : "bg-muted border border-muted-foreground/20"
            : "bg-muted"
        )}>
          <p className="text-muted-foreground">Реакция</p>
          <p className={cn("font-semibold text-[11px]", 
            unit.reaction !== 'none' && unit.reactionAvailable ? 'text-yellow-400' : 'text-muted-foreground'
          )}>
            {reactionLabels[unit.reaction]}
          </p>
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
