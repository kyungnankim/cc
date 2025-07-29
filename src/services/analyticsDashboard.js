// src/services/analyticsDashboard.js - 대시보드 및 실시간 통계

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * 실시간 대시보드용 요약 통계
 */
export const getDashboardStats = async () => {
  try {
    // 최근 24시간 데이터
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const battlesRef = collection(db, "battles");
    const recentQuery = query(
      battlesRef,
      where("createdAt", ">=", last24Hours),
      orderBy("createdAt", "desc")
    );

    const allQuery = query(
      battlesRef,
      orderBy("createdAt", "desc"),
      limit(100)
    );

    const [recentSnapshot, allSnapshot] = await Promise.all([
      getDocs(recentQuery),
      getDocs(allQuery),
    ]);

    const recentBattles = recentSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    }));

    const allBattles = allSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    }));

    // 실시간 통계 계산
    const stats = {
      overview: {
        totalBattles: allBattles.length,
        activeBattles: allBattles.filter((b) => b.status === "ongoing").length,
        last24hBattles: recentBattles.length,
        totalVotes: allBattles.reduce((sum, b) => sum + (b.totalVotes || 0), 0),
        totalViews: allBattles.reduce((sum, b) => sum + (b.viewCount || 0), 0),
        avgEngagement: 0,
      },

      trending: {
        hotBattles: allBattles
          .filter((b) => b.status === "ongoing" && b.trendingScore > 0)
          .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
          .slice(0, 3)
          .map((b) => ({
            id: b.id,
            title: b.title,
            trendingScore: b.trendingScore,
            totalVotes: b.totalVotes || 0,
          })),

        risingBattles: allBattles
          .filter((b) => b.status === "ongoing")
          .map((b) => ({
            ...b,
            recentGrowth: calculateRecentGrowth(b),
          }))
          .filter((b) => b.recentGrowth > 1.5)
          .sort((a, b) => b.recentGrowth - a.recentGrowth)
          .slice(0, 3)
          .map((b) => ({
            id: b.id,
            title: b.title,
            growth: b.recentGrowth,
          })),
      },

      categories: {},
      recentActivity: calculateRecentActivity24h(recentBattles),
    };

    // 평균 참여율 계산
    if (stats.overview.totalViews > 0) {
      stats.overview.avgEngagement =
        stats.overview.totalVotes / stats.overview.totalViews;
    }

    // 카테고리별 통계
    const categoryData = {};
    allBattles.forEach((battle) => {
      const category = battle.category || "unknown";
      if (!categoryData[category]) {
        categoryData[category] = { count: 0, votes: 0, views: 0 };
      }
      categoryData[category].count += 1;
      categoryData[category].votes += battle.totalVotes || 0;
      categoryData[category].views += battle.viewCount || 0;
    });

    stats.categories = categoryData;

    return { success: true, stats };
  } catch (error) {
    console.error("Dashboard stats failed:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 최근 성장률 계산
 */
const calculateRecentGrowth = (battle) => {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const todayVotes = battle.dailyVotes?.[today]?.total || 0;
  const yesterdayVotes = battle.dailyVotes?.[yesterday]?.total || 0;

  return yesterdayVotes > 0 ? todayVotes / yesterdayVotes : 1;
};

/**
 * 최근 24시간 활동 계산
 */
const calculateRecentActivity24h = (recentBattles) => {
  const hourlyData = {};

  // 지난 24시간의 시간별 데이터 초기화
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(Date.now() - i * 60 * 60 * 1000);
    const hourKey = hour.getHours();
    hourlyData[hourKey] = {
      battlesCreated: 0,
      totalVotes: 0,
      totalViews: 0,
    };
  }

  // 실제 데이터 집계
  recentBattles.forEach((battle) => {
    const hour = battle.createdAt.getHours();
    if (hourlyData[hour]) {
      hourlyData[hour].battlesCreated += 1;
      hourlyData[hour].totalVotes += battle.totalVotes || 0;
      hourlyData[hour].totalViews += battle.viewCount || 0;
    }
  });

  return hourlyData;
};

/**
 * 카테고리별 성과 비교
 */
export const getCategoryComparison = async (timeRange = 30) => {
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

    const categoryStats = {};

    battles.forEach((battle) => {
      const category = battle.category || "unknown";
      if (!categoryStats[category]) {
        categoryStats[category] = {
          totalBattles: 0,
          totalVotes: 0,
          totalViews: 0,
          totalComments: 0,
          totalLikes: 0,
          avgEngagement: 0,
          avgDuration: 0,
          winRates: {},
          topCreators: {},
        };
      }

      const stats = categoryStats[category];
      stats.totalBattles += 1;
      stats.totalVotes += battle.totalVotes || 0;
      stats.totalViews += battle.viewCount || 0;
      stats.totalComments += battle.commentCount || 0;
      stats.totalLikes += battle.likeCount || 0;

      // 크리에이터별 통계
      const creatorId = battle.creatorId;
      if (!stats.topCreators[creatorId]) {
        stats.topCreators[creatorId] = {
          name: battle.creatorName,
          battles: 0,
          votes: 0,
          wins: 0,
        };
      }
      stats.topCreators[creatorId].battles += 1;
      stats.topCreators[creatorId].votes += battle.totalVotes || 0;

      // 승률 계산 (종료된 배틀만)
      if (battle.status === "ended" && battle.finalResult) {
        if (battle.finalResult.winner !== "tie") {
          stats.topCreators[creatorId].wins += 1;
        }
      }
    });

    // 카테고리별 평균 및 순위 계산
    Object.keys(categoryStats).forEach((category) => {
      const stats = categoryStats[category];

      // 평균 계산
      if (stats.totalBattles > 0) {
        stats.avgVotes = Math.round(stats.totalVotes / stats.totalBattles);
        stats.avgViews = Math.round(stats.totalViews / stats.totalBattles);
        stats.avgComments = Math.round(
          stats.totalComments / stats.totalBattles
        );
        stats.avgLikes = Math.round(stats.totalLikes / stats.totalBattles);

        if (stats.totalViews > 0) {
          stats.avgEngagement = stats.totalVotes / stats.totalViews;
        }
      }

      // 상위 크리에이터 정리
      stats.topCreators = Object.values(stats.topCreators)
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 5)
        .map((creator) => ({
          ...creator,
          winRate:
            creator.battles > 0 ? (creator.wins / creator.battles) * 100 : 0,
        }));
    });

    return { success: true, categoryStats };
  } catch (error) {
    console.error("Category comparison failed:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 사용자 참여 패턴 분석
 */
export const getUserEngagementPatterns = async (timeRange = 7) => {
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

    // 시간대별 활동 패턴
    const hourlyEngagement = {};
    const dailyEngagement = {};
    const userRetention = new Set();

    for (let i = 0; i < 24; i++) {
      hourlyEngagement[i] = { votes: 0, views: 0, comments: 0 };
    }

    battles.forEach((battle) => {
      // 시간대별 분석
      if (battle.hourlyStats) {
        Object.entries(battle.hourlyStats).forEach(([timeKey, data]) => {
          const hour = parseInt(timeKey.split("-")[3]);
          if (hour >= 0 && hour < 24) {
            hourlyEngagement[hour].votes += data.total || 0;
          }
        });
      }

      // 일별 분석
      if (battle.dailyVotes) {
        Object.entries(battle.dailyVotes).forEach(([date, data]) => {
          if (!dailyEngagement[date]) {
            dailyEngagement[date] = {
              votes: 0,
              battles: 0,
              uniqueUsers: new Set(),
            };
          }
          dailyEngagement[date].votes += data.total || 0;
          dailyEngagement[date].battles += 1;
        });
      }

      // 사용자 활동 추적
      if (battle.participants) {
        battle.participants.forEach((userId) => userRetention.add(userId));
      }
    });

    // 피크 시간대 찾기
    const peakHour = Object.entries(hourlyEngagement).sort(
      ([, a], [, b]) => b.votes - a.votes
    )[0];

    // 가장 활발한 날 찾기
    const peakDay = Object.entries(dailyEngagement).sort(
      ([, a], [, b]) => b.votes - a.votes
    )[0];

    const patterns = {
      hourlyEngagement,
      dailyEngagement,
      peakHour: peakHour
        ? {
            hour: parseInt(peakHour[0]),
            votes: peakHour[1].votes,
          }
        : null,
      peakDay: peakDay
        ? {
            date: peakDay[0],
            votes: peakDay[1].votes,
            battles: peakDay[1].battles,
          }
        : null,
      totalActiveUsers: userRetention.size,
      avgDailyUsers: Math.round(userRetention.size / timeRange),
    };

    return { success: true, patterns };
  } catch (error) {
    console.error("User engagement patterns failed:", error);
    return { success: false, error: error.message };
  }
};

export default {
  getDashboardStats,
  getCategoryComparison,
  getUserEngagementPatterns,
};
