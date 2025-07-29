// 순수 자동매칭 시스템 - Firebase 의존성 최소화
// src/services/matchingService.js

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  writeBatch,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * 순수 매칭 알고리즘 클래스
 * Firebase와 독립적으로 동작하는 매칭 로직
 */
class PureMatchingEngine {
  constructor() {
    this.matchingRules = {
      // 매칭 우선순위 설정
      categoryWeight: 1.0, // 같은 카테고리 매칭 가중치
      creatorDiversityWeight: 0.8, // 크리에이터 다양성 가중치
      freshnessWeight: 0.6, // 최신성 가중치
      popularityWeight: 0.4, // 인기도 가중치
      balanceWeight: 0.7, // 밸런스 가중치
    };

    this.antiPatterns = [
      "same_creator", // 같은 크리에이터 매칭 방지
      "recent_battle", // 최근 배틀한 컨텐츠 매칭 방지
      "category_mismatch", // 카테고리 불일치 방지
      "skill_gap_too_large", // 실력차 너무 큰 매칭 방지
    ];
  }

  /**
   * 컨텐츠 매칭 점수 계산
   * @param {Object} contenderA - 첫 번째 컨텐츠
   * @param {Object} contenderB - 두 번째 컨텐츠
   * @param {Array} recentBattles - 최근 배틀 기록
   * @returns {number} - 매칭 점수 (0-100)
   */
  calculateMatchScore(contenderA, contenderB, recentBattles = []) {
    let score = 0;
    const weights = this.matchingRules;

    // 1. 카테고리 매칭 점수 (필수 조건)
    if (contenderA.category !== contenderB.category) {
      return 0; // 카테고리가 다르면 매칭 불가
    }
    score += 25 * weights.categoryWeight;

    // 2. 크리에이터 다양성 점수
    if (contenderA.creatorId !== contenderB.creatorId) {
      score += 20 * weights.creatorDiversityWeight;
    } else {
      return 0; // 같은 크리에이터는 매칭 불가
    }

    // 3. 최신성 점수 (둘 다 최근에 만들어진 컨텐츠일 때 높은 점수)
    const daysSinceA = this.getDaysSinceCreation(contenderA.createdAt);
    const daysSinceB = this.getDaysSinceCreation(contenderB.createdAt);
    const avgFreshness = (daysSinceA + daysSinceB) / 2;
    const freshnessScore =
      Math.max(0, 20 - avgFreshness) * weights.freshnessWeight;
    score += freshnessScore;

    // 4. 인기도 밸런스 점수 (비슷한 인기도끼리 매칭)
    const popularityA = contenderA.likeCount || 0;
    const popularityB = contenderB.likeCount || 0;
    const popularityDiff = Math.abs(popularityA - popularityB);
    const popularityScore =
      Math.max(0, 15 - popularityDiff) * weights.popularityWeight;
    score += popularityScore;

    // 5. 밸런스 점수 (공정한 매칭을 위한 추가 요소들)
    const balanceScore = this.calculateBalanceScore(contenderA, contenderB);
    score += balanceScore * weights.balanceWeight;

    // 6. 안티패턴 패널티 적용
    const penalty = this.calculateAntiPatternPenalty(
      contenderA,
      contenderB,
      recentBattles
    );
    score -= penalty;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 생성일로부터 지난 일수 계산
   */
  getDaysSinceCreation(createdAt) {
    const now = new Date();
    const created = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  }

  /**
   * 밸런스 점수 계산
   */
  calculateBalanceScore(contenderA, contenderB) {
    let balanceScore = 10;

    // 제목 길이 유사성 (비슷한 길이의 제목끼리 매칭)
    const titleLengthDiff = Math.abs(
      contenderA.title.length - contenderB.title.length
    );
    if (titleLengthDiff < 10) balanceScore += 5;

    // 업로드 시간 다양성 (다른 시간대에 업로드된 컨텐츠 선호)
    const timeA = new Date(contenderA.createdAt).getHours();
    const timeB = new Date(contenderB.createdAt).getHours();
    const timeDiff = Math.abs(timeA - timeB);
    if (timeDiff > 4) balanceScore += 3;

    return balanceScore;
  }

  /**
   * 안티패턴 패널티 계산
   */
  calculateAntiPatternPenalty(contenderA, contenderB, recentBattles) {
    let penalty = 0;

    // 최근에 이미 배틀한 적이 있는 조합인지 확인
    const hasRecentBattle = recentBattles.some(
      (battle) =>
        (battle.itemA.contenderId === contenderA.id &&
          battle.itemB.contenderId === contenderB.id) ||
        (battle.itemA.contenderId === contenderB.id &&
          battle.itemB.contenderId === contenderA.id)
    );

    if (hasRecentBattle) penalty += 50; // 큰 패널티

    // 같은 크리에이터의 연속 매칭 방지는 이미 위에서 처리됨

    return penalty;
  }

  /**
   * 여러 매칭 후보 중 최적의 매칭들을 선별
   * @param {Array} contenders - 매칭 가능한 컨텐츠들
   * @param {Array} recentBattles - 최근 배틀 기록
   * @param {number} maxMatches - 최대 생성할 매칭 수
   * @returns {Array} - 매칭 쌍들의 배열
   */
  findOptimalMatches(contenders, recentBattles = [], maxMatches = 3) {
    const matches = [];
    const usedContenders = new Set();

    // 모든 가능한 매칭 조합 생성 및 점수 계산
    const candidateMatches = [];

    for (let i = 0; i < contenders.length; i++) {
      for (let j = i + 1; j < contenders.length; j++) {
        const contenderA = contenders[i];
        const contenderB = contenders[j];

        const score = this.calculateMatchScore(
          contenderA,
          contenderB,
          recentBattles
        );

        if (score > 50) {
          // 최소 점수 기준
          candidateMatches.push({
            contenderA,
            contenderB,
            score,
            id: `${contenderA.id}-${contenderB.id}`,
          });
        }
      }
    }

    // 점수순으로 정렬
    candidateMatches.sort((a, b) => b.score - a.score);

    // 최적의 매칭들 선별 (중복 사용 방지)
    for (const candidate of candidateMatches) {
      if (matches.length >= maxMatches) break;

      if (
        !usedContenders.has(candidate.contenderA.id) &&
        !usedContenders.has(candidate.contenderB.id)
      ) {
        matches.push(candidate);
        usedContenders.add(candidate.contenderA.id);
        usedContenders.add(candidate.contenderB.id);
      }
    }

    return matches;
  }

  /**
   * 매칭 다양성을 위한 카테고리 분산
   */
  diversifyByCategory(matches) {
    const categoryCount = {};
    const diversifiedMatches = [];

    // 카테고리별 매칭 수 제한
    for (const match of matches) {
      const category = match.contenderA.category;
      categoryCount[category] = (categoryCount[category] || 0) + 1;

      // 같은 카테고리 최대 2개까지만 허용
      if (categoryCount[category] <= 2) {
        diversifiedMatches.push(match);
      }
    }

    return diversifiedMatches;
  }
}

/**
 * Firebase와 연동되는 매칭 서비스 클래스
 */
class AdvancedMatchingService {
  constructor() {
    this.matchingEngine = new PureMatchingEngine();
    this.lastMatchingTime = null;
    this.matchingCooldown = 5 * 60 * 1000; // 5분 쿨다운
  }

