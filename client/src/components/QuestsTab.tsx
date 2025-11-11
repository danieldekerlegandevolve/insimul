import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Clock, XCircle, Trophy, Target, Plus } from 'lucide-react';
import { QuestCreateDialog } from './QuestCreateDialog';

interface Quest {
  id: string;
  worldId: string;
  assignedTo: string;
  assignedBy: string | null;
  assignedToCharacterId: string | null;
  assignedByCharacterId: string | null;
  title: string;
  description: string;
  questType: string;
  difficulty: string;
  targetLanguage: string;
  objectives: any[] | null;
  progress: Record<string, any> | null;
  status: string;
  completionCriteria: Record<string, any> | null;
  experienceReward: number;
  rewards: Record<string, any> | null;
  assignedAt: Date;
  completedAt: Date | null;
  expiresAt: Date | null;
  conversationContext: string | null;
  tags: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

interface QuestsTabProps {
  worldId: string;
}

export function QuestsTab({ worldId }: QuestsTabProps) {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch quests
  const { data: quests = [] } = useQuery<Quest[]>({
    queryKey: ['/api/worlds', worldId, 'quests'],
    enabled: !!worldId,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'active':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'conversation':
        return '💬';
      case 'translation':
        return '🔄';
      case 'vocabulary':
        return '📚';
      case 'grammar':
        return '📝';
      case 'cultural':
        return '🌍';
      default:
        return '🎯';
    }
  };

  const activeQuests = quests.filter(q => q.status === 'active');
  const completedQuests = quests.filter(q => q.status === 'completed');
  const otherQuests = quests.filter(q => q.status !== 'active' && q.status !== 'completed');

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6" />
            Quests ({quests.length})
          </h2>
          <p className="text-muted-foreground mt-1">
            Create and manage narrative quests for your world
          </p>
        </div>
        <QuestCreateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          worldId={worldId}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/worlds', worldId, 'quests'] });
          }}
        >
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Quest
          </Button>
        </QuestCreateDialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quest List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Quests */}
        {activeQuests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Active Quests ({activeQuests.length})
              </CardTitle>
              <CardDescription>
                Language learning quests currently in progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {activeQuests.map((quest) => (
                    <Card
                      key={quest.id}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        selectedQuest?.id === quest.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedQuest(quest)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">{getTypeIcon(quest.questType)}</span>
                              <h3 className="font-semibold">{quest.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {quest.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge className={getDifficultyColor(quest.difficulty)}>
                                {quest.difficulty}
                              </Badge>
                              <Badge variant="outline">
                                {quest.targetLanguage}
                              </Badge>
                              <Badge variant="outline">
                                {quest.questType}
                              </Badge>
                              {quest.assignedBy && (
                                <Badge variant="secondary">
                                  From: {quest.assignedBy}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusIcon(quest.status)}
                            <div className="flex items-center gap-1 text-sm text-amber-600">
                              <Trophy className="w-3 h-3" />
                              {quest.experienceReward} XP
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Completed Quests */}
        {completedQuests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Completed Quests ({completedQuests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {completedQuests.map((quest) => (
                    <Card
                      key={quest.id}
                      className="cursor-pointer opacity-75 hover:opacity-100 transition-opacity"
                      onClick={() => setSelectedQuest(quest)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{quest.title}</h3>
                            <p className="text-sm text-muted-foreground">{quest.description}</p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* No Quests */}
        {quests.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Quests Yet</h3>
              <p className="text-muted-foreground">
                Talk to characters to receive language learning quests!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quest Details Panel */}
      <div className="lg:col-span-1">
        {selectedQuest ? (
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{getTypeIcon(selectedQuest.questType)}</span>
                Quest Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedQuest.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedQuest.description}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(selectedQuest.status)}
                    <span className="capitalize">{selectedQuest.status}</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <Badge className={getDifficultyColor(selectedQuest.difficulty)}>
                    {selectedQuest.difficulty}
                  </Badge>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Language:</span>
                  <span>{selectedQuest.targetLanguage}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="capitalize">{selectedQuest.questType}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reward:</span>
                  <div className="flex items-center gap-1 text-amber-600">
                    <Trophy className="w-3 h-3" />
                    {selectedQuest.experienceReward} XP
                  </div>
                </div>

                {selectedQuest.assignedBy && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Assigned by:</span>
                    <span>{selectedQuest.assignedBy}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Assigned:</span>
                  <span>{new Date(selectedQuest.assignedAt).toLocaleDateString()}</span>
                </div>

                {selectedQuest.completedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed:</span>
                    <span>{new Date(selectedQuest.completedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {selectedQuest.completionCriteria && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Completion Criteria:</h4>
                  <p className="text-xs text-muted-foreground">
                    {selectedQuest.completionCriteria.description}
                  </p>

                  {/* Progress Display */}
                  {selectedQuest.progress && (
                    <div className="space-y-2">
                      {/* Vocabulary Usage Progress */}
                      {selectedQuest.completionCriteria.type === 'vocabulary_usage' && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Words Used:</span>
                            <span className="font-semibold">
                              {selectedQuest.progress.currentCount || 0} / {selectedQuest.completionCriteria.requiredCount}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, ((selectedQuest.progress.currentCount || 0) / selectedQuest.completionCriteria.requiredCount) * 100)}%`
                              }}
                            />
                          </div>
                          {selectedQuest.progress.wordsUsed && selectedQuest.progress.wordsUsed.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold mb-1">Words you've used:</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedQuest.progress.wordsUsed.map((word: string) => (
                                  <Badge key={word} variant="secondary" className="text-xs">
                                    {word}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Conversation Turns Progress */}
                      {selectedQuest.completionCriteria.type === 'conversation_turns' && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Conversation Turns:</span>
                            <span className="font-semibold">
                              {selectedQuest.progress.turnsCompleted || 0} / {selectedQuest.completionCriteria.requiredTurns}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, ((selectedQuest.progress.turnsCompleted || 0) / selectedQuest.completionCriteria.requiredTurns) * 100)}%`
                              }}
                            />
                          </div>
                          {selectedQuest.progress.keywordsUsed && selectedQuest.progress.keywordsUsed.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold mb-1">Keywords used:</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedQuest.progress.keywordsUsed.map((keyword: string) => (
                                  <Badge key={keyword} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Grammar Pattern Progress */}
                      {selectedQuest.completionCriteria.type === 'grammar_pattern' && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Patterns Used:</span>
                            <span className="font-semibold">
                              {selectedQuest.progress.currentCount || 0} / {selectedQuest.completionCriteria.requiredCount}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, ((selectedQuest.progress.currentCount || 0) / selectedQuest.completionCriteria.requiredCount) * 100)}%`
                              }}
                            />
                          </div>
                          {selectedQuest.progress.patternsUsed && selectedQuest.progress.patternsUsed.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold mb-1">Patterns used:</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedQuest.progress.patternsUsed.map((pattern: string) => (
                                  <Badge key={pattern} variant="secondary" className="text-xs">
                                    {pattern}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Conversation Engagement Progress */}
                      {selectedQuest.completionCriteria.type === 'conversation_engagement' && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Messages Sent:</span>
                            <span className="font-semibold">
                              {selectedQuest.progress.messagesCount || 0} / {selectedQuest.completionCriteria.requiredMessages}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, ((selectedQuest.progress.messagesCount || 0) / selectedQuest.completionCriteria.requiredMessages) * 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedQuest.conversationContext && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Context:</h4>
                  <p className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900 p-3 rounded">
                    {selectedQuest.conversationContext.substring(0, 200)}...
                  </p>
                </div>
              )}

              {selectedQuest.status === 'active' && (
                <Button className="w-full" variant="default">
                  Continue Quest
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="sticky top-4">
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Select a quest to view details
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
}
