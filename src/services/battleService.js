// battleService.js - 완전히 수정된 버전

import { auth, db } from "../firebase/config";
import { getFirestore } from "firebase/firestore";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  runTransaction,
  where,
  limit,
  orderBy,
  updateDoc,
  arrayUnion,
  query,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * 트렌딩 배틀 가져오기 (인덱스 오류 해결)
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
        limit(limitCount * 2) // 더 많이 가져와서 클라이언트에서 정렬
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
        // 먼저 totalVotes로 정렬
        if (b.totalVotes !== a.totalVotes) {
          return b.totalVotes - a.totalVotes;
        }
        // totalVotes가 같으면 viewCount로 정렬
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
 * 배틀 상세 정보 조회 (조회수 증가 포함) - 개선된 버전
 */
export const getBattleDetail = async (battleId, userId = null) => {
  try {
    const battleRef = doc(db, "battles", battleId);

    // 배틀 데이터 조회
    const battleDoc = await getDoc(battleRef);

    if (!battleDoc.exists()) {
      return {
        success: false,
        message: "배틀을 찾을 수 없습니다.",
        battle: null,
      };
    }

    const battleData = battleDoc.data();

    // 조회수 증가 (더 안전하게, transaction 대신 updateDoc 사용)
    setTimeout(async () => {
      try {
        if (userId) {
          // 로그인한 사용자: 중복 체크 후 증가
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
          // 비로그인 사용자: 단순 증가
          await updateDoc(battleRef, {
            viewCount: increment(1),
            lastViewAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        console.warn("조회수 업데이트 실패 (무시됨):", error);
      }
    }, 500); // 지연 시간 증가

    // 날짜 변환 및 데이터 정리
    const processedBattle = {
      id: battleDoc.id,
      ...battleData,
      createdAt: battleData.createdAt?.toDate() || new Date(),
      endDate: battleData.endsAt?.toDate() || new Date(),
      lastVoteAt: battleData.lastVoteAt?.toDate() || null,
      lastCommentAt: battleData.lastCommentAt?.toDate() || null,
      lastViewAt: battleData.lastViewAt?.toDate() || null,

      // 안전한 데이터 접근 및 YouTube 정보 추가
      itemA: {
        title: battleData.itemA?.title || "",
        imageUrl: battleData.itemA?.imageUrl || "",
        votes: battleData.itemA?.votes || 0,
        contenderId: battleData.itemA?.contenderId || null,
        creatorId: battleData.itemA?.creatorId || null,
        creatorName: battleData.itemA?.creatorName || "Unknown",
        contentType: battleData.itemA?.contentType || "image",
        youtubeId: battleData.itemA?.youtubeId || null,
        youtubeUrl: battleData.itemA?.youtubeUrl || null,
        instagramUrl: battleData.itemA?.instagramUrl || null,
        thumbnailUrl: battleData.itemA?.thumbnailUrl || null,
        description: battleData.itemA?.description || "",
      },
      itemB: {
        title: battleData.itemB?.title || "",
        imageUrl: battleData.itemB?.imageUrl || "",
        votes: battleData.itemB?.votes || 0,
        contenderId: battleData.itemB?.contenderId || null,
        creatorId: battleData.itemB?.creatorId || null,
        creatorName: battleData.itemB?.creatorName || "Unknown",
        contentType: battleData.itemB?.contentType || "image",
        youtubeId: battleData.itemB?.youtubeId || null,
        youtubeUrl: battleData.itemB?.youtubeUrl || null,
        instagramUrl: battleData.itemB?.instagramUrl || null,
        thumbnailUrl: battleData.itemB?.thumbnailUrl || null,
        description: battleData.itemB?.description || "",
      },

      // 기본값 설정
      totalVotes: battleData.totalVotes || 0,
      participants: battleData.participants || [],
      viewCount: battleData.viewCount || 0,
      likeCount: battleData.likeCount || 0,
      commentCount: battleData.commentCount || 0,
      shareCount: battleData.shareCount || 0,
      uniqueViewers: battleData.uniqueViewers || [],
      likedBy: battleData.likedBy || [],

      // 실시간 상태 정보 추가
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
 * createBattleFromContenders 함수 개선 (YouTube 정보 포함)
 */
export const createBattleFromContenders = async (contenderA, contenderB) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("로그인이 필요합니다.");

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
      creatorName: currentUser.displayName || currentUser.email.split("@")[0],
      title: `${contenderA.title} vs ${contenderB.title}`,
      category: contenderA.category,

      itemA: {
        title: contenderA.title,
        imageUrl: contenderA.imageUrl,
        votes: 0,
        contenderId: contenderA.id,
        creatorId: contenderA.creatorId,
        creatorName: contenderA.creatorName,
        // YouTube 정보 추가
        contentType: contenderA.contentType || "image",
        youtubeId: contenderA.youtubeId || null,
        youtubeUrl: contenderA.youtubeUrl || null,
        thumbnailUrl: contenderA.thumbnailUrl || null,
        instagramUrl: contenderA.instagramUrl || null,
        description: contenderA.description || "",
      },
      itemB: {
        title: contenderB.title,
        imageUrl: contenderB.imageUrl,
        votes: 0,
        contenderId: contenderB.id,
        creatorId: contenderB.creatorId,
        creatorName: contenderB.creatorName,
        // YouTube 정보 추가
        contentType: contenderB.contentType || "image",
        youtubeId: contenderB.youtubeId || null,
        youtubeUrl: contenderB.youtubeUrl || null,
        thumbnailUrl: contenderB.thumbnailUrl || null,
        instagramUrl: contenderB.instagramUrl || null,
        description: contenderB.description || "",
      },

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

    return battleRef.id;
  });
};

/**
 * 스마트 자동 매칭 실행
 */
// 매칭 디버깅을 위한 개선된 findAndCreateRandomBattle 함수

/**
 * 스마트 자동 매칭 실행 (디버깅 개선)
 */
/**
 * 개선된 스마트 자동 매칭 실행 (유연한 매칭 규칙)
 */
export const findAndCreateRandomBattle = async (options = {}) => {
  const {
    maxMatches = 3,
    allowSameCreator = false, // 같은 크리에이터 매칭 허용 여부
    allowCrossCategory = false, // 카테고리 간 매칭 허용 여부
  } = options;

  try {
    console.log(
      "🔍 매칭 시작 - maxMatches:",
      maxMatches,
      "allowSameCreator:",
      allowSameCreator,
      "allowCrossCategory:",
      allowCrossCategory
    );

    try {
      const contendersQuery = query(
        collection(db, "contenders"),
        where("status", "==", "available"),
        limit(maxMatches * 2)
      );

      const contendersSnapshot = await getDocs(contendersQuery);
      console.log("📊 조회된 contenders 수:", contendersSnapshot.size);

      if (contendersSnapshot.empty) {
        console.log("❌ 매칭 실패: 콘텐츠가 없음");
        return {
          success: false,
          reason: "insufficient_contenders",
          message: "매칭할 수 있는 콘텐츠가 부족합니다.",
          matchesCreated: 0,
        };
      }

      const availableContenders = contendersSnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("📋 콘텐츠:", {
          id: doc.id,
          title: data.title,
          category: data.category,
          creatorId: data.creatorId,
          status: data.status,
        });
        return {
          id: doc.id,
          ...data,
        };
      });

      if (availableContenders.length < 2) {
        console.log("❌ 매칭 실패: 콘텐츠 수 부족 (최소 2개 필요)");
        return {
          success: false,
          reason: "insufficient_contenders",
          message: "매칭할 수 있는 콘텐츠가 부족합니다. (최소 2개 필요)",
          matchesCreated: 0,
        };
      }

      let matchesCreated = 0;
      const matchingScores = [];
      const maxPossibleMatches = Math.min(
        maxMatches,
        Math.floor(availableContenders.length / 2)
      );

      console.log("🎯 최대 가능한 매칭 수:", maxPossibleMatches);

      // 1단계: 카테고리 내 + 다른 크리에이터 매칭 시도
      matchesCreated += await tryMatchingWithinCategories(
        availableContenders,
        maxMatches - matchesCreated,
        matchingScores,
        false // 같은 크리에이터 금지
      );

      console.log("🎯 1단계 후 매칭 수:", matchesCreated);

      // 2단계: 매칭이 부족하면 같은 크리에이터 매칭 허용 (카테고리 내)
      if (matchesCreated < maxMatches && allowSameCreator) {
        console.log("🔄 2단계: 같은 크리에이터 매칭 허용");
        matchesCreated += await tryMatchingWithinCategories(
          availableContenders,
          maxMatches - matchesCreated,
          matchingScores,
          true // 같은 크리에이터 허용
        );
        console.log("🎯 2단계 후 매칭 수:", matchesCreated);
      }

      // 3단계: 매칭이 부족하면 카테고리 간 매칭 허용
      if (matchesCreated < maxMatches && allowCrossCategory) {
        console.log("🔄 3단계: 카테고리 간 매칭 허용");
        matchesCreated += await tryCrossCategoryMatching(
          availableContenders,
          maxMatches - matchesCreated,
          matchingScores,
          allowSameCreator
        );
        console.log("🎯 3단계 후 매칭 수:", matchesCreated);
      }

      console.log(`\n📊 최종 매칭 결과: ${matchesCreated}개 생성`);

      if (matchesCreated === 0) {
        // 자동으로 더 유연한 매칭 제안
        console.log("🤖 자동 유연 매칭 시도...");
        const flexibleResult = await findAndCreateRandomBattle({
          maxMatches: 1,
          allowSameCreator: true,
          allowCrossCategory: true,
        });

        if (flexibleResult.success) {
          return flexibleResult;
        }

        // 실패 원인 분석
        const debugInfo = analyzeMatchingFailure(availableContenders);
        console.log("🔍 실패 원인 분석:", debugInfo);

        return {
          success: false,
          reason: "no_valid_matches",
          message:
            "현재 매칭 가능한 조합이 없습니다. 더 유연한 매칭을 허용하거나 다른 크리에이터의 콘텐츠를 추가해보세요.",
          matchesCreated: 0,
          debugInfo,
          suggestions: [
            "다른 크리에이터가 콘텐츠를 업로드하기를 기다리세요",
            "같은 크리에이터 매칭을 허용해보세요 (테스트용)",
            "카테고리 간 매칭을 허용해보세요",
          ],
        };
      }

      return {
        success: true,
        matchesCreated,
        matchingScores,
        message: `${matchesCreated}개의 배틀이 생성되었습니다.`,
      };
    } catch (error) {
      console.log("❌ Contenders collection does not exist yet");
      return {
        success: false,
        reason: "insufficient_contenders",
        message: "콘텐츠를 먼저 업로드해주세요.",
        matchesCreated: 0,
      };
    }
  } catch (error) {
    console.error("💥 스마트 매칭 오류:", error);
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
    // 이미 사용된 콘텐츠는 제외
    if (contender.status !== "available") return;

    const category = contender.category || "general";
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }
    categoryGroups[category].push(contender);
  });

  console.log(
    "📂 카테고리별 분포:",
    Object.entries(categoryGroups)
      .map(([cat, items]) => `${cat}: ${items.length}개`)
      .join(", ")
  );

  // 각 카테고리에서 매칭 시도
  for (const [category, contenders] of Object.entries(categoryGroups)) {
    console.log(
      `\n🔄 ${category} 카테고리 매칭 시도 (${contenders.length}개 콘텐츠)`
    );

    if (contenders.length < 2) {
      console.log(
        `⚠️  ${category} 카테고리: 콘텐츠 수 부족 (${contenders.length}개)`
      );
      continue;
    }

    if (matchesCreated >= maxMatches) {
      console.log(`⚠️  ${category} 카테고리: 이미 최대 매칭 수 달성`);
      break;
    }

    // 같은 카테고리 내에서 매칭
    const shuffled = [...contenders].sort(() => Math.random() - 0.5);
    console.log(
      "🔀 셔플된 순서:",
      shuffled.map((c) => `${c.title}(${c.creatorId.slice(0, 8)})`)
    );

    for (
      let i = 0;
      i < shuffled.length - 1 && matchesCreated < maxMatches;
      i += 2
    ) {
      const contender1 = shuffled[i];
      const contender2 = shuffled[i + 1];

      // 이미 사용된 콘텐츠는 건너뛰기
      if (
        contender1.status !== "available" ||
        contender2.status !== "available"
      ) {
        continue;
      }

      console.log(
        `\n🥊 매칭 시도: "${contender1.title}" vs "${contender2.title}"`
      );
      console.log(`   Creator1: ${contender1.creatorId.slice(0, 8)}...`);
      console.log(`   Creator2: ${contender2.creatorId.slice(0, 8)}...`);

      // 같은 크리에이터 체크
      if (!allowSameCreator && contender1.creatorId === contender2.creatorId) {
        console.log("❌ 매칭 실패: 같은 크리에이터");
        continue;
      }

      try {
        console.log("✅ 배틀 생성 시도...");
        const battleId = await createBattleFromContendersFlexible(
          contender1,
          contender2
        );

        // 매칭 점수 계산
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
        console.log(
          `🎉 배틀 생성 성공! ID: ${battleId} (점수: ${matchingScore})`
        );
      } catch (error) {
        console.error("💥 배틀 생성 실패:", error.message);
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

  // 사용 가능한 콘텐츠만 필터링
  const available = availableContenders.filter((c) => c.status === "available");

  console.log(`🌐 카테고리 간 매칭 시도 (${available.length}개 콘텐츠)`);

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

    console.log(
      `\n🌍 카테고리 간 매칭: "${contender1.title}"(${contender1.category}) vs "${contender2.title}"(${contender2.category})`
    );

    // 같은 크리에이터 체크
    if (!allowSameCreator && contender1.creatorId === contender2.creatorId) {
      console.log("❌ 매칭 실패: 같은 크리에이터");
      continue;
    }

    try {
      const battleId = await createBattleFromContendersFlexible(
        contender1,
        contender2
      );

      const matchingScore = calculateMatchingScore(contender1, contender2) - 20; // 카테고리 다름 패널티

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
      console.log(`🎉 카테고리 간 배틀 생성 성공! ID: ${battleId}`);
    } catch (error) {
      console.error("💥 카테고리 간 배틀 생성 실패:", error.message);
    }
  }

  return matchesCreated;
}

/**
 * 유연한 배틀 생성 (카테고리 및 크리에이터 제한 완화)
 */
export const createBattleFromContendersFlexible = async (
  contenderA,
  contenderB
) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("로그인이 필요합니다.");

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
      creatorName: currentUser.displayName || currentUser.email.split("@")[0],
      title: `${contenderA.title} vs ${contenderB.title}`,
      category: battleCategory,

      itemA: {
        title: contenderA.title,
        imageUrl: contenderA.imageUrl,
        votes: 0,
        contenderId: contenderA.id,
        creatorId: contenderA.creatorId,
        creatorName: contenderA.creatorName,
        contentType: contenderA.contentType || "image",
        youtubeId: contenderA.youtubeId || null,
        youtubeUrl: contenderA.youtubeUrl || null,
        thumbnailUrl: contenderA.thumbnailUrl || null,
        instagramUrl: contenderA.instagramUrl || null,
        description: contenderA.description || "",
        originalCategory: contenderA.category,
      },
      itemB: {
        title: contenderB.title,
        imageUrl: contenderB.imageUrl,
        votes: 0,
        contenderId: contenderB.id,
        creatorId: contenderB.creatorId,
        creatorName: contenderB.creatorName,
        contentType: contenderB.contentType || "image",
        youtubeId: contenderB.youtubeId || null,
        youtubeUrl: contenderB.youtubeUrl || null,
        thumbnailUrl: contenderB.thumbnailUrl || null,
        instagramUrl: contenderB.instagramUrl || null,
        description: contenderB.description || "",
        originalCategory: contenderB.category,
      },

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

    return battleRef.id;
  });
};

