export type HeroRole = 'tank' | 'attack' | 'support';
export type DamageType = 'physical' | 'magical';
export type AttackRange = 'melee' | 'ranged';

export type HeroTrait = 'flight' | 'siege' | 'no_melee_penalty' | 'ignores_reactions' | 'sleep_immune' | 'none';
export type HeroReaction = 'counterattack' | 'return_shot' | 'retreat' | 'parry' | 'provoked_attack' | 'none';

export const traitLabels: Record<HeroTrait, string> = {
  flight: 'Полёт',
  siege: 'Осадный урон',
  no_melee_penalty: 'Нет штрафа в ближнем бою',
  ignores_reactions: 'Игнорирует реакции',
  sleep_immune: 'Иммунитет ко сну',
  none: 'Нет',
};

export const traitDescriptions: Record<HeroTrait, string> = {
  flight: 'Игнорирует препятствия при перемещении (конечная клетка должна быть свободна)',
  siege: 'Может атаковать препятствия (1 HP). Способности тоже разрушают их',
  no_melee_penalty: 'Стрелок атакует в ближнем бою без штрафа к урону',
  ignores_reactions: 'Против атак этого существа не срабатывают реакции',
  sleep_immune: 'Не может быть усыплён',
  none: 'Нет особенности',
};

export const reactionLabels: Record<HeroReaction, string> = {
  counterattack: 'Контрудар',
  return_shot: 'Ответный выстрел',
  retreat: 'Отход',
  parry: 'Парирование',
  provoked_attack: 'Спровоцированная атака',
  none: 'Нет',
};

export const reactionDescriptions: Record<HeroReaction, string> = {
  counterattack: 'При атаке ближнего боя автоматически наносит ответный удар обычной атакой',
  return_shot: 'При атаке дальнего боя автоматически производит ответный выстрел',
  retreat: 'При атаке ближнего боя отходит на одну клетку назад от атакующего',
  parry: 'С шансом 50% получает +2 к защите того типа, каким была атака (до начала следующего хода)',
  provoked_attack: 'Когда стоит вплотную к врагу и тот отходит на дистанцию >1, автоматически атакует его (не срабатывает на Отход)',
  none: 'Нет реакции',
};

export type StatusEffectType = 
  | 'acid' | 'burning' | 'frozen' | 'stunned' | 'immobilized'
  | 'silenced' | 'suppressed' | 'distracted' | 'sleep'
  | 'bleeding' | 'fear' | 'taunt' | 'powerless' | 'ranged_blocked';

export interface StatusEffect {
  type: StatusEffectType;
  duration: number;
  stacks?: number;
  sourceId?: string;
  turnsActive?: number;
}

export const statusEffectLabels: Record<StatusEffectType, string> = {
  acid: 'Кислота',
  burning: 'Горение',
  frozen: 'Заморозка',
  stunned: 'Оглушение',
  immobilized: 'Обездвиживание',
  silenced: 'Безмолвие',
  suppressed: 'Подавление',
  distracted: 'Отвлечение',
  sleep: 'Сон',
  bleeding: 'Кровотечение',
  fear: 'Страх',
  taunt: 'Провокация',
  powerless: 'Бессилие',
  ranged_blocked: 'Стрельба заблокирована',
};

export const statusEffectDescriptions: Record<StatusEffectType, string> = {
  acid: 'Наносит 10 физ. урона/ход. Снижает физ. защиту на 1/ход за заряд. До 3 зарядов. 3 хода.',
  burning: 'Наносит 15 маг. урона/ход. 2 хода. Повторное наложение обновляет длительность.',
  frozen: 'Пропуск хода. Нельзя лечить.',
  stunned: 'Пропуск хода. После оглушения реакция недоступна 1 ход.',
  immobilized: 'Герой не может двигаться.',
  silenced: 'Нельзя использовать активные способности и ульт.',
  suppressed: 'Отключает пассивные способности.',
  distracted: 'Отключает реакции.',
  sleep: 'Пропуск хода. Урон пробуждает (+15% урона по спящему).',
  bleeding: 'Урон % от макс. HP (9→12→15%). Игнорирует защиту. Лечение снимает.',
  fear: 'Автоматически бежит в случайном направлении. Пропуск хода.',
  taunt: 'Автоматически подбегает к источнику и атакует в ближнем бою.',
  powerless: 'Герой не может атаковать.',
  ranged_blocked: 'Дистанционная атака недоступна (начал ход рядом с врагом).',
};

