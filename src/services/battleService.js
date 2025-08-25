// src/services/battleService.js - 배틀 관리 서비스

import { auth, db } from "../firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  arrayUnion,
  runTransaction,
  serverTimestamp,
  increment,
} from "firebase/firestore";

// ==================== 유틸리티 함수들 ====================

// 라이브 상태 계산 함수
export const calculateLiveStatus = (battleData) => {
  const itemAVotes = battleData.itemA?.votes || 0;
  const itemBVotes = battleData.itemB?.votes || 0;
  const total = itemAVotes + itemBVotes;

  if (total === 0) {
    return {
      status: "waiting",
      message: "첫 투표를 기다리고 있습니다",
      percentage: { itemA: 50, itemB: 50 },
    };
  }

  const percentageA = Math.round((itemAVotes / total) * 100);
  const percentageB = 100 - percentageA;
  const margin = Math.abs(itemAVotes - itemBVotes);

  let status = "competitive";
  let message = "치열한 접전 중";

  if (margin > total * 0.2) {
    status = "dominant";
    message = `${itemAVotes > itemBVotes ? "A" : "B"}가 앞서고 있습니다`;
  } else if (margin > total * 0.1) {
    status = "leading";
    message = `${itemAVotes > itemBVotes ? "A" : "B"}가 우세합니다`;
  }

  return {
    status,
    message,
    percentage: { itemA: percentageA, itemB: percentageB },
    margin,
  };
};

// 트렌딩 점수 계산 함수
export const calculateTrendingScore = (battleData) => {
  const now = Date.now();
  const createdAt = battleData.createdAt?.toDate?.()?.getTime() || now;
  const ageInHours = (now - createdAt) / (1000 * 60 * 60);

  const votes = battleData.totalVotes || 0;
  const views = battleData.viewCount || 0;
  const comments = battleData.commentCount || 0;
  const engagement = battleData.metrics?.engagementRate || 0;

  const timeWeight = Math.max(0, 1 - ageInHours / 168); // 7일
  const baseScore = votes * 2 + views * 0.5 + comments * 3 + engagement * 100;

  return Math.round(baseScore * timeWeight * 100) / 100;
};

// ==================== 메인 배틀 서비스 함수들 ====================

/**
 * 트렌딩 배틀 가져오기
 */
