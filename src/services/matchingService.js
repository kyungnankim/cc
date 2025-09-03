// src/services/matchingService.js - 세션 기반 인증으로 수정된 버전

import { auth, db } from "../firebase/config";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  limit,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

// ==================== 유틸리티 함수들 ====================

// 세션에서 현재 사용자 가져오기 함수 (contentService와 동일)
const getCurrentUser = () => {
  try {
    const userData = sessionStorage.getItem("currentUser");
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error("사용자 정보 파싱 오류:", error);
    return null;
  }
};

// 매칭 점수 계산 함수 (플랫폼 고려)
export const calculateMatchingScore = (contender1, contender2) => {
  let score = 0;

  // 같은 카테고리 보너스
  if (contender1.category === contender2.category) {
    score += 50;
  }

  // 같은 플랫폼 보너스
  if (contender1.platform === contender2.platform) {
    score += 30;
  }

  // 인기도 차이 고려
  const popularityDiff = Math.abs(
    (contender1.likeCount || 0) - (contender2.likeCount || 0)
  );
  score += Math.max(0, 30 - popularityDiff / 10);

  // 최근 생성된 콘텐츠 보너스
  const now = Date.now();
  const age1 = now - (contender1.createdAt?.toDate?.()?.getTime() || now);
  const age2 = now - (contender2.createdAt?.toDate?.()?.getTime() || now);
  const avgAge = (age1 + age2) / 2;
  const dayInMs = 24 * 60 * 60 * 1000;

  if (avgAge < 7 * dayInMs) {
    score += 20;
  }

  // 미디어 콘텐츠 보너스
  if (contender1.platform !== "image" && contender2.platform !== "image") {
    score += 15;
  }

  // 랜덤 요소 추가
  score += Math.random() * 10;

  return Math.round(score);
};

// ==================== 배틀 생성 함수들 ====================

/**
 * 기본 배틀 생성 (미디어 정보 포함) - 세션 기반 인증
 */
export const createBattleFromContenders = async (contenderA, contenderB) => {
  const currentUser = getCurrentUser(); // 세션에서 사용자 정보 가져오기
  if (!currentUser) {
    throw new Error("로그인이 필요합니다. 세션을 확인해주세요.");
  }

  console.log("🔐 배틀 생성 사용자 확인:", {
    uid: currentUser.uid,
    displayName: currentUser.displayName,
    email: currentUser.email,
  });

  if (contenderA.category !== contenderB.category) {
    throw new Error("같은 카테고리의 콘텐츠끼리만 배틀할 수 있습니다.");
  }

  if (contenderA.creatorId === contenderB.creatorId) {
    throw new Error("같은 크리에이터의 콘텐츠끼리는 배틀할 수 없습니다.");
  }

  return await runTransaction(db, async (transaction) => {
    const contenderRefA = doc(db, "contenders", contenderA.id);
    const contenderRefB = doc(db, "contenders", contenderB.id);

    const contenderDocA = await transaction.get(contenderRefA);
    const contenderDocB = await transaction.get(contenderRefB);

    if (
      !contenderDocA.exists() ||
      contenderDocA.data().status !== "available" ||
      !contenderDocB.exists() ||
      contenderDocB.data().status !== "available"
    ) {
      throw new Error("선택된 콘텐츠 중 하나가 이미 사용 중입니다.");
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);

    const battleData = {
      creatorId: currentUser.uid,
      creatorName:
        currentUser.displayName || currentUser.email?.split("@")[0] || "익명",
      title: `${contenderA.title} vs ${contenderB.title}`,
      category: contenderA.category,

      itemA: createBattleItem(contenderA),
      itemB: createBattleItem(contenderB),

      status: "ongoing",
      createdAt: serverTimestamp(),
      endsAt: endTime,
      totalVotes: 0,
      participants: [],

      // 매칭 관련 메타데이터
      matchingMethod: "smart_algorithm",
      matchingScore: calculateMatchingScore(contenderA, contenderB),

      // 소셜 및 상호작용
      likeCount: 0,
      likedBy: [],
      shareCount: 0,
      commentCount: 0,
      viewCount: 0,
      uniqueViewers: [],

      // 메트릭
      metrics: {
        engagementRate: 0,
        commentRate: 0,
        shareRate: 0,
      },

      updatedAt: serverTimestamp(),
      lastVoteAt: null,
      lastCommentAt: null,
      lastViewAt: null,
    };

    const battleRef = doc(collection(db, "battles"));

    transaction.set(battleRef, battleData);
    transaction.update(contenderRefA, {
      status: "in_battle",
      lastBattleId: battleRef.id,
      battleCount: (contenderDocA.data().battleCount || 0) + 1,
    });
    transaction.update(contenderRefB, {
      status: "in_battle",
      lastBattleId: battleRef.id,
      battleCount: (contenderDocB.data().battleCount || 0) + 1,
    });

    console.log("✅ 배틀 생성 성공:", battleRef.id);
    return battleRef.id;
  });
};

