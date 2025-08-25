// src/services/utilsService.js - 유틸리티 및 디버깅 서비스

import { db } from "../firebase/config";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

// ==================== 유틸리티 함수들 ====================

/**
 * 시간 포맷팅 함수
 */
export const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/**
 * 날짜 포맷팅 함수
 */
export const formatDate = (date) => {
  if (!date) return "";

  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);

  if (diffInSeconds < 60) {
    return "방금 전";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}시간 전`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}일 전`;
  } else {
    return targetDate.toLocaleDateString();
  }
};

/**
 * 숫자 포맷팅 함수 (K, M 단위)
 */
export const formatNumber = (num) => {
  if (!num || num === 0) return "0";

  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }

  return num.toString();
};

/**
 * 퍼센티지 계산 함수
 */
export const calculatePercentage = (part, total) => {
  if (!total || total === 0) return 0;
  return Math.round((part / total) * 100);
};

/**
 * URL 유효성 검사
 */
export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * 플랫폼명 반환
 */
export const getPlatformName = (platform) => {
  const platformNames = {
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram: "Instagram",
    image: "이미지",
  };

  return platformNames[platform] || "알 수 없음";
};

/**
 * 카테고리명 반환
 */
export const getCategoryName = (category) => {
  const categoryNames = {
    music: "음악",
    fashion: "패션",
    food: "음식",
  };

  return categoryNames[category] || "기타";
};

// ==================== 디버깅 및 관리 함수들 ====================

/**
 * 시스템 상태 확인
 */
