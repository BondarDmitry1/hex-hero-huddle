import { useGameStore } from '@/store/gameStore';
import { Swords, Users } from 'lucide-react';

export const MainMenu = () => {
  const { setPhase, resetDraft } = useGameStore();

  const handleBattle = () => {
    resetDraft();
    setPhase('draft');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-background" />
      <div className="absolute inset-0 opacity-10" style={{ 
        backgroundImage: `repeating-linear-gradient(45deg, hsl(43 74% 49% / 0.1) 0px, transparent 1px, transparent 30px, hsl(43 74% 49% / 0.1) 31px)`,
        backgroundSize: '60px 60px'
      }} />
      
      <div className="relative z-10 text-center animate-fade-in">
        {/* Logo/Title */}
        <div className="mb-12">
          <h1 className="text-6xl font-display font-bold text-primary text-shadow-glow mb-4">
            Герои Битвы
          </h1>
          <p className="text-xl text-muted-foreground font-body">
            Тактическая пошаговая стратегия
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <span className="text-4xl animate-float" style={{ animationDelay: '0s' }}>⚔️</span>
            <span className="text-4xl animate-float" style={{ animationDelay: '0.2s' }}>🛡️</span>
            <span className="text-4xl animate-float" style={{ animationDelay: '0.4s' }}>✨</span>
          </div>
        </div>

        {/* Menu buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleBattle}
            className="fantasy-button flex items-center justify-center gap-3 min-w-[240px] text-lg"
          >
            <Swords className="w-6 h-6" />
            В Бой
          </button>
          
          <button
            onClick={() => setPhase('heroes')}
            className="fantasy-button flex items-center justify-center gap-3 min-w-[240px] text-lg"
          >
            <Users className="w-6 h-6" />
            Герои
          </button>
        </div>

        {/* Version info */}
        <p className="mt-12 text-sm text-muted-foreground/50">
          Версия 0.1 • Демо
        </p>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-primary/30" />
      <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-primary/30" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-primary/30" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-primary/30" />
    </div>
  );
};
