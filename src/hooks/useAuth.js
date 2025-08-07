// src/hooks/useAuth.js - 최적화된 버전

import { useState, useEffect, useCallback, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";

// 현재 사용자 정보를 가져오는 함수
const getCurrentUser = () => {
  const sessionUser = sessionStorage.getItem("currentUser");

  if (sessionUser) {
    try {
      const userData = JSON.parse(sessionUser);
      if (userData && userData.isLoggedIn) {
        return userData;
      }
    } catch (error) {
      console.error("Session user data parsing error:", error);
      sessionStorage.removeItem("currentUser");
    }
  }

  return null;
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 중복 실행 방지를 위한 ref
  const initialized = useRef(false);
  const currentUserRef = useRef(null);

  // 사용자 상태 업데이트 함수 (메모이제이션)
  const updateUser = useCallback((newUser) => {
    // 실제로 사용자가 변경된 경우에만 상태 업데이트
    const currentUserStr = JSON.stringify(currentUserRef.current);
    const newUserStr = JSON.stringify(newUser);

    if (currentUserStr !== newUserStr) {
      console.log("🔄 User state updated:", newUser);
      currentUserRef.current = newUser;
      setUser(newUser);
    }
  }, []);

  // 인증 상태를 수동으로 새로고침하는 함수
  const refreshAuth = useCallback(() => {
    console.log("🔄 Manual auth refresh requested");
    const currentUser = getCurrentUser();
    updateUser(currentUser);
  }, [updateUser]);

  useEffect(() => {
    // 이미 초기화되었으면 실행하지 않음
    if (initialized.current) {
      console.log("🚫 useAuth already initialized, skipping...");
      return;
    }

    let isMounted = true;
    initialized.current = true;

    console.log("🚀 Initializing useAuth hook");

    // 초기 사용자 상태 확인
    const initUser = getCurrentUser();
    if (isMounted) {
      console.log("🔄 Initial user state:", initUser);
      updateUser(initUser);
      setLoading(false);
    }

    // Firebase Auth 상태 변경 감지 (이메일 로그인용)
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
            sessionUser.provider === "google")
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

    // 이벤트 리스너들 (한 번만 등록)
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

      // 포커스 시에는 간단하게 세션만 확인
      const currentUser = getCurrentUser();
      updateUser(currentUser);
    };

    const handleAuthStateChanged = (event) => {
      if (!isMounted) return;

      console.log("🔄 Custom auth event received");
      const currentUser = getCurrentUser();
      updateUser(currentUser);
    };

    // 이벤트 리스너 등록 (중복 방지)
    window.addEventListener("storage", handleStorageChange, { passive: true });
    window.addEventListener("focus", handleFocus, { passive: true });
    window.addEventListener("authStateChanged", handleAuthStateChanged, {
      passive: true,
    });

    // cleanup function
    return () => {
      console.log("🧹 Cleaning up useAuth");
      isMounted = false;
      initialized.current = false;

      if (unsubscribe) unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("authStateChanged", handleAuthStateChanged);
    };
  }, []); // 빈 의존성 배열로 한 번만 실행

  return {
    user,
    loading,
    refreshAuth,
  };
};
