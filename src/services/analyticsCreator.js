// src/services/analyticsCreator.js - 크리에이터 분석

import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * 크리에이터 성과 분석
 */
export const getCreatorAnalytics = async (creatorId) => {
  try {
    const battlesRef = collection(db, "battles");
    const q = query(
      battlesRef,
      where("creatorId", "==", creatorId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const creatorBattles = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    }));

    const analytics = {
      summary: {
        totalBattles: creatorBattles.length,
        totalVotes: creatorBattles.reduce(
          (sum, b) => sum + (b.totalVotes || 0),
          0
        ),
        totalViews: creatorBattles.reduce(
          (sum, b) => sum + (b.viewCount || 0),
          0
        ),
        totalComments: creatorBattles.reduce(
          (sum, b) => sum + (b.commentCount || 0),
          0
        ),
        totalLikes: creatorBattles.reduce(
          (sum, b) => sum + (b.likeCount || 0),
          0
        ),
        avgEngagement: 0,
        bestPerformingBattle: null,
        winRate: 0,
        averageVotesPerBattle: 0,
        averageViewsPerBattle: 0,
      },

      recentBattles: creatorBattles.slice(0, 5),
      categoryPreference: {},
      performanceTrend: calculatePerformanceTrend(creatorBattles),
      monthlyStats: calculateMonthlyStats(creatorBattles),
      competitorComparison: null, // 추후 구현
    };

    // 기본 통계 계산
    if (creatorBattles.length > 0) {
      analytics.summary.averageVotesPerBattle = Math.round(
        analytics.summary.totalVotes / creatorBattles.length
      );
      analytics.summary.averageViewsPerBattle = Math.round(
        analytics.summary.totalViews / creatorBattles.length
      );
    }

    // 평균 참여율 계산
    if (analytics.summary.totalViews > 0) {
      analytics.summary.avgEngagement =
        analytics.summary.totalVotes / analytics.summary.totalViews;
    }

    // 최고 성과 배틀 찾기
    let bestScore = 0;
    creatorBattles.forEach((battle) => {
      const score =
        (battle.totalVotes || 0) +
        (battle.viewCount || 0) * 0.1 +
        (battle.commentCount || 0) * 2;
      if (score > bestScore) {
        bestScore = score;
        analytics.summary.bestPerformingBattle = {
          id: battle.id,
          title: battle.title,
          votes: battle.totalVotes || 0,
          views: battle.viewCount || 0,
          comments: battle.commentCount || 0,
          score: score,
        };
      }
    });

    // 승률 계산 (종료된 배틀 중에서)
    const endedBattles = creatorBattles.filter(
      (b) => b.status === "ended" && b.finalResult
    );
    if (endedBattles.length > 0) {
      const wins = endedBattles.filter(
        (b) =>
          b.finalResult.winner !== "tie" &&
          ((b.finalResult.winner === "itemA" &&
            b.itemA.creatorId === creatorId) ||
            (b.finalResult.winner === "itemB" &&
              b.itemB.creatorId === creatorId))
      ).length;
      analytics.summary.winRate = Math.round(
        (wins / endedBattles.length) * 100
      );
    }

    // 카테고리 선호도
    creatorBattles.forEach((battle) => {
      const category = battle.category || "unknown";
      analytics.categoryPreference[category] =
        (analytics.categoryPreference[category] || 0) + 1;
    });

    return { success: true, analytics };
  } catch (error) {
    console.error("Creator analytics failed:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 크리에이터 성과 트렌드 계산
 */
const calculatePerformanceTrend = (battles) => {
  if (battles.length < 4) return { trend: "insufficient_data", data: [] };

  // 최근 배틀들을 4개씩 그룹으로 나누어 트렌드 분석
  const groupSize = Math.max(2, Math.floor(battles.length / 4));
  const groups = [];

  for (let i = 0; i < battles.length; i += groupSize) {
    const group = battles.slice(i, i + groupSize);
    const avgVotes =
      group.reduce((sum, b) => sum + (b.totalVotes || 0), 0) / group.length;
    const avgViews =
      group.reduce((sum, b) => sum + (b.viewCount || 0), 0) / group.length;
    const avgEngagement = avgViews > 0 ? avgVotes / avgViews : 0;

    groups.push({
      period: `그룹 ${groups.length + 1}`,
      battles: group.length,
      avgVotes: Math.round(avgVotes),
      avgViews: Math.round(avgViews),
      avgEngagement: Math.round(avgEngagement * 1000) / 1000,
    });
  }

  // 트렌드 방향 결정
  if (groups.length >= 2) {
    const first = groups[0];
    const last = groups[groups.length - 1];

    let trend = "stable";
    const engagementChange =
      first.avgEngagement > 0
        ? ((last.avgEngagement - first.avgEngagement) / first.avgEngagement) *
          100
        : 0;

    if (engagementChange > 10) trend = "improving";
    else if (engagementChange < -10) trend = "declining";

    return { trend, data: groups, change: Math.round(engagementChange) };
  }

  return { trend: "stable", data: groups };
};

/**
 * 월별 통계 계산
 */
const calculateMonthlyStats = (battles) => {
  const monthlyData = {};
  const now = new Date();

  // 최근 6개월 데이터 초기화
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    monthlyData[monthKey] = {
      battles: 0,
      votes: 0,
      views: 0,
      comments: 0,
      likes: 0,
      avgEngagement: 0,
    };
  }

  // 실제 데이터 집계
  battles.forEach((battle) => {
    const date = new Date(battle.createdAt);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    if (monthlyData[monthKey]) {
      monthlyData[monthKey].battles += 1;
      monthlyData[monthKey].votes += battle.totalVotes || 0;
      monthlyData[monthKey].views += battle.viewCount || 0;
      monthlyData[monthKey].comments += battle.commentCount || 0;
      monthlyData[monthKey].likes += battle.likeCount || 0;
    }
  });

  // 월별 평균 참여율 계산
  Object.keys(monthlyData).forEach((month) => {
    const data = monthlyData[month];
    if (data.views > 0) {
      data.avgEngagement = data.votes / data.views;
    }
  });

  return monthlyData;
};

/**
 * 크리에이터 순위 조회
 */
export const getCreatorRankings = async (timeRange = 30, category = null) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);

    const battlesRef = collection(db, "battles");
    let q = query(
      battlesRef,
      where("createdAt", ">=", cutoffDate),
      orderBy("createdAt", "desc")
    );

    if (category) {
      q = query(
        battlesRef,
        where("createdAt", ">=", cutoffDate),
        where("category", "==", category),
        orderBy("createdAt", "desc")
      );
    }

    const querySnapshot = await getDocs(q);
    const battles = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    }));

    // 크리에이터별 성과 집계
    const creatorStats = {};

    battles.forEach((battle) => {
      const creatorId = battle.creatorId;
      const creatorName = battle.creatorName;

      if (!creatorStats[creatorId]) {
        creatorStats[creatorId] = {
          id: creatorId,
          name: creatorName,
          battles: 0,
          totalVotes: 0,
          totalViews: 0,
          totalComments: 0,
          totalLikes: 0,
          wins: 0,
          avgEngagement: 0,
          winRate: 0,
          trendingBattles: 0,
        };
      }

      const stats = creatorStats[creatorId];
      stats.battles += 1;
      stats.totalVotes += battle.totalVotes || 0;
      stats.totalViews += battle.viewCount || 0;
      stats.totalComments += battle.commentCount || 0;
      stats.totalLikes += battle.likeCount || 0;

      // 트렌딩 배틀 카운트
      if (battle.trendingScore > 50) {
        stats.trendingBattles += 1;
      }

      // 승리 카운트 (종료된 배틀만)
      if (battle.status === "ended" && battle.finalResult) {
        if (
          battle.finalResult.winner !== "tie" &&
          ((battle.finalResult.winner === "itemA" &&
            battle.itemA.creatorId === creatorId) ||
            (battle.finalResult.winner === "itemB" &&
              battle.itemB.creatorId === creatorId))
        ) {
          stats.wins += 1;
        }
      }
    });

    // 크리에이터별 평균 및 승률 계산
    const creatorRankings = Object.values(creatorStats).map((creator) => {
      if (creator.totalViews > 0) {
        creator.avgEngagement = creator.totalVotes / creator.totalViews;
      }

      if (creator.battles > 0) {
        creator.winRate = (creator.wins / creator.battles) * 100;
        creator.avgVotesPerBattle = Math.round(
          creator.totalVotes / creator.battles
        );
        creator.avgViewsPerBattle = Math.round(
          creator.totalViews / creator.battles
        );
      }

      return creator;
    });

    // 다양한 기준으로 순위 생성
    const rankings = {
      byEngagement: [...creatorRankings]
        .filter((c) => c.battles >= 3) // 최소 3개 배틀
        .sort((a, b) => b.avgEngagement - a.avgEngagement)
        .slice(0, 10),

      byVotes: [...creatorRankings]
        .sort((a, b) => b.totalVotes - a.totalVotes)
        .slice(0, 10),

      byWinRate: [...creatorRankings]
        .filter((c) => c.battles >= 5) // 최소 5개 배틀
        .sort((a, b) => b.winRate - a.winRate)
        .slice(0, 10),

      byActivity: [...creatorRankings]
        .sort((a, b) => b.battles - a.battles)
        .slice(0, 10),

      trending: [...creatorRankings]
        .filter((c) => c.trendingBattles > 0)
        .sort((a, b) => b.trendingBattles - a.trendingBattles)
        .slice(0, 10),
    };

    return { success: true, rankings };
  } catch (error) {
    console.error("Creator rankings failed:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 크리에이터 비교 분석
 */
export const compareCreators = async (creatorIds) => {
  try {
    if (!Array.isArray(creatorIds) || creatorIds.length < 2) {
      return { success: false, error: "최소 2명의 크리에이터가 필요합니다." };
    }

    const comparisons = {};

    // 각 크리에이터의 분석 데이터 수집
    for (const creatorId of creatorIds) {
      const result = await getCreatorAnalytics(creatorId);
      if (result.success) {
        comparisons[creatorId] = result.analytics;
      }
    }

    // 비교 메트릭 계산
    const metrics = [
      "totalBattles",
      "totalVotes",
      "totalViews",
      "avgEngagement",
      "winRate",
      "averageVotesPerBattle",
    ];

    const comparison = {
      creators: comparisons,
      rankings: {},
      insights: [],
    };

    // 각 메트릭별 순위 계산
    metrics.forEach((metric) => {
      const sorted = Object.entries(comparisons)
        .map(([id, data]) => ({
          creatorId: id,
          name: data.recentBattles[0]?.creatorName || "Unknown",
          value: data.summary[metric] || 0,
        }))
        .sort((a, b) => b.value - a.value);

      comparison.rankings[metric] = sorted;
    });

    // 인사이트 생성
    const topByEngagement = comparison.rankings.avgEngagement[0];
    const topByVotes = comparison.rankings.totalVotes[0];
    const topByWinRate = comparison.rankings.winRate[0];

    comparison.insights.push({
      type: "engagement_leader",
      message: `${
        topByEngagement.name
      }님이 가장 높은 참여율을 보이고 있습니다 (${Math.round(
        topByEngagement.value * 100
      )}%)`,
    });

    comparison.insights.push({
      type: "popularity_leader",
      message: `${topByVotes.name}님이 가장 많은 투표를 받았습니다 (${topByVotes.value}표)`,
    });

    if (topByWinRate.value > 0) {
      comparison.insights.push({
        type: "win_rate_leader",
        message: `${
          topByWinRate.name
        }님이 가장 높은 승률을 기록했습니다 (${Math.round(
          topByWinRate.value
        )}%)`,
      });
    }

    return { success: true, comparison };
  } catch (error) {
    console.error("Creator comparison failed:", error);
    return { success: false, error: error.message };
  }
};

export default {
  getCreatorAnalytics,
  getCreatorRankings,
  compareCreators,
};
