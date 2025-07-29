// src/services/analyticsService.js - 핵심 분석 기능

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * 배틀 종합 분석 조회
 * @param {number} timeRange - 분석 기간 (일수)
 * @returns {Promise<Object>} - 분석 결과
 */
export const getBattleAnalytics = async (timeRange = 7) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);

    const battlesRef = collection(db, "battles");
    const q = query(
      battlesRef,
      where("createdAt", ">=", cutoffDate),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const battles = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    }));

    // 📊 종합 통계 계산
    const analytics = {
      summary: {
        totalBattles: battles.length,
        ongoingBattles: battles.filter((b) => b.status === "ongoing").length,
        endedBattles: battles.filter((b) => b.status === "ended").length,
        totalVotes: battles.reduce((sum, b) => sum + (b.totalVotes || 0), 0),
        totalViews: battles.reduce((sum, b) => sum + (b.viewCount || 0), 0),
        totalComments: battles.reduce(
          (sum, b) => sum + (b.commentCount || 0),
          0
        ),
        totalLikes: battles.reduce((sum, b) => sum + (b.likeCount || 0), 0),
        uniqueParticipants: calculateUniqueParticipants(battles),
        smartMatchedBattles: battles.filter(
          (b) => b.matchingMethod === "smart_algorithm"
        ).length,
      },

      averages: calculateAverages(battles),
      categoryStats: analyzeCategoryPerformance(battles),
      timelineAnalysis: analyzeTimelineActivity(battles),
      topPerformers: analyzeTopPerformers(battles),
      trendingData: analyzeTrendingBattles(battles),
      weeklyData: generateWeeklyData(battles, timeRange),
    };

    return { success: true, analytics };
  } catch (error) {
    console.error("Analytics retrieval failed:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 고유 참여자 수 계산
 */
const calculateUniqueParticipants = (battles) => {
  const allParticipants = new Set();
  battles.forEach((battle) => {
    (battle.participants || []).forEach((uid) => allParticipants.add(uid));
  });
  return allParticipants.size;
};

/**
 * 평균 지표 계산
 */
const calculateAverages = (battles) => {
  const averages = {
    votesPerBattle: 0,
    viewsPerBattle: 0,
    commentsPerBattle: 0,
    engagementRate: 0,
    battleDuration: 0,
  };

  if (battles.length > 0) {
    const totalVotes = battles.reduce((sum, b) => sum + (b.totalVotes || 0), 0);
    const totalViews = battles.reduce((sum, b) => sum + (b.viewCount || 0), 0);
    const totalComments = battles.reduce(
      (sum, b) => sum + (b.commentCount || 0),
      0
    );

    averages.votesPerBattle = Math.round(totalVotes / battles.length);
    averages.viewsPerBattle = Math.round(totalViews / battles.length);
    averages.commentsPerBattle = Math.round(totalComments / battles.length);

    // 참여율 평균
    const validEngagementRates = battles
      .map((b) => b.metrics?.engagementRate)
      .filter((rate) => rate !== undefined && rate !== null && rate > 0);

    if (validEngagementRates.length > 0) {
      averages.engagementRate =
        validEngagementRates.reduce((sum, rate) => sum + rate, 0) /
        validEngagementRates.length;
    }

    // 평균 배틀 지속 시간
    const endedBattles = battles.filter(
      (b) => b.status === "ended" && b.finalStats?.duration?.actual
    );
    if (endedBattles.length > 0) {
      const totalDuration = endedBattles.reduce(
        (sum, b) => sum + b.finalStats.duration.actual,
        0
      );
      averages.battleDuration = totalDuration / endedBattles.length;
    }
  }

  return averages;
};

/**
 * 카테고리별 성과 분석
 */
const analyzeCategoryPerformance = (battles) => {
  const categoryStats = {};

  battles.forEach((battle) => {
    const category = battle.category || "unknown";
    if (!categoryStats[category]) {
      categoryStats[category] = {
        count: 0,
        totalVotes: 0,
        totalViews: 0,
        totalComments: 0,
        totalLikes: 0,
        avgEngagement: 0,
        avgMatchingScore: 0,
        topBattle: null,
      };
    }

    const stats = categoryStats[category];
    stats.count += 1;
    stats.totalVotes += battle.totalVotes || 0;
    stats.totalViews += battle.viewCount || 0;
    stats.totalComments += battle.commentCount || 0;
    stats.totalLikes += battle.likeCount || 0;

    // 가장 성공적인 배틀 추적
    const battleScore =
      (battle.totalVotes || 0) +
      (battle.viewCount || 0) * 0.1 +
      (battle.commentCount || 0) * 2;
    if (!stats.topBattle || battleScore > stats.topBattle.score) {
      stats.topBattle = {
        id: battle.id,
        title: battle.title,
        score: battleScore,
        votes: battle.totalVotes || 0,
        views: battle.viewCount || 0,
      };
    }
  });

  // 카테고리별 평균 계산
  Object.keys(categoryStats).forEach((category) => {
    const stats = categoryStats[category];
    if (stats.count > 0) {
      stats.avgVotes = Math.round(stats.totalVotes / stats.count);
      stats.avgViews = Math.round(stats.totalViews / stats.count);
      stats.avgComments = Math.round(stats.totalComments / stats.count);
      stats.avgLikes = Math.round(stats.totalLikes / stats.count);

      if (stats.totalViews > 0) {
        stats.avgEngagement = stats.totalVotes / stats.totalViews;
      }
    }
  });

  return categoryStats;
};

/**
 * 시간대별 활동 분석
 */
const analyzeTimelineActivity = (battles) => {
  const hourlyActivity = {};
  const dailyActivity = {};

  // 24시간 초기화
  for (let i = 0; i < 24; i++) {
    hourlyActivity[i] = 0;
  }

  battles.forEach((battle) => {
    // 시간별 생성 패턴
    const hour = battle.createdAt.getHours();
    hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;

    // 일별 활동 패턴
    const date = battle.createdAt.toISOString().split("T")[0];
    if (!dailyActivity[date]) {
      dailyActivity[date] = {
        battlesCreated: 0,
        totalVotes: 0,
        totalViews: 0,
        totalComments: 0,
      };
    }

    dailyActivity[date].battlesCreated += 1;
    dailyActivity[date].totalVotes += battle.totalVotes || 0;
    dailyActivity[date].totalViews += battle.viewCount || 0;
    dailyActivity[date].totalComments += battle.commentCount || 0;

    // 일별 투표 추이 분석
    if (battle.dailyVotes) {
      Object.entries(battle.dailyVotes).forEach(([voteDate, voteData]) => {
        if (!dailyActivity[voteDate]) {
          dailyActivity[voteDate] = {
            battlesCreated: 0,
            totalVotes: 0,
            totalViews: 0,
            totalComments: 0,
          };
        }
        dailyActivity[voteDate].totalVotes += voteData.total || 0;
      });
    }
  });

  // 가장 활발한 시간대 찾기
  const peakHour = Object.entries(hourlyActivity).sort(
    ([, a], [, b]) => b - a
  )[0];

  return {
    hourlyActivity,
    dailyActivity,
    peakHour: peakHour
      ? {
          hour: parseInt(peakHour[0]),
          battlesCreated: peakHour[1],
        }
      : null,
    totalActiveDays: Object.keys(dailyActivity).length,
  };
};

/**
 * 인기 배틀 및 크리에이터 분석
 */
const analyzeTopPerformers = (battles) => {
  // 인기 배틀 (참여율 기준)
  const topBattlesByEngagement = battles
    .filter((b) => b.metrics?.engagementRate > 0)
    .sort(
      (a, b) =>
        (b.metrics?.engagementRate || 0) - (a.metrics?.engagementRate || 0)
    )
    .slice(0, 10)
    .map((b) => ({
      id: b.id,
      title: b.title,
      category: b.category,
      totalVotes: b.totalVotes || 0,
      viewCount: b.viewCount || 0,
      engagementRate: b.metrics?.engagementRate || 0,
      trendingScore: b.trendingScore || 0,
      createdAt: b.createdAt,
    }));

  // 인기 배틀 (총 투표수 기준)
  const topBattlesByVotes = battles
    .sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0))
    .slice(0, 10)
    .map((b) => ({
      id: b.id,
      title: b.title,
      category: b.category,
      totalVotes: b.totalVotes || 0,
      viewCount: b.viewCount || 0,
      createdAt: b.createdAt,
    }));

  // 크리에이터 성과 분석
  const creatorStats = {};
  battles.forEach((battle) => {
    const creatorId = battle.creatorId;
    const creatorName = battle.creatorName;

    if (!creatorStats[creatorId]) {
      creatorStats[creatorId] = {
        name: creatorName,
        battlesCreated: 0,
        totalVotes: 0,
        totalViews: 0,
        totalComments: 0,
        avgEngagement: 0,
        bestBattle: null,
      };
    }

    const stats = creatorStats[creatorId];
    stats.battlesCreated += 1;
    stats.totalVotes += battle.totalVotes || 0;
    stats.totalViews += battle.viewCount || 0;
    stats.totalComments += battle.commentCount || 0;

    // 크리에이터의 최고 성과 배틀
    const battleScore =
      (battle.totalVotes || 0) + (battle.viewCount || 0) * 0.1;
    if (!stats.bestBattle || battleScore > stats.bestBattle.score) {
      stats.bestBattle = {
        id: battle.id,
        title: battle.title,
        score: battleScore,
        votes: battle.totalVotes || 0,
      };
    }
  });

  // 크리에이터별 평균 참여율 계산
  Object.keys(creatorStats).forEach((creatorId) => {
    const stats = creatorStats[creatorId];
    if (stats.totalViews > 0) {
      stats.avgEngagement = stats.totalVotes / stats.totalViews;
    }
  });

  // 상위 크리에이터 (평균 참여율 기준)
  const topCreators = Object.values(creatorStats)
    .filter((c) => c.battlesCreated >= 2) // 최소 2개 이상 배틀 생성
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 10);

  return {
    topBattlesByEngagement,
    topBattlesByVotes,
    topCreators,
    totalCreators: Object.keys(creatorStats).length,
  };
};

