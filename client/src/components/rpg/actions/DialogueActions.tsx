// Social actions component for NPC dialogue

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Action } from '../types/actions';

interface DialogueActionsProps {
  actions: Action[];
  onActionSelect: (actionId: string) => void;
  playerEnergy: number;
}

export function DialogueActions({ actions, onActionSelect, playerEnergy }: DialogueActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <Card className="mt-2">
      <CardContent className="p-3">
        <div className="text-xs font-semibold text-muted-foreground mb-2">
          What do you want to do?
        </div>
        <div className="space-y-1">
          {actions.map((action) => {
            const canAfford = !action.energyCost || action.energyCost <= playerEnergy;
            const disabled = !canAfford;

            return (
              <Button
                key={action.id}
                variant="outline"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => onActionSelect(action.id)}
                disabled={disabled}
              >
                <div className="flex items-start gap-2 w-full">
                  <span className="text-lg">💬</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {action.name}
                    </div>
                    {action.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {action.description}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 items-center shrink-0">
                    {action.energyCost && action.energyCost > 0 && (
                      <Badge 
                        variant={canAfford ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        ⚡{action.energyCost}
                      </Badge>
                    )}
                    {action.effects && action.effects.length > 0 && (
                      <span className="text-xs" title="Affects relationship">
                        ❤️
                      </span>
                    )}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <span>💡</span>
          <span>Actions affect your relationship with NPCs and cost energy</span>
        </div>
      </CardContent>
    </Card>
  );
}