  /**
   * 스마트 자동 매칭 실행
   * @param {Object} options - 매칭 옵션
   * @returns {Promise<Object>} - 매칭 결과
   */
  async executeSmartMatching(options = {}) {
    const {
      maxContenders = 50,
      maxMatches = 3,
      forceCooldown = false,
    } = options;

    // 쿨다운 체크
    if (!forceCooldown && this.isInCooldown()) {
      return {
        success: false,
        reason: "cooldown",
        message: "매칭 쿨다운 중입니다.",
        nextMatchingTime: new Date(
          this.lastMatchingTime.getTime() + this.matchingCooldown
        ),
      };
    }

    try {
      // 1. 매칭 가능한 컨텐츠들 조회
      const availableContenders = await this.fetchAvailableContenders(
        maxContenders
      );

      if (availableContenders.length < 2) {
        return {
          success: false,
          reason: "insufficient_contenders",
          message: "매칭 가능한 컨텐츠가 부족합니다.",
          availableCount: availableContenders.length,
        };
      }

      // 2. 최근 배틀 기록 조회 (중복 매칭 방지용)
      const recentBattles = await this.fetchRecentBattles();

      // 3. 순수 매칭 알고리즘으로 최적 매칭 찾기
      const optimalMatches = this.matchingEngine.findOptimalMatches(
        availableContenders,
        recentBattles,
        maxMatches
      );

      if (optimalMatches.length === 0) {
        return {
          success: false,
          reason: "no_valid_matches",
          message: "현재 매칭 가능한 조합이 없습니다.",
          candidateCount: availableContenders.length,
        };
      }

      // 4. 카테고리 다양성 적용
      const diversifiedMatches =
        this.matchingEngine.diversifyByCategory(optimalMatches);

      // 5. 배틀 생성 실행
      const createdBattles = await this.createBattlesFromMatches(
        diversifiedMatches
      );

      // 6. 매칭 시간 업데이트
      this.lastMatchingTime = new Date();

      return {
        success: true,
        matchesCreated: createdBattles.length,
        battles: createdBattles,
        matchingScores: diversifiedMatches.map((m) => ({
          contenders: [m.contenderA.title, m.contenderB.title],
          score: m.score,
          category: m.contenderA.category,
        })),
      };
    } catch (error) {
      console.error("Smart matching error:", error);
      return {
        success: false,
        reason: "system_error",
        message: "매칭 시스템 오류가 발생했습니다.",
        error: error.message,
      };
    }
  }

  /**
   * 쿨다운 상태 체크
   */
  isInCooldown() {
    if (!this.lastMatchingTime) return false;
    return Date.now() - this.lastMatchingTime.getTime() < this.matchingCooldown;
  }

