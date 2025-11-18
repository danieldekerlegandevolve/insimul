import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Globe,
  ChevronDown,
  Menu,
  Scroll,
  Users,
  MapPin,
  Zap,
  Target,
  Sparkles,
  BookOpen,
  Brain,
  Play,
  Upload,
  Download,
  X,
  Home,
  FileText,
  Gamepad2,
  Compass,
  History
} from 'lucide-react';

interface ModernNavbarProps {
  currentWorld?: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onChangeWorld: () => void;
}

export function ModernNavbar({ currentWorld, activeTab, onTabChange, onChangeWorld }: ModernNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const contentItems = [
    { id: 'rules', label: 'Rules', icon: Scroll },
    { id: 'society', label: 'Society', icon: Users },
    { id: 'actions', label: 'Actions', icon: Zap },
    { id: 'quests', label: 'Quests', icon: Target },
    { id: 'grammars', label: 'Grammars', icon: FileText },
  ];

  const truthItems = [
    { id: 'truth', label: 'Truth System', icon: BookOpen },
    { id: 'prolog', label: 'Prolog Knowledge Base', icon: Brain },
  ];

  const simulationItems = [
    { id: 'simulations', label: 'Run Simulations', icon: Play },
    { id: 'rpg-game', label: 'Explore World (2D RPG)', icon: Gamepad2 },
    { id: '3d-game', label: 'Explore World (3D)', icon: Gamepad2 },
    { id: 'my-playthroughs', label: 'My Playthroughs', icon: History },
  ];

  const browseItems = [
    { id: 'browse-worlds', label: 'Browse Public Worlds', icon: Compass },
  ];

  const dataItems = [
    { id: 'import', label: 'Import Data', icon: Upload },
    { id: 'export', label: 'Export Data', icon: Download },
  ];

  const NavDropdown = ({ label, items, icon: Icon }: any) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="gap-1 hover:bg-primary/10 hover:text-primary transition-colors"
        >
          {Icon && <Icon className="w-4 h-4" />}
          {label}
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item: any) => (
          <DropdownMenuItem 
            key={item.id}
            onClick={() => {
              onTabChange(item.id);
              setMobileMenuOpen(false);
            }}
            className="cursor-pointer"
          >
            <item.icon className="w-4 h-4 mr-2" />
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const MobileNavItem = ({ item }: any) => (
    <button
      onClick={() => {
        onTabChange(item.id);
        setMobileMenuOpen(false);
      }}
      className={`
        w-full flex items-center gap-3 p-3 rounded-lg transition-all
        ${activeTab === item.id 
          ? 'bg-primary text-primary-foreground' 
          : 'hover:bg-primary/10 hover:text-primary'
        }
      `}
    >
      <item.icon className="w-5 h-5" />
      <span className="font-medium">{item.label}</span>
    </button>
  );

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-16 items-center px-6">
        {/* Logo & World Info */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-primary to-primary/60 rounded-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Insimul
              </span>
              {currentWorld && (
                <button 
                  onClick={onChangeWorld}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  {currentWorld.name}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Button
            variant={activeTab === 'home' ? 'default' : 'ghost'}
            onClick={() => onTabChange('home')}
            className="gap-2 hover:bg-primary/10 hover:text-primary"
          >
            <Home className="w-4 h-4" />
            World Home
          </Button>

          <NavDropdown label="Content" items={contentItems} icon={FileText} />
          <NavDropdown label="Truth" items={truthItems} icon={BookOpen} />
          <NavDropdown label="Play" items={simulationItems} icon={Play} />
          <NavDropdown label="Browse" items={browseItems} icon={Compass} />
          <NavDropdown label="Data" items={dataItems} icon={Upload} />
        </nav>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 py-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-primary to-primary/60 rounded-lg">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold">Insimul</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Current World */}
                {currentWorld && (
                  <div className="pb-4 border-b space-y-2">
                    <p className="text-sm text-muted-foreground px-3">Current World</p>
                    <button
                      onClick={() => {
                        onTabChange('home');
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-lg transition-all
                        ${activeTab === 'home' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-primary/10 hover:text-primary'
                        }
                      `}
                    >
                      <Home className="w-5 h-5" />
                      <span className="font-medium">{currentWorld.name}</span>
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onChangeWorld();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start gap-2 text-xs"
                    >
                      <Globe className="w-3 h-3" />
                      Change World
                    </Button>
                  </div>
                )}

                {/* Content Section */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-3">CONTENT</h3>
                  <div className="space-y-1">
                    {contentItems.map(item => (
                      <MobileNavItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>

                {/* Truth Section */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-3">TRUTH</h3>
                  <div className="space-y-1">
                    {truthItems.map(item => (
                      <MobileNavItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>

                {/* Play Section */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-3">PLAY</h3>
                  <div className="space-y-1">
                    {simulationItems.map(item => (
                      <MobileNavItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>

                {/* Browse Section */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-3">BROWSE</h3>
                  <div className="space-y-1">
                    {browseItems.map(item => (
                      <MobileNavItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>

                {/* Data Section */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-3">DATA</h3>
                  <div className="space-y-1">
                    {dataItems.map(item => (
                      <MobileNavItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