/**
 * 유연한 배틀 생성 (카테고리 및 크리에이터 제한 완화) - 세션 기반 인증
 */
export const createBattleFromContendersFlexible = async (
  contenderA,
  contenderB
) => {
  const currentUser = getCurrentUser(); // 세션에서 사용자 정보 가져오기
  if (!currentUser) {
    throw new Error("로그인이 필요합니다. 세션을 확인해주세요.");
  }

  console.log("🔐 유연한 배틀 생성 사용자 확인:", {
    uid: currentUser.uid,
    displayName: currentUser.displayName,
  });

  return await runTransaction(db, async (transaction) => {
    const contenderRefA = doc(db, "contenders", contenderA.id);
    const contenderRefB = doc(db, "contenders", contenderB.id);

    const contenderDocA = await transaction.get(contenderRefA);
    const contenderDocB = await transaction.get(contenderRefB);

    if (
      !contenderDocA.exists() ||
      contenderDocA.data().status !== "available" ||
      !contenderDocB.exists() ||
      contenderDocB.data().status !== "available"
    ) {
      throw new Error("선택된 콘텐츠 중 하나가 이미 사용 중입니다.");
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 카테고리 결정 (우선순위: A의 카테고리 -> B의 카테고리 -> "mixed")
    const battleCategory =
      contenderA.category || contenderB.category || "mixed";

    const battleData = {
      creatorId: currentUser.uid,
      creatorName:
        currentUser.displayName || currentUser.email?.split("@")[0] || "익명",
      title: `${contenderA.title} vs ${contenderB.title}`,
      category: battleCategory,

      itemA: createBattleItemFlexible(contenderA),
      itemB: createBattleItemFlexible(contenderB),

      status: "ongoing",
      createdAt: serverTimestamp(),
      endsAt: endTime,
      totalVotes: 0,
      participants: [],

      // 매칭 관련 메타데이터
      matchingMethod: "flexible_algorithm",
      matchingScore: calculateMatchingScore(contenderA, contenderB),
      isSameCreator: contenderA.creatorId === contenderB.creatorId,
      isCrossCategory: contenderA.category !== contenderB.category,

      // 소셜 및 상호작용
      likeCount: 0,
      likedBy: [],
      shareCount: 0,
      commentCount: 0,
      viewCount: 0,
      uniqueViewers: [],

      // 메트릭
      metrics: {
        engagementRate: 0,
        commentRate: 0,
        shareRate: 0,
      },

      updatedAt: serverTimestamp(),
      lastVoteAt: null,
      lastCommentAt: null,
      lastViewAt: null,
    };

    const battleRef = doc(collection(db, "battles"));

    transaction.set(battleRef, battleData);
    transaction.update(contenderRefA, {
      status: "in_battle",
      lastBattleId: battleRef.id,
      battleCount: (contenderDocA.data().battleCount || 0) + 1,
    });
    transaction.update(contenderRefB, {
      status: "in_battle",
      lastBattleId: battleRef.id,
      battleCount: (contenderDocB.data().battleCount || 0) + 1,
    });

    console.log("✅ 유연한 배틀 생성 성공:", battleRef.id);
    return battleRef.id;
  });
};

/**
 * 강제 배틀 생성 (모든 제한 해제) - 세션 기반 인증
 */
export const createBattleFromContendersForce = async (
  contenderA,
  contenderB
) => {
  const currentUser = getCurrentUser(); // 세션에서 사용자 정보 가져오기
  if (!currentUser) {
    throw new Error("로그인이 필요합니다. 세션을 확인해주세요.");
  }

  console.log("🔐 강제 배틀 생성 사용자 확인:", {
    uid: currentUser.uid,
    displayName: currentUser.displayName,
  });

  return await runTransaction(db, async (transaction) => {
    const contenderRefA = doc(db, "contenders", contenderA.id);
    const contenderRefB = doc(db, "contenders", contenderB.id);

    const contenderDocA = await transaction.get(contenderRefA);
    const contenderDocB = await transaction.get(contenderRefB);

    if (
      !contenderDocA.exists() ||
      contenderDocA.data().status !== "available" ||
      !contenderDocB.exists() ||
      contenderDocB.data().status !== "available"
    ) {
      throw new Error("선택된 콘텐츠 중 하나가 이미 사용 중입니다.");
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);

    const battleData = {
      creatorId: currentUser.uid,
      creatorName:
        currentUser.displayName || currentUser.email?.split("@")[0] || "익명",
      title: `${contenderA.title} vs ${contenderB.title}`,
      category: contenderA.category || contenderB.category || "general",

      itemA: createBattleItemFlexible(contenderA),
      itemB: createBattleItemFlexible(contenderB),

      status: "ongoing",
      createdAt: serverTimestamp(),
      endsAt: endTime,
      totalVotes: 0,
      participants: [],

      // 매칭 관련 메타데이터
      matchingMethod: "force_matching",
      matchingScore: 0,

      // 소셜 및 상호작용
      likeCount: 0,
      likedBy: [],
      shareCount: 0,
      commentCount: 0,
      viewCount: 0,
      uniqueViewers: [],

      // 메트릭
      metrics: {
        engagementRate: 0,
        commentRate: 0,
        shareRate: 0,
      },

      updatedAt: serverTimestamp(),
      lastVoteAt: null,
      lastCommentAt: null,
      lastViewAt: null,
    };

    const battleRef = doc(collection(db, "battles"));

    transaction.set(battleRef, battleData);
    transaction.update(contenderRefA, {
      status: "in_battle",
      lastBattleId: battleRef.id,
      battleCount: (contenderDocA.data().battleCount || 0) + 1,
    });
    transaction.update(contenderRefB, {
      status: "in_battle",
      lastBattleId: battleRef.id,
      battleCount: (contenderDocB.data().battleCount || 0) + 1,
    });

    console.log("✅ 강제 배틀 생성 성공:", battleRef.id);
    return battleRef.id;
  });
};

// ==================== 헬퍼 함수들 ====================

/**
 * 배틀 아이템 생성 (표준)
 */
function createBattleItem(contender) {
  return {
    title: contender.title,
    imageUrl: contender.imageUrl,
    votes: 0,
    contenderId: contender.id,
    creatorId: contender.creatorId,
    creatorName: contender.creatorName,
    description: contender.description || "",

    // 플랫폼 및 미디어 정보
    platform: contender.platform || "image",
    contentType: contender.contentType || "image",

    // 추출된 미디어 데이터
    ...(contender.extractedData && {
      extractedData: contender.extractedData,
    }),

    // 호환성을 위한 기존 필드들
    ...(contender.platform === "youtube" && {
      youtubeUrl: contender.youtubeUrl,
      youtubeId: contender.youtubeId,
      thumbnailUrl: contender.thumbnailUrl,
    }),

    ...(contender.platform === "instagram" && {
      instagramUrl: contender.instagramUrl,
      postType: contender.postType,
    }),

    ...(contender.platform === "tiktok" && {
      tiktokUrl: contender.tiktokUrl,
      tiktokId: contender.tiktokId,
      tiktokHtml: contender.tiktokHtml, // TikTok HTML 임베드
    }),

    // 시간 설정
    ...(contender.timeSettings && {
      timeSettings: contender.timeSettings,
    }),
  };
}

/**
 * 배틀 아이템 생성 (유연한 버전)
 */
function createBattleItemFlexible(contender) {
  return {
    title: contender.title,
    imageUrl: contender.imageUrl,
    votes: 0,
    contenderId: contender.id,
    creatorId: contender.creatorId,
    creatorName: contender.creatorName,
    platform: contender.platform || "image",
    contentType: contender.contentType || "image",
    extractedData: contender.extractedData || null,
    timeSettings: contender.timeSettings || null,
    description: contender.description || "",
    originalCategory: contender.category,

    // TikTok 특별 처리
    ...(contender.platform === "tiktok" && {
      tiktokHtml: contender.tiktokHtml,
      tiktokBlockquote: contender.tiktokBlockquote,
      embedType: contender.embedType,
    }),
  };
}

// ==================== 스마트 매칭 시스템 ====================

/**
 * 스마트 자동 매칭 실행 - 세션 기반 인증
 */
export const findAndCreateRandomBattle = async (options = {}) => {
  const {
    maxMatches = 3,
    allowSameCreator = false,
    allowCrossCategory = false,
  } = options;

  // 사용자 인증 확인 (로깅 추가)
  const currentUser = getCurrentUser();
  console.log("🔐 매칭 시스템 사용자 확인:", {
    hasUser: !!currentUser,
    uid: currentUser?.uid,
    displayName: currentUser?.displayName,
  });

  try {
    console.log("🔍 매칭 시작 - maxMatches:", maxMatches);

    try {
      const contendersQuery = query(
        collection(db, "contenders"),
        where("status", "==", "available"),
        limit(maxMatches * 2)
      );

      const contendersSnapshot = await getDocs(contendersQuery);
      console.log("📊 조회된 contenders 수:", contendersSnapshot.size);

      if (contendersSnapshot.empty) {
        return {
          success: false,
          reason: "insufficient_contenders",
          message: "매칭할 수 있는 콘텐츠가 부족합니다.",
          matchesCreated: 0,
        };
      }

      const availableContenders = contendersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (availableContenders.length < 2) {
        return {
          success: false,
          reason: "insufficient_contenders",
          message: "매칭할 수 있는 콘텐츠가 부족합니다. (최소 2개 필요)",
          matchesCreated: 0,
        };
      }

      let matchesCreated = 0;
      const matchingScores = [];

      // 1단계: 카테고리 내 + 다른 크리에이터 매칭
      matchesCreated += await tryMatchingWithinCategories(
        availableContenders,
        maxMatches - matchesCreated,
        matchingScores,
        false
      );

      // 2단계: 같은 크리에이터 매칭 허용
      if (matchesCreated < maxMatches && allowSameCreator) {
        matchesCreated += await tryMatchingWithinCategories(
          availableContenders,
          maxMatches - matchesCreated,
          matchingScores,
          true
        );
      }

      // 3단계: 카테고리 간 매칭 허용
      if (matchesCreated < maxMatches && allowCrossCategory) {
        matchesCreated += await tryCrossCategoryMatching(
          availableContenders,
          maxMatches - matchesCreated,
          matchingScores,
          allowSameCreator
        );
      }

      if (matchesCreated === 0) {
        return {
          success: false,
          reason: "no_valid_matches",
          message: "현재 매칭 가능한 조합이 없습니다.",
          matchesCreated: 0,
        };
      }

      return {
        success: true,
        matchesCreated,
        matchingScores,
        message: `${matchesCreated}개의 배틀이 생성되었습니다.`,
      };
    } catch (error) {
      return {
        success: false,
        reason: "insufficient_contenders",
        message: "콘텐츠를 먼저 업로드해주세요.",
        matchesCreated: 0,
      };
    }
  } catch (error) {
    console.error("스마트 매칭 오류:", error);
    return {
      success: false,
      reason: "system_error",
      message: "매칭 시스템 오류가 발생했습니다.",
      error: error.message,
      matchesCreated: 0,
    };
  }
};

/**
 * 카테고리 내 매칭 시도
 */
async function tryMatchingWithinCategories(
  availableContenders,
  maxMatches,
  matchingScores,
  allowSameCreator
) {
  let matchesCreated = 0;

  // 카테고리별 그룹화
  const categoryGroups = {};
  availableContenders.forEach((contender) => {
    if (contender.status !== "available") return;

    const category = contender.category || "general";
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }
    categoryGroups[category].push(contender);
  });

  // 각 카테고리에서 매칭 시도
  for (const [category, contenders] of Object.entries(categoryGroups)) {
    if (contenders.length < 2 || matchesCreated >= maxMatches) continue;

    const shuffled = [...contenders].sort(() => Math.random() - 0.5);

    for (
      let i = 0;
      i < shuffled.length - 1 && matchesCreated < maxMatches;
      i += 2
    ) {
      const contender1 = shuffled[i];
      const contender2 = shuffled[i + 1];

      if (
        contender1.status !== "available" ||
        contender2.status !== "available"
      ) {
        continue;
      }

      // 같은 크리에이터 체크
      if (!allowSameCreator && contender1.creatorId === contender2.creatorId) {
        continue;
      }

      try {
        const battleId = await createBattleFromContenders(
          contender1,
          contender2
        );

        const matchingScore = calculateMatchingScore(contender1, contender2);

        matchingScores.push({
          battleId,
          contender1: contender1.title,
          contender2: contender2.title,
          category,
          score: matchingScore,
          sameCreator: contender1.creatorId === contender2.creatorId,
        });

        // 사용된 콘텐츠 표시
        contender1.status = "in_battle";
        contender2.status = "in_battle";

        matchesCreated++;
      } catch (error) {
        console.error("배틀 생성 실패:", error.message);
      }
    }
  }

  return matchesCreated;
}

