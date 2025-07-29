// src/services/analyticsDetail.js - 상세 분석 기능

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * 특정 배틀의 상세 분석
 */
export const getBattleDetailAnalytics = async (battleId) => {
  try {
    const battleRef = doc(db, "battles", battleId);
    const battleDoc = await getDoc(battleRef);

    if (!battleDoc.exists()) {
      return { success: false, error: "배틀을 찾을 수 없습니다." };
    }

    const battleData = { id: battleDoc.id, ...battleDoc.data() };

    // 상세 분석 데이터 생성
    const analytics = {
      basic: {
        title: battleData.title,
        category: battleData.category,
        status: battleData.status,
        createdAt: battleData.createdAt,
        endsAt: battleData.endsAt,
        totalVotes: battleData.totalVotes || 0,
        totalViews: battleData.viewCount || 0,
        totalComments: battleData.commentCount || 0,
        totalLikes: battleData.likeCount || 0,
        uniqueParticipants: battleData.participants?.length || 0,
        uniqueViewers: battleData.uniqueViewers?.length || 0,
      },

      performance: battleData.metrics || {
        engagementRate: 0,
        commentRate: 0,
        shareRate: 0,
      },

      timeline: {
        dailyVotes: battleData.dailyVotes || {},
        hourlyStats: battleData.hourlyStats || {},
        peakVotingTime: findPeakVotingTime(battleData.hourlyStats || {}),
      },

      contestants: {
        itemA: {
          ...battleData.itemA,
          winPercentage: calculateWinPercentage(
            battleData.itemA?.votes || 0,
            battleData.totalVotes || 0
          ),
        },
        itemB: {
          ...battleData.itemB,
          winPercentage: calculateWinPercentage(
            battleData.itemB?.votes || 0,
            battleData.totalVotes || 0
          ),
        },
      },

      social: {
        comments: battleData.commentList || [],
        recentViewers: battleData.recentViewers || [],
        likedBy: battleData.likedBy || [],
      },

      predictions: generateBattlePredictions(battleData),
    };

    return { success: true, analytics };
  } catch (error) {
    console.error("Battle detail analytics failed:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 최고 투표 시간대 찾기
 */
const findPeakVotingTime = (hourlyStats) => {
  if (!hourlyStats || Object.keys(hourlyStats).length === 0) return null;

  const hourlyTotals = {};

  Object.entries(hourlyStats).forEach(([timeKey, data]) => {
    const hour = timeKey.split("-")[3]; // YYYY-MM-DD-HH에서 HH 추출
    if (hour) {
      hourlyTotals[hour] = (hourlyTotals[hour] || 0) + (data.total || 0);
    }
  });

  const peakHour = Object.entries(hourlyTotals).sort(
    ([, a], [, b]) => b - a
  )[0];

  return peakHour
    ? {
        hour: parseInt(peakHour[0]),
        votes: peakHour[1],
      }
    : null;
};

/**
 * 승률 계산
 */
const calculateWinPercentage = (votes, totalVotes) => {
  return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
};

/**
 * 배틀 결과 예측
 */
const generateBattlePredictions = (battleData) => {
  const totalVotes = battleData.totalVotes || 0;
  const itemAVotes = battleData.itemA?.votes || 0;
  const itemBVotes = battleData.itemB?.votes || 0;

  if (totalVotes < 10) {
    return {
      confidence: "low",
      prediction: "아직 예측하기 어려움",
      reasoning: "투표 수가 부족합니다.",
    };
  }

  const margin = Math.abs(itemAVotes - itemBVotes);
  const marginPercentage = totalVotes > 0 ? (margin / totalVotes) * 100 : 0;

  let confidence = "medium";
  let prediction = "접전 예상";
  let reasoning = "비슷한 득표율을 보이고 있습니다.";

  if (marginPercentage > 20) {
    confidence = "high";
    const leader =
      itemAVotes > itemBVotes ? battleData.itemA.title : battleData.itemB.title;
    prediction = `${leader} 승리 예상`;
    reasoning = `현재 ${Math.round(marginPercentage)}% 차이로 앞서고 있습니다.`;
  } else if (marginPercentage > 10) {
    confidence = "medium";
    const leader =
      itemAVotes > itemBVotes ? battleData.itemA.title : battleData.itemB.title;
    prediction = `${leader} 우세`;
    reasoning = `현재 ${Math.round(
      marginPercentage
    )}% 차이로 앞서고 있지만 역전 가능합니다.`;
  }

  // 최근 트렌드 고려
  const today = new Date().toISOString().split("T")[0];
  const todayVotes = battleData.dailyVotes?.[today]?.total || 0;

  if (todayVotes > totalVotes * 0.3) {
    // 오늘 투표가 전체의 30% 이상
    reasoning += " 최근 투표가 급증하고 있어 결과가 바뀔 수 있습니다.";
  }

  return {
    confidence,
    prediction,
    reasoning,
    currentMargin: marginPercentage,
    totalVotes,
  };
};

export default {
  getBattleDetailAnalytics,
};
