// src/services/battleDataService.js - 향상된 배틀 데이터 관리

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * 향상된 배틀 데이터 스키마
 * battles 컬렉션 구조를 확장하여 더 상세한 정보 저장
 */
const ENHANCED_BATTLE_SCHEMA = {
  // 기본 배틀 정보
  id: "자동 생성 ID",
  creatorId: "배틀 생성자 UID",
  creatorName: "배틀 생성자 이름",
  title: "콘텐츠A vs 콘텐츠B",
  category: "music | fashion | food",
  description: "배틀 설명",
  tags: ["태그1", "태그2"],

  // 대결 아이템 정보 (확장)
  itemA: {
    title: "콘텐츠 제목",
    imageUrl: "이미지 URL",
    votes: 0,
    contenderId: "원본 콘텐츠 ID",
    creatorId: "콘텐츠 제작자 ID",
    creatorName: "콘텐츠 제작자 이름",
  },
  itemB: {
    // itemA와 동일 구조
  },

  // 배틀 상태 및 시간 (확장)
  status: "ongoing | ended | paused",
  createdAt: "시작일시 (serverTimestamp)",
  endsAt: "종료일시 (Date)",
  endedAt: "실제 종료일시 (serverTimestamp)",
  duration: "배틀 진행 기간 (ms)",

  // 투표 관련 (확장)
  totalVotes: 0,
  participants: ["투표한 사용자 UID들"],
  dailyVotes: {
    "2025-01-26": { itemA: 10, itemB: 8, total: 18 },
    "2025-01-27": { itemA: 15, itemB: 12, total: 27 },
  },
  hourlyStats: {
    "2025-01-26-14": { itemA: 3, itemB: 2, total: 5 },
  },

  // 결과 및 승부 기록
  result: {
    winner: "itemA | itemB | tie",
    winnerVotes: 150,
    loserVotes: 120,
    winPercentage: 55.6,
    margin: 30,
  },

  // 소셜 상호작용
  likeCount: 0,
  likedBy: ["사용자 UID들"],
  shareCount: 0,
  bookmarkCount: 0,

  // 댓글 관련 (확장)
  commentCount: 0,
  commentList: [
    {
      id: "댓글 ID",
      authorId: "작성자 UID",
      authorName: "작성자 이름",
      text: "댓글 내용",
      createdAt: "작성시간",
      likes: 0,
      replies: [],
    },
  ],

  // 조회 및 참여 통계
  viewCount: 0,
  uniqueViewers: ["고유 조회자 UID들"],
  viewHistory: [
    {
      viewerId: "조회자 UID",
      viewedAt: "조회시간",
      duration: "페이지 머문 시간",
    },
  ],

  // 매칭 메타데이터
  matchingMethod: "smart_algorithm | manual | random",
  matchingScore: 85.5,
  matchingFactors: {
    categoryMatch: 25,
    creatorDiversity: 20,
    freshness: 18,
    popularityBalance: 15,
    qualityScore: 7.5,
  },

  // 성능 메트릭
  metrics: {
    engagementRate: 0.156, // 참여율 (투표수/조회수)
    completionRate: 0.892, // 완주율 (끝까지 본 사람/전체 조회자)
    shareRate: 0.034, // 공유율
    commentRate: 0.089, // 댓글율
  },

  // 관리 메타데이터
  moderationStatus: "approved | pending | flagged",
  reportCount: 0,
  isPromoted: false,
  isTrending: false,
  trendingScore: 0,

  // 업데이트 추적
  createdAt: "최초 생성시간",
  updatedAt: "마지막 업데이트시간",
  lastVoteAt: "마지막 투표시간",
  lastCommentAt: "마지막 댓글시간",
  lastViewAt: "마지막 조회시간",
};

/**
 * 배틀 생성 시 향상된 데이터 구조로 저장
 */
