"use client";

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/redux/store';
import { useAuth } from '@/hooks/useAuth';

export default function TokenDebug() {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const reduxAuth = useSelector((s: RootState) => s.auth);
  const { token: hookToken, user: hookUser, isAuthenticated, isLoading } = useAuth(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lsToken = localStorage.getItem('token');
      const lsUser = localStorage.getItem('user');
      
      setTokenInfo({
        localStorage: {
          hasToken: !!lsToken,
          tokenLength: lsToken?.length || 0,
          tokenPreview: lsToken ? `${lsToken.substring(0, 15)}...${lsToken.substring(lsToken.length - 6)}` : 'None',
          user: lsUser ? JSON.parse(lsUser) : null,
        },
        redux: {
          hasToken: !!reduxAuth.token,
          tokenLength: reduxAuth.token?.length || 0,
          tokenPreview: reduxAuth.token ? `${reduxAuth.token.substring(0, 15)}...${reduxAuth.token.substring(reduxAuth.token.length - 6)}` : 'None',
          user: reduxAuth.user,
          isAuthenticated: reduxAuth.isAuthenticated,
          isHydrated: reduxAuth.isHydrated,
        },
        hook: {
          hasToken: !!hookToken,
          tokenLength: hookToken?.length || 0,
          tokenPreview: hookToken ? `${hookToken.substring(0, 15)}...${hookToken.substring(hookToken.length - 6)}` : 'None',
          user: hookUser,
          isAuthenticated,
          isLoading,
        },
        timestamp: new Date().toISOString()
      });
    }
  }, [reduxAuth, hookToken, hookUser, isAuthenticated, isLoading]);

  if (!tokenInfo) return <div>Loading debug info...</div>;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-sm max-w-sm max-h-96 overflow-y-auto">
      <h3 className="font-bold mb-2">🔐 Auth Debug</h3>
      
      <div className="mb-3">
        <div className="font-semibold text-yellow-300 mb-1">localStorage:</div>
        <div>Token: {tokenInfo?.localStorage?.hasToken ? '✅' : '❌'}</div>
        <div>Length: {tokenInfo?.localStorage?.tokenLength || 0}</div>
        <div>Preview: {tokenInfo?.localStorage?.tokenPreview}</div>
        <div>User: {tokenInfo?.localStorage?.user?.email || 'None'}</div>
      </div>
      
      <div className="mb-3">
        <div className="font-semibold text-blue-300 mb-1">Redux:</div>
        <div>Token: {tokenInfo?.redux?.hasToken ? '✅' : '❌'}</div>
        <div>Length: {tokenInfo?.redux?.tokenLength || 0}</div>
        <div>Preview: {tokenInfo?.redux?.tokenPreview}</div>
        <div>User: {tokenInfo?.redux?.user || 'None'}</div>
        <div>Auth: {tokenInfo?.redux?.isAuthenticated ? '✅' : '❌'}</div>
        <div>Hydrated: {tokenInfo?.redux?.isHydrated ? '✅' : '❌'}</div>
      </div>
      
      <div className="mb-3">
        <div className="font-semibold text-green-300 mb-1">useAuth Hook:</div>
        <div>Token: {tokenInfo?.hook?.hasToken ? '✅' : '❌'}</div>
        <div>Length: {tokenInfo?.hook?.tokenLength || 0}</div>
        <div>Preview: {tokenInfo?.hook?.tokenPreview}</div>
        <div>User: {tokenInfo?.hook?.user || 'None'}</div>
        <div>Auth: {tokenInfo?.hook?.isAuthenticated ? '✅' : '❌'}</div>
        <div>Loading: {tokenInfo?.hook?.isLoading ? '⏳' : '✅'}</div>
      </div>
      
      <div className="text-xs mt-2 text-gray-400">{tokenInfo?.timestamp}</div>
    </div>
  );
}
