import { useEffect, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Language } from "@shared/schema";
import { useLocation } from "wouter";

interface LanguageTreeProps {
  languages: Language[];
}

interface LanguageNodeData {
  label: string;
  language: Language;
  childCount: number;
}

function LanguageNode({ data }: { data: LanguageNodeData }) {
  const [, setLocation] = useLocation();
  
  return (
    <Card
      className="min-w-48 cursor-pointer hover-elevate active-elevate-2"
      onClick={() => setLocation(`/language/${data.language.id}`)}
      data-testid={`node-language-${data.language.id}`}
    >
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-sm">{data.label}</h3>
        <div className="flex flex-wrap gap-1">
          {data.language.influences?.slice(0, 2).map((inf) => (
            <Badge key={inf} variant="secondary" className="text-xs">
              {inf}
            </Badge>
          ))}
        </div>
        {data.childCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {data.childCount} {data.childCount === 1 ? "child" : "children"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const nodeTypes = {
  languageNode: LanguageNode,
};

export function LanguageTree({ languages }: LanguageTreeProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const languageMap = new Map(languages.map((lang) => [lang.id, lang]));
    const childCountMap = new Map<string, number>();
    
    languages.forEach((lang) => {
      if (lang.parentId) {
        childCountMap.set(lang.parentId, (childCountMap.get(lang.parentId) || 0) + 1);
      }
    });

    const rootLanguages = languages.filter((lang) => !lang.parentId);
    const nodes: Node<LanguageNodeData>[] = [];
    const edges: Edge[] = [];
    
    let yOffset = 0;
    const levelSpacing = 200;
    const nodeSpacing = 300;

    const processLanguage = (lang: Language, level: number, parentX: number, index: number, siblingsCount: number) => {
      const x = parentX + (index - (siblingsCount - 1) / 2) * nodeSpacing;
      const y = level * levelSpacing;

      nodes.push({
        id: lang.id,
        type: "languageNode",
        position: { x, y },
        data: {
          label: lang.name,
          language: lang,
          childCount: childCountMap.get(lang.id) || 0,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });

      const children = languages.filter((l) => l.parentId === lang.id);
      children.forEach((child, childIndex) => {
        edges.push({
          id: `${lang.id}-${child.id}`,
          source: lang.id,
          target: child.id,
          type: "smoothstep",
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
        
        processLanguage(child, level + 1, x, childIndex, children.length);
      });
    };

    rootLanguages.forEach((root, index) => {
      processLanguage(root, 0, index * nodeSpacing * 2, 0, 1);
    });

    return { nodes, edges };
  }, [languages]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (languages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <p>No languages to display in the tree</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] w-full rounded-md border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
        }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            return "hsl(var(--primary))";
          }}
          className="bg-background"
        />
      </ReactFlow>
    </div>
  );
}