/**
 * 카테고리 간 매칭 시도
 */
async function tryCrossCategoryMatching(
  availableContenders,
  maxMatches,
  matchingScores,
  allowSameCreator
) {
  let matchesCreated = 0;

  const available = availableContenders.filter((c) => c.status === "available");

  if (available.length < 2) {
    return 0;
  }

  const shuffled = [...available].sort(() => Math.random() - 0.5);

  for (
    let i = 0;
    i < shuffled.length - 1 && matchesCreated < maxMatches;
    i += 2
  ) {
    const contender1 = shuffled[i];
    const contender2 = shuffled[i + 1];

    // 같은 크리에이터 체크
    if (!allowSameCreator && contender1.creatorId === contender2.creatorId) {
      continue;
    }

    try {
      const battleId = await createBattleFromContendersFlexible(
        contender1,
        contender2
      );

      const matchingScore = calculateMatchingScore(contender1, contender2) - 20;

      matchingScores.push({
        battleId,
        contender1: contender1.title,
        contender2: contender2.title,
        category: `${contender1.category} vs ${contender2.category}`,
        score: matchingScore,
        crossCategory: true,
        sameCreator: contender1.creatorId === contender2.creatorId,
      });

      // 사용된 콘텐츠 표시
      contender1.status = "in_battle";
      contender2.status = "in_battle";

      matchesCreated++;
    } catch (error) {
      console.error("카테고리 간 배틀 생성 실패:", error.message);
    }
  }

  return matchesCreated;
}