/**
 * 트렌딩 배틀 분석
 */
const analyzeTrendingBattles = (battles) => {
  // 현재 트렌딩 배틀 (트렌딩 점수 기준)
  const trendingBattles = battles
    .filter((b) => b.trendingScore > 0 && b.status === "ongoing")
    .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
    .slice(0, 5)
    .map((b) => ({
      id: b.id,
      title: b.title,
      category: b.category,
      trendingScore: b.trendingScore || 0,
      totalVotes: b.totalVotes || 0,
      viewCount: b.viewCount || 0,
      recentActivity: calculateRecentActivity(b),
    }));

  // 급상승 배틀 (최근 24시간 활동 기준)
  const risingBattles = battles
    .filter((b) => b.status === "ongoing")
    .map((b) => ({
      ...b,
      recentActivity: calculateRecentActivity(b),
    }))
    .filter((b) => b.recentActivity.growth > 1.5) // 50% 이상 증가
    .sort((a, b) => b.recentActivity.growth - a.recentActivity.growth)
    .slice(0, 5)
    .map((b) => ({
      id: b.id,
      title: b.title,
      category: b.category,
      growth: b.recentActivity.growth,
      recentVotes: b.recentActivity.recentVotes,
    }));

  return {
    trendingBattles,
    risingBattles,
    averageTrendingScore:
      trendingBattles.length > 0
        ? trendingBattles.reduce((sum, b) => sum + b.trendingScore, 0) /
          trendingBattles.length
        : 0,
  };
};