export const statusEffectIcons: Record<StatusEffectType, string> = {
  acid: '🧪',
  burning: '🔥',
  frozen: '🧊',
  stunned: '⚡',
  immobilized: '🔗',
  silenced: '🤐',
  suppressed: '🚫',
  distracted: '😵',
  sleep: '💤',
  bleeding: '🩸',
  fear: '😱',
  taunt: '😤',
  powerless: '💫',
  ranged_blocked: '🚫',
};

// ===== SKILL EFFECT SYSTEM =====

export interface SkillEffect {
  /** Who the skill targets */
  target: 'enemy' | 'ally' | 'self' | 'all_enemies' | 'all_allies';
  /** Flat damage amount */
  damage?: number;
  /** Damage as multiplier of caster's attack */
  damageMultiplier?: number;
  /** Damage type (defaults to caster's attackType) */
  damageType?: 'physical' | 'magical';
  /** Status effect to apply */
  status?: StatusEffectType;
  /** Duration of status effect */
  statusDuration?: number;
  /** Stacks of status effect */
  statusStacks?: number;
  /** Area of effect radius in hexes */
  area?: number;
  /** Temporary stat buffs to apply */
  statBuffs?: {
    stat: 'attack' | 'speed' | 'physicalDefense' | 'magicalDefense' | 'initiative';
    value: number;
    isPercent?: boolean;
    duration: number;
  }[];
  /** Flat heal amount */
  heal?: number;
  /** Heal as % of maxHealth */
  healPercent?: number;
  /** Self-damage (flat) */
  selfDamage?: number;
  /** Self-damage as % of maxHealth */
  selfDamagePercent?: number;
  /** Guarantees next attack is critical */
  guaranteedCrit?: boolean;
  /** Removes range penalty from next attack */
  ignoreRangePenalty?: boolean;
  /** Skill range override (default uses hero range) */
  range?: number;
  /** Costs movement point instead of/in addition to action */
  costsMovementPoint?: boolean;
  /** For truly unique effects that need minimal custom logic */
  special?: string;
}

export interface PassiveEffect {
  /** When this passive triggers */
  trigger: 'aura' | 'on_attack' | 'on_hit' | 'on_parry' | 'always';
  /** Aura/area radius */
  area?: number;
  /** Who is affected */
  target?: 'allies' | 'enemies' | 'self';
  /** Stat modifications */
  statBuffs?: {
    stat: 'attack' | 'speed' | 'physicalDefense' | 'magicalDefense' | 'initiative';
    value: number;
    isPercent?: boolean;
  }[];
  /** Ranged damage reduction for aura targets */
  rangedDamageReduction?: number;
  /** Heal per tick (for aura) */
  heal?: number;
  /** Status to apply on trigger */
  status?: StatusEffectType;
  /** Duration of applied status */
  statusDuration?: number;
  /** Chance of triggering (0-1, default 1) */
  chance?: number;
  /** Damage on trigger */
  damage?: number;
  /** Damage type */
  damageType?: 'physical' | 'magical';
  /** For unique passives that need custom code */
  special?: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'passive' | 'active' | 'ultimate';
  energyCost?: number;
  /** Cooldown in turns (for active skills) */
  cooldown?: number;
  /** Executable effect - used by the universal skill system */
  effect?: SkillEffect;
  /** Passive effect definition */
  passiveEffect?: PassiveEffect;
}

export interface Hero {
  id: string;
  name: string;
  title: string;
  role: HeroRole;
  avatar: string;
  health: number;
  maxHealth: number;
  attack: number;
  attackType: DamageType;
  attackRange: AttackRange;
  range: number;
  physicalDefense: number;
  magicalDefense: number;
  initiative: number;
  speed: number;
  energy: number;
  maxEnergy: number;
  trait: HeroTrait;
  reaction: HeroReaction;
  skills: {
    passive: Skill;
    active: Skill;
    ultimate: Skill;
  };
  description: string;
}

