import { BattleUnit, SkillMode, getEffectiveStat, hexDistance, hasStatus } from '@/store/gameStore';
import { traitLabels, traitDescriptions, reactionLabels, reactionDescriptions, statusEffectLabels, statusEffectDescriptions, statusEffectIcons } from '@/data/heroes';
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
  allUnits?: BattleUnit[];
}

export const SkillPanel = ({ 
  unit, 
  onUseSkill, 
  onWait,
  onDefend,
  onEndTurn,
  skillMode, 
  isViewOnly = false, 
  isCompact = false,
  allUnits = [],
}: SkillPanelProps) => {
  const canUseUltimate = unit.currentEnergy >= (unit.skills.ultimate.energyCost || 100);
  const isActiveMode = skillMode === 'active';
  const isUltimateMode = skillMode === 'ultimate';
  const isPassiveActive = true;
  
  const hasDefenseBuff = unit.buffs?.some(b => b.type === 'defense_boost');
  const hasParryPhys = unit.buffs?.some(b => b.type === 'parry_phys');
  const hasParryMag = unit.buffs?.some(b => b.type === 'parry_mag');
  
  // Calculate actual defenses with buffs
  const physDef = getEffectiveStat(unit, 'physicalDefense') + (hasDefenseBuff ? 1 : 0) + (hasParryPhys ? 2 : 0);
  const magDef = getEffectiveStat(unit, 'magicalDefense') + (hasDefenseBuff ? 1 : 0) + (hasParryMag ? 2 : 0);
  const effectiveSpeed = getEffectiveStat(unit, 'speed');
  const effectiveAttack = getEffectiveStat(unit, 'attack');
  const effectiveInit = getEffectiveStat(unit, 'initiative');
  
  if (isCompact) {
    const positiveEffects = unit.buffs?.filter(b => 
      b.type === 'defense_boost' || b.type === 'parry_phys' || b.type === 'parry_mag'
    ) || [];
    const negativeEffects: Array<{ type: string; name: string; desc: string; icon: string }> = [];
    
    // rangedBlocked as negative effect
    if (unit.rangedBlocked) {
      negativeEffects.push({ 
        type: 'ranged_blocked', 
        name: 'Стрельба заблокирована', 
        desc: 'Дистанционная атака недоступна (начал ход рядом с врагом)',
        icon: '🚫'
      });
    }
    
    // Status effects from unit
    (unit.statusEffects || []).forEach(se => {
      negativeEffects.push({
        type: se.type,
        name: statusEffectLabels[se.type] || se.type,
        desc: `${statusEffectDescriptions[se.type] || ''} (${se.duration} ход.)${se.stacks ? ` ×${se.stacks}` : ''}`,
        icon: statusEffectIcons[se.type] || '❓',
      });
    });

    // Temporary buffs as positive effects
    const tempBuffPositive: Array<{ type: string; positive: boolean; icon: string; name: string; desc: string }> = [];
    (unit.temporaryBuffs || []).forEach(buff => {
      const statNames: Record<string, string> = {
        attack: 'Атака', speed: 'Скорость', physicalDefense: 'Физ. защита',
        magicalDefense: 'Маг. защита', initiative: 'Инициатива'
      };
      tempBuffPositive.push({
        type: `buff_${buff.stat}`,
        positive: true,
        icon: buff.stat === 'speed' ? '💨' : buff.stat === 'attack' ? '⚔️' : buff.stat === 'initiative' ? '⚡' : '🛡️',
        name: `+${buff.value} ${statNames[buff.stat] || buff.stat}`,
        desc: `${buff.duration} ход. осталось${buff.sourceSkillId ? ` (от ${buff.sourceSkillId})` : ''}`,
      });
    });

    // Shield Wall aura effect
    const auraEffects: Array<{ type: string; positive: boolean; icon: string; name: string; desc: string }> = [];
    // Check if this unit is a knight with shield wall aura (self)
    if (unit.skills.passive.passiveEffect?.trigger === 'aura' && unit.skills.passive.passiveEffect?.rangedDamageReduction) {
      auraEffects.push({
        type: 'aura_shield_wall',
        positive: true,
        icon: '🛡️',
        name: 'Стена Щитов (аура)',
        desc: `-${Math.floor((unit.skills.passive.passiveEffect.rangedDamageReduction || 0) * 100)}% урона от дальних атак в радиусе ${unit.skills.passive.passiveEffect.area || 1}`,
      });
    }
    
    const allEffects = [
      ...auraEffects,
      ...positiveEffects.map(e => ({ type: e.type, positive: true, icon: '🛡️', name: '', desc: '' })),
      ...tempBuffPositive,
      ...negativeEffects.map(e => ({ ...e, positive: false }))
    ];

    const getEffectLabel = (type: string, icon?: string, name?: string, desc?: string) => {
      if (type === 'defense_boost') return { name: 'Готовность', desc: '+1 к обеим защитам', icon: '🛡️' };
      if (type === 'parry_phys') return { name: 'Парирование', desc: '+2 физ. защиты', icon: '🤺' };
      if (type === 'parry_mag') return { name: 'Парирование', desc: '+2 маг. защиты', icon: '🤺' };
      return { name: name || 'Эффект', desc: desc || '', icon: icon || '❓' };
    };
    
    return (
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-3 py-3 px-4">
          {/* Hero avatar & name */}
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

          {/* Status Effects */}
          <div className="grid grid-cols-3 gap-0.5 w-[66px] flex-shrink-0">
            {allEffects.length > 0 ? (
              allEffects.slice(0, 6).map((effect, idx) => {
                const info = getEffectLabel(effect.type, effect.icon, effect.name, effect.desc);
                return (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center cursor-default text-[10px]",
                        effect.positive 
                          ? "bg-green-900/40 border border-green-500/60" 
                          : "bg-red-900/40 border border-red-500/60"
                      )}>
                        {info.icon}
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
                  <span className="text-[10px] text-muted-foreground/30 col-span-3 text-center cursor-default">—</span>
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
                  disabled={unit.hasActed || (unit.skillCooldowns?.[unit.skills.active.id] > 0)}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all flex-shrink-0 relative',
                    isActiveMode 
                      ? 'bg-amber-700/40 border-amber-400 ring-2 ring-amber-400/50 text-amber-300' 
                      : !unit.hasActed && !(unit.skillCooldowns?.[unit.skills.active.id] > 0)
                        ? 'bg-amber-900/20 border-amber-500/50 hover:bg-amber-900/40 cursor-pointer text-amber-400'
                        : 'bg-amber-900/10 border-amber-500/20 opacity-50 cursor-not-allowed text-amber-400/50'
                  )}
                >
                  {getSkillIcon(unit.skills.active.id, 'md')}
                  {(unit.skillCooldowns?.[unit.skills.active.id] > 0) && (
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground/60 bg-black/40 rounded-lg">
                      {unit.skillCooldowns[unit.skills.active.id]}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold text-amber-300">{unit.skills.active.name}</p>
                <p className="text-xs text-muted-foreground">Активный навык</p>
                <p className="text-xs mt-1">{unit.skills.active.description}</p>
                {(unit.skillCooldowns?.[unit.skills.active.id] > 0) && (
                  <p className="text-xs text-red-400 mt-1">Откат: {unit.skillCooldowns[unit.skills.active.id]} ход.</p>
                )}
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
                  disabled={!onWait || unit.hasWaited || unit.hasMoved || unit.hasActed}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all flex-shrink-0',
                    onWait && !unit.hasWaited && !unit.hasMoved && !unit.hasActed
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
                <p className="text-xs mt-1">Требует оба очка (перемещения и действия). Они не расходуются. Действует только в текущем раунде.</p>
                {unit.hasWaited && <p className="text-xs text-red-400 mt-1">Уже использовано в этом раунде</p>}
                {!unit.hasWaited && (unit.hasMoved || unit.hasActed) && <p className="text-xs text-red-400 mt-1">Требуются оба очка</p>}
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
                    {effectiveAttack}{effectiveAttack !== unit.attack ? ` (${unit.attack})` : ''}
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
                  <span className="text-support font-medium text-[11px] tabular-nums">{effectiveSpeed}{effectiveSpeed !== unit.speed ? ` (${unit.speed})` : ''}</span>
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
                  <span className="text-primary font-medium text-[11px] tabular-nums">{effectiveInit}{effectiveInit !== unit.initiative ? ` (${unit.initiative})` : ''}</span>
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

      {/* Status Effects */}
      {((unit.statusEffects || []).length > 0 || unit.rangedBlocked || (unit.temporaryBuffs || []).length > 0 || (unit.skills.passive.passiveEffect?.trigger === 'aura' && unit.skills.passive.passiveEffect?.rangedDamageReduction)) && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1">Статус-эффекты</p>
          <div className="flex flex-wrap gap-1">
            {/* Aura */}
            {unit.skills.passive.passiveEffect?.trigger === 'aura' && unit.skills.passive.passiveEffect?.rangedDamageReduction && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="px-1.5 py-0.5 rounded text-[10px] bg-green-900/40 border border-green-500/60 text-green-300 cursor-default">
                    🛡️ {unit.skills.passive.name}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-green-400">{unit.skills.passive.name}</p>
                  <p className="text-xs text-muted-foreground">{unit.skills.passive.description}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {/* Temporary buffs */}
            {(unit.temporaryBuffs || []).map((buff, idx) => {
              const statNames: Record<string, string> = {
                attack: 'Атака', speed: 'Скорость', physicalDefense: 'Физ. защита',
                magicalDefense: 'Маг. защита', initiative: 'Инициатива'
              };
              const icon = buff.stat === 'speed' ? '💨' : buff.stat === 'attack' ? '⚔️' : '🛡️';
              return (
                <Tooltip key={`buff-${idx}`}>
                  <TooltipTrigger asChild>
                    <div className="px-1.5 py-0.5 rounded text-[10px] bg-green-900/40 border border-green-500/60 text-green-300 cursor-default">
                      {icon} +{buff.value} {statNames[buff.stat]} ({buff.duration})
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-green-400">+{buff.value} {statNames[buff.stat]}</p>
                    <p className="text-xs text-muted-foreground">{buff.duration} ход. осталось</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            {unit.rangedBlocked && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="px-1.5 py-0.5 rounded text-[10px] bg-red-900/40 border border-red-500/60 text-red-300 cursor-default">
                    🚫 Стрельба заблокирована
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-red-400">Стрельба заблокирована</p>
                  <p className="text-xs text-muted-foreground">Дистанционная атака недоступна (начал ход рядом с врагом)</p>
                </TooltipContent>
              </Tooltip>
            )}
            {(unit.statusEffects || []).map((se, idx) => (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div className="px-1.5 py-0.5 rounded text-[10px] bg-red-900/40 border border-red-500/60 text-red-300 cursor-default">
                    {statusEffectIcons[se.type]} {statusEffectLabels[se.type]} {se.stacks && se.stacks > 1 ? `×${se.stacks}` : ''} ({se.duration})
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-red-400">{statusEffectLabels[se.type]}</p>
                  <p className="text-xs text-muted-foreground">{statusEffectDescriptions[se.type]}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

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
              <span className="text-[10px] text-amber-400 ml-auto">
                АКТИВНЫЙ{(unit.skillCooldowns?.[unit.skills.active.id] > 0) ? ` • Откат: ${unit.skillCooldowns[unit.skills.active.id]}` : ''}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{unit.skills.active.description}</p>
          </div>
        ) : (
          <button
            onClick={() => onUseSkill('active')}
            disabled={unit.hasActed || (unit.skillCooldowns?.[unit.skills.active.id] > 0)}
            className={cn(
              'w-full text-left rounded-lg p-3 transition-all border',
              isActiveMode 
                ? 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-400/50' 
                : !unit.hasActed && !(unit.skillCooldowns?.[unit.skills.active.id] > 0)
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
