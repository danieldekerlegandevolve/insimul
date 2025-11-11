// Mental actions radial menu component

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Action } from '../types/actions';

interface ActionRadialMenuProps {
  actions: Action[];
  playerPosition: { x: number; y: number };
  onActionSelect: (actionId: string) => void;
  onClose: () => void;
  playerEnergy: number;
}

export function ActionRadialMenu({ 
  actions, 
  playerPosition, 
  onActionSelect, 
  onClose,
  playerEnergy 
}: ActionRadialMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + actions.length) % actions.length);
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % actions.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (actions[selectedIndex]) {
          const action = actions[selectedIndex];
          if (!action.energyCost || action.energyCost <= playerEnergy) {
            onActionSelect(action.id);
            onClose();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, selectedIndex, onClose, onActionSelect, playerEnergy]);

  if (actions.length === 0) {
    return (
      <div 
        className="absolute bg-card/95 backdrop-blur-sm rounded-lg p-4 shadow-xl border-2 border-primary z-50"
        style={{
          left: `${playerPosition.x + 50}px`,
          top: `${playerPosition.y}px`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <p className="text-sm text-muted-foreground">No mental actions available</p>
        <p className="text-xs text-muted-foreground mt-1">Press TAB or ESC to close</p>
      </div>
    );
  }

  // Calculate radial positions for actions
  const radius = 120;
  const angleStep = (2 * Math.PI) / actions.length;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Center indicator */}
      <div
        className="absolute w-12 h-12 bg-primary/20 rounded-full border-2 border-primary z-50"
        style={{
          left: `${playerPosition.x}px`,
          top: `${playerPosition.y}px`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="w-full h-full flex items-center justify-center text-2xl">
          🧠
        </div>
      </div>

      {/* Radial action buttons */}
      {actions.map((action, index) => {
        const angle = index * angleStep - Math.PI / 2; // Start from top
        const x = playerPosition.x + radius * Math.cos(angle);
        const y = playerPosition.y + radius * Math.sin(angle);
        const isSelected = index === selectedIndex;
        const canAfford = !action.energyCost || action.energyCost <= playerEnergy;

        return (
          <Card
            key={action.id}
            className={`absolute w-32 cursor-pointer transition-all z-50 ${
              isSelected ? 'border-2 border-primary scale-110' : 'border'
            } ${!canAfford ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => {
              if (canAfford) {
                onActionSelect(action.id);
                onClose();
              }
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <CardContent className="p-3">
              <div className="text-center">
                <div className="text-2xl mb-1">🧠</div>
                <div className="text-xs font-semibold mb-1">{action.name}</div>
                {action.energyCost && action.energyCost > 0 && (
                  <Badge 
                    variant={canAfford ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    ⚡{action.energyCost}
                  </Badge>
                )}
                {action.cooldown && action.cooldown > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    CD: {action.cooldown}s
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Instructions */}
      <div
        className="absolute bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-xl border z-50"
        style={{
          left: `${playerPosition.x}px`,
          top: `${playerPosition.y + radius + 80}px`,
          transform: 'translateX(-50%)'
        }}
      >
        <div className="text-xs text-center space-y-1">
          <div><strong>↑↓</strong> or <strong>WS</strong>: Select</div>
          <div><strong>Enter</strong> or <strong>Space</strong>: Use</div>
          <div><strong>TAB</strong> or <strong>ESC</strong>: Close</div>
        </div>
      </div>
    </>
  );
}
