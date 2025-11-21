import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertLanguageSchema, type InsertLanguage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Sparkles } from "lucide-react";

const LANGUAGE_INFLUENCES = [
  "Romance", "Germanic", "Slavic", "Celtic", "Baltic",
  "Sino-Tibetan", "Japonic", "Koreanic", "Dravidian",
  "Austronesian", "Turkic", "Semitic", "Uralic",
  "Niger-Congo", "Austroasiatic", "Indo-Aryan"
];

interface LanguageFormProps {
  onSubmit: (data: InsertLanguage) => Promise<void>;
  isPending: boolean;
  parentId?: string;
  parentName?: string;
}

export function LanguageForm({ onSubmit, isPending, parentId, parentName }: LanguageFormProps) {
  const form = useForm<InsertLanguage>({
    resolver: zodResolver(insertLanguageSchema),
    defaultValues: {
      name: "",
      description: "",
      influences: [],
      parentId: parentId || undefined,
    },
  });

  const handleSubmit = async (data: InsertLanguage) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {parentName && (
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              Creating a child language of <span className="font-semibold text-foreground">{parentName}</span>
            </p>
          </div>
        )}
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Elvarin, Neo-Latine, Stellarian"
                  {...field}
                  data-testid="input-language-name"
                />
              </FormControl>
              <FormDescription>
                Give your constructed language a unique and memorable name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the characteristics, purpose, and feel of your language. What makes it unique? What sounds, structures, or cultural elements should it have?"
                  className="min-h-32 resize-none"
                  {...field}
                  data-testid="input-language-description"
                />
              </FormControl>
              <FormDescription>
                Provide detailed guidance for the AI to generate your language. The more specific, the better!
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="influences"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Natural Language Influences</FormLabel>
                <FormDescription className="mt-2">
                  Select the natural language families that should influence your conlang's structure and sound.
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {LANGUAGE_INFLUENCES.map((influence) => (
                  <FormField
                    key={influence}
                    control={form.control}
                    name="influences"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={influence}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(influence)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, influence])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== influence
                                      )
                                    );
                              }}
                              data-testid={`checkbox-influence-${influence}`}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            {influence}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            data-testid="button-generate-language"
            className="min-w-48"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Language
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