  /**
   * 매칭 가능한 컨텐츠들 조회
   */
  async fetchAvailableContenders(maxContenders = 50) {
    const contendersRef = collection(db, "contenders");
    const q = query(
      contendersRef,
      where("status", "==", "available"),
      orderBy("createdAt", "desc"),
      limit(maxContenders)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // 추가 메타데이터
      likeCount: doc.data().likeCount || 0,
      viewCount: doc.data().viewCount || 0,
    }));
  }

  /**
   * 최근 배틀 기록 조회 (중복 방지용)
   */
  async fetchRecentBattles(daysBack = 7) {
    const battlesRef = collection(db, "battles");
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const q = query(
      battlesRef,
      where("createdAt", ">=", cutoffDate),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data());
  }

  /**
   * 매칭 결과로부터 실제 배틀들 생성
   */
  async createBattlesFromMatches(matches) {
    const createdBattles = [];

    for (const match of matches) {
      try {
        const battleId = await this.createSingleBattle(
          match.contenderA,
          match.contenderB
        );
        createdBattles.push({
          id: battleId,
          contenderA: match.contenderA.title,
          contenderB: match.contenderB.title,
          category: match.contenderA.category,
          score: match.score,
        });
      } catch (error) {
        console.error(
          `Failed to create battle for ${match.contenderA.title} vs ${match.contenderB.title}:`,
          error
        );
      }
    }

    return createdBattles;
  }

  /**
   * 단일 배틀 생성 (트랜잭션)
   */
  async createSingleBattle(contenderA, contenderB) {
    return await runTransaction(db, async (transaction) => {
      const contenderRefA = doc(db, "contenders", contenderA.id);
      const contenderRefB = doc(db, "contenders", contenderB.id);

      // 상태 재확인
      const contenderDocA = await transaction.get(contenderRefA);
      const contenderDocB = await transaction.get(contenderRefB);

      if (
        !contenderDocA.exists() ||
        contenderDocA.data().status !== "available" ||
        !contenderDocB.exists() ||
        contenderDocB.data().status !== "available"
      ) {
        throw new Error("선택된 컨텐츠 중 하나가 이미 사용 중입니다.");
      }

      // 배틀 데이터 생성
      const battleData = {
        creatorId: contenderA.creatorId,
        creatorName: contenderA.creatorName,
        title: `${contenderA.title} vs ${contenderB.title}`,
        category: contenderA.category,
        itemA: {
          title: contenderA.title,
          imageUrl: contenderA.imageUrl,
          votes: 0,
          contenderId: contenderA.id,
        },
        itemB: {
          title: contenderB.title,
          imageUrl: contenderB.imageUrl,
          votes: 0,
          contenderId: contenderB.id,
        },
        status: "ongoing",
        createdAt: serverTimestamp(),
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
        totalVotes: 0,
        participants: [],

        // 매칭 메타데이터
        matchingMethod: "smart_algorithm",
        matchingScore: this.matchingEngine.calculateMatchScore(
          contenderA,
          contenderB
        ),
      };

      const battleRef = doc(collection(db, "battles"));

      // 트랜잭션으로 안전하게 생성
      transaction.set(battleRef, battleData);
      transaction.update(contenderRefA, { status: "in_battle" });
      transaction.update(contenderRefB, { status: "in_battle" });

      return battleRef.id;
    });
  }

  /**
   * 매칭 통계 조회
   */
  async getMatchingStats() {
    const stats = {
      totalAvailableContenders: 0,
      categoryDistribution: {},
      lastMatchingTime: this.lastMatchingTime,
      nextAvailableMatching: this.isInCooldown()
        ? new Date(this.lastMatchingTime.getTime() + this.matchingCooldown)
        : new Date(),
      cooldownRemaining: this.isInCooldown()
        ? this.matchingCooldown - (Date.now() - this.lastMatchingTime.getTime())
        : 0,
    };

    try {
      const contenders = await this.fetchAvailableContenders(100);
      stats.totalAvailableContenders = contenders.length;

      contenders.forEach((contender) => {
        stats.categoryDistribution[contender.category] =
          (stats.categoryDistribution[contender.category] || 0) + 1;
      });
    } catch (error) {
      console.error("Error fetching matching stats:", error);
    }

    return stats;
  }
}

// 싱글톤 인스턴스 생성
const advancedMatchingService = new AdvancedMatchingService();

// 기존 함수를 새로운 시스템으로 대체
export const findAndCreateRandomBattle = async (options = {}) => {
  return await advancedMatchingService.executeSmartMatching(options);
};

// 추가 유틸리티 함수들
export const getMatchingStats = async () => {
  return await advancedMatchingService.getMatchingStats();
};

export const forceMatching = async (maxMatches = 5) => {
  return await advancedMatchingService.executeSmartMatching({
    maxMatches,
    forceCooldown: true,
  });
};

// 기존 createBattleFromContenders 함수 (수동 배틀 생성용)
export const createBattleFromContenders = async (contenderA, contenderB) => {
  return await advancedMatchingService.createSingleBattle(
    contenderA,
    contenderB
  );
};

export default advancedMatchingService;
