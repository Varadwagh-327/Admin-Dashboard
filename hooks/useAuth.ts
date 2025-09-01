"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/app/redux/store";
import { hydrate } from "@/app/redux/authSlice";

export interface UseAuthReturn {
  token: string | null;
  user: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tokenPreview: string;
}

export function useAuth(redirectOnFail = true): UseAuthReturn {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user: reduxUser, token: reduxToken, isHydrated } = useSelector((s: RootState) => s.auth);
  
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);

  // Hydrate Redux from localStorage on first load
  useEffect(() => {
    if (!isHydrated && typeof window !== "undefined") {
      const lsToken = localStorage.getItem("token");
      const lsUser = localStorage.getItem("user");
      
      let parsedUser = null;
      if (lsUser) {
        try {
          const userObj = JSON.parse(lsUser);
          parsedUser = userObj.email || userObj.name || lsUser;
        } catch {
          parsedUser = null;
        }
      }
      
      dispatch(hydrate({ user: parsedUser, token: lsToken }));
    }
  }, [dispatch, isHydrated]);

  // Handle authentication state
  useEffect(() => {
    if (isHydrated) {
      // Use Redux values if available, otherwise fallback to localStorage
      const effectiveToken = reduxToken || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
      const effectiveUser = reduxUser || (typeof window !== "undefined" ? (() => {
        const lsUser = localStorage.getItem("user");
        if (lsUser) {
          try {
            const userObj = JSON.parse(lsUser);
            return userObj.email || userObj.name || lsUser;
          } catch {
            return null;
          }
        }
        return null;
      })() : null);

      setToken(effectiveToken);
      setUser(effectiveUser);

      if (redirectOnFail && (!effectiveToken || !effectiveUser)) {
        router.replace("/");
        return;
      }

      setIsLoading(false);
    }
  }, [isHydrated, reduxToken, reduxUser, router, redirectOnFail]);

  const tokenPreview = token 
    ? token.length > 20 
      ? `${token.slice(0, 12)}...${token.slice(-6)}`
      : token
    : "—";

  return {
    token,
    user,
    isAuthenticated: !!(token && user),
    isLoading,
    tokenPreview,
  };
}
