// src/services/authService.js

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";

/**
 * Google 로그인 처리 - 기존 사용자 확인 후 로그인 또는 회원가입 판단
 */
export const handleGoogleLogin = async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Firebase Auth에서 자동 로그아웃 (세션 관리를 위해)
    await signOut(auth);

    // Firestore에서 사용자 확인 (이메일 기반)
    const userDocRef = doc(db, "users", user.email);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // 기존 사용자 - 로그인 처리
      const userData = userDoc.data();

      // Google 정보 업데이트
      await setDoc(
        userDocRef,
        {
          ...userData,
          googleId: user.uid,
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
          profile: {
            ...userData.profile,
            avatar: user.photoURL || userData.profile?.avatar || null,
          },
        },
        { merge: true }
      );

      // 세션에 사용자 정보 저장
      sessionStorage.setItem(
        "currentUser",
        JSON.stringify({
          uid: userData.uid || user.uid,
          email: userData.email,
          displayName: userData.username || user.displayName,
          photoURL: user.photoURL,
          provider: "google",
          isLoggedIn: true,
        })
      );

      return {
        success: true,
        isExistingUser: true,
        userData: userData,
        message: "로그인되었습니다!",
      };
    } else {
      // 신규 사용자 - 회원가입 필요
      // Google 프로필 정보를 세션에 임시 저장
      sessionStorage.setItem(
        "googleProfile",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
        })
      );

      return {
        success: true,
        isExistingUser: false,
        needsRegistration: true,
        googleProfile: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        message: "회원가입이 필요합니다.",
      };
    }
  } catch (error) {
    console.error("Google login error:", error);

    if (error.code === "auth/popup-closed-by-user") {
      return {
        success: false,
        error: "popup_closed",
        message: "로그인이 취소되었습니다.",
      };
    }

    throw error;
  }
};

/**
 * Spotify 로그인 처리 - 기존 사용자 확인 후 로그인 또는 회원가입 판단
 */