// ==================== 고급 매칭 함수들 ====================

/**
 * 강제 매칭 실행
 */
export const executeForceMatching = async (maxMatches = 5) => {
  try {
    console.log("🚀 강제 매칭 시작");
    const currentUser = getCurrentUser();
    console.log("🔐 강제 매칭 사용자 확인:", {
      hasUser: !!currentUser,
      uid: currentUser?.uid,
    });

    const result = await findAndCreateRandomBattle({
      maxMatches,
      allowSameCreator: true,
      allowCrossCategory: true,
    });
    return {
      ...result,
      forcedMatching: true,
    };
  } catch (error) {
    console.error("강제 매칭 오류:", error);
    return {
      success: false,
      error: error.message,
      matchesCreated: 0,
    };
  }
};

/**
 * 즉시 매칭 실행 (테스트용)
 */
export const createBattleNow = async () => {
  console.log("🚀 즉시 매칭 실행 (모든 제한 해제)");
  const currentUser = getCurrentUser();
  console.log("🔐 즉시 매칭 사용자 확인:", {
    hasUser: !!currentUser,
    uid: currentUser?.uid,
  });

  const result = await findAndCreateRandomBattle({
    maxMatches: 1,
    allowSameCreator: true,
    allowCrossCategory: true,
  });

  return result;
};

