import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LearningModule as LearningModuleType, Exercise } from '@/types/language';
import { BookOpen, CheckCircle, XCircle, Play, RotateCcw } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface LearningModuleProps {
  module: LearningModuleType;
}

const LearningModule: React.FC<LearningModuleProps> = ({ module }) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const allExercises = module.content.flatMap(content => content.exercises || []);
  const totalExercises = allExercises.length;

  const handleAnswerChange = (exerciseIndex: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [exerciseIndex]: answer
    }));
  };

  const checkAnswers = () => {
    let correctCount = 0;
    allExercises.forEach((exercise, index) => {
      if (userAnswers[index] === exercise.correctAnswer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setShowResults(true);
    
    const percentage = (correctCount / totalExercises) * 100;
    if (percentage >= 80) {
      showSuccess(`Excellent! You scored ${correctCount}/${totalExercises} (${percentage.toFixed(0)}%)`);
    } else if (percentage >= 60) {
      showSuccess(`Good job! You scored ${correctCount}/${totalExercises} (${percentage.toFixed(0)}%)`);
    } else {
      showError(`Keep practicing! You scored ${correctCount}/${totalExercises} (${percentage.toFixed(0)}%)`);
    }
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setShowResults(false);
    setScore(0);
    setCurrentExercise(0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'default';
      case 'intermediate': return 'secondary';
      case 'advanced': return 'destructive';
      default: return 'outline';
    }
  };

  const renderExercise = (exercise: Exercise, index: number) => {
    const isCorrect = showResults && userAnswers[index] === exercise.correctAnswer;
    const isIncorrect = showResults && userAnswers[index] !== exercise.correctAnswer;

    return (
      <Card key={index} className={`${
        showResults ? (isCorrect ? 'border-green-500' : isIncorrect ? 'border-red-500' : '') : ''
      }`}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h4 className="font-medium">{exercise.question}</h4>
              {showResults && (
                <div className="flex items-center space-x-1">
                  {isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
            </div>

            {exercise.type === 'multiple-choice' && exercise.options && (
              <RadioGroup
                value={userAnswers[index] || ''}
                onValueChange={(value) => handleAnswerChange(index, value)}
                disabled={showResults}
              >
                {exercise.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${index}-${optionIndex}`} />
                    <Label htmlFor={`${index}-${optionIndex}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {(exercise.type === 'fill-blank' || exercise.type === 'translation') && (
              <Input
                placeholder="Enter your answer..."
                value={userAnswers[index] || ''}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                disabled={showResults}
              />
            )}

            {showResults && (
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">Correct Answer:</span>
                  <span className="font-mono">{exercise.correctAnswer}</span>
                </div>
                <p className="text-sm text-muted-foreground">{exercise.explanation}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <CardTitle>{module.title}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={getDifficultyColor(module.difficulty)} className="capitalize">
              {module.difficulty}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {module.type}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Interactive exercises to learn your constructed language
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Learning Content */}
        <div className="space-y-4">
          {module.content.map((content, index) => (
            <div key={index} className="space-y-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm">{content.instruction}</p>
                {content.examples.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <h5 className="font-medium text-xs">Examples:</h5>
                    {content.examples.map((example, exampleIndex) => (
                      <p key={exampleIndex} className="font-mono text-sm">
                        {example}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Exercises */}
        {totalExercises > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Practice Exercises</h3>
              {showResults && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Score: {score}/{totalExercises}</span>
                  <Progress value={(score / totalExercises) * 100} className="w-20" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              {allExercises.map((exercise, index) => renderExercise(exercise, index))}
            </div>

            <div className="flex space-x-2">
              {!showResults ? (
                <Button onClick={checkAnswers} className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Check Answers</span>
                </Button>
              ) : (
                <Button onClick={resetQuiz} variant="outline" className="flex items-center space-x-2">
                  <RotateCcw className="h-4 w-4" />
                  <span>Try Again</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LearningModule;