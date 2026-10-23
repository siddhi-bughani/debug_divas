import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const DEMO_USERS = {
  admin: {
    id: 'USR-ADMIN-01',
    name: 'District Collectorate Control Officer',
    email: 'admin.disaster@kerala.gov.in',
    role: 'Central Administrator',
    badge: 'State HQ',
    assignedCampId: null,
    permissions: ['all'],
  },
  manager: {
    id: 'USR-MGR-02',
    name: 'Dr. Anita Thomas',
    email: 'anita.thomas@sahay.org',
    role: 'Camp Manager',
    badge: 'Riverside Camp (CAMP-01)',
    assignedCampId: 'CAMP-01',
    permissions: ['camp:view', 'camp:edit', 'request:create', 'inventory:view'],
  },
  reporter: {
    id: 'USR-REP-03',
    name: 'Field Ground Reporter',
    email: 'ground.reporter@volunteer.org',
    role: 'Reporter',
    badge: 'Field Volunteer',
    assignedCampId: null,
    permissions: ['report:submit', 'report:view-public'],
  },
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sahay_demo_role');
    return DEMO_USERS[saved] || DEMO_USERS.admin;
  });

  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem('sahay_auth_token'));
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Authenticate persona with backend API
  const authenticateWithBackend = async (roleKey) => {
    try {
      const res = await apiClient.post('/auth/login', { roleKey });
      if (res?.token) {
        sessionStorage.setItem('sahay_auth_token', res.token);
        setAuthToken(res.token);
        setIsBackendConnected(true);
        if (res.user) {
          setCurrentUser(res.user);
        }
        return res.token;
      }
    } catch {
      // Backend not running; client remains in seamless standalone demo mode
      setIsBackendConnected(false);
    }
    return null;
  };

  useEffect(() => {
    const initialRoleKey = localStorage.getItem('sahay_demo_role') || 'admin';
    authenticateWithBackend(initialRoleKey);
  }, []);

  const switchRole = async (roleKey) => {
    if (DEMO_USERS[roleKey]) {
      setCurrentUser(DEMO_USERS[roleKey]);
      localStorage.setItem('sahay_demo_role', roleKey);
      await authenticateWithBackend(roleKey);
    }
  };

  const hasPermission = (perm) => {
    if (!currentUser) return false;
    if (currentUser.permissions && currentUser.permissions.includes('all')) return true;
    return currentUser.permissions ? currentUser.permissions.includes(perm) : false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authToken,
        isBackendConnected,
        switchRole,
        hasPermission,
        isAdmin: currentUser.role === 'Central Administrator',
        isManager: currentUser.role === 'Camp Manager',
        isReporter: currentUser.role === 'Reporter',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
