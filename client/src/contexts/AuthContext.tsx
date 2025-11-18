import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/../../shared/schema';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedToken = localStorage.getItem('insimul_token');
    const storedUser = localStorage.getItem('insimul_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);

        // Verify token is still valid
        fetch('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })
          .then((res) => {
            if (!res.ok) {
              // Token expired or invalid
              localStorage.removeItem('insimul_token');
              localStorage.removeItem('insimul_user');
              setUser(null);
              setToken(null);
            }
          })
          .catch(() => {
            // Network error, keep local session
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('insimul_token');
        localStorage.removeItem('insimul_user');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('insimul_token', newToken);
    localStorage.setItem('insimul_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('insimul_token');
    localStorage.removeItem('insimul_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
