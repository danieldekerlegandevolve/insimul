/**
 * Variant Comparison Dialog
 *
 * Displays multiple AI-generated variants side-by-side for comparison.
 * Allows users to select the best variant or keep multiple.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Trash2, Star } from 'lucide-react';

interface VariantComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variants: any[];
  title?: string;
  description?: string;
  onComplete?: () => void;
}

export function VariantComparisonDialog({
  open,
  onOpenChange,
  variants,
  title = 'Compare Variants',
  description = 'Select your favorite variant or keep multiple',
  onComplete,
}: VariantComparisonDialogProps) {
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [favoriteVariant, setFavoriteVariant] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const response = await apiRequest('DELETE', `/api/assets/${assetId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
    },
  });

  const toggleVariant = (variantId: string) => {
    const newSelected = new Set(selectedVariants);
    if (newSelected.has(variantId)) {
      newSelected.delete(variantId);
    } else {
      newSelected.add(variantId);
    }
    setSelectedVariants(newSelected);
  };

  const setAsFavorite = (variantId: string) => {
    setFavoriteVariant(variantId);
    setSelectedVariants(new Set([variantId]));
  };

  const handleKeepSelected = async () => {
    // Delete unselected variants
    const variantsToDelete = variants
      .filter(v => !selectedVariants.has(v.id))
      .map(v => v.id);

    try {
      await Promise.all(
        variantsToDelete.map(id => deleteAssetMutation.mutateAsync(id))
      );

      toast({
        title: 'Variants Updated',
        description: `Kept ${selectedVariants.size} variant(s), deleted ${variantsToDelete.length}`,
      });

      if (onComplete) onComplete();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update variants',
        variant: 'destructive',
      });
    }
  };

  const handleKeepAll = () => {
    toast({
      title: 'All Variants Kept',
      description: `Keeping all ${variants.length} variants`,
    });
    if (onComplete) onComplete();
    onOpenChange(false);
  };

  const handleKeepFavorite = async () => {
    if (!favoriteVariant) {
      toast({
        title: 'No Favorite Selected',
        description: 'Please select a favorite variant first',
        variant: 'destructive',
      });
      return;
    }

    const variantsToDelete = variants
      .filter(v => v.id !== favoriteVariant)
      .map(v => v.id);

    try {
      await Promise.all(
        variantsToDelete.map(id => deleteAssetMutation.mutateAsync(id))
      );

      toast({
        title: 'Favorite Selected',
        description: `Kept your favorite, deleted ${variantsToDelete.length} other variant(s)`,
      });

      if (onComplete) onComplete();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update variants',
        variant: 'destructive',
      });
    }
  };

  if (variants.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Variant Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
          {variants.map((variant, index) => {
            const isSelected = selectedVariants.has(variant.id);
            const isFavorite = favoriteVariant === variant.id;

            return (
              <Card
                key={variant.id}
                className={`cursor-pointer transition-all relative ${
                  isSelected ? 'ring-2 ring-primary' : 'hover:shadow-lg'
                } ${isFavorite ? 'ring-2 ring-yellow-500' : ''}`}
                onClick={() => toggleVariant(variant.id)}
              >
                {/* Favorite Badge */}
                {isFavorite && (
                  <Badge
                    className="absolute top-2 left-2 z-10 bg-yellow-500"
                  >
                    <Star className="h-3 w-3 mr-1 fill-white" />
                    Favorite
                  </Badge>
                )}

                {/* Selection Indicator */}
                {isSelected && !isFavorite && (
                  <div className="absolute top-2 right-2 z-10">
                    <CheckCircle2 className="h-6 w-6 text-primary bg-white rounded-full" />
                  </div>
                )}

                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Variant {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAsFavorite(variant.id);
                      }}
                    >
                      <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </Button>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-2">
                  {/* Image Preview */}
                  <div className="relative aspect-square rounded-md overflow-hidden bg-muted">
                    <img
                      src={`/${variant.filePath}`}
                      alt={variant.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Provider:</span>
                      <span className="font-medium">{variant.generationProvider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dimensions:</span>
                      <span className="font-medium">{variant.width}×{variant.height}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Selection Summary */}
        <div className="bg-muted p-3 rounded-md flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">{selectedVariants.size}</span> of{' '}
            <span className="font-medium">{variants.length}</span> variants selected
            {favoriteVariant && (
              <span className="ml-2 text-yellow-600">
                • 1 favorite marked
              </span>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            variant="outline"
            onClick={handleKeepAll}
          >
            Keep All {variants.length}
          </Button>

          {favoriteVariant && (
            <Button
              variant="default"
              onClick={handleKeepFavorite}
              disabled={deleteAssetMutation.isPending}
            >
              <Star className="h-4 w-4 mr-2 fill-yellow-500" />
              Keep Favorite Only
            </Button>
          )}

          <Button
            onClick={handleKeepSelected}
            disabled={selectedVariants.size === 0 || deleteAssetMutation.isPending}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Keep Selected ({selectedVariants.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
