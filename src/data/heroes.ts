export type HeroRole = 'tank' | 'attack' | 'support';
export type DamageType = 'physical' | 'magical';

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
  physicalDefense: number;
  magicalDefense: number;
  initiative: number;
  speed: number;
  energy: number;
  maxEnergy: number;
  skills: {
    passive: Skill;
    active: Skill;
    ultimate: Skill;
  };
  description: string;
}

export const heroes: Hero[] = [
  // TANKS
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
    physicalDefense: 8,
    magicalDefense: 4,
    initiative: 2,
    speed: 2,
    energy: 0,
    maxEnergy: 100,
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
    physicalDefense: 6,
    magicalDefense: 6,
    initiative: 1,
    speed: 1,
    energy: 0,
    maxEnergy: 100,
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
  
  // ATTACKERS
  {
    id: 'shadow_blade',
    name: 'Клинок Тени',
    title: 'Мастер Теней',
    role: 'attack',
    avatar: '⚔️',
    health: 100,
    maxHealth: 100,
    attack: 45,
    attackType: 'physical',
    physicalDefense: 2,
    magicalDefense: 3,
    initiative: 8,
    speed: 4,
    energy: 0,
    maxEnergy: 80,
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
    physicalDefense: 1,
    magicalDefense: 5,
    initiative: 5,
    speed: 2,
    energy: 0,
    maxEnergy: 90,
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
  
  // SUPPORT
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
    physicalDefense: 2,
    magicalDefense: 6,
    initiative: 6,
    speed: 3,
    energy: 0,
    maxEnergy: 100,
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
        description: 'Восстанавливает 40 HP союзнику',
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
    physicalDefense: 3,
    magicalDefense: 3,
    initiative: 7,
    speed: 3,
    energy: 0,
    maxEnergy: 85,
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
];

export const getHeroById = (id: string): Hero | undefined => {
  return heroes.find(hero => hero.id === id);
};

export const getHeroesByRole = (role: HeroRole): Hero[] => {
  return heroes.filter(hero => hero.role === role);
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
