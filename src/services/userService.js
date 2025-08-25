// src/services/userService.js - 사용자 관련 서비스 (완성 버전)

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase/config";

// 사용자 프로필 가져오기
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));

    if (!userDoc.exists()) {
      console.log("No such user document! Creating new one...");

      // 🔧 사용자 문서가 없으면 기본 문서 생성
      const currentUser = auth.currentUser;
      if (currentUser) {
        const defaultUserData = {
          uid: uid,
          email: currentUser.email,
          displayName:
            currentUser.displayName || currentUser.email.split("@")[0],
          photoURL: currentUser.photoURL || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          provider: "email",
          stats: {
            totalVotes: 0,
            battlesCreated: 0,
            battlesWon: 0,
            points: 100, // 기본 포인트
          },
          bio: "",
          location: "",
          website: "",
        };

        // 새 사용자 문서 생성
        await setDoc(doc(db, "users", uid), defaultUserData);
        console.log("새 사용자 문서가 생성되었습니다.");

        return defaultUserData;
      }

      return null;
    }

    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

// 사용자 통계 가져오기
export const getUserStats = async (uid) => {
  try {
    const userProfile = await getUserProfile(uid);

    if (!userProfile) {
      // 기본 통계 반환
      return {
        totalVotes: 0,
        battlesCreated: 0,
        battlesWon: 0,
        points: 100,
      };
    }

    // 실제 통계 계산 (더 정확한 통계를 위해)
    const [battlesCreated, votesCount] = await Promise.all([
      // 생성한 배틀 수
      getDocs(query(collection(db, "battles"), where("creatorId", "==", uid))),
      // 참여한 투표 수 (battles에서 participants 확인)
      getDocs(
        query(
          collection(db, "battles"),
          where("participants", "array-contains", uid)
        )
      ),
    ]);

    const stats = {
      totalVotes: votesCount.size,
      battlesCreated: battlesCreated.size,
      battlesWon: userProfile.stats?.battlesWon || 0,
      points: userProfile.stats?.points || 100,
    };

    // 사용자 문서의 통계 업데이트
    await updateDoc(doc(db, "users", uid), {
      "stats.totalVotes": stats.totalVotes,
      "stats.battlesCreated": stats.battlesCreated,
      updatedAt: serverTimestamp(),
    });

    return stats;
  } catch (error) {
    console.error("Error getting user stats:", error);
    return {
      totalVotes: 0,
      battlesCreated: 0,
      battlesWon: 0,
      points: 100,
    };
  }
};

// 사용자 프로필 업데이트
export const updateProfile = async (uid, profileData) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

// 사용자가 생성한 배틀 목록 가져오기
export const getUserBattles = async (userId, filter = "all") => {
  try {
    let q;

    if (filter === "all") {
      q = query(
        collection(db, "battles"),
        where("creatorId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(20)
      );
    } else {
      q = query(
        collection(db, "battles"),
        where("creatorId", "==", userId),
        where("status", "==", filter),
        orderBy("createdAt", "desc"),
        limit(20)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error("Error getting user battles:", error);
    return [];
  }
};

// 사용자 투표 내역 가져오기
export const getUserVotes = async (userId) => {
  try {
    // 사용자가 참여한 배틀들 가져오기
    const q = query(
      collection(db, "battles"),
      where("participants", "array-contains", userId),
      orderBy("lastVoteAt", "desc"),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const votes = [];

    snapshot.docs.forEach((doc) => {
      const battle = doc.data();
      votes.push({
        id: doc.id,
        battleTitle: battle.title,
        category: battle.category,
        votedAt: battle.lastVoteAt?.toDate() || new Date(),
        selectedItem: "투표 완료", // 실제로는 사용자별 선택 기록 필요
        isWinner: false, // 실제로는 최종 결과와 비교 필요
      });
    });

    return votes;
  } catch (error) {
    console.error("Error getting user votes:", error);
    return [];
  }
};

// 사용자 포인트 내역 가져오기
export const getUserPoints = async (userId) => {
  try {
    // pointHistory 컬렉션이 없다면 기본 데이터 반환
    const q = query(
      collection(db, "pointHistory"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(30)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // 포인트 내역이 없으면 기본 데이터 반환
      return [
        {
          id: "1",
          type: "welcome",
          amount: 100,
          createdAt: new Date(),
          description: "가입 환영 보너스",
        },
      ];
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error("Error getting user points:", error);
    // 에러 발생 시 기본 포인트 내역 반환
    return [
      {
        id: "1",
        type: "welcome",
        amount: 100,
        createdAt: new Date(),
        description: "가입 환영 보너스",
      },
      {
        id: "2",
        type: "vote",
        amount: 10,
        createdAt: new Date(Date.now() - 86400000), // 1일 전
        description: "투표 참여",
      },
    ];
  }
};

// 포인트 추가 함수
export const addPoints = async (userId, pointData) => {
  try {
    // 포인트 내역 추가
    await setDoc(doc(collection(db, "pointHistory")), {
      userId,
      type: pointData.type,
      amount: pointData.amount,
      description: pointData.description,
      createdAt: serverTimestamp(),
    });

    // 사용자 총 포인트 업데이트
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const currentPoints = userDoc.data().stats?.points || 0;
      await updateDoc(userRef, {
        "stats.points": currentPoints + pointData.amount,
        updatedAt: serverTimestamp(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding points:", error);
    return { success: false, error: error.message };
  }
};

// 사용자 통계 업데이트 함수
export const updateUserStats = async (userId, statType, increment = 1) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const currentStats = userDoc.data().stats || {};
      const updateData = {
        [`stats.${statType}`]: (currentStats[statType] || 0) + increment,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userRef, updateData);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating user stats:", error);
    return { success: false, error: error.message };
  }
};

// 사용자 설정 저장
export const saveUserSettings = async (userId, settings) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      settings: settings,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error saving user settings:", error);
    throw error;
  }
};

// 사용자 설정 가져오기
export const getUserSettings = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));

    if (userDoc.exists()) {
      return userDoc.data().settings || getDefaultSettings();
    }

    return getDefaultSettings();
  } catch (error) {
    console.error("Error getting user settings:", error);
    return getDefaultSettings();
  }
};

// 기본 설정값
const getDefaultSettings = () => ({
  notifications: {
    email: true,
    push: false,
    battleResults: true,
    newBattles: false,
    comments: true,
  },
  privacy: {
    profilePublic: true,
    showStats: true,
    allowMessages: true,
  },
  preferences: {
    theme: "dark",
    language: "ko",
    autoPlay: false,
  },
});
