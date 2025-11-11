import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { X, CheckCircle2, Circle, Target, Trophy, Clock } from 'lucide-react';

interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  assignedBy?: string;
  assignedByCharacterId?: string;
  questType?: string;
  difficulty?: string;
  targetLanguage?: string;
  experienceReward?: number;
  completionCriteria?: any;
  progress?: any;
  createdAt?: Date;
  completedAt?: Date;
}

interface QuestManagerModalProps {
  worldData: any;
  open: boolean;
  onClose: () => void;
}

export function QuestManagerModal({ worldData, open, onClose }: QuestManagerModalProps) {
  if (!open) return null;

  const quests = (worldData.quests || []) as Quest[];
  const activeQuests = quests.filter(q => q.status === 'active');
  const completedQuests = quests.filter(q => q.status === 'completed');
  const failedQuests = quests.filter(q => q.status === 'failed');

  const getQuestProgress = (quest: Quest): number => {
    if (quest.status === 'completed') return 100;
    if (quest.status === 'failed') return 0;

    if (!quest.completionCriteria || !quest.progress) return 0;

    const criteria = quest.completionCriteria;
    const progress = quest.progress;

    if (criteria.type === 'vocabulary_usage') {
      const current = progress.currentCount || 0;
      const required = criteria.requiredCount || 1;
      return Math.min(100, (current / required) * 100);
    }

    if (criteria.type === 'conversation_turns') {
      const current = progress.turnsCompleted || 0;
      const required = criteria.requiredTurns || 1;
      return Math.min(100, (current / required) * 100);
    }

    if (criteria.type === 'grammar_pattern') {
      const current = progress.currentCount || 0;
      const required = criteria.requiredCount || 1;
      return Math.min(100, (current / required) * 100);
    }

    if (criteria.type === 'conversation_engagement') {
      const current = progress.messagesCount || 0;
      const required = criteria.requiredMessages || 1;
      return Math.min(100, (current / required) * 100);
    }

    return 0;
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getQuestTypeIcon = (questType?: string) => {
    switch (questType?.toLowerCase()) {
      case 'conversation': return '💬';
      case 'translation': return '🔄';
      case 'vocabulary': return '📚';
      case 'grammar': return '✍️';
      case 'cultural': return '🌍';
      default: return '📋';
    }
  };

  const renderQuestCard = (quest: Quest) => {
    const progress = getQuestProgress(quest);
    const isCompleted = quest.status === 'completed';
    const isFailed = quest.status === 'failed';

    return (
      <Card
        key={quest.id}
        className={`bg-white/5 border-white/20 text-white hover:bg-white/10 transition-colors ${
          isCompleted ? 'border-green-500/50' : isFailed ? 'border-red-500/50' : ''
        }`}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : isFailed ? (
                  <X className="w-5 h-5 text-red-400" />
                ) : (
                  <Circle className="w-5 h-5 text-blue-400" />
                )}
                <span className="text-2xl mr-2">{getQuestTypeIcon(quest.questType)}</span>
                {quest.title}
              </CardTitle>
              <CardDescription className="text-gray-300 mt-1">
                {quest.description}
              </CardDescription>
            </div>
            {quest.experienceReward && (
              <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">{quest.experienceReward} XP</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Quest metadata */}
            <div className="flex flex-wrap gap-2 text-sm">
              {quest.difficulty && (
                <span className={`px-2 py-1 rounded-full bg-white/10 ${getDifficultyColor(quest.difficulty)}`}>
                  {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
                </span>
              )}
              {quest.targetLanguage && (
                <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                  {quest.targetLanguage}
                </span>
              )}
              {quest.assignedBy && (
                <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
                  From: {quest.assignedBy}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {!isCompleted && !isFailed && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Completion criteria */}
            {quest.completionCriteria && (
              <div className="text-sm text-gray-400 bg-white/5 p-3 rounded-lg">
                <p className="font-semibold text-white mb-1">Objective:</p>
                <p>{quest.completionCriteria.description || 'Complete the quest requirements'}</p>
              </div>
            )}

            {/* Completion time */}
            {isCompleted && quest.completedAt && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Clock className="w-4 h-4" />
                <span>Completed {new Date(quest.completedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 pointer-events-auto">
      <Card className="w-[90vw] h-[90vh] max-w-6xl bg-black/90 border-white/20 text-white flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/20">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Target className="w-6 h-6" />
              Quest Manager
            </CardTitle>
            <CardDescription className="text-gray-400">
              Track your progress and complete quests to earn experience
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 p-6 overflow-hidden">
          <Tabs defaultValue="active" className="h-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/10">
              <TabsTrigger value="active" className="data-[state=active]:bg-blue-600">
                Active ({activeQuests.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-green-600">
                Completed ({completedQuests.length})
              </TabsTrigger>
              <TabsTrigger value="failed" className="data-[state=active]:bg-red-600">
                Failed ({failedQuests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="h-[calc(100%-3rem)] mt-4">
              <ScrollArea className="h-full pr-4">
                {activeQuests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Target className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg">No active quests</p>
                    <p className="text-sm">Talk to characters to receive new quests!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeQuests.map(renderQuestCard)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="completed" className="h-[calc(100%-3rem)] mt-4">
              <ScrollArea className="h-full pr-4">
                {completedQuests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Trophy className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg">No completed quests yet</p>
                    <p className="text-sm">Complete active quests to see them here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedQuests.map(renderQuestCard)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="failed" className="h-[calc(100%-3rem)] mt-4">
              <ScrollArea className="h-full pr-4">
                {failedQuests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <CheckCircle2 className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg">No failed quests</p>
                    <p className="text-sm">Keep up the good work!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {failedQuests.map(renderQuestCard)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