/**
 * 매칭 실패 원인 분석
 */
function analyzeMatchingFailure(availableContenders) {
  const totalContenders = availableContenders.length;
  const categories = {};
  const creators = {};

  availableContenders.forEach((contender) => {
    const category = contender.category || "general";
    const creatorId = contender.creatorId;

    categories[category] = (categories[category] || 0) + 1;
    creators[creatorId] = (creators[creatorId] || 0) + 1;
  });

  const possibleReasons = [];

  // 카테고리별 분석
  const categoriesWithMultiple = Object.entries(categories).filter(
    ([_, count]) => count >= 2
  );
  if (categoriesWithMultiple.length === 0) {
    possibleReasons.push("모든 카테고리에 콘텐츠가 2개 미만");
  }

  // 크리에이터별 분석
  const uniqueCreators = Object.keys(creators).length;
  if (uniqueCreators === 1) {
    possibleReasons.push("모든 콘텐츠가 같은 크리에이터");
  }

  return {
    totalContenders,
    categories: Object.entries(categories).map(([cat, count]) => ({
      category: cat,
      count,
    })),
    uniqueCreators,
    possibleReasons,
  };
}

/**
 * 즉시 매칭 실행 (테스트용 - 가장 유연한 설정)
 */
export const createBattleNow = async () => {
  console.log("🚀 즉시 매칭 실행 (모든 제한 해제)");

  const result = await findAndCreateRandomBattle({
    maxMatches: 1,
    allowSameCreator: true, // 같은 크리에이터 허용
    allowCrossCategory: true, // 카테고리 간 매칭 허용
  });

  return result;
};

