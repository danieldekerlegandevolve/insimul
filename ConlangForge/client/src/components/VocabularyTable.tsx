import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Volume2, Play, Pause } from "lucide-react";
import { useSpeech } from "@/hooks/use-speech";

interface VocabularyItem {
  word: string;
  translation: string;
  partOfSpeech: string;
  etymology?: string;
  pronunciation?: string;
}

interface VocabularyTableProps {
  vocabulary: VocabularyItem[];
}

export function VocabularyTable({ vocabulary }: VocabularyTableProps) {
  const [search, setSearch] = useState("");
  const [practicing, setPracticing] = useState(false);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const practiceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const practicingRef = useRef(false);
  const practiceVocabularyRef = useRef<VocabularyItem[]>([]);
  const { speak, stop, isSpeaking, supported } = useSpeech({ rate: 0.8 });

  const filteredVocabulary = vocabulary.filter((item) => {
    const searchLower = search.toLowerCase();
    return (
      item.word.toLowerCase().includes(searchLower) ||
      item.translation.toLowerCase().includes(searchLower) ||
      item.partOfSpeech.toLowerCase().includes(searchLower)
    );
  });

  const playNextWord = useCallback((index: number) => {
    // Use ref to avoid closure issues
    const vocabList = practiceVocabularyRef.current;
    
    if (!practicingRef.current || index >= vocabList.length) {
      setPracticing(false);
      setCurrentPracticeIndex(0);
      practicingRef.current = false;
      return;
    }

    setCurrentPracticeIndex(index);
    speak(vocabList[index].word, `practice-${index}`, () => {
      // This callback fires when the word finishes speaking
      practiceTimeoutRef.current = setTimeout(() => {
        playNextWord(index + 1);
      }, 800);
    });
  }, [speak]);

  const startPractice = () => {
    if (filteredVocabulary.length === 0) return;
    
    // Store current vocabulary list in ref
    practiceVocabularyRef.current = [...filteredVocabulary];
    setPracticing(true);
    practicingRef.current = true;
    playNextWord(0);
  };

  const stopPractice = () => {
    setPracticing(false);
    setCurrentPracticeIndex(0);
    practicingRef.current = false;
    stop(); // Cancel any ongoing speech
    if (practiceTimeoutRef.current) {
      clearTimeout(practiceTimeoutRef.current);
      practiceTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (practiceTimeoutRef.current) {
        clearTimeout(practiceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vocabulary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-vocabulary-search"
          />
        </div>
        {supported && filteredVocabulary.length > 0 && (
          <Button
            variant={practicing ? "destructive" : "default"}
            onClick={practicing ? stopPractice : startPractice}
            data-testid="button-practice-mode"
          >
            {practicing ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Stop Practice
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Practice
              </>
            )}
          </Button>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/5">Word</TableHead>
              <TableHead className="w-1/5">Translation</TableHead>
              <TableHead className="w-1/6">Part of Speech</TableHead>
              <TableHead className="w-1/5">Pronunciation</TableHead>
              <TableHead className="w-1/6">Etymology</TableHead>
              {supported && <TableHead className="w-16 text-center">Audio</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVocabulary.length === 0 ? (
              <TableRow>
                <TableCell colSpan={supported ? 6 : 5} className="text-center text-muted-foreground py-8">
                  {search ? "No matching vocabulary found" : "No vocabulary available"}
                </TableCell>
              </TableRow>
            ) : (
              filteredVocabulary.map((item, index) => {
                const isPracticingThis = practicing && index === currentPracticeIndex;
                return (
                  <TableRow 
                    key={index} 
                    data-testid={`row-vocab-${index}`}
                    className={isPracticingThis ? "bg-primary/10" : ""}
                  >
                    <TableCell className="font-ipa font-semibold">{item.word}</TableCell>
                    <TableCell>{item.translation}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {item.partOfSpeech}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-ipa text-sm text-muted-foreground">
                      {item.pronunciation || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.etymology || "—"}
                    </TableCell>
                    {supported && (
                      <TableCell className="text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => speak(item.word, `vocab-${index}`)}
                          data-testid={`button-speak-${index}`}
                          aria-label={`Pronounce ${item.word}`}
                          disabled={practicing}
                        >
                          {isSpeaking(`vocab-${index}`) || isPracticingThis ? (
                            <Volume2 className="h-4 w-4 text-primary" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredVocabulary.length} of {vocabulary.length} words
      </p>
    </div>
  );
}
