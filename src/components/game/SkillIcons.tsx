import { 
  Shield, Sword, Flame, Snowflake, Target, Heart, 
  Drum, Skull, Zap, Mountain, Cross, Wind, 
  Axe, Eye, Sparkles, Ghost, Users, Footprints,
  Hammer, CloudLightning, Droplets, Sun, Moon
} from 'lucide-react';
import { ReactNode } from 'react';

// Mapping skill IDs to appropriate icons
export const getSkillIcon = (skillId: string, size: 'sm' | 'md' | 'lg' = 'md'): ReactNode => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  
  const iconMap: Record<string, ReactNode> = {
    // Passives
    iron_skin: <Shield className={sizeClass} />,
    stone_body: <Mountain className={sizeClass} />,
    divine_shield: <Shield className={sizeClass} />,
    backstab: <Sword className={sizeClass} />,
    burning: <Flame className={sizeClass} />,
    eagle_eye: <Eye className={sizeClass} />,
    blood_rage: <Droplets className={sizeClass} />,
    frostbite: <Snowflake className={sizeClass} />,
    holy_aura: <Sun className={sizeClass} />,
    battle_rhythm: <Drum className={sizeClass} />,
    life_drain: <Skull className={sizeClass} />,
    storm_shield: <CloudLightning className={sizeClass} />,
    
    // Active skills
    shield_wall: <Shield className={sizeClass} />,
    earthquake: <Mountain className={sizeClass} />,
    holy_strike: <Hammer className={sizeClass} />,
    shadow_step: <Footprints className={sizeClass} />,
    fireball: <Flame className={sizeClass} />,
    piercing_shot: <Target className={sizeClass} />,
    whirlwind: <Wind className={sizeClass} />,
    ice_lance: <Snowflake className={sizeClass} />,
    healing_light: <Heart className={sizeClass} />,
    war_cry: <Drum className={sizeClass} />,
    dark_pact: <Skull className={sizeClass} />,
    chain_lightning: <Zap className={sizeClass} />,
    
    // Ultimate skills
    fortress: <Shield className={sizeClass} />,
    mountain_form: <Mountain className={sizeClass} />,
    divine_judgement: <Sun className={sizeClass} />,
    dance_of_blades: <Sword className={sizeClass} />,
    meteor_storm: <Flame className={sizeClass} />,
    arrow_rain: <Target className={sizeClass} />,
    rampage: <Axe className={sizeClass} />,
    blizzard: <Snowflake className={sizeClass} />,
    divine_intervention: <Cross className={sizeClass} />,
    drums_of_war: <Users className={sizeClass} />,
    army_of_dead: <Ghost className={sizeClass} />,
    storm_avatar: <CloudLightning className={sizeClass} />,
  };
  
  return iconMap[skillId] || <Sparkles className={sizeClass} />;
};

// Skill emoji for fallback display
export const getSkillEmoji = (skillId: string): string => {
  const emojiMap: Record<string, string> = {
    // Passives
    iron_skin: '🛡️',
    stone_body: '🗿',
    divine_shield: '✨',
    backstab: '🗡️',
    burning: '🔥',
    eagle_eye: '👁️',
    blood_rage: '🩸',
    frostbite: '❄️',
    holy_aura: '☀️',
    battle_rhythm: '🥁',
    life_drain: '💀',
    storm_shield: '⚡',
    
    // Active skills
    shield_wall: '🛡️',
    earthquake: '🌍',
    holy_strike: '⚔️',
    shadow_step: '👤',
    fireball: '🔥',
    piercing_shot: '🎯',
    whirlwind: '🌀',
    ice_lance: '🧊',
    healing_light: '💚',
    war_cry: '📢',
    dark_pact: '👻',
    chain_lightning: '⚡',
    
    // Ultimate skills
    fortress: '🏰',
    mountain_form: '⛰️',
    divine_judgement: '☀️',
    dance_of_blades: '💃',
    meteor_storm: '☄️',
    arrow_rain: '🏹',
    rampage: '😤',
    blizzard: '🌨️',
    divine_intervention: '🙏',
    drums_of_war: '🎺',
    army_of_dead: '💀',
    storm_avatar: '🌩️',
  };
  
  return emojiMap[skillId] || '✨';
};