/**
 * 매칭 문제 해결을 위한 강제 매칭 (카테고리 무시)
 */
export const forceCreateBattleAnyCategory = async (maxMatches = 1) => {
  try {
    console.log("🚀 강제 매칭 시작 (카테고리 무시)");

    const contendersQuery = query(
      collection(db, "contenders"),
      where("status", "==", "available"),
      limit(10) // 더 많이 가져와서 선택권 확보
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

    console.log(
      `📊 서로 다른 크리에이터 콘텐츠: ${differentCreators.length}개`
    );

    if (differentCreators.length < 2) {
      // 같은 크리에이터도 허용하는 매칭
      console.log("⚠️ 같은 크리에이터 매칭도 허용");
      const contender1 = availableContenders[0];
      const contender2 = availableContenders[1];

      try {
        // createBattleFromContenders를 수정해서 같은 크리에이터도 허용
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
        console.error("강제 매칭 실패:", error);
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
      console.error("강제 매칭 실패:", error);
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
 * 같은 크리에이터도 허용하는 배틀 생성 (강제용)
 */
export const createBattleFromContendersForce = async (
  contenderA,
  contenderB
) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("로그인이 필요합니다.");

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
      creatorName: currentUser.displayName || currentUser.email.split("@")[0],
      title: `${contenderA.title} vs ${contenderB.title}`,
      category: contenderA.category || contenderB.category || "general",

      itemA: {
        title: contenderA.title,
        imageUrl: contenderA.imageUrl,
        votes: 0,
        contenderId: contenderA.id,
        creatorId: contenderA.creatorId,
        creatorName: contenderA.creatorName,
        contentType: contenderA.contentType || "image",
        youtubeId: contenderA.youtubeId || null,
        youtubeUrl: contenderA.youtubeUrl || null,
        thumbnailUrl: contenderA.thumbnailUrl || null,
        instagramUrl: contenderA.instagramUrl || null,
        description: contenderA.description || "",
      },
      itemB: {
        title: contenderB.title,
        imageUrl: contenderB.imageUrl,
        votes: 0,
        contenderId: contenderB.id,
        creatorId: contenderB.creatorId,
        creatorName: contenderB.creatorName,
        contentType: contenderB.contentType || "image",
        youtubeId: contenderB.youtubeId || null,
        youtubeUrl: contenderB.youtubeUrl || null,
        thumbnailUrl: contenderB.thumbnailUrl || null,
        instagramUrl: contenderB.instagramUrl || null,
        description: contenderB.description || "",
      },

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

    return battleRef.id;
  });
};

/**
 * 콘텐츠 상태 확인 및 리셋 함수
 */
export const debugContenderStatus = async () => {
  try {
    const contendersQuery = query(collection(db, "contenders"));
    const snapshot = await getDocs(contendersQuery);

    const contenders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("📋 모든 콘텐츠 상태:");
    contenders.forEach((c) => {
      console.log(
        `- ${c.title}: status=${c.status}, creator=${c.creatorId?.slice(
          0,
          8
        )}, category=${c.category}`
      );
    });

    return {
      success: true,
      total: contenders.length,
      available: contenders.filter((c) => c.status === "available").length,
      inBattle: contenders.filter((c) => c.status === "in_battle").length,
      contenders,
    };
  } catch (error) {
    console.error("콘텐츠 상태 확인 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 모든 콘텐츠를 available 상태로 리셋
 */
export const resetAllContendersToAvailable = async () => {
  try {
    const contendersQuery = query(
      collection(db, "contenders"),
      where("status", "!=", "available")
    );

    const snapshot = await getDocs(contendersQuery);
    const batch = [];

    snapshot.docs.forEach((doc) => {
      batch.push(
        updateDoc(doc.ref, {
          status: "available",
          lastBattleId: null,
          updatedAt: serverTimestamp(),
        })
      );
    });

    await Promise.all(batch);

    return {
      success: true,
      resetCount: snapshot.size,
      message: `${snapshot.size}개 콘텐츠를 available 상태로 리셋했습니다.`,
    };
  } catch (error) {
    console.error("콘텐츠 상태 리셋 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
// 나머지 모든 기존 함수들
export const executeForceMatching = async (maxMatches = 5) => {
  try {
    const result = await findAndCreateRandomBattle({ maxMatches });
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
        const category = doc.data().category || "general";
        if (stats.categoryDistribution[category] !== undefined) {
          stats.categoryDistribution[category]++;
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
        cooldownRemaining: 0,
        systemHealth: "error",
      },
    };
  }
};

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

const uploadImage = async (imageFile) => {
  if (!imageFile) return null;

  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append(
    "upload_preset",
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  );

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
      }/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error(data.error?.message || "Cloudinary upload failed");
    }
  } catch (error) {
    console.error("Image upload error:", error);
    return null;
  }
};

export const uploadContender = async (formData, imageFile) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("로그인이 필요합니다.");
  }

  try {
    let imageUrl = null;

    if (formData.contentType === "image" && imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) {
        throw new Error("이미지 업로드에 실패했습니다.");
      }
    } else if (formData.contentType === "youtube" && formData.youtubeId) {
      imageUrl = "/images/popo.png";
    } else if (formData.contentType === "instagram" && formData.instagramUrl) {
      imageUrl = "/images/popo.png";
    } else {
      throw new Error("콘텐츠 정보가 올바르지 않습니다.");
    }

    const contenderData = {
      creatorId: currentUser.uid,
      creatorName: currentUser.displayName || currentUser.email.split("@")[0],
      title: formData.title,
      description: formData.description || "",
      imageUrl: imageUrl,
      category: formData.category,
      status: "available",
      createdAt: serverTimestamp(),
      contentType: formData.contentType || "image",

      ...(formData.contentType === "youtube" && {
        youtubeUrl: formData.youtubeUrl,
        youtubeId: formData.youtubeId,
        thumbnailUrl: `https://img.youtube.com/vi/${formData.youtubeId}/maxresdefault.jpg`,
      }),

      ...(formData.contentType === "instagram" && {
        instagramUrl: formData.instagramUrl,
      }),

      likeCount: 0,
      viewCount: 0,
      tags: formData.tags || [],
      battleCount: 0,
      updatedAt: serverTimestamp(),
      isActive: true,
    };

    const docRef = await addDoc(collection(db, "contenders"), contenderData);

    setTimeout(() => {
      findAndCreateRandomBattle({ maxMatches: 2 })
        .then((result) => {
          if (result.success) {
            console.log(
              `새 콘텐츠 업로드로 ${result.matchesCreated}개의 배틀이 생성되었습니다.`
            );
          }
        })
        .catch((error) => {
          console.error("Auto-matching after upload failed:", error);
        });
    }, 2000);

    return {
      success: true,
      contenderId: docRef.id,
      imageUrl: imageUrl,
      contentType: formData.contentType,
    };
  } catch (error) {
    console.error("Contender upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getUserContenders = async (userId, limitCount = 20) => {
  try {
    const q = query(
      collection(db, "contenders"),
      where("creatorId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const contenders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    }));

    return {
      success: true,
      contenders,
    };
  } catch (error) {
    console.error("사용자 contender 조회 오류:", error);
    return {
      success: false,
      error: error.message,
      contenders: [],
    };
  }
};

export const getAvailableContenders = async (
  category = null,
  limitCount = 50
) => {
  try {
    let q;

    if (category) {
      q = query(
        collection(db, "contenders"),
        where("status", "==", "available"),
        where("category", "==", category),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, "contenders"),
        where("status", "==", "available"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    const contenders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));

    return {
      success: true,
      contenders,
    };
  } catch (error) {
    console.error("Contender 목록 조회 오류:", error);
    return {
      success: false,
      error: error.message,
      contenders: [],
    };
  }
};

export const deleteContender = async (contenderId, userId) => {
  try {
    const contenderRef = doc(db, "contenders", contenderId);
    const contenderDoc = await getDoc(contenderRef);

    if (!contenderDoc.exists()) {
      throw new Error("콘텐츠를 찾을 수 없습니다.");
    }

    const contenderData = contenderDoc.data();

    if (contenderData.creatorId !== userId) {
      throw new Error("삭제 권한이 없습니다.");
    }

    if (contenderData.status === "in_battle") {
      throw new Error("배틀 진행 중인 콘텐츠는 삭제할 수 없습니다.");
    }

    await updateDoc(contenderRef, {
      status: "deleted",
      isActive: false,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Contender 삭제 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// 헬퍼 함수들
const calculateLiveStatus = (battleData) => {
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

const calculateTrendingScore = (battleData) => {
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

const calculateMatchingScore = (contender1, contender2) => {
  let score = 0;

  // 같은 카테고리 보너스
  if (contender1.category === contender2.category) {
    score += 50;
  }

  // 인기도 차이 고려 (너무 차이나지 않는 것이 좋음)
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

  // 랜덤 요소 추가
  score += Math.random() * 10;

  return Math.round(score);
};
