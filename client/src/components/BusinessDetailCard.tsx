import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Sparkles, Image as ImageIcon, Users, Briefcase } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Business, VisualAsset } from '@shared/schema';
import { VisualAssetGeneratorDialog } from './VisualAssetGeneratorDialog';
import { AssetBrowserDialog } from './AssetBrowserDialog';

interface BusinessDetailCardProps {
  business: Business;
  showAssets?: boolean;
}

export function BusinessDetailCard({ business, showAssets = true }: BusinessDetailCardProps) {
  const [showAssetGenerator, setShowAssetGenerator] = useState(false);
  const [showAssetBrowser, setShowAssetBrowser] = useState(false);
  const queryClient = useQueryClient();

  // Fetch business visual assets
  const { data: businessAssets = [] } = useQuery<VisualAsset[]>({
    queryKey: ['/api/assets', 'business', business.id],
    enabled: showAssets,
  });

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{business.name}</CardTitle>
              <CardDescription>
                <Badge variant="outline" className="mt-1">
                  {business.businessType}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Business Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Founded</span>
            <p className="font-medium">{business.foundedYear}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Status</span>
            <p className="font-medium">
              {business.isOutOfBusiness ? (
                <Badge variant="destructive">Out of Business</Badge>
              ) : (
                <Badge variant="default">Active</Badge>
              )}
            </p>
          </div>
        </div>

        {/* Visual Assets Section */}
        {showAssets && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Visual Assets ({businessAssets.length})
              </h4>
              <div className="flex gap-2">
                {businessAssets.length > 0 && (
                  <Button
                    onClick={() => setShowAssetBrowser(true)}
                    variant="outline"
                    size="sm"
                  >
                    <ImageIcon className="h-3 w-3 mr-1" />
                    View All
                  </Button>
                )}
                <Button
                  onClick={() => setShowAssetGenerator(true)}
                  variant="outline"
                  size="sm"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Generate
                </Button>
              </div>
            </div>

            {businessAssets.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground mb-3">No building images yet</p>
                  <Button onClick={() => setShowAssetGenerator(true)} size="sm" variant="outline">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Generate Exterior
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {businessAssets.slice(0, 4).map(asset => (
                  <div key={asset.id} className="relative aspect-video rounded-md overflow-hidden">
                    <img
                      src={`/${asset.filePath}`}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1">
                      <Badge variant="secondary" className="text-xs">
                        {asset.assetType.replace('building_', '')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Asset Generator Dialog */}
        <VisualAssetGeneratorDialog
          open={showAssetGenerator}
          onOpenChange={setShowAssetGenerator}
          entityType="business"
          entityId={business.id}
          entityName={business.name}
          assetType="building_exterior"
          onAssetGenerated={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/assets', 'business', business.id] });
          }}
        />

        {/* Asset Browser Dialog */}
        <AssetBrowserDialog
          open={showAssetBrowser}
          onOpenChange={setShowAssetBrowser}
          entityType="business"
          entityId={business.id}
        />
      </CardContent>
    </Card>
  );
}