export const handleSpotifyLogin = async (spotifyProfile, accessToken) => {
  try {
    // Firestore에서 사용자 확인 (이메일 기반)
    const userDocRef = doc(db, "users", spotifyProfile.email);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // 기존 사용자 - 로그인 처리
      const userData = userDoc.data();

      // Spotify 정보 업데이트
      await setDoc(
        userDocRef,
        {
          ...userData,
          spotifyId: spotifyProfile.id,
          spotifyProfile: {
            id: spotifyProfile.id,
            displayName: spotifyProfile.display_name,
            email: spotifyProfile.email,
            images: spotifyProfile.images || [],
            country: spotifyProfile.country,
            followers: spotifyProfile.followers,
          },
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 세션에 사용자 정보 저장
      sessionStorage.setItem(
        "currentUser",
        JSON.stringify({
          uid: userData.uid || spotifyProfile.id,
          email: userData.email,
          displayName: userData.username || spotifyProfile.display_name,
          photoURL: spotifyProfile.images?.[0]?.url || userData.profile?.avatar,
          provider: "spotify",
          isLoggedIn: true,
        })
      );

      // Spotify 임시 데이터 정리
      sessionStorage.removeItem("spotifyProfile");
      sessionStorage.removeItem("spotifyAccessToken");

      return {
        success: true,
        isExistingUser: true,
        userData: userData,
        message: "Spotify 로그인되었습니다!",
      };
    } else {
      // 신규 사용자 - 회원가입 필요
      // Spotify 프로필 정보를 세션에 저장 (이미 저장되어 있음)
      return {
        success: true,
        isExistingUser: false,
        needsRegistration: true,
        spotifyProfile: spotifyProfile,
        message: "회원가입이 필요합니다.",
      };
    }
  } catch (error) {
    console.error("Spotify login error:", error);
    throw error;
  }
};

/**
 * Google 프로필과 추가 입력 정보로 신규 회원을 가입시킵니다.
 * @param {object} formData - 회원가입 폼에서 입력받은 데이터
 */
export const registerWithGoogle = async (formData) => {
  try {
    // 세션에서 Google 정보 가져오기
    const googleProfile = JSON.parse(sessionStorage.getItem("googleProfile"));

    if (!googleProfile) {
      throw new Error("Google 인증 정보가 없습니다. 다시 로그인해주세요.");
    }

    console.log("Creating user document for:", googleProfile.email);

    const citizenCode = `BS${Date.now().toString(36).toUpperCase()}`;

    // 사용자 데이터 준비 (이메일을 document ID로 사용)
    const userData = {
      // 기본 정보
      uid: googleProfile.uid,
      email: googleProfile.email,
      username:
        formData.displayName ||
        googleProfile.displayName ||
        googleProfile.email.split("@")[0],

      // 프로필 정보
      profile: {
        name: formData.displayName || googleProfile.displayName || "",
        citizenCode: citizenCode,
        avatar: googleProfile.photoURL || null,
        level: 1,
        points: 100,
        joinedAt: serverTimestamp(),
        birthYear: formData.birthYear || "",
        gender: formData.gender || "",
        country: formData.country || "",
        bio: formData.bio || "",
        location: formData.location || "",
      },

      // Google 관련 정보
      provider: "google",
      googleId: googleProfile.uid,
      emailVerified: googleProfile.emailVerified || false,

      // 시스템 정보
      stats: { totalVotes: 0, battlesCreated: 0, battlesWon: 0 },
      preferences: {
        favoriteCategories: formData.favoriteCategories || [],
        notifications: true,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      isActive: true,
      hasPassword: true, // 이메일/비밀번호도 설정했으므로
    };

    // Firestore에 사용자 문서 생성 (이메일을 document ID로 사용)
    const userDocRef = doc(db, "users", googleProfile.email);

    console.log("Attempting to create user document...");
    await setDoc(userDocRef, userData);
    console.log("User document created successfully");

    // 세션 정리
    sessionStorage.removeItem("googleProfile");

    // 로그인 상태로 사용자 정보 저장
    sessionStorage.setItem(
      "currentUser",
      JSON.stringify({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.username,
        photoURL: userData.profile.avatar,
        provider: "google",
        isLoggedIn: true,
      })
    );

    return {
      success: true,
      user: userData,
      citizenCode,
    };
  } catch (error) {
    console.error("Google 회원가입 오류:", error);
    throw error;
  }
};

/**
 * Spotify 프로필과 추가 입력 정보로 신규 회원을 가입시킵니다.
 * Firebase Auth 없이 Firestore에 직접 사용자 정보를 저장합니다.
 * @param {object} formData - 회원가입 폼에서 입력받은 데이터
 */
export const registerWithSpotify = async (formData) => {
  try {
    // 세션에서 Spotify 정보 가져오기
    const spotifyProfile = JSON.parse(sessionStorage.getItem("spotifyProfile"));
    const spotifyAccessToken = sessionStorage.getItem("spotifyAccessToken");

    if (!spotifyProfile || !spotifyAccessToken) {
      throw new Error("Spotify 인증 정보가 없습니다. 다시 로그인해주세요.");
    }

    console.log("Creating user document for:", spotifyProfile.email);

    const citizenCode = `BS${Date.now().toString(36).toUpperCase()}`;

    // 사용자 데이터 준비 (이메일을 document ID로 사용)
    const userData = {
      // 기본 정보
      uid: spotifyProfile.id, // Spotify ID를 UID로 사용
      email: spotifyProfile.email,
      username:
        formData.displayName ||
        spotifyProfile.display_name ||
        spotifyProfile.email.split("@")[0],

      // 프로필 정보
      profile: {
        name: formData.displayName || spotifyProfile.display_name || "",
        citizenCode: citizenCode,
        avatar: spotifyProfile.images?.[0]?.url || null,
        level: 1,
        points: 100,
        joinedAt: serverTimestamp(),
        birthYear: formData.birthYear || "",
        gender: formData.gender || "",
        country: formData.country || spotifyProfile.country || "",
        bio: formData.bio || "",
        location: formData.location || "",
      },

      // Spotify 관련 정보
      provider: "spotify",
      spotifyId: spotifyProfile.id,
      spotifyProfile: {
        id: spotifyProfile.id,
        displayName: spotifyProfile.display_name,
        email: spotifyProfile.email,
        images: spotifyProfile.images || [],
        country: spotifyProfile.country,
        followers: spotifyProfile.followers,
      },

      // 시스템 정보
      stats: { totalVotes: 0, battlesCreated: 0, battlesWon: 0 },
      preferences: {
        favoriteCategories: formData.favoriteCategories || [],
        notifications: true,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      isActive: true,
      hasPassword: true, // 비밀번호도 설정했으므로
    };

    // Firestore에 사용자 문서 생성 (이메일을 document ID로 사용)
    const userDocRef = doc(db, "users", spotifyProfile.email);

    console.log("Attempting to create user document...");
    await setDoc(userDocRef, userData);
    console.log("User document created successfully");

    // 세션 정리
    sessionStorage.removeItem("spotifyProfile");
    sessionStorage.removeItem("spotifyAccessToken");

    // 로그인 상태로 사용자 정보 저장
    sessionStorage.setItem(
      "currentUser",
      JSON.stringify({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.username,
        photoURL: userData.profile.avatar,
        provider: "spotify",
        isLoggedIn: true,
      })
    );

    return {
      success: true,
      user: userData,
      citizenCode,
    };
  } catch (error) {
    console.error("Spotify 회원가입 오류:", error);
    throw error;
  }
};

/**
 * 이메일과 비밀번호 등 폼 데이터로 신규 회원을 가입시킵니다.
 * @param {object} formData - 회원가입 폼에서 입력받은 데이터
 */
export const registerWithEmail = async (formData) => {
  const { user } = await createUserWithEmailAndPassword(
    auth,
    formData.email,
    formData.password
  );
  const citizenCode = `BS${Date.now().toString(36).toUpperCase()}`;
  const userData = {
    uid: user.uid,
    email: user.email,
    username: user.email.split("@")[0],
    profile: {
      name: "",
      country: formData.country,
      birthYear: formData.birthYear,
      gender: formData.gender,
      citizenCode: citizenCode,
      avatar: null,
      level: 1,
      points: 100,
      joinedAt: serverTimestamp(),
    },
    provider: "email",
    stats: { totalVotes: 0, battlesCreated: 0, battlesWon: 0 },
    preferences: { favoriteCategories: [], notifications: true },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    hasPassword: true,
  };

  // 이메일을 document ID로 사용하도록 변경
  await setDoc(doc(db, "users", user.email), userData);
  await updateProfile(user, {
    displayName: user.email.split("@")[0],
  });

  return { success: true, user, citizenCode };
};

/**
 * 이메일과 비밀번호로 기존 사용자를 로그인시킵니다.
 * @param {string} email - 사용자 이메일
 * @param {string} password - 사용자 비밀번호
 */
export const loginWithEmail = async (email, password) => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);

  // 이메일 기반으로 사용자 문서 조회
  const userDoc = await getDoc(doc(db, "users", email));

  if (userDoc.exists()) {
    const userData = userDoc.data();

    // 마지막 로그인 시간 업데이트
    await setDoc(
      doc(db, "users", email),
      {
        ...userData,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      success: true,
      user,
      userData: userData,
    };
  } else {
    throw new Error("사용자 데이터베이스에서 정보를 찾을 수 없습니다.");
  }
};

/**
 * Spotify 사용자 로그인 (Firebase Auth 없이)
 * @param {string} email - 사용자 이메일
 */
export const loginWithSpotify = async (email) => {
  try {
    const userDocRef = doc(db, "users", email);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();

      // 마지막 로그인 시간 업데이트
      await setDoc(
        userDocRef,
        {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 세션에 사용자 정보 저장
      sessionStorage.setItem(
        "currentUser",
        JSON.stringify({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.username,
          photoURL: userData.profile?.avatar,
          provider: "spotify",
          isLoggedIn: true,
        })
      );

      return {
        success: true,
        userData: userData,
      };
    } else {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error("Spotify 로그인 오류:", error);
    throw error;
  }
};

/**
 * 사용자를 로그아웃시키고 관련 세션 스토리지를 정리합니다.
 */
export const logout = async () => {
  try {
    // Firebase Auth 사용자가 있는 경우에만 signOut 호출
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch (error) {
    console.log("Firebase signOut 오류 (무시됨):", error);
  }

  // 세션 스토리지 정리
  sessionStorage.removeItem("spotifyProfile");
  sessionStorage.removeItem("spotifyAccessToken");
  sessionStorage.removeItem("googleProfile");
  sessionStorage.removeItem("currentUser");
  sessionStorage.removeItem("tempUserData");
};

// 기존 함수들 (하위 호환성을 위해 유지)
export const loginOrRegisterWithGoogle = handleGoogleLogin;
export const handleSpotifyAuth = handleSpotifyLogin;