export const getSystemStatus = async () => {
  try {
    const status = {
      timestamp: new Date(),
      contenders: {
        total: 0,
        available: 0,
        inBattle: 0,
        deleted: 0,
      },
      battles: {
        total: 0,
        ongoing: 0,
        ended: 0,
      },
      platforms: {
        image: 0,
        youtube: 0,
        instagram: 0,
        tiktok: 0,
      },
      categories: {
        music: 0,
        fashion: 0,
        food: 0,
      },
      errors: [],
    };

    // 콘텐츠 상태 확인
    try {
      const contendersSnapshot = await getDocs(collection(db, "contenders"));
      status.contenders.total = contendersSnapshot.size;

      contendersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const contenderStatus = data.status || "unknown";
        const platform = data.platform || "image";
        const category = data.category || "other";

        // 상태별 카운트
        if (status.contenders[contenderStatus] !== undefined) {
          status.contenders[contenderStatus]++;
        }

        // 플랫폼별 카운트
        if (status.platforms[platform] !== undefined) {
          status.platforms[platform]++;
        }

        // 카테고리별 카운트
        if (status.categories[category] !== undefined) {
          status.categories[category]++;
        }
      });
    } catch (error) {
      status.errors.push(`Contenders collection error: ${error.message}`);
    }

    // 배틀 상태 확인
    try {
      const battlesSnapshot = await getDocs(collection(db, "battles"));
      status.battles.total = battlesSnapshot.size;

      battlesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const battleStatus = data.status || "unknown";

        if (status.battles[battleStatus] !== undefined) {
          status.battles[battleStatus]++;
        }
      });
    } catch (error) {
      status.errors.push(`Battles collection error: ${error.message}`);
    }

    return {
      success: true,
      status,
    };
  } catch (error) {
    console.error("시스템 상태 확인 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 데이터베이스 정리 (삭제된 콘텐츠 제거)
 */
export const cleanupDatabase = async () => {
  try {
    const results = {
      deletedContenders: 0,
      resetContenders: 0,
      errors: [],
    };

    // 삭제된 콘텐츠 완전 제거 (실제로는 상태만 변경)
    try {
      const deletedQuery = query(
        collection(db, "contenders"),
        where("status", "==", "deleted")
      );
      const deletedSnapshot = await getDocs(deletedQuery);

      const updatePromises = deletedSnapshot.docs.map((doc) =>
        updateDoc(doc.ref, {
          isActive: false,
          cleanedAt: serverTimestamp(),
        })
      );

      await Promise.all(updatePromises);
      results.deletedContenders = deletedSnapshot.size;
    } catch (error) {
      results.errors.push(`Cleanup deleted contenders error: ${error.message}`);
    }

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error("데이터베이스 정리 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 성능 통계 계산
 */
export const calculatePerformanceStats = async () => {
  try {
    const stats = {
      topBattles: [],
      topCreators: {},
      platformPerformance: {},
      categoryPerformance: {},
      engagementMetrics: {
        averageVotes: 0,
        averageViews: 0,
        averageEngagementRate: 0,
      },
    };

    // 상위 배틀 조회
    try {
      const topBattlesQuery = query(
        collection(db, "battles"),
        orderBy("totalVotes", "desc"),
        limit(10)
      );
      const topBattlesSnapshot = await getDocs(topBattlesQuery);

      stats.topBattles = topBattlesSnapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        totalVotes: doc.data().totalVotes || 0,
        viewCount: doc.data().viewCount || 0,
        category: doc.data().category,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));

      // 전체 배틀에서 평균 계산
      let totalVotes = 0;
      let totalViews = 0;
      let totalEngagement = 0;
      let battleCount = 0;

      topBattlesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        totalVotes += data.totalVotes || 0;
        totalViews += data.viewCount || 0;
        totalEngagement += data.metrics?.engagementRate || 0;
        battleCount++;
      });

      if (battleCount > 0) {
        stats.engagementMetrics.averageVotes = Math.round(
          totalVotes / battleCount
        );
        stats.engagementMetrics.averageViews = Math.round(
          totalViews / battleCount
        );
        stats.engagementMetrics.averageEngagementRate =
          Math.round((totalEngagement / battleCount) * 100) / 100;
      }
    } catch (error) {
      console.error("Top battles query error:", error);
    }

    // 크리에이터 성과 분석
    try {
      const contendersSnapshot = await getDocs(collection(db, "contenders"));

      contendersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const creatorId = data.creatorId;
        const creatorName = data.creatorName || "Unknown";
        const platform = data.platform || "image";
        const category = data.category || "other";

        // 크리에이터별 통계
        if (!stats.topCreators[creatorId]) {
          stats.topCreators[creatorId] = {
            name: creatorName,
            contentCount: 0,
            totalLikes: 0,
            totalViews: 0,
            platforms: new Set(),
            categories: new Set(),
          };
        }

        stats.topCreators[creatorId].contentCount++;
        stats.topCreators[creatorId].totalLikes += data.likeCount || 0;
        stats.topCreators[creatorId].totalViews += data.viewCount || 0;
        stats.topCreators[creatorId].platforms.add(platform);
        stats.topCreators[creatorId].categories.add(category);

        // 플랫폼별 성과
        if (!stats.platformPerformance[platform]) {
          stats.platformPerformance[platform] = {
            contentCount: 0,
            totalLikes: 0,
            totalViews: 0,
            averageLikes: 0,
            averageViews: 0,
          };
        }

        stats.platformPerformance[platform].contentCount++;
        stats.platformPerformance[platform].totalLikes += data.likeCount || 0;
        stats.platformPerformance[platform].totalViews += data.viewCount || 0;

        // 카테고리별 성과
        if (!stats.categoryPerformance[category]) {
          stats.categoryPerformance[category] = {
            contentCount: 0,
            totalLikes: 0,
            totalViews: 0,
            averageLikes: 0,
            averageViews: 0,
          };
        }

        stats.categoryPerformance[category].contentCount++;
        stats.categoryPerformance[category].totalLikes += data.likeCount || 0;
        stats.categoryPerformance[category].totalViews += data.viewCount || 0;
      });

      // 평균값 계산
      Object.keys(stats.platformPerformance).forEach((platform) => {
        const perf = stats.platformPerformance[platform];
        if (perf.contentCount > 0) {
          perf.averageLikes = Math.round(perf.totalLikes / perf.contentCount);
          perf.averageViews = Math.round(perf.totalViews / perf.contentCount);
        }
      });

      Object.keys(stats.categoryPerformance).forEach((category) => {
        const perf = stats.categoryPerformance[category];
        if (perf.contentCount > 0) {
          perf.averageLikes = Math.round(perf.totalLikes / perf.contentCount);
          perf.averageViews = Math.round(perf.totalViews / perf.contentCount);
        }
      });

      // Set을 배열로 변환
      Object.keys(stats.topCreators).forEach((creatorId) => {
        stats.topCreators[creatorId].platforms = Array.from(
          stats.topCreators[creatorId].platforms
        );
        stats.topCreators[creatorId].categories = Array.from(
          stats.topCreators[creatorId].categories
        );
      });
    } catch (error) {
      console.error("Performance stats calculation error:", error);
    }

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error("성능 통계 계산 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 데이터 백업 정보 생성
 */
export const generateBackupInfo = async () => {
  try {
    const backupInfo = {
      timestamp: new Date(),
      collections: {},
      totalDocuments: 0,
      estimatedSize: 0,
    };

    // 각 컬렉션의 문서 수 계산
    const collections = ["contenders", "battles", "users", "comments"];

    for (const collectionName of collections) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        backupInfo.collections[collectionName] = {
          documentCount: snapshot.size,
          lastUpdated: new Date(),
        };
        backupInfo.totalDocuments += snapshot.size;
      } catch (error) {
        backupInfo.collections[collectionName] = {
          documentCount: 0,
          error: error.message,
        };
      }
    }

    // 예상 크기 계산 (대략적)
    backupInfo.estimatedSize = backupInfo.totalDocuments * 2; // KB 단위

    return {
      success: true,
      backupInfo,
    };
  } catch (error) {
    console.error("백업 정보 생성 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 시스템 건강 상태 확인
 */
export const checkSystemHealth = async () => {
  try {
    const health = {
      status: "healthy",
      checks: {
        database: "unknown",
        collections: "unknown",
        indexing: "unknown",
        performance: "unknown",
      },
      issues: [],
      recommendations: [],
    };

    // 데이터베이스 연결 확인
    try {
      await getDocs(query(collection(db, "contenders"), limit(1)));
      health.checks.database = "healthy";
    } catch (error) {
      health.checks.database = "error";
      health.issues.push("데이터베이스 연결 오류");
      health.status = "unhealthy";
    }

    // 컬렉션 상태 확인
    try {
      const contendersSnapshot = await getDocs(
        query(collection(db, "contenders"), limit(5))
      );
      const battlesSnapshot = await getDocs(
        query(collection(db, "battles"), limit(5))
      );

      if (contendersSnapshot.size > 0 && battlesSnapshot.size > 0) {
        health.checks.collections = "healthy";
      } else {
        health.checks.collections = "warning";
        health.issues.push("일부 컬렉션에 데이터가 부족합니다");
      }
    } catch (error) {
      health.checks.collections = "error";
      health.issues.push("컬렉션 접근 오류");
      health.status = "unhealthy";
    }

    // 권장사항 생성
    if (health.issues.length === 0) {
      health.recommendations.push("시스템이 정상적으로 작동하고 있습니다");
    } else {
      health.recommendations.push("발견된 문제들을 해결해주세요");
      health.recommendations.push("정기적인 시스템 점검을 수행하세요");
    }

    return {
      success: true,
      health,
    };
  } catch (error) {
    console.error("시스템 건강 상태 확인 오류:", error);
    return {
      success: false,
      error: error.message,
      health: {
        status: "error",
        checks: {
          database: "error",
          collections: "error",
          indexing: "error",
          performance: "error",
        },
        issues: ["시스템 건강 상태 확인 실패"],
        recommendations: ["기술 지원팀에 문의하세요"],
      },
    };
  }
};