/**
 * 최근 활동 계산
 */
const calculateRecentActivity = (battle) => {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const todayVotes = battle.dailyVotes?.[today]?.total || 0;
  const yesterdayVotes = battle.dailyVotes?.[yesterday]?.total || 0;

  const growth = yesterdayVotes > 0 ? todayVotes / yesterdayVotes : 1;

  return {
    recentVotes: todayVotes,
    growth: growth,
    trend: growth > 1.2 ? "rising" : growth < 0.8 ? "falling" : "stable",
  };
};

/**
 * 주간 데이터 생성
 */
const generateWeeklyData = (battles, timeRange) => {
  const weeklyData = [];

  for (let i = timeRange - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const dayBattles = battles.filter((b) => {
      const battleDate = b.createdAt.toISOString().split("T")[0];
      return battleDate === dateStr;
    });

    // 해당 날짜의 총 투표수 계산
    const dayVotes = battles.reduce((sum, b) => {
      const dailyVotes = b.dailyVotes?.[dateStr];
      return sum + (dailyVotes?.total || 0);
    }, 0);

    const dayViews = dayBattles.reduce((sum, b) => sum + (b.viewCount || 0), 0);
    const dayComments = dayBattles.reduce(
      (sum, b) => sum + (b.commentCount || 0),
      0
    );

    weeklyData.push({
      date: dateStr,
      battlesCreated: dayBattles.length,
      totalVotes: dayVotes,
      totalViews: dayViews,
      totalComments: dayComments,
      avgEngagement: dayViews > 0 ? dayVotes / dayViews : 0,
    });
  }

  return weeklyData;
};

export default {
  getBattleAnalytics,
};
