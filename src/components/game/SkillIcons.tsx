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
    shield_wall_aura: <Shield className={sizeClass} />,
    stone_body: <Mountain className={sizeClass} />,
    divine_shield: <Shield className={sizeClass} />,
    backstab: <Sword className={sizeClass} />,
    burning: <Flame className={sizeClass} />,
    dodge: <Eye className={sizeClass} />,
    blood_rage: <Droplets className={sizeClass} />,
    frostbite: <Snowflake className={sizeClass} />,
    holy_aura: <Sun className={sizeClass} />,
    battle_rhythm: <Drum className={sizeClass} />,
    life_drain: <Skull className={sizeClass} />,
    static_charge: <CloudLightning className={sizeClass} />,
    
    // Active skills
    maneuvers: <Wind className={sizeClass} />,
    earthquake: <Mountain className={sizeClass} />,
    holy_strike: <Hammer className={sizeClass} />,
    shadow_step: <Footprints className={sizeClass} />,
    fireball: <Flame className={sizeClass} />,
    entangle: <Target className={sizeClass} />,
    whirlwind: <Wind className={sizeClass} />,
    ice_lance: <Snowflake className={sizeClass} />,
    healing_light: <Heart className={sizeClass} />,
    war_cry: <Drum className={sizeClass} />,
    dark_pact: <Skull className={sizeClass} />,
    totem_of_protection: <Shield className={sizeClass} />,
    
    // Ultimate skills
    shield_bash: <Shield className={sizeClass} />,
    mountain_form: <Mountain className={sizeClass} />,
    divine_judgement: <Sun className={sizeClass} />,
    dance_of_blades: <Sword className={sizeClass} />,
    meteor_storm: <Flame className={sizeClass} />,
    precise_shot: <Target className={sizeClass} />,
    rampage: <Axe className={sizeClass} />,
    blizzard: <Snowflake className={sizeClass} />,
    divine_intervention: <Cross className={sizeClass} />,
    drums_of_war: <Users className={sizeClass} />,
    army_of_dead: <Ghost className={sizeClass} />,
    storm_call: <CloudLightning className={sizeClass} />,
  };
  
  return iconMap[skillId] || <Sparkles className={sizeClass} />;
};

// Skill emoji for fallback display
export const getSkillEmoji = (skillId: string): string => {
  const emojiMap: Record<string, string> = {
    // Passives
    shield_wall_aura: '🛡️',
    stone_body: '🗿',
    divine_shield: '✨',
    backstab: '🗡️',
    burning: '🔥',
    dodge: '👁️',
    blood_rage: '🩸',
    frostbite: '❄️',
    holy_aura: '☀️',
    battle_rhythm: '🥁',
    life_drain: '💀',
    static_charge: '⚡',
    
    // Active skills
    maneuvers: '🏃',
    earthquake: '🌍',
    holy_strike: '⚔️',
    shadow_step: '👤',
    fireball: '🔥',
    entangle: '🌿',
    whirlwind: '🌀',
    ice_lance: '🧊',
    healing_light: '💚',
    war_cry: '📢',
    dark_pact: '👻',
    totem_of_protection: '🌩️',
    
    // Ultimate skills
    shield_bash: '🛡️',
    mountain_form: '⛰️',
    divine_judgement: '☀️',
    dance_of_blades: '💃',
    meteor_storm: '☄️',
    precise_shot: '🎯',
    rampage: '😤',
    blizzard: '🌨️',
    divine_intervention: '🙏',
    drums_of_war: '🎺',
    army_of_dead: '💀',
    storm_call: '🌩️',
  };
  
  return emojiMap[skillId] || '✨';
};
