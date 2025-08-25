// src/hooks/useAuth.js - Apple 로그인 지원 개선 버전

import { useState, useEffect, useCallback, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";

// 현재 사용자 정보를 가져오는 함수 (개선된 버전)
const getCurrentUser = () => {
  const sessionUser = sessionStorage.getItem("currentUser");

  if (sessionUser) {
    try {
      const userData = JSON.parse(sessionUser);
      if (userData && userData.isLoggedIn) {
        // Apple, Google, Spotify 등 모든 provider 지원
        console.log(
          "📱 Session user found:",
          userData.provider,
          userData.email
        );
        return userData;
      }
    } catch (error) {
      console.error("Session user data parsing error:", error);
      sessionStorage.removeItem("currentUser");
    }
  }

  return null;
};

// 세션 유효성 검사
const validateSession = (user) => {
  if (!user) return null;

  // 필수 필드 확인
  if (!user.email || !user.provider) {
    console.warn("⚠️ Invalid user session data:", user);
    sessionStorage.removeItem("currentUser");
    return null;
  }

  return user;
};

// 사용자 세션 새로고침
const refreshUserSession = () => {
  const currentUser = getCurrentUser();
  if (currentUser) {
    // 세션 타임스탬프 업데이트
    const updatedUser = {
      ...currentUser,
      lastActivity: new Date().toISOString(),
    };
    sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
    return updatedUser;
  }
  return null;
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 중복 실행 방지를 위한 ref
  const initialized = useRef(false);
  const currentUserRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // 사용자 상태 업데이트 함수 (메모이제이션)
  const updateUser = useCallback((newUser) => {
    const validatedUser = validateSession(newUser);

    // 실제로 사용자가 변경된 경우에만 상태 업데이트
    const currentUserStr = JSON.stringify(currentUserRef.current);
    const newUserStr = JSON.stringify(validatedUser);

    if (currentUserStr !== newUserStr) {
      console.log("🔄 User state updated:", validatedUser?.provider || "null");
      currentUserRef.current = validatedUser;
      setUser(validatedUser);
    }
  }, []);

  // 인증 상태를 수동으로 새로고침하는 함수
  const refreshAuth = useCallback(() => {
    console.log("🔄 Manual auth refresh requested");
    const currentUser = refreshUserSession();
    updateUser(currentUser);
  }, [updateUser]);

  // 폴링을 통한 세션 감지 (모바일 환경 대응)
  const startSessionPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // 모바일에서는 더 자주 체크 (3초마다)
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const pollInterval = isMobile ? 3000 : 5000;

    pollIntervalRef.current = setInterval(() => {
      const sessionUser = getCurrentUser();
      const currentUser = currentUserRef.current;

      // 세션과 현재 상태가 다른 경우에만 업데이트
      if (JSON.stringify(sessionUser) !== JSON.stringify(currentUser)) {
        console.log(
          "📱 Session polling detected change:",
          sessionUser?.provider || "logout"
        );
        updateUser(sessionUser);
      }
    }, pollInterval);
  }, [updateUser]);

  useEffect(() => {
    // 이미 초기화되었으면 실행하지 않음
    if (initialized.current) {
      console.log("🚫 useAuth already initialized, skipping...");
      return;
    }

    let isMounted = true;
    initialized.current = true;

    console.log("🚀 Initializing useAuth hook (Apple support)");

    // 1. 초기 사용자 상태 확인 (세션 우선)
    const initUser = getCurrentUser();
    if (isMounted) {
      console.log("🔄 Initial user state:", initUser?.provider || "null");
      updateUser(initUser);
      setLoading(false);
    }

    // 2. 세션 폴링 시작 (모바일 환경 대응)
    startSessionPolling();

    // 3. Firebase Auth 상태 변경 감지 (이메일 로그인용)
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!isMounted) return;

      console.log("🔥 Firebase auth changed:", firebaseUser?.email || "null");

      if (firebaseUser) {
        // Firebase 사용자가 로그인된 경우
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName:
            firebaseUser.displayName || firebaseUser.email?.split("@")[0],
          photoURL: firebaseUser.photoURL,
          provider: "email",
          isLoggedIn: true,
          lastActivity: new Date().toISOString(),
        };

        // 세션에 소셜 로그인 정보가 없는 경우에만 Firebase 사용자 설정
        const sessionUser = getCurrentUser();
        if (!sessionUser) {
          console.log("🔥 Setting Firebase user");
          sessionStorage.setItem("currentUser", JSON.stringify(userData));
          updateUser(userData);
        }
      } else {
        // Firebase 사용자가 로그아웃된 경우
        const sessionUser = getCurrentUser();

        if (
          sessionUser &&
          (sessionUser.provider === "spotify" ||
            sessionUser.provider === "google" ||
            sessionUser.provider === "apple") // Apple 추가
        ) {
          // 소셜 로그인 사용자는 유지
          console.log("🔥 Keeping social user:", sessionUser.provider);
        } else {
          // 완전 로그아웃
          console.log("🔥 Complete logout");
          sessionStorage.removeItem("currentUser");
          updateUser(null);
        }
      }
    });

    // 4. 이벤트 리스너들
    const handleStorageChange = (e) => {
      if (!isMounted || e.key !== "currentUser") return;

      console.log("📦 Storage changed from another tab");
      if (e.newValue) {
        try {
          const userData = JSON.parse(e.newValue);
          updateUser(userData);
        } catch (error) {
          console.error("Failed to parse storage user data:", error);
          updateUser(null);
        }
      } else {
        updateUser(null);
      }
    };

    const handleFocus = () => {
      if (!isMounted) return;

      console.log("🔍 Focus event - checking session");
      // 포커스 시 즉시 세션 새로고침
      const currentUser = refreshUserSession();
      updateUser(currentUser);
    };

    const handleAuthStateChanged = (event) => {
      if (!isMounted) return;

      console.log("🔄 Custom auth event received:", event.detail?.provider);
      const currentUser = getCurrentUser();
      updateUser(currentUser);
    };

    // 5. 모바일 환경 특별 처리
    const handleVisibilityChange = () => {
      if (!isMounted) return;

      if (document.visibilityState === "visible") {
        console.log("📱 Page visible - refreshing auth");
        const currentUser = refreshUserSession();
        updateUser(currentUser);
      }
    };

    const handlePageShow = (event) => {
      if (!isMounted) return;

      console.log("📱 Page show event - refreshing auth");
      const currentUser = refreshUserSession();
      updateUser(currentUser);
    };

    // 이벤트 리스너 등록
    window.addEventListener("storage", handleStorageChange, { passive: true });
    window.addEventListener("focus", handleFocus, { passive: true });
    window.addEventListener("authStateChanged", handleAuthStateChanged, {
      passive: true,
    });
    document.addEventListener("visibilitychange", handleVisibilityChange, {
      passive: true,
    });
    window.addEventListener("pageshow", handlePageShow, { passive: true });

    // cleanup function
    return () => {
      console.log("🧹 Cleaning up useAuth");
      isMounted = false;
      initialized.current = false;

      // 폴링 정리
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      if (unsubscribe) unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("authStateChanged", handleAuthStateChanged);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []); // 빈 의존성 배열로 한 번만 실행

  return {
    user,
    loading,
    refreshAuth,
    isAuthenticated: !!user,
    userProvider: user?.provider || null,
  };
};
