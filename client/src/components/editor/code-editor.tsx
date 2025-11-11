import { useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useEditorState } from "@/hooks/use-editor-state";

interface CodeEditorProps {
  editorState: ReturnType<typeof useEditorState>;
}

export default function CodeEditor({ editorState }: CodeEditorProps) {
  const { tabs, activeTab, closeTab, updateTabContent, openTab } = editorState;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const handleContentChange = (content: string) => {
    if (activeTab) {
      updateTabContent(activeTab, content);
    }
  };

  const handleNewTab = () => {
    openTab({
      id: `new-${Date.now()}`,
      name: 'Untitled',
      type: 'file',
      content: '',
      sourceFormat: 'ensemble'
    });
  };

  return (
    <>
      {/* Editor Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center space-x-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center px-3 py-1.5 text-sm rounded-md ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className={`mr-2 text-xs ${
              tab.type === 'file' 
                ? tab.sourceFormat === 'ensemble' ? 'fas fa-code text-blue-500'
                : tab.sourceFormat === 'kismet' ? 'fas fa-code text-green-500'
                : tab.sourceFormat === 'tott' ? 'fas fa-code text-purple-500'
                : 'fas fa-code text-slate-400'
                : tab.type === 'character' ? 'fas fa-user'
                : tab.type === 'genealogy' ? 'fas fa-family'
                : 'fas fa-file'
            }`}></i>
            <span className="font-medium">{tab.name}</span>
            {tab.isDirty && <span className="ml-1 w-1 h-1 bg-orange-500 rounded-full"></span>}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 p-0 h-auto text-current hover:text-slate-700"
              onClick={() => closeTab(tab.id)}
            >
              <i className="fas fa-times text-xs"></i>
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto p-1.5 text-slate-400 hover:text-slate-600"
          onClick={handleNewTab}
        >
          <i className="fas fa-plus"></i>
        </Button>
      </div>
      
      {/* Code Editor Area */}
      <div className="flex-1 relative">
        {activeTabData ? (
          <div className="h-full flex editor-bg text-gray-300">
            {/* Line Numbers */}
            <div className="w-12 editor-line border-r border-gray-600 py-4 text-center text-sm font-mono text-gray-500">
              {activeTabData.content?.split('\n').map((_, index) => (
                <div key={index} className="leading-6">{index + 1}</div>
              ))}
            </div>
            
            {/* Code Content */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={activeTabData.content || ''}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm leading-6 bg-transparent text-gray-300 resize-none outline-none border-none"
                placeholder="Start typing your rules..."
                spellCheck={false}
              />
              
              {/* Syntax Highlighting Overlay */}
              <div className="absolute inset-0 p-4 font-mono text-sm leading-6 pointer-events-none">
                <pre className="whitespace-pre-wrap">
                  {activeTabData.content?.split('\n').map((line, index) => (
                    <div key={index} className="min-h-6">
                      {line.includes('//') && (
                        <span className="code-comment">{line}</span>
                      )}
                      {(line.includes('rule') || line.includes('when') || line.includes('then')) && !line.includes('//') && (
                        <span>
                          {line.split(/\b(rule|when|then|and|or)\b/).map((part, i) => 
                            ['rule', 'when', 'then', 'and', 'or'].includes(part) ? (
                              <span key={i} className="code-keyword">{part}</span>
                            ) : (
                              <span key={i}>{part}</span>
                            )
                          )}
                        </span>
                      )}
                      {line.includes('"') && !line.includes('//') && (
                        <span>
                          {line.split(/(\"[^\"]*\")/).map((part, i) => 
                            part.startsWith('"') && part.endsWith('"') ? (
                              <span key={i} className="code-string">{part}</span>
                            ) : (
                              <span key={i}>{part}</span>
                            )
                          )}
                        </span>
                      )}
                      {!line.includes('//') && !line.includes('rule') && !line.includes('when') && !line.includes('then') && !line.includes('"') && (
                        <span>{line}</span>
                      )}
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <i className="fas fa-file-code text-4xl text-slate-300 mb-4"></i>
              <p className="text-slate-500 mb-4">No file open</p>
              <Button onClick={handleNewTab}>
                <i className="fas fa-plus mr-2"></i>Create New Rule
              </Button>
            </div>
          </div>
        )}
        
        {/* Editor Status Bar */}
        {activeTabData && (
          <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white px-4 py-1 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>{activeTabData.sourceFormat?.charAt(0).toUpperCase() + activeTabData.sourceFormat?.slice(1)} Syntax</span>
              <span>Line 1, Column 1</span>
              <span className="flex items-center">
                <i className="fas fa-check-circle text-green-300 mr-1"></i>
                No errors
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <span>UTF-8</span>
              <span>LF</span>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-blue-700 px-2 py-0.5 rounded text-white"
              >
                <i className="fas fa-play mr-1"></i>Test Rules
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