export const heroes: Hero[] = [
  // === TANKS ===
  {
    id: 'knight',
    name: 'Рыцарь',
    title: 'Защитник Королевства',
    role: 'tank',
    avatar: '🛡️',
    health: 170,
    maxHealth: 170,
    attack: 45,
    attackType: 'physical',
    attackRange: 'melee',
    range: 1,
    physicalDefense: 5,
    magicalDefense: 3,
    initiative: 3,
    speed: 4,
    energy: 0,
    maxEnergy: 100,
    trait: 'none',
    reaction: 'parry',
    skills: {
      passive: {
        id: 'shield_wall_aura',
        name: 'Стена Щитов',
        description: 'Рыцарь и союзники в радиусе 1 получают на 30% меньше урона от дальних атак. При парировании +1 инициатива на следующий ход.',
        type: 'passive',
        passiveEffect: {
          trigger: 'aura',
          area: 1,
          target: 'allies',
          rangedDamageReduction: 0.3,
          special: 'on_parry_initiative',
        },
      },
      active: {
        id: 'maneuvers',
        name: 'Маневры',
        description: 'Добавляет себе или союзнику +2 скорости на 2 хода. Дальность 5 клеток. Откат 3 хода.',
        type: 'active',
        cooldown: 3,
        effect: {
          target: 'ally',
          range: 5,
          statBuffs: [{ stat: 'speed', value: 2, duration: 2 }],
        },
      },
      ultimate: {
        id: 'shield_bash',
        name: 'Удар Щитом',
        description: 'Наносит 50 физического урона в ближнем бою и оглушает врага на 1 ход',
        type: 'ultimate',
        energyCost: 100,
        effect: {
          target: 'enemy',
          damage: 50,
          damageType: 'physical',
          range: 1,
          status: 'stunned',
          statusDuration: 1,
        },
      },
    },
    description: 'Благородный воин, мастер оборонительного боя. Его щит — стена для союзников.',
  },
  {
    id: 'stone_giant',
    name: 'Каменный Голем',
    title: 'Горный Титан',
    role: 'tank',
    avatar: '🗿',
    health: 220,
    maxHealth: 220,
    attack: 20,
    attackType: 'physical',
    attackRange: 'melee',
    range: 1,
    physicalDefense: 6,
    magicalDefense: 6,
    initiative: 1,
    speed: 1,
    energy: 0,
    maxEnergy: 100,
    trait: 'siege',
    reaction: 'parry',
    skills: {
      passive: {
        id: 'stone_body',
        name: 'Каменное Тело',
        description: 'Иммунитет к эффектам контроля',
        type: 'passive',
        passiveEffect: {
          trigger: 'always',
          target: 'self',
          special: 'cc_immune',
        },
      },
      active: {
        id: 'earthquake',
        name: 'Землетрясение',
        description: 'Наносит 15 урона всем врагам в радиусе 2 гексов и обездвиживает на 1 ход',
        type: 'active',
        effect: {
          target: 'enemy',
          damage: 15,
          damageType: 'physical',
          area: 2,
          status: 'immobilized',
          statusDuration: 1,
        },
      },
      ultimate: {
        id: 'mountain_form',
        name: 'Форма Горы',
        description: 'Удваивает защиту и восстанавливает 50% здоровья',
        type: 'ultimate',
        energyCost: 100,
        effect: {
          target: 'self',
          healPercent: 50,
          statBuffs: [
            { stat: 'physicalDefense', value: 100, isPercent: true, duration: 2 },
            { stat: 'magicalDefense', value: 100, isPercent: true, duration: 2 },
          ],
        },
      },
    },
    description: 'Пробуждённый дух горы, медленный но несокрушимый. Веками охранял древние руины.',
  },
  {
    id: 'paladin',
    name: 'Паладин',
    title: 'Святой Воин',
    role: 'tank',
    avatar: '⚜️',
    health: 160,
    maxHealth: 160,
    attack: 30,
    attackType: 'physical',
    attackRange: 'melee',
    range: 1,
    physicalDefense: 6,
    magicalDefense: 7,
    initiative: 4,
    speed: 2,
    energy: 0,
    maxEnergy: 90,
    trait: 'none',
    reaction: 'counterattack',
    skills: {
      passive: {
        id: 'divine_shield',
        name: 'Божественный Щит',
        description: 'Каждый 3-й удар по нему блокируется полностью',
        type: 'passive',
        passiveEffect: {
          trigger: 'on_hit',
          target: 'self',
          special: 'block_every_3rd',
        },
      },
      active: {
        id: 'holy_strike',
        name: 'Святой Удар',
        description: 'Наносит 35 урона и оглушает цель на 1 ход',
        type: 'active',
        effect: {
          target: 'enemy',
          damage: 35,
          damageType: 'physical',
          range: 1,
          status: 'stunned',
          statusDuration: 1,
        },
      },
      ultimate: {
        id: 'divine_judgement',
        name: 'Божий Суд',
        description: 'Наносит урон всем врагам равный 20% их потерянного здоровья',
        type: 'ultimate',
        energyCost: 90,
        effect: {
          target: 'all_enemies',
          special: 'percent_lost_hp_damage',
        },
      },
    },
    description: 'Благословлённый воин света. Сочетает защиту с карающей силой праведного гнева.',
  },
  
  // === ATTACKERS ===
  {
    id: 'shadow_blade',
    name: 'Клинок Тени',
    title: 'Мастер Теней',
    role: 'attack',
    avatar: '🗡️',
    health: 100,
    maxHealth: 100,
    attack: 45,
    attackType: 'physical',
    attackRange: 'melee',
    range: 1,
    physicalDefense: 2,
    magicalDefense: 3,
    initiative: 8,
    speed: 4,
    energy: 0,
    maxEnergy: 80,
    trait: 'ignores_reactions',
    reaction: 'provoked_attack',
    skills: {
      passive: {
        id: 'backstab',
        name: 'Удар в Спину',
        description: 'Критический удар (+50% урона) при атаке сзади',
        type: 'passive',
        passiveEffect: {
          trigger: 'on_attack',
          target: 'self',
          special: 'backstab_crit',
        },
      },
      active: {
        id: 'shadow_step',
        name: 'Теневой Шаг',
        description: 'Телепортируется на 3 гекса и наносит 30 урона',
        type: 'active',
        effect: {
          target: 'enemy',
          damage: 30,
          damageType: 'physical',
          range: 3,
          special: 'teleport_to_target',
        },
      },
      ultimate: {
        id: 'dance_of_blades',
        name: 'Танец Клинков',
        description: 'Атакует всех соседних врагов, нанося 60% урона каждому',
        type: 'ultimate',
        energyCost: 80,
        effect: {
          target: 'enemy',
          damageMultiplier: 0.6,
          damageType: 'physical',
          area: 1,
        },
      },
    },
    description: 'Элитный ассасин гильдии теней. Быстрый и смертоносный, появляется из ниоткуда.',
  },
  {
    id: 'fire_mage',
    name: 'Огненный Маг',
    title: 'Повелитель Пламени',
    role: 'attack',
    avatar: '🔥',
    health: 85,
    maxHealth: 85,
    attack: 50,
    attackType: 'magical',
    attackRange: 'ranged',
    range: 4,
    physicalDefense: 1,
    magicalDefense: 5,
    initiative: 5,
    speed: 2,
    energy: 0,
    maxEnergy: 90,
    trait: 'siege',
    reaction: 'none',
    skills: {
      passive: {
        id: 'burning',
        name: 'Горение',
        description: 'Атаки поджигают врага, нанося 15 маг. урона в течение 2 ходов',
        type: 'passive',
        passiveEffect: {
          trigger: 'on_attack',
          target: 'enemies',
          status: 'burning',
          statusDuration: 2,
        },
      },
      active: {
        id: 'fireball',
        name: 'Огненный Шар',
        description: 'Наносит 40 магического урона в области 2 гекса',
        type: 'active',
        effect: {
          target: 'enemy',
          damage: 40,
          damageType: 'magical',
          area: 2,
        },
      },
      ultimate: {
        id: 'meteor_storm',
        name: 'Метеоритный Шторм',
        description: 'Вызывает метеориты на 3 случайных врага, нанося 70 урона каждому',
        type: 'ultimate',
        energyCost: 90,
        effect: {
          target: 'all_enemies',
          damage: 70,
          damageType: 'magical',
          special: 'random_3_targets',
        },
      },
    },
    description: 'Мастер разрушительной магии огня. Его пламя сжигает всё на своём пути.',
  },
  {
    id: 'elf_archer',
    name: 'Эльфийский Лучник',
    title: 'Страж Древнего Леса',
    role: 'attack',
    avatar: '🏹',
    health: 85,
    maxHealth: 85,
    attack: 45,
    attackType: 'physical',
    attackRange: 'ranged',
    range: 6,
    physicalDefense: 2,
    magicalDefense: 2,
    initiative: 8,
    speed: 4,
    energy: 0,
    maxEnergy: 90,
    trait: 'sleep_immune',
    reaction: 'retreat',
    skills: {
      passive: {
        id: 'dodge',
        name: 'Уворот',
        description: '20% шанс увернуться от любой атаки, если не под эффектом контроля',
        type: 'passive',
        passiveEffect: {
          trigger: 'on_hit',
          target: 'self',
          chance: 0.2,
          special: 'dodge_if_no_cc',
        },
      },
      active: {
        id: 'entangle',
        name: 'Путы',
        description: 'Опутывает цель, обездвиживая на 1 ход. Дальность 6. Откат 2 хода.',
        type: 'active',
        cooldown: 2,
        effect: {
          target: 'enemy',
          range: 6,
          status: 'immobilized',
          statusDuration: 1,
        },
      },
      ultimate: {
        id: 'precise_shot',
        name: 'Меткий Выстрел',
        description: 'Следующий выстрел без штрафа за расстояние и гарантированный крит. Стоит очко движения.',
        type: 'ultimate',
        energyCost: 90,
        effect: {
          target: 'self',
          guaranteedCrit: true,
          ignoreRangePenalty: true,
          costsMovementPoint: true,
        },
      },
    },
    description: 'Древний эльф, чей взгляд пронзает тени леса. Его стрелы не знают промаха.',
  },
  {
    id: 'berserker',
    name: 'Берсерк',
    title: 'Безумный Воин',
    role: 'attack',
    avatar: '🪓',
    health: 130,
    maxHealth: 130,
    attack: 55,
    attackType: 'physical',
    attackRange: 'melee',
    range: 1,
    physicalDefense: 3,
    magicalDefense: 1,
    initiative: 6,
    speed: 3,
    energy: 0,
    maxEnergy: 70,
    trait: 'none',
    reaction: 'counterattack',
    skills: {
      passive: {
        id: 'blood_rage',
        name: 'Кровавая Ярость',
        description: 'Урон увеличивается на 2% за каждый потерянный 1% здоровья',
        type: 'passive',
        passiveEffect: {
          trigger: 'always',
          target: 'self',
          special: 'blood_rage_damage_boost',
        },
      },
      active: {
        id: 'whirlwind',
        name: 'Вихрь',
        description: 'Вращается с топором, нанося 40 урона всем соседним врагам',
        type: 'active',
        effect: {
          target: 'enemy',
          damage: 40,
          damageType: 'physical',
          area: 1,
        },
      },
      ultimate: {
        id: 'rampage',
        name: 'Буйство',
        description: 'Впадает в ярость: +50% урона и +2 скорости на 2 хода, но теряет 20% HP',
        type: 'ultimate',
        energyCost: 70,
        effect: {
          target: 'self',
          selfDamagePercent: 20,
          statBuffs: [
            { stat: 'attack', value: 50, isPercent: true, duration: 2 },
            { stat: 'speed', value: 2, duration: 2 },
          ],
        },
      },
    },
    description: 'Северный воин, черпающий силу из боевого безумия. Чем ближе к смерти, тем опаснее.',
  },
  {
    id: 'frost_mage',
    name: 'Ледяная Ведьма',
    title: 'Повелительница Мороза',
    role: 'attack',
    avatar: '❄️',
    health: 80,
    maxHealth: 80,
    attack: 42,
    attackType: 'magical',
    attackRange: 'ranged',
    range: 4,
    physicalDefense: 1,
    magicalDefense: 6,
    initiative: 5,
    speed: 2,
    energy: 0,
    maxEnergy: 95,
    trait: 'none',
    reaction: 'none',
    skills: {
      passive: {
        id: 'frostbite',
        name: 'Обморожение',
        description: 'Атаки замедляют врагов на 1 скорость на 1 ход',
        type: 'passive',
        passiveEffect: {
          trigger: 'on_attack',
          target: 'enemies',
          statBuffs: [{ stat: 'speed', value: -1 }],
          statusDuration: 1,
        },
      },
      active: {
        id: 'ice_lance',
        name: 'Ледяное Копьё',
        description: 'Пронзает врага льдом, нанося 45 урона и замораживая на 1 ход',
        type: 'active',
        effect: {
          target: 'enemy',
          damage: 45,
          damageType: 'magical',
          status: 'frozen',
          statusDuration: 1,
        },
      },
      ultimate: {
        id: 'blizzard',
        name: 'Буран',
        description: 'Вызывает снежную бурю: 20 маг. урона всем врагам и замедление на 3 хода',
        type: 'ultimate',
        energyCost: 95,
        effect: {
          target: 'all_enemies',
          damage: 20,
          damageType: 'magical',
          statBuffs: [{ stat: 'speed', value: -1, duration: 3 }],
        },
      },
    },
    description: 'Древняя колдунья из северных пустошей. Её взгляд несёт холод самой смерти.',
  },
  
  // === SUPPORT ===
  {
    id: 'light_priestess',
    name: 'Жрица Света',
    title: 'Целительница Рассвета',
    role: 'support',
    avatar: '✨',
    health: 95,
    maxHealth: 95,
    attack: 25,
    attackType: 'magical',
    attackRange: 'ranged',
    range: 3,
    physicalDefense: 2,
    magicalDefense: 6,
    initiative: 6,
    speed: 3,
    energy: 0,
    maxEnergy: 100,
    trait: 'none',
    reaction: 'retreat',
    skills: {
      passive: {
        id: 'holy_aura',
        name: 'Святая Аура',
        description: 'Союзники в радиусе 2 гексов восстанавливают 5 HP каждый ход',
        type: 'passive',
        passiveEffect: {
          trigger: 'aura',
          area: 2,
          target: 'allies',
          heal: 5,
        },
      },
      active: {
        id: 'healing_light',
        name: 'Исцеляющий Свет',
        description: 'Восстанавливает 40 HP союзнику на дистанции до 3 гексов',
        type: 'active',
        effect: {
          target: 'ally',
          heal: 40,
          range: 3,
        },
      },
      ultimate: {
        id: 'divine_intervention',
        name: 'Божественное Вмешательство',
        description: 'Воскрешает павшего союзника с 50% HP',
        type: 'ultimate',
        energyCost: 100,
        effect: {
          target: 'ally',
          special: 'resurrect',
          healPercent: 50,
        },
      },
    },
    description: 'Благословенная служительница Света. Её молитвы исцеляют раны и возвращают павших.',
  },
  {
    id: 'war_drummer',
    name: 'Боевой Барабанщик',
    title: 'Вдохновитель Битвы',
    role: 'support',
    avatar: '🥁',
    health: 110,
    maxHealth: 110,
    attack: 30,
    attackType: 'physical',
    attackRange: 'melee',
    range: 1,
    physicalDefense: 3,
    magicalDefense: 3,
    initiative: 7,
    speed: 3,
    energy: 0,
    maxEnergy: 85,
    trait: 'none',
    reaction: 'parry',
    skills: {
      passive: {
        id: 'battle_rhythm',
        name: 'Боевой Ритм',
        description: 'Союзники получают +1 к инициативе',
        type: 'passive',
        passiveEffect: {
          trigger: 'aura',
          target: 'allies',
          statBuffs: [{ stat: 'initiative', value: 1 }],
        },
      },
      active: {
        id: 'war_cry',
        name: 'Боевой Клич',
        description: 'Союзники в радиусе 3 гексов получают +20% к атаке на 2 хода',
        type: 'active',
        effect: {
          target: 'ally',
          area: 3,
          statBuffs: [{ stat: 'attack', value: 20, isPercent: true, duration: 2 }],
        },
      },
      ultimate: {
        id: 'drums_of_war',
        name: 'Барабаны Войны',
        description: 'Все союзники получают дополнительный ход',
        type: 'ultimate',
        energyCost: 85,
        effect: {
          target: 'all_allies',
          special: 'extra_turn',
        },
      },
    },
    description: 'Ветеран сотен битв. Его барабаны вселяют храбрость в сердца союзников.',
  },
  {
    id: 'necromancer',
    name: 'Некромант',
    title: 'Повелитель Мёртвых',
    role: 'support',
    avatar: '💀',
    health: 90,
    maxHealth: 90,
    attack: 35,
    attackType: 'magical',
    attackRange: 'ranged',
    range: 4,
    physicalDefense: 2,
    magicalDefense: 5,
    initiative: 4,
    speed: 2,
    energy: 0,
    maxEnergy: 100,
    trait: 'none',
    reaction: 'none',
    skills: {
      passive: {
        id: 'life_drain',
        name: 'Похищение Жизни',
        description: 'Восстанавливает HP равное 20% нанесённого урона',
        type: 'passive',
        passiveEffect: {
          trigger: 'on_attack',
          target: 'self',
          special: 'life_drain',
        },
      },
      active: {
        id: 'dark_pact',
        name: 'Тёмный Договор',
        description: 'Жертвует 20 своего HP, чтобы дать союзнику +30% урона на 2 хода',
        type: 'active',
        effect: {
          target: 'ally',
          range: 4,
          selfDamage: 20,
          statBuffs: [{ stat: 'attack', value: 30, isPercent: true, duration: 2 }],
        },
      },
      ultimate: {
        id: 'army_of_dead',
        name: 'Армия Мёртвых',
        description: 'Призывает 2 скелетов-воинов (50 HP, 20 атаки) на 3 хода',
        type: 'ultimate',
        energyCost: 100,
        effect: {
          target: 'self',
          special: 'summon_skeletons',
        },
      },
    },
    description: 'Мрачный маг, управляющий силами смерти. Грань между союзником и врагом для него размыта.',
  },
  {
    id: 'shaman',
    name: 'Шаман Бури',
    title: 'Голос Стихий',
    role: 'support',
    avatar: '🌩️',
    health: 100,
    maxHealth: 100,
    attack: 32,
    attackType: 'magical',
    attackRange: 'ranged',
    range: 3,
    physicalDefense: 2,
    magicalDefense: 5,
    initiative: 5,
    speed: 2,
    energy: 0,
    maxEnergy: 90,
    trait: 'flight',
    reaction: 'return_shot',
    skills: {
      passive: {
        id: 'static_charge',
        name: 'Статический Заряд',
        description: 'Атаки с шансом 25% наносят цепную молнию 2 ближайшим врагам',
        type: 'passive',
        passiveEffect: {
          trigger: 'on_attack',
          target: 'enemies',
          chance: 0.25,
          damage: 15,
          damageType: 'magical',
          special: 'chain_lightning',
        },
      },
      active: {
        id: 'totem_of_protection',
        name: 'Тотем Защиты',
        description: 'Устанавливает тотем, дающий союзникам в радиусе 2 +2 защиты на 3 хода',
        type: 'active',
        effect: {
          target: 'ally',
          area: 2,
          statBuffs: [
            { stat: 'physicalDefense', value: 2, duration: 3 },
            { stat: 'magicalDefense', value: 2, duration: 3 },
          ],
        },
      },
      ultimate: {
        id: 'storm_call',
        name: 'Зов Бури',
        description: 'Вызывает грозу: молнии бьют 5 раз случайных врагов по 25 урона',
        type: 'ultimate',
        energyCost: 90,
        effect: {
          target: 'all_enemies',
          damage: 25,
          damageType: 'magical',
          special: 'random_5_hits',
        },
      },
    },
    description: 'Духовный лидер племени, способный призывать гнев небес на врагов.',
  },
];

export const getHeroById = (id: string): Hero | undefined => {
  return heroes.find(hero => hero.id === id);
};

export const getHeroesByRole = (role: HeroRole): Hero[] => {
  return heroes.filter(hero => hero.role === role);
};

export const getHeroesByRange = (range: AttackRange): Hero[] => {
  return heroes.filter(hero => hero.attackRange === range);
};

export const calculateDamageReduction = (defense: number): number => {
  return Math.min(defense * 10, 90);
};

export const calculateDamage = (
  attackerDamage: number,
  attackType: DamageType,
  defenderPhysDef: number,
  defenderMagDef: number
): number => {
  const defense = attackType === 'physical' ? defenderPhysDef : defenderMagDef;
  const reduction = calculateDamageReduction(defense) / 100;
  return Math.round(attackerDamage * (1 - reduction));
};