export const createEnhancedBattle = async (
  contenderA,
  contenderB,
  creatorId,
  creatorName
) => {
  try {
    const battleData = {
      // 기본 정보
      creatorId,
      creatorName,
      title: `${contenderA.title} vs ${contenderB.title}`,
      category: contenderA.category,
      description: `${contenderA.title}과(와) ${contenderB.title}의 치열한 대결!`,
      tags: [
        ...new Set([...(contenderA.tags || []), ...(contenderB.tags || [])]),
      ],

      // 대결 아이템 (확장)
      itemA: {
        title: contenderA.title,
        imageUrl: contenderA.imageUrl,
        votes: 0,
        contenderId: contenderA.id,
        creatorId: contenderA.creatorId,
        creatorName: contenderA.creatorName,
      },
      itemB: {
        title: contenderB.title,
        imageUrl: contenderB.imageUrl,
        votes: 0,
        contenderId: contenderB.id,
        creatorId: contenderB.creatorId,
        creatorName: contenderB.creatorName,
      },

      // 시간 정보
      status: "ongoing",
      createdAt: serverTimestamp(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
      duration: 7 * 24 * 60 * 60 * 1000, // 7일 (ms)

      // 투표 및 참여 정보
      totalVotes: 0,
      participants: [],
      dailyVotes: {},
      hourlyStats: {},

      // 소셜 정보
      likeCount: 0,
      likedBy: [],
      shareCount: 0,
      bookmarkCount: 0,

      // 댓글 정보
      commentCount: 0,
      commentList: [],

      // 조회 정보
      viewCount: 0,
      uniqueViewers: [],
      viewHistory: [],

      // 매칭 정보
      matchingMethod: "smart_algorithm",
      matchingScore: 0,
      matchingFactors: {},

      // 초기 메트릭
      metrics: {
        engagementRate: 0,
        completionRate: 0,
        shareRate: 0,
        commentRate: 0,
      },

      // 관리 정보
      moderationStatus: "approved",
      reportCount: 0,
      isPromoted: false,
      isTrending: false,
      trendingScore: 0,

      // 추적 정보
      updatedAt: serverTimestamp(),
      lastVoteAt: null,
      lastCommentAt: null,
      lastViewAt: null,
    };

    const battleRef = await addDoc(collection(db, "battles"), battleData);
    return { success: true, battleId: battleRef.id };
  } catch (error) {
    console.error("Enhanced battle creation failed:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 투표 처리 시 상세 데이터 업데이트
 */
export const recordVoteWithDetails = async (battleId, choice, userId) => {
  try {
    await runTransaction(db, async (transaction) => {
      const battleRef = doc(db, "battles", battleId);
      const battleDoc = await transaction.get(battleRef);

      if (!battleDoc.exists()) {
        throw new Error("배틀을 찾을 수 없습니다.");
      }

      const battleData = battleDoc.data();

      // 중복 투표 확인
      if (battleData.participants?.includes(userId)) {
        throw new Error("이미 투표했습니다.");
      }

      const now = new Date();
      const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const hour = `${today}-${now.getHours()}`; // YYYY-MM-DD-HH

      // 기본 투표 데이터 업데이트
      const updateData = {
        [`${choice}.votes`]: battleData[choice].votes + 1,
        totalVotes: battleData.totalVotes + 1,
        participants: arrayUnion(userId),
        lastVoteAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // 일별 투표 통계 업데이트
      const dailyVotes = battleData.dailyVotes || {};
      if (!dailyVotes[today]) {
        dailyVotes[today] = { itemA: 0, itemB: 0, total: 0 };
      }
      dailyVotes[today][choice] += 1;
      dailyVotes[today].total += 1;
      updateData.dailyVotes = dailyVotes;

      // 시간별 투표 통계 업데이트
      const hourlyStats = battleData.hourlyStats || {};
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { itemA: 0, itemB: 0, total: 0 };
      }
      hourlyStats[hour][choice] += 1;
      hourlyStats[hour].total += 1;
      updateData.hourlyStats = hourlyStats;

      // 메트릭 재계산
      const newTotalVotes = battleData.totalVotes + 1;
      const newEngagementRate =
        newTotalVotes / Math.max(battleData.viewCount, 1);
      updateData.metrics = {
        ...battleData.metrics,
        engagementRate: newEngagementRate,
      };

      transaction.update(battleRef, updateData);
    });

    return { success: true };
  } catch (error) {
    console.error("Vote recording failed:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 배틀 조회 시 상세 추적
 */
export const recordBattleView = async (
  battleId,
  viewerId = null,
  viewDuration = null
) => {
  try {
    const battleRef = doc(db, "battles", battleId);

    await runTransaction(db, async (transaction) => {
      const battleDoc = await transaction.get(battleRef);

      if (!battleDoc.exists()) return;

      const battleData = battleDoc.data();
      const updateData = {
        viewCount: battleData.viewCount + 1,
        lastViewAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // 로그인한 사용자인 경우 상세 추적
      if (viewerId) {
        // 고유 조회자 추가
        if (!battleData.uniqueViewers?.includes(viewerId)) {
          updateData.uniqueViewers = arrayUnion(viewerId);
        }

        // 조회 히스토리 추가 (최근 100개만 유지)
        const viewHistory = battleData.viewHistory || [];
        const newViewRecord = {
          viewerId,
          viewedAt: new Date(),
          duration: viewDuration,
        };

        viewHistory.push(newViewRecord);
        if (viewHistory.length > 100) {
          viewHistory.shift(); // 오래된 기록 제거
        }

        updateData.viewHistory = viewHistory;
      }

      transaction.update(battleRef, updateData);
    });
  } catch (error) {
    console.error("View recording failed:", error);
  }
};

/**
 * 댓글 추가 시 상세 데이터 업데이트
 */
export const addBattleComment = async (
  battleId,
  authorId,
  authorName,
  commentText
) => {
  try {
    await runTransaction(db, async (transaction) => {
      const battleRef = doc(db, "battles", battleId);
      const battleDoc = await transaction.get(battleRef);

      if (!battleDoc.exists()) {
        throw new Error("배틀을 찾을 수 없습니다.");
      }

      const battleData = battleDoc.data();

      // 새 댓글 객체
      const newComment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        authorId,
        authorName,
        text: commentText,
        createdAt: new Date(),
        likes: 0,
        replies: [],
      };

      // 댓글 리스트 업데이트 (최근 50개만 유지)
      const commentList = battleData.commentList || [];
      commentList.push(newComment);
      if (commentList.length > 50) {
        commentList.shift(); // 오래된 댓글 제거
      }

      // 댓글율 계산
      const newCommentCount = battleData.commentCount + 1;
      const commentRate = newCommentCount / Math.max(battleData.viewCount, 1);

      const updateData = {
        commentCount: newCommentCount,
        commentList,
        lastCommentAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metrics: {
          ...battleData.metrics,
          commentRate,
        },
      };

      transaction.update(battleRef, updateData);
    });

    return { success: true };
  } catch (error) {
    console.error("Comment addition failed:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 배틀 종료 시 최종 결과 계산 및 저장
 */
export const finalizeBattleResults = async (battleId) => {
  try {
    await runTransaction(db, async (transaction) => {
      const battleRef = doc(db, "battles", battleId);
      const battleDoc = await transaction.get(battleRef);

      if (!battleDoc.exists()) {
        throw new Error("배틀을 찾을 수 없습니다.");
      }

      const battleData = battleDoc.data();

      // 최종 결과 계산
      const itemAVotes = battleData.itemA.votes;
      const itemBVotes = battleData.itemB.votes;
      const totalVotes = itemAVotes + itemBVotes;

      let winner = null;
      let winnerVotes = 0;
      let loserVotes = 0;
      let winPercentage = 0;

      if (itemAVotes > itemBVotes) {
        winner = "itemA";
        winnerVotes = itemAVotes;
        loserVotes = itemBVotes;
      } else if (itemBVotes > itemAVotes) {
        winner = "itemB";
        winnerVotes = itemBVotes;
        loserVotes = itemAVotes;
      } else {
        winner = "tie";
        winnerVotes = itemAVotes;
        loserVotes = itemBVotes;
      }

      if (totalVotes > 0) {
        winPercentage = (winnerVotes / totalVotes) * 100;
      }

      // 최종 메트릭 계산
      const finalMetrics = {
        engagementRate: totalVotes / Math.max(battleData.viewCount, 1),
        completionRate: battleData.uniqueViewers
          ? battleData.uniqueViewers.length / Math.max(battleData.viewCount, 1)
          : 0,
        shareRate: battleData.shareCount / Math.max(battleData.viewCount, 1),
        commentRate:
          battleData.commentCount / Math.max(battleData.viewCount, 1),
      };

      const updateData = {
        status: "ended",
        endedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        result: {
          winner,
          winnerVotes,
          loserVotes,
          winPercentage: Math.round(winPercentage * 100) / 100,
          margin: winnerVotes - loserVotes,
          totalVotes,
        },
        metrics: finalMetrics,
      };

      transaction.update(battleRef, updateData);
    });

    return { success: true };
  } catch (error) {
    console.error("Battle finalization failed:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 배틀 상세 통계 조회
 */
export const getBattleDetailedStats = async (battleId) => {
  try {
    const battleRef = doc(db, "battles", battleId);
    const battleDoc = await getDoc(battleRef);

    if (!battleDoc.exists()) {
      return { success: false, error: "배틀을 찾을 수 없습니다." };
    }

    const battleData = battleDoc.data();

    // 통계 데이터 정리
    const stats = {
      basic: {
        totalVotes: battleData.totalVotes || 0,
        totalViews: battleData.viewCount || 0,
        totalComments: battleData.commentCount || 0,
        totalLikes: battleData.likeCount || 0,
        uniqueParticipants: battleData.participants?.length || 0,
        uniqueViewers: battleData.uniqueViewers?.length || 0,
      },
      timeline: {
        dailyVotes: battleData.dailyVotes || {},
        hourlyStats: battleData.hourlyStats || {},
      },
      performance: battleData.metrics || {},
      result: battleData.result || null,
      social: {
        comments: battleData.commentList || [],
        recentViews: battleData.viewHistory?.slice(-20) || [],
      },
    };

    return { success: true, stats };
  } catch (error) {
    console.error("Stats retrieval failed:", error);
    return { success: false, error: error.message };
  }
};

export {
  ENHANCED_BATTLE_SCHEMA,
  createEnhancedBattle,
  recordVoteWithDetails,
  recordBattleView,
  addBattleComment,
  finalizeBattleResults,
  getBattleDetailedStats,
};
