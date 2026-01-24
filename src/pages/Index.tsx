import { useGameStore } from '@/store/gameStore';
import { MainMenu } from '@/components/game/MainMenu';
import { HeroesGallery } from '@/components/game/HeroesGallery';
import { DraftPhase } from '@/components/game/DraftPhase';
import { BattleArena } from '@/components/game/BattleArena';

const Index = () => {
  const { phase } = useGameStore();

  return (
    <>
      {phase === 'menu' && <MainMenu />}
      {phase === 'heroes' && <HeroesGallery />}
      {phase === 'draft' && <DraftPhase />}
      {(phase === 'placement' || phase === 'battle') && <BattleArena />}
    </>
  );
};

export default Index;
