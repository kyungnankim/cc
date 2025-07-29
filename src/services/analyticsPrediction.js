// src/services/analyticsPrediction.js - 예측 및 AI 분석

import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { getCreatorAnalytics } from "./analyticsCreator";
import { getCategoryComparison } from "./analyticsDashboard";

/**
 * 배틀 성공 예측 모델
 */
export const predictBattleSuccess = async (battleData) => {
  try {
    // 예측 점수 계산을 위한 가중치
    const weights = {
      categoryPopularity: 0.2,
      creatorHistory: 0.25,
      contentQuality: 0.2,
      timingFactor: 0.15,
      matchingScore: 0.2,
    };

    let predictionScore = 0;
    const factors = {};

    // 1. 카테고리 인기도
    const categoryScore = await getCategoryPopularityScore(battleData.category);
    factors.categoryPopularity = categoryScore;
    predictionScore += categoryScore * weights.categoryPopularity;

    // 2. 크리에이터 이력
    const creatorScore = await getCreatorHistoryScore(battleData.creatorId);
    factors.creatorHistory = creatorScore;
    predictionScore += creatorScore * weights.creatorHistory;

    // 3. 콘텐츠 품질 (제목 길이, 이미지 품질 등)
    const contentScore = calculateContentQualityScore(battleData);
    factors.contentQuality = contentScore;
    predictionScore += contentScore * weights.contentQuality;

    // 4. 타이밍 요소 (시간대, 요일 등)
    const timingScore = calculateTimingScore(battleData.createdAt);
    factors.timingFactor = timingScore;
    predictionScore += timingScore * weights.timingFactor;

    // 5. 매칭 점수
    const matchingScore = (battleData.matchingScore || 50) / 100;
    factors.matchingScore = matchingScore;
    predictionScore += matchingScore * weights.matchingScore;

    // 최종 예측
    const finalScore = Math.round(predictionScore * 100);

    let prediction = "보통";
    let confidence = "medium";

    if (finalScore >= 75) {
      prediction = "높은 성공 가능성";
      confidence = "high";
    } else if (finalScore >= 60) {
      prediction = "성공 가능성 있음";
      confidence = "medium";
    } else if (finalScore >= 40) {
      prediction = "보통 수준";
      confidence = "medium";
    } else {
      prediction = "저조할 가능성";
      confidence = "low";
    }

    return {
      success: true,
      prediction: {
        score: finalScore,
        prediction,
        confidence,
        factors,
        recommendations: generateRecommendations(factors),
      },
    };
  } catch (error) {
    console.error("Battle success prediction failed:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 카테고리 인기도 점수 계산
 */
const getCategoryPopularityScore = async (category) => {
  try {
    // 최근 30일간 카테고리별 성과 조회
    const result = await getCategoryComparison(30);
    if (!result.success) return 0.5;

    const categoryStats = result.categoryStats[category];
    if (!categoryStats) return 0.5;

    // 전체 평균 대비 해당 카테고리 성과
    const allCategories = Object.values(result.categoryStats);
    const avgEngagement =
      allCategories.reduce((sum, cat) => sum + cat.avgEngagement, 0) /
      allCategories.length;

    return Math.min(1, categoryStats.avgEngagement / avgEngagement);
  } catch (error) {
    return 0.5; // 기본값
  }
};

/**
 * 크리에이터 이력 점수 계산
 */
const getCreatorHistoryScore = async (creatorId) => {
  try {
    const result = await getCreatorAnalytics(creatorId);
    if (!result.success) return 0.5;

    const { summary } = result.analytics;

    // 크리에이터 성과 지표들을 종합
    let score = 0.5; // 기본 점수

    // 배틀 경험
    if (summary.totalBattles > 5) score += 0.1;
    if (summary.totalBattles > 10) score += 0.1;

    // 평균 참여율
    if (summary.avgEngagement > 0.1) score += 0.1;
    if (summary.avgEngagement > 0.2) score += 0.1;

    // 승률
    if (summary.winRate > 50) score += 0.1;

    return Math.min(1, score);
  } catch (error) {
    return 0.5; // 기본값
  }
};

/**
 * 콘텐츠 품질 점수 계산
 */
const calculateContentQualityScore = (battleData) => {
  let score = 0.5; // 기본 점수

  // 제목 품질 (길이, 특수문자 등)
  const titleLength = battleData.title.length;
  if (titleLength >= 10 && titleLength <= 50) score += 0.1;
  if (!battleData.title.includes("vs")) score -= 0.1; // VS 배틀 제목 형식

  // 설명 유무
  if (battleData.description && battleData.description.length > 10)
    score += 0.1;

  // 태그 유무
  if (battleData.tags && battleData.tags.length > 0) score += 0.1;

  // 이미지 품질 (URL 유효성 등)
  if (battleData.itemA?.imageUrl && battleData.itemB?.imageUrl) score += 0.2;

  return Math.min(1, score);
};

/**
 * 타이밍 점수 계산
 */
const calculateTimingScore = (createdAt) => {
  const date = new Date(createdAt);
  const hour = date.getHours();
  const dayOfWeek = date.getDay();

  let score = 0.5; // 기본 점수

  // 시간대 (저녁 시간대가 높은 점수)
  if (hour >= 18 && hour <= 22) score += 0.2;
  else if (hour >= 12 && hour <= 17) score += 0.1;
  else if (hour >= 6 && hour <= 11) score += 0.05;

  // 요일 (주말이 높은 점수)
  if (dayOfWeek === 0 || dayOfWeek === 6) score += 0.2; // 일요일, 토요일
  else if (dayOfWeek >= 1 && dayOfWeek <= 5) score += 0.1; // 평일

  return Math.min(1, score);
};

/**
 * 개선 추천사항 생성
 */
const generateRecommendations = (factors) => {
  const recommendations = [];

  if (factors.categoryPopularity < 0.6) {
    recommendations.push("인기 카테고리 선택을 고려해보세요");
  }

  if (factors.creatorHistory < 0.6) {
    recommendations.push("더 많은 배틀 경험을 쌓아보세요");
  }

  if (factors.contentQuality < 0.6) {
    recommendations.push("제목과 설명을 더 매력적으로 작성해보세요");
  }

  if (factors.timingFactor < 0.6) {
    recommendations.push("저녁 시간대(18-22시) 또는 주말에 업로드해보세요");
  }

  if (factors.matchingScore < 0.6) {
    recommendations.push("더 나은 매칭을 위해 콘텐츠 품질을 높여보세요");
  }

  return recommendations;
};

/**
 * 트렌드 예측 분석
 */
export const predictTrends = async (timeRange = 30) => {
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

    // 카테고리별 트렌드 분석
    const categoryTrends = analyzeCategoryTrends(battles);

    // 시간대별 트렌드 분석
    const timeTrends = analyzeTimeTrends(battles);

    // 참여도 트렌드 분석
    const engagementTrends = analyzeEngagementTrends(battles);

    return {
      success: true,
      trends: {
        category: categoryTrends,
        time: timeTrends,
        engagement: engagementTrends,
        predictions: generateTrendPredictions(
          categoryTrends,
          timeTrends,
          engagementTrends
        ),
      },
    };
  } catch (error) {
    console.error("Trend prediction failed:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 카테고리별 트렌드 분석
 */
const analyzeCategoryTrends = (battles) => {
  const weeklyData = {};
  const weeks = 4; // 4주간 분석

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - i * 7);

    const weekKey = `week_${weeks - i}`;
    weeklyData[weekKey] = {};

    const weekBattles = battles.filter(
      (b) => b.createdAt >= weekStart && b.createdAt < weekEnd
    );

    weekBattles.forEach((battle) => {
      const category = battle.category || "unknown";
      if (!weeklyData[weekKey][category]) {
        weeklyData[weekKey][category] = {
          count: 0,
          votes: 0,
          engagement: 0,
        };
      }

      weeklyData[weekKey][category].count += 1;
      weeklyData[weekKey][category].votes += battle.totalVotes || 0;
      weeklyData[weekKey][category].engagement +=
        battle.metrics?.engagementRate || 0;
    });
  }

  // 트렌드 방향 계산
  const trendDirections = {};
  Object.keys(weeklyData.week_4 || {}).forEach((category) => {
    const week1 = weeklyData.week_1?.[category]?.count || 0;
    const week4 = weeklyData.week_4?.[category]?.count || 0;

    let trend = "stable";
    if (week4 > week1 * 1.2) trend = "rising";
    else if (week4 < week1 * 0.8) trend = "falling";

    trendDirections[category] = {
      trend,
      growth: week1 > 0 ? ((week4 - week1) / week1) * 100 : 0,
      weeklyData: {
        week1: week1,
        week4: week4,
      },
    };
  });

  return trendDirections;
};

/**
 * 시간대별 트렌드 분석
 */
const analyzeTimeTrends = (battles) => {
  const hourlyActivity = {};
  const recentBattles = battles.slice(0, Math.floor(battles.length / 2));
  const olderBattles = battles.slice(Math.floor(battles.length / 2));

  for (let i = 0; i < 24; i++) {
    hourlyActivity[i] = {
      recent: 0,
      older: 0,
      trend: "stable",
    };
  }

  recentBattles.forEach((battle) => {
    const hour = battle.createdAt.getHours();
    hourlyActivity[hour].recent += 1;
  });

  olderBattles.forEach((battle) => {
    const hour = battle.createdAt.getHours();
    hourlyActivity[hour].older += 1;
  });

  // 트렌드 계산
  Object.keys(hourlyActivity).forEach((hour) => {
    const data = hourlyActivity[hour];
    if (data.recent > data.older * 1.2) data.trend = "rising";
    else if (data.recent < data.older * 0.8) data.trend = "falling";
  });

  return hourlyActivity;
};

/**
 * 참여도 트렌드 분석
 */
const analyzeEngagementTrends = (battles) => {
  const recentBattles = battles.slice(0, Math.floor(battles.length / 2));
  const olderBattles = battles.slice(Math.floor(battles.length / 2));

  const recentAvgEngagement =
    recentBattles.reduce(
      (sum, b) => sum + (b.metrics?.engagementRate || 0),
      0
    ) / recentBattles.length;

  const olderAvgEngagement =
    olderBattles.reduce((sum, b) => sum + (b.metrics?.engagementRate || 0), 0) /
    olderBattles.length;

  const engagementChange =
    olderAvgEngagement > 0
      ? ((recentAvgEngagement - olderAvgEngagement) / olderAvgEngagement) * 100
      : 0;

  let trend = "stable";
  if (engagementChange > 10) trend = "improving";
  else if (engagementChange < -10) trend = "declining";

  return {
    recent: recentAvgEngagement,
    older: olderAvgEngagement,
    change: engagementChange,
    trend,
  };
};

/**
 * 트렌드 예측 생성
 */
const generateTrendPredictions = (
  categoryTrends,
  timeTrends,
  engagementTrends
) => {
  const predictions = [];

  // 카테고리 예측
  Object.entries(categoryTrends).forEach(([category, data]) => {
    if (data.trend === "rising" && data.growth > 20) {
      predictions.push({
        type: "category",
        prediction: `${category} 카테고리가 급성장 중입니다 (+${Math.round(
          data.growth
        )}%)`,
        confidence: "high",
        timeframe: "다음 2주",
      });
    }
  });

  // 시간대 예측
  const risingHours = Object.entries(timeTrends)
    .filter(([, data]) => data.trend === "rising")
    .map(([hour]) => hour);

  if (risingHours.length > 0) {
    predictions.push({
      type: "timing",
      prediction: `${risingHours.join(", ")}시에 활동이 증가하고 있습니다`,
      confidence: "medium",
      timeframe: "향후 1주",
    });
  }

  // 참여도 예측
  if (engagementTrends.trend === "improving") {
    predictions.push({
      type: "engagement",
      prediction: `전체 참여율이 개선되고 있습니다 (+${Math.round(
        engagementTrends.change
      )}%)`,
      confidence: "medium",
      timeframe: "지속적",
    });
  }

  return predictions;
};

export default {
  predictBattleSuccess,
  predictTrends,
};
