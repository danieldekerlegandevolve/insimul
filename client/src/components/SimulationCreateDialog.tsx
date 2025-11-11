import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSimulationSchema, type InsertSimulation } from "@shared/schema";
import { z } from "zod";

const createSimulationFormSchema = insertSimulationSchema.extend({
  name: z.string().min(1, "Simulation name is required"),
  description: z.string().optional(),
  endTime: z.coerce.number().min(1).optional(),
  timeStep: z.coerce.number().min(1).optional(),
});

type CreateSimulationForm = z.infer<typeof createSimulationFormSchema>;

interface SimulationCreateDialogProps {
  worldId: string;
  onCreateSimulation: (data: InsertSimulation) => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function SimulationCreateDialog({ worldId, onCreateSimulation, isLoading = false, children }: SimulationCreateDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<CreateSimulationForm>({
    resolver: zodResolver(createSimulationFormSchema),
    defaultValues: {
      worldId,
      name: "",
      description: "",
      config: {},
      startTime: 0,
      endTime: 100,
      timeStep: 1,
      status: "pending",
      progress: 0,
      results: {},
      narrativeOutput: [],
      rulesExecuted: 0,
      eventsGenerated: 0,
    },
  });

  const handleSubmit = (data: CreateSimulationForm) => {
    onCreateSimulation(data);
    setOpen(false);
    form.reset();
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" data-testid="button-create-simulation">
            <Plus className="w-4 h-4 mr-2" />
            Create Simulation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Create New Simulation
          </DialogTitle>
          <DialogDescription>
            Create a new simulation to run narrative scenarios in this world.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Simulation Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              data-testid="input-simulation-name"
              placeholder="e.g., Royal Succession Crisis, Merchant Guild Wars"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              data-testid="textarea-simulation-description"
              placeholder="Describe what this simulation will explore..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="number"
                {...form.register("startTime")}
                data-testid="input-start-time"
                placeholder="0"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="number"
                {...form.register("endTime")}
                data-testid="input-end-time"
                placeholder="100"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeStep">Time Step</Label>
              <Input
                id="timeStep"
                type="number"
                {...form.register("timeStep")}
                data-testid="input-time-step"
                placeholder="1"
                min="1"
              />
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Simulation Settings</CardTitle>
              <CardDescription>
                The simulation will be created in a pending state. Use the "Configure & Run" button to set detailed parameters and execute it.
              </CardDescription>
            </CardHeader>
          </Card>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-simulation"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              data-testid="button-submit-simulation"
            >
              {isLoading ? "Creating..." : "Create Simulation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}