/**
 * 강제 카테고리 무시 배틀 생성
 */
export const forceCreateBattleAnyCategory = async (maxMatches = 1) => {
  try {
    console.log("🚀 강제 매칭 시작 (카테고리 무시)");
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        reason: "auth_required",
        message: "로그인이 필요합니다. 세션을 확인해주세요.",
        matchesCreated: 0,
      };
    }

    console.log("🔐 강제 매칭 사용자 확인:", {
      uid: currentUser.uid,
      displayName: currentUser.displayName,
    });

    const contendersQuery = query(
      collection(db, "contenders"),
      where("status", "==", "available"),
      limit(10)
    );

    const contendersSnapshot = await getDocs(contendersQuery);

    if (contendersSnapshot.size < 2) {
      return {
        success: false,
        reason: "insufficient_contenders",
        message: "매칭할 콘텐츠가 부족합니다.",
        matchesCreated: 0,
      };
    }

    const availableContenders = contendersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 다른 크리에이터 콘텐츠만 필터링
    const differentCreators = [];
    const usedCreators = new Set();

    for (const contender of availableContenders) {
      if (!usedCreators.has(contender.creatorId)) {
        differentCreators.push(contender);
        usedCreators.add(contender.creatorId);
      }
    }

    if (differentCreators.length < 2) {
      // 같은 크리에이터도 허용하는 매칭
      const contender1 = availableContenders[0];
      const contender2 = availableContenders[1];

      try {
        const battleId = await createBattleFromContendersForce(
          contender1,
          contender2
        );

        return {
          success: true,
          matchesCreated: 1,
          message: "강제 매칭으로 배틀이 생성되었습니다.",
          battleId,
          note: "같은 크리에이터 콘텐츠로 매칭됨",
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          matchesCreated: 0,
        };
      }
    }

    // 서로 다른 크리에이터로 매칭
    const contender1 = differentCreators[0];
    const contender2 = differentCreators[1];

    try {
      const battleId = await createBattleFromContenders(contender1, contender2);

      return {
        success: true,
        matchesCreated: 1,
        message: "강제 매칭으로 배틀이 생성되었습니다.",
        battleId,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        matchesCreated: 0,
      };
    }
  } catch (error) {
    console.error("강제 매칭 시스템 오류:", error);
    return {
      success: false,
      reason: "system_error",
      message: "강제 매칭 시스템 오류가 발생했습니다.",
      error: error.message,
      matchesCreated: 0,
    };
  }
};