export const getTrendingBattles = async (limitCount = 8) => {
  try {
    let q;

    try {
      // 원래 복합 인덱스 쿼리 시도
      q = query(
        collection(db, "battles"),
        where("status", "==", "ongoing"),
        orderBy("totalVotes", "desc"),
        orderBy("viewCount", "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const battles = [];

      querySnapshot.docs.forEach((docSnapshot) => {
        const battleData = {
          id: docSnapshot.id,
          ...docSnapshot.data(),
          createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
          endDate: docSnapshot.data().endsAt?.toDate() || new Date(),
          lastActivityAt:
            docSnapshot.data().lastVoteAt?.toDate() ||
            docSnapshot.data().createdAt?.toDate() ||
            new Date(),
        };

        // HOT 배틀 여부 판단
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        battleData.isHot =
          battleData.lastActivityAt > oneHourAgo && battleData.totalVotes > 50;

        battles.push(battleData);
      });

      return {
        success: true,
        battles,
      };
    } catch (indexError) {
      console.warn("복합 인덱스가 없어서 단순 쿼리로 fallback:", indexError);

      // 인덱스 오류가 발생하면 단순한 쿼리로 fallback
      q = query(
        collection(db, "battles"),
        where("status", "==", "ongoing"),
        limit(limitCount * 2)
      );

      const querySnapshot = await getDocs(q);
      const battles = [];

      querySnapshot.docs.forEach((docSnapshot) => {
        const battleData = {
          id: docSnapshot.id,
          ...docSnapshot.data(),
          createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
          endDate: docSnapshot.data().endsAt?.toDate() || new Date(),
          lastActivityAt:
            docSnapshot.data().lastVoteAt?.toDate() ||
            docSnapshot.data().createdAt?.toDate() ||
            new Date(),
        };

        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        battleData.isHot =
          battleData.lastActivityAt > oneHourAgo && battleData.totalVotes > 50;

        battles.push(battleData);
      });

      // 클라이언트에서 정렬
      battles.sort((a, b) => {
        if (b.totalVotes !== a.totalVotes) {
          return b.totalVotes - a.totalVotes;
        }
        return (b.viewCount || 0) - (a.viewCount || 0);
      });

      return {
        success: true,
        battles: battles.slice(0, limitCount),
      };
    }
  } catch (error) {
    console.error("트렌딩 배틀 조회 오류:", error);
    return {
      success: false,
      error: error.message,
      battles: [],
    };
  }
};

/**
 * 배틀 상세 정보 조회 (미디어 정보 포함)
 */
export const getBattleDetail = async (battleId, userId = null) => {
  try {
    const battleRef = doc(db, "battles", battleId);
    const battleDoc = await getDoc(battleRef);

    if (!battleDoc.exists()) {
      return {
        success: false,
        message: "배틀을 찾을 수 없습니다.",
        battle: null,
      };
    }

    const battleData = battleDoc.data();

    // 조회수 증가
    setTimeout(async () => {
      try {
        if (userId) {
          const uniqueViewers = battleData.uniqueViewers || [];
          if (!uniqueViewers.includes(userId)) {
            await updateDoc(battleRef, {
              viewCount: increment(1),
              uniqueViewers: arrayUnion(userId),
              lastViewAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } else {
          await updateDoc(battleRef, {
            viewCount: increment(1),
            lastViewAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        console.warn("조회수 업데이트 실패 (무시됨):", error);
      }
    }, 500);

    // 미디어 정보를 포함한 배틀 데이터 처리
    const processedBattle = {
      id: battleDoc.id,
      ...battleData,
      createdAt: battleData.createdAt?.toDate() || new Date(),
      endDate: battleData.endsAt?.toDate() || new Date(),
      lastVoteAt: battleData.lastVoteAt?.toDate() || null,
      lastCommentAt: battleData.lastCommentAt?.toDate() || null,
      lastViewAt: battleData.lastViewAt?.toDate() || null,

      // 미디어 정보를 포함한 아이템 데이터
      itemA: {
        title: battleData.itemA?.title || "",
        imageUrl: battleData.itemA?.imageUrl || "",
        votes: battleData.itemA?.votes || 0,
        contenderId: battleData.itemA?.contenderId || null,
        creatorId: battleData.itemA?.creatorId || null,
        creatorName: battleData.itemA?.creatorName || "Unknown",
        description: battleData.itemA?.description || "",

        // 플랫폼 및 미디어 정보
        platform: battleData.itemA?.platform || "image",
        contentType: battleData.itemA?.contentType || "image",
        extractedData: battleData.itemA?.extractedData || null,

        // 호환성을 위한 기존 필드들
        youtubeId: battleData.itemA?.youtubeId || null,
        youtubeUrl: battleData.itemA?.youtubeUrl || null,
        thumbnailUrl: battleData.itemA?.thumbnailUrl || null,
        instagramUrl: battleData.itemA?.instagramUrl || null,
        postType: battleData.itemA?.postType || null,
        tiktokUrl: battleData.itemA?.tiktokUrl || null,
        tiktokId: battleData.itemA?.tiktokId || null,

        // 시간 설정
        timeSettings: battleData.itemA?.timeSettings || null,
      },

      itemB: {
        title: battleData.itemB?.title || "",
        imageUrl: battleData.itemB?.imageUrl || "",
        votes: battleData.itemB?.votes || 0,
        contenderId: battleData.itemB?.contenderId || null,
        creatorId: battleData.itemB?.creatorId || null,
        creatorName: battleData.itemB?.creatorName || "Unknown",
        description: battleData.itemB?.description || "",

        // 플랫폼 및 미디어 정보
        platform: battleData.itemB?.platform || "image",
        contentType: battleData.itemB?.contentType || "image",
        extractedData: battleData.itemB?.extractedData || null,

        // 호환성을 위한 기존 필드들
        youtubeId: battleData.itemB?.youtubeId || null,
        youtubeUrl: battleData.itemB?.youtubeUrl || null,
        thumbnailUrl: battleData.itemB?.thumbnailUrl || null,
        instagramUrl: battleData.itemB?.instagramUrl || null,
        postType: battleData.itemB?.postType || null,
        tiktokUrl: battleData.itemB?.tiktokUrl || null,
        tiktokId: battleData.itemB?.tiktokId || null,

        // 시간 설정
        timeSettings: battleData.itemB?.timeSettings || null,
      },

      // 기본 메타데이터
      totalVotes: battleData.totalVotes || 0,
      participants: battleData.participants || [],
      viewCount: battleData.viewCount || 0,
      likeCount: battleData.likeCount || 0,
      commentCount: battleData.commentCount || 0,
      shareCount: battleData.shareCount || 0,
      uniqueViewers: battleData.uniqueViewers || [],
      likedBy: battleData.likedBy || [],

      // 실시간 상태 정보
      liveStatus: calculateLiveStatus(battleData),
      trendingScore: calculateTrendingScore(battleData),
    };

    return {
      success: true,
      battle: processedBattle,
    };
  } catch (error) {
    console.error("배틀 조회 실패:", error);
    return {
      success: false,
      error: error.message,
      battle: null,
    };
  }
};

/**
 * 배틀 투표
 */
export const voteOnBattle = async (battleId, choice) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("투표하려면 로그인이 필요합니다.");
  }

  const battleRef = doc(db, "battles", battleId);

  try {
    return await runTransaction(db, async (transaction) => {
      const battleDoc = await transaction.get(battleRef);

      if (!battleDoc.exists()) {
        throw new Error("배틀 정보를 찾을 수 없습니다.");
      }

      const battleData = battleDoc.data();

      if (battleData.status !== "ongoing") {
        throw new Error("이미 종료된 배틀입니다.");
      }

      if (battleData.participants?.includes(currentUser.uid)) {
        throw new Error("이미 이 배틀에 투표했습니다.");
      }

      const newVoteCount = (battleData[choice]?.votes || 0) + 1;
      const newTotalVotes = (battleData.totalVotes || 0) + 1;

      const today = new Date().toISOString().split("T")[0];
      const dailyVotes = battleData.dailyVotes || {};

      if (!dailyVotes[today]) {
        dailyVotes[today] = { itemA: 0, itemB: 0, total: 0 };
      }
      dailyVotes[today][choice] += 1;
      dailyVotes[today].total += 1;

      const itemAVotes =
        choice === "itemA" ? newVoteCount : battleData.itemA?.votes || 0;
      const itemBVotes =
        choice === "itemB" ? newVoteCount : battleData.itemB?.votes || 0;

      let currentWinner = "tie";
      let winPercentage = 50;
      let margin = 0;

      if (itemAVotes > itemBVotes) {
        currentWinner = "itemA";
        winPercentage = Math.round((itemAVotes / newTotalVotes) * 100);
        margin = itemAVotes - itemBVotes;
      } else if (itemBVotes > itemAVotes) {
        currentWinner = "itemB";
        winPercentage = Math.round((itemBVotes / newTotalVotes) * 100);
        margin = itemBVotes - itemAVotes;
      }

      const engagementRate =
        newTotalVotes / Math.max(battleData.viewCount || 1, 1);

      const updateData = {
        [`${choice}.votes`]: newVoteCount,
        totalVotes: newTotalVotes,
        participants: arrayUnion(currentUser.uid),
        lastVoteAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        dailyVotes: dailyVotes,
        currentLeader: {
          winner: currentWinner,
          percentage: winPercentage,
          margin: margin,
          lastUpdated: serverTimestamp(),
        },
        metrics: {
          ...battleData.metrics,
          engagementRate: Math.round(engagementRate * 1000) / 1000,
        },
      };

      transaction.update(battleRef, updateData);

      return {
        success: true,
        newVoteCount,
        newTotalVotes,
        currentLeader: {
          winner: currentWinner,
          percentage: winPercentage,
          margin: margin,
        },
      };
    });
  } catch (error) {
    console.error("투표 처리 중 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 관련 배틀 조회
 */
export const getRelatedBattles = async (
  currentBattleId,
  category,
  limitCount = 8
) => {
  try {
    const q = query(
      collection(db, "battles"),
      where("category", "==", category),
      orderBy("totalVotes", "desc"),
      limit(limitCount + 1)
    );

    const querySnapshot = await getDocs(q);
    const battles = [];

    querySnapshot.docs.forEach((docSnapshot) => {
      if (docSnapshot.id === currentBattleId) return;

      const battleData = {
        id: docSnapshot.id,
        ...docSnapshot.data(),
        createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
        endDate: docSnapshot.data().endsAt?.toDate() || new Date(),
        lastActivityAt:
          docSnapshot.data().lastVoteAt?.toDate() ||
          docSnapshot.data().createdAt?.toDate() ||
          new Date(),
      };

      battles.push(battleData);
    });

    const limitedBattles = battles.slice(0, limitCount);

    return {
      success: true,
      battles: limitedBattles,
    };
  } catch (error) {
    console.error("관련 배틀 조회 오류:", error);
    return {
      success: false,
      error: error.message,
      battles: [],
    };
  }
};

/**
 * 인기 배틀 조회
 */
export const getPopularBattles = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, "battles"),
      orderBy("totalVotes", "desc"),
      orderBy("viewCount", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const battles = [];

    querySnapshot.docs.forEach((docSnapshot) => {
      const battleData = {
        id: docSnapshot.id,
        ...docSnapshot.data(),
        createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
        endDate: docSnapshot.data().endsAt?.toDate() || new Date(),
      };

      battles.push(battleData);
    });

    return {
      success: true,
      battles,
    };
  } catch (error) {
    console.error("인기 배틀 조회 오류:", error);
    return {
      success: false,
      error: error.message,
      battles: [],
    };
  }
};

/**
 * 배틀 검색
 */
export const searchBattles = async (
  searchTerm,
  category = null,
  limitCount = 20
) => {
  try {
    let q;

    if (category) {
      q = query(
        collection(db, "battles"),
        where("category", "==", category),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, "battles"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    const battles = [];

    querySnapshot.docs.forEach((docSnapshot) => {
      const battleData = {
        id: docSnapshot.id,
        ...docSnapshot.data(),
        createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
        endDate: docSnapshot.data().endsAt?.toDate() || new Date(),
      };

      const searchableText = `${battleData.title} ${
        battleData.description || ""
      } ${battleData.itemA.title} ${battleData.itemB.title}`.toLowerCase();

      if (searchableText.includes(searchTerm.toLowerCase())) {
        battles.push(battleData);
      }
    });

    return {
      success: true,
      battles,
    };
  } catch (error) {
    console.error("배틀 검색 오류:", error);
    return {
      success: false,
      error: error.message,
      battles: [],
    };
  }
};

/**
 * 사용자 배틀 조회
 */
export const getUserBattles = async (userId, limitCount = 20) => {
  try {
    const q = query(
      collection(db, "battles"),
      where("creatorId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const battles = [];

    querySnapshot.docs.forEach((docSnapshot) => {
      const battleData = {
        id: docSnapshot.id,
        ...docSnapshot.data(),
        createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
        endDate: docSnapshot.data().endsAt?.toDate() || new Date(),
      };

      battles.push(battleData);
    });

    return {
      success: true,
      battles,
    };
  } catch (error) {
    console.error("사용자 배틀 조회 오류:", error);
    return {
      success: false,
      error: error.message,
      battles: [],
    };
  }
};

/**
 * 사용자 투표 확인
 */
export const checkUserVoted = async (battleId, userId) => {
  try {
    const battleRef = doc(db, "battles", battleId);
    const battleDoc = await getDoc(battleRef);

    if (!battleDoc.exists()) {
      return {
        success: false,
        hasVoted: false,
        selectedSide: null,
      };
    }

    const battleData = battleDoc.data();
    const participants = battleData.participants || [];
    const hasVoted = participants.includes(userId);

    return {
      success: true,
      hasVoted,
      selectedSide: null,
    };
  } catch (error) {
    console.error("투표 확인 오류:", error);
    return {
      success: false,
      hasVoted: false,
      selectedSide: null,
    };
  }
};

/**
 * 배틀 좋아요/좋아요 취소
 */
export const toggleBattleLike = async (battleId, userId) => {
  try {
    const battleRef = doc(db, "battles", battleId);

    return await runTransaction(db, async (transaction) => {
      const battleDoc = await transaction.get(battleRef);

      if (!battleDoc.exists()) {
        throw new Error("배틀을 찾을 수 없습니다.");
      }

      const battleData = battleDoc.data();
      const likedBy = battleData.likedBy || [];
      const currentLikeCount = battleData.likeCount || 0;

      let newLikedBy;
      let newLikeCount;
      let isLiked;

      if (likedBy.includes(userId)) {
        // 좋아요 취소
        newLikedBy = likedBy.filter((id) => id !== userId);
        newLikeCount = Math.max(0, currentLikeCount - 1);
        isLiked = false;
      } else {
        // 좋아요 추가
        newLikedBy = [...likedBy, userId];
        newLikeCount = currentLikeCount + 1;
        isLiked = true;
      }

      transaction.update(battleRef, {
        likedBy: newLikedBy,
        likeCount: newLikeCount,
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        isLiked,
        likeCount: newLikeCount,
      };
    });
  } catch (error) {
    console.error("배틀 좋아요 토글 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 배틀 공유
 */
export const shareBattle = async (battleId) => {
  try {
    const battleRef = doc(db, "battles", battleId);

    await updateDoc(battleRef, {
      shareCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: "배틀이 공유되었습니다.",
    };
  } catch (error) {
    console.error("배틀 공유 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
