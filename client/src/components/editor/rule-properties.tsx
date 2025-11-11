import { EditorTab } from "@/lib/editor-types";
import { useEditorState } from "@/hooks/use-editor-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface RulePropertiesProps {
  activeTab?: EditorTab;
  editorState: ReturnType<typeof useEditorState>;
}

export default function RuleProperties({ activeTab }: RulePropertiesProps) {
  if (!activeTab || activeTab.type !== 'file') {
    return (
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Rule Properties</h3>
        <p className="text-sm text-slate-500">Select a rule file to edit properties</p>
      </div>
    );
  }

  return (
    <>
      {/* Properties Panel */}
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Rule Properties</h3>
        
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium text-slate-600">Rule Name</Label>
            <Input 
              type="text" 
              value="inheritance_succession" 
              className="w-full text-sm mt-1"
            />
          </div>
          
          <div>
            <Label className="text-xs font-medium text-slate-600">System Type</Label>
            <Select defaultValue={activeTab.sourceFormat || 'ensemble'}>
              <SelectTrigger className="w-full text-sm mt-1">
                <SelectValue placeholder="Select system type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ensemble">Ensemble (JavaScript)</SelectItem>
                <SelectItem value="kismet">Kismet (Prolog-style)</SelectItem>
                <SelectItem value="tott">Talk of the Town (Python)</SelectItem>
                <SelectItem value="insimul">Insimul Syntax</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs font-medium text-slate-600">Priority</Label>
            <Input 
              type="number" 
              value="5" 
              className="w-full text-sm mt-1"
            />
          </div>
          
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-2 block">Tags</Label>
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">nobility</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md">inheritance</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md">succession</span>
              <Button variant="outline" size="sm" className="px-2 py-1 border-dashed text-slate-500 text-xs h-auto">
                <i className="fas fa-plus"></i>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rule Dependencies */}
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Dependencies</h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
            <div className="flex items-center space-x-2">
              <i className="fas fa-link text-slate-400 text-xs"></i>
              <span className="text-sm text-slate-700">parent_of</span>
            </div>
            <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded">Predicate</span>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
            <div className="flex items-center space-x-2">
              <i className="fas fa-link text-slate-400 text-xs"></i>
              <span className="text-sm text-slate-700">eldest_child</span>
            </div>
            <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded">Function</span>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
            <div className="flex items-center space-x-2">
              <i className="fas fa-link text-slate-400 text-xs"></i>
              <span className="text-sm text-slate-700">Noble</span>
            </div>
            <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded">Type</span>
          </div>
        </div>
      </div>
    </>
  );
}
