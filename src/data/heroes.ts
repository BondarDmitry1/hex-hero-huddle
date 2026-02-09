export type HeroRole = 'tank' | 'attack' | 'support';
export type DamageType = 'physical' | 'magical';
export type AttackRange = 'melee' | 'ranged';

export type HeroTrait = 'flight' | 'siege' | 'no_melee_penalty' | 'ignores_reactions' | 'none';
export type HeroReaction = 'counterattack' | 'return_shot' | 'retreat' | 'parry' | 'provoked_attack' | 'none';

export const traitLabels: Record<HeroTrait, string> = {
  flight: 'Полёт',
  siege: 'Осадный урон',
  no_melee_penalty: 'Нет штрафа в ближнем бою',
  ignores_reactions: 'Игнорирует реакции',
  none: 'Нет',
};

export const traitDescriptions: Record<HeroTrait, string> = {
  flight: 'Игнорирует препятствия при перемещении (конечная клетка должна быть свободна)',
  siege: 'Может атаковать препятствия (1 HP). Способности тоже разрушают их',
  no_melee_penalty: 'Стрелок атакует в ближнем бою без штрафа к урону',
  ignores_reactions: 'Против атак этого существа не срабатывают реакции',
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

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'passive' | 'active' | 'ultimate';
  energyCost?: number;
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
  range: number; // in hexes: 1 for melee, 2-4 for ranged
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
    id: 'ironclad',
    name: 'Железный Страж',
    title: 'Непробиваемый Защитник',
    role: 'tank',
    avatar: '🛡️',
    health: 180,
    maxHealth: 180,
    attack: 25,
    attackType: 'physical',
    attackRange: 'melee',
    range: 1,
    physicalDefense: 8,
    magicalDefense: 4,
    initiative: 2,
    speed: 2,
    energy: 0,
    maxEnergy: 100,
    trait: 'none',
    reaction: 'counterattack',
    skills: {
      passive: {
        id: 'iron_skin',
        name: 'Железная Кожа',
        description: 'Получает на 15% меньше физического урона',
        type: 'passive',
      },
      active: {
        id: 'shield_wall',
        name: 'Стена Щитов',
        description: 'Блокирует следующую атаку союзника в радиусе 1 гекса',
        type: 'active',
      },
      ultimate: {
        id: 'fortress',
        name: 'Крепость',
        description: 'Становится неуязвимым на 1 ход и провоцирует всех врагов в радиусе 2 гексов',
        type: 'ultimate',
        energyCost: 100,
      },
    },
    description: 'Древний рыцарь, закованный в зачарованную броню. Его долг - защищать союзников любой ценой.',
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
      },
      active: {
        id: 'earthquake',
        name: 'Землетрясение',
        description: 'Наносит 15 урона всем врагам в радиусе 2 гексов и замедляет их на 1 ход',
        type: 'active',
      },
      ultimate: {
        id: 'mountain_form',
        name: 'Форма Горы',
        description: 'Удваивает защиту и восстанавливает 50% здоровья',
        type: 'ultimate',
        energyCost: 100,
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
      },
      active: {
        id: 'holy_strike',
        name: 'Святой Удар',
        description: 'Наносит 35 урона и оглушает цель на 1 ход',
        type: 'active',
      },
      ultimate: {
        id: 'divine_judgement',
        name: 'Божий Суд',
        description: 'Наносит урон всем врагам равный 20% их потерянного здоровья',
        type: 'ultimate',
        energyCost: 90,
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
      },
      active: {
        id: 'shadow_step',
        name: 'Теневой Шаг',
        description: 'Телепортируется на 3 гекса и наносит 30 урона',
        type: 'active',
      },
      ultimate: {
        id: 'dance_of_blades',
        name: 'Танец Клинков',
        description: 'Атакует всех соседних врагов, нанося 60% урона каждому',
        type: 'ultimate',
        energyCost: 80,
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
        description: 'Атаки поджигают врага, нанося 10 урона в течение 2 ходов',
        type: 'passive',
      },
      active: {
        id: 'fireball',
        name: 'Огненный Шар',
        description: 'Наносит 40 магического урона в области 2 гекса',
        type: 'active',
      },
      ultimate: {
        id: 'meteor_storm',
        name: 'Метеоритный Шторм',
        description: 'Вызывает метеориты на 3 случайных врага, нанося 70 урона каждому',
        type: 'ultimate',
        energyCost: 90,
      },
    },
    description: 'Мастер разрушительной магии огня. Его пламя сжигает всё на своём пути.',
  },
  {
    id: 'ranger',
    name: 'Лесной Рейнджер',
    title: 'Меткий Стрелок',
    role: 'attack',
    avatar: '🏹',
    health: 95,
    maxHealth: 95,
    attack: 40,
    attackType: 'physical',
    attackRange: 'ranged',
    range: 5,
    physicalDefense: 2,
    magicalDefense: 2,
    initiative: 7,
    speed: 3,
    energy: 0,
    maxEnergy: 85,
    trait: 'no_melee_penalty',
    reaction: 'return_shot',
    skills: {
      passive: {
        id: 'eagle_eye',
        name: 'Орлиный Глаз',
        description: '+20% шанс критического удара на дальних дистанциях',
        type: 'passive',
      },
      active: {
        id: 'piercing_shot',
        name: 'Пронзающий Выстрел',
        description: 'Стрела пробивает цель и бьёт врага за ней, нанося 35 урона каждому',
        type: 'active',
      },
      ultimate: {
        id: 'arrow_rain',
        name: 'Дождь Стрел',
        description: 'Обрушивает град стрел на область 3x3, нанося 45 урона всем врагам',
        type: 'ultimate',
        energyCost: 85,
      },
    },
    description: 'Хранитель древних лесов. Его стрелы находят цель даже сквозь густой туман.',
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
      },
      active: {
        id: 'whirlwind',
        name: 'Вихрь',
        description: 'Вращается с топором, нанося 40 урона всем соседним врагам',
        type: 'active',
      },
      ultimate: {
        id: 'rampage',
        name: 'Буйство',
        description: 'Впадает в ярость: +50% урона и скорости на 2 хода, но теряет 20% HP',
        type: 'ultimate',
        energyCost: 70,
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
      },
      active: {
        id: 'ice_lance',
        name: 'Ледяное Копьё',
        description: 'Пронзает врага льдом, нанося 45 урона и замораживая на 1 ход',
        type: 'active',
      },
      ultimate: {
        id: 'blizzard',
        name: 'Буран',
        description: 'Вызывает снежную бурю на 3 хода, замедляя всех врагов и нанося 20 урона/ход',
        type: 'ultimate',
        energyCost: 95,
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
      },
      active: {
        id: 'healing_light',
        name: 'Исцеляющий Свет',
        description: 'Восстанавливает 40 HP союзнику на дистанции до 3 гексов',
        type: 'active',
      },
      ultimate: {
        id: 'divine_intervention',
        name: 'Божественное Вмешательство',
        description: 'Воскрешает павшего союзника с 50% HP',
        type: 'ultimate',
        energyCost: 100,
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
      },
      active: {
        id: 'war_cry',
        name: 'Боевой Клич',
        description: 'Союзники в радиусе 3 гексов получают +20% к атаке на 2 хода',
        type: 'active',
      },
      ultimate: {
        id: 'drums_of_war',
        name: 'Барабаны Войны',
        description: 'Все союзники получают дополнительный ход',
        type: 'ultimate',
        energyCost: 85,
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
      },
      active: {
        id: 'dark_pact',
        name: 'Тёмный Договор',
        description: 'Жертвует 20 своего HP, чтобы дать союзнику +30% урона на 2 хода',
        type: 'active',
      },
      ultimate: {
        id: 'army_of_dead',
        name: 'Армия Мёртвых',
        description: 'Призывает 2 скелетов-воинов (50 HP, 20 атаки) на 3 хода',
        type: 'ultimate',
        energyCost: 100,
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
      },
      active: {
        id: 'totem_of_protection',
        name: 'Тотем Защиты',
        description: 'Устанавливает тотем, дающий союзникам в радиусе 2 +15% защиты',
        type: 'active',
      },
      ultimate: {
        id: 'storm_call',
        name: 'Зов Бури',
        description: 'Вызывает грозу: молнии бьют случайных врагов 5 раз по 25 урона',
        type: 'ultimate',
        energyCost: 90,
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
  return Math.min(defense * 10, 90); // Cap at 90%
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