/**
 * 매칭 통계 조회
 */
export const getMatchingStatistics = async () => {
  try {
    const stats = {
      totalAvailableContenders: 0,
      totalActiveBattles: 0,
      categoryDistribution: {
        music: 0,
        fashion: 0,
        food: 0,
      },
      platformDistribution: {
        image: 0,
        youtube: 0,
        instagram: 0,
        tiktok: 0,
      },
      cooldownRemaining: 0,
      lastMatchingTime: new Date(),
      systemHealth: "active",
    };

    try {
      const contendersQuery = query(
        collection(db, "contenders"),
        where("status", "==", "available")
      );
      const contendersSnapshot = await getDocs(contendersQuery);
      stats.totalAvailableContenders = contendersSnapshot.size;

      contendersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const category = data.category || "general";
        const platform = data.platform || "image";

        if (stats.categoryDistribution[category] !== undefined) {
          stats.categoryDistribution[category]++;
        }

        if (stats.platformDistribution[platform] !== undefined) {
          stats.platformDistribution[platform]++;
        }
      });
    } catch (error) {
      console.log("Contenders collection query error:", error);
    }

    try {
      const activeBattlesQuery = query(
        collection(db, "battles"),
        where("status", "==", "ongoing")
      );
      const activeBattlesSnapshot = await getDocs(activeBattlesQuery);
      stats.totalActiveBattles = activeBattlesSnapshot.size;
    } catch (error) {
      console.log("Battles collection query error:", error);
    }

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error("매칭 통계 조회 오류:", error);
    return {
      success: false,
      error: error.message,
      stats: {
        totalAvailableContenders: 0,
        totalActiveBattles: 0,
        categoryDistribution: {
          music: 0,
          fashion: 0,
          food: 0,
        },
        platformDistribution: {
          image: 0,
          youtube: 0,
          instagram: 0,
          tiktok: 0,
        },
        cooldownRemaining: 0,
        systemHealth: "error",
      },
    };
  }
};
