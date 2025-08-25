// src/services/stripeService.js - React 전용 Stripe 서비스

import { loadStripe } from "@stripe/stripe-js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

// Stripe 초기화
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// 구독 플랜 설정
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: "free",
    name: "무료 플랜",
    price: 0,
    priceId: null,
    features: [
      "월 10회 배틀 생성",
      "기본 콘텐츠 업로드",
      "커뮤니티 투표 참여",
      "기본 프로필 설정",
    ],
    limits: {
      battlesPerMonth: 10,
      uploadsPerDay: 5,
      storageGB: 1,
    },
  },
  PREMIUM: {
    id: "premium",
    name: "프리미엄 플랜",
    price: 9900,
    priceId: "price_premium_monthly_kr", // Stripe에서 생성한 실제 Price ID로 변경
    features: [
      "무제한 배틀 생성",
      "고화질 콘텐츠 업로드",
      "우선 투표권",
      "프리미엄 배지",
      "상세 분석 리포트",
      "광고 제거",
      "우선 고객 지원",
    ],
    limits: {
      battlesPerMonth: -1,
      uploadsPerDay: -1,
      storageGB: 50,
    },
  },
  PRO: {
    id: "pro",
    name: "프로 플랜",
    price: 19900,
    priceId: "price_pro_monthly_kr", // Stripe에서 생성한 실제 Price ID로 변경
    features: [
      "모든 프리미엄 기능",
      "브랜드 협업 도구",
      "고급 분석 대시보드",
      "커스텀 배틀 템플릿",
      "API 액세스",
      "전용 계정 매니저",
      "우선 피처 액세스",
    ],
    limits: {
      battlesPerMonth: -1,
      uploadsPerDay: -1,
      storageGB: 200,
    },
  },
};

/**
 * 사용자의 현재 구독 정보 가져오기
 */
export const getUserSubscription = async (userId) => {
  try {
    const subscriptionDoc = await getDoc(doc(db, "subscriptions", userId));

    if (subscriptionDoc.exists()) {
      const subscription = subscriptionDoc.data();

      // 구독 만료 확인
      if (
        subscription.currentPeriodEnd &&
        subscription.currentPeriodEnd.toDate() < new Date()
      ) {
        // 만료된 구독은 FREE로 변경
        await updateDoc(doc(db, "subscriptions", userId), {
          planId: "free",
          status: "expired",
          updatedAt: serverTimestamp(),
        });

        return {
          ...SUBSCRIPTION_PLANS.FREE,
          status: "expired",
          currentPeriodEnd: null,
        };
      }

      const plan =
        SUBSCRIPTION_PLANS[subscription.planId.toUpperCase()] ||
        SUBSCRIPTION_PLANS.FREE;

      return {
        ...plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd?.toDate(),
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      };
    }

    return {
      ...SUBSCRIPTION_PLANS.FREE,
      status: "active",
      currentPeriodEnd: null,
    };
  } catch (error) {
    console.error("Error getting user subscription:", error);
    return {
      ...SUBSCRIPTION_PLANS.FREE,
      status: "active",
      currentPeriodEnd: null,
    };
  }
};

/**
 * Stripe Checkout으로 구독 업그레이드
 */
export const createCheckoutSession = async (userId, planId, userEmail) => {
  try {
    const stripe = await stripePromise;
    const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];

    if (!plan || !plan.priceId) {
      throw new Error("유효하지 않은 플랜입니다.");
    }

    // Firebase에 결제 세션 정보 저장
    const sessionRef = await addDoc(collection(db, "paymentSessions"), {
      userId,
      planId,
      userEmail,
      amount: plan.price,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    // Stripe Checkout으로 리디렉션
    const { error } = await stripe.redirectToCheckout({
      lineItems: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      successUrl: `${window.location.origin}/mypage?session_id={CHECKOUT_SESSION_ID}&success=true&plan=${planId}`,
      cancelUrl: `${window.location.origin}/mypage?canceled=true`,
      customerEmail: userEmail,
      metadata: {
        userId: userId,
        planId: planId,
        sessionId: sessionRef.id,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error) {
    console.error("Checkout session creation error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 구독 상태를 수동으로 업데이트 (결제 성공 후)
 */
export const updateSubscriptionStatus = async (
  userId,
  planId,
  sessionId = null
) => {
  try {
    const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
    if (!plan) {
      throw new Error("유효하지 않은 플랜입니다.");
    }

    // 30일 후 만료일 설정
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    // 구독 정보 업데이트
    await setDoc(doc(db, "subscriptions", userId), {
      userId,
      planId: plan.id,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: currentPeriodEnd,
      stripeSessionId: sessionId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 결제 내역 저장
    await addDoc(collection(db, "payments"), {
      userId,
      sessionId,
      planId: plan.id,
      amount: plan.price,
      currency: "KRW",
      status: "succeeded",
      description: `${plan.name} 구독`,
      createdAt: serverTimestamp(),
    });

    // 사용자에게 구독 포인트 지급
    await addDoc(collection(db, "pointHistory"), {
      userId,
      type: "subscription",
      amount: plan.price / 100, // 결제 금액의 1% 포인트 지급
      description: `${plan.name} 구독 보너스`,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Subscription update error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 구독 취소 (즉시 취소)
 */
export const cancelSubscription = async (userId) => {
  try {
    const subscriptionRef = doc(db, "subscriptions", userId);
    const subscriptionDoc = await getDoc(subscriptionRef);

    if (!subscriptionDoc.exists()) {
      throw new Error("구독 정보를 찾을 수 없습니다.");
    }

    await updateDoc(subscriptionRef, {
      status: "canceled",
      canceledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: "구독이 취소되었습니다.",
    };
  } catch (error) {
    console.error("Subscription cancellation error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 구독 재개 (새로운 구독 시작)
 */
export const resumeSubscription = async (userId, planId) => {
  try {
    const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
    if (!plan) {
      throw new Error("유효하지 않은 플랜입니다.");
    }

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    await updateDoc(doc(db, "subscriptions", userId), {
      planId: plan.id,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: currentPeriodEnd,
      resumedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: "구독이 재개되었습니다.",
    };
  } catch (error) {
    console.error("Subscription resume error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 결제 내역 가져오기
 */
export const getPaymentHistory = async (userId) => {
  try {
    const q = query(
      collection(db, "payments"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error("Error getting payment history:", error);
    return [];
  }
};

/**
 * 사용량 체크 (플랜 제한 확인)
 */
export const checkUsageLimit = async (userId, limitType) => {
  try {
    const subscription = await getUserSubscription(userId);
    const limit = subscription.limits[limitType];

    if (limit === -1) {
      return {
        allowed: true,
        remaining: -1,
        limit: -1,
      };
    }

    let currentUsage = 0;

    if (limitType === "battlesPerMonth") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, "battles"),
        where("creatorId", "==", userId),
        where("createdAt", ">=", startOfMonth)
      );

      const snapshot = await getDocs(q);
      currentUsage = snapshot.size;
    }

    return {
      allowed: currentUsage < limit,
      remaining: Math.max(0, limit - currentUsage),
      limit,
      currentUsage,
    };
  } catch (error) {
    console.error("Error checking usage limit:", error);
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      currentUsage: 0,
    };
  }
};

/**
 * 프로모션 코드 적용
 */
export const applyPromoCode = async (userId, promoCode) => {
  try {
    // 미리 정의된 프로모션 코드들
    const validCodes = {
      WELCOME50: {
        discount: 50,
        type: "percentage",
        duration: 3,
        maxUses: 1000,
        description: "신규 가입 50% 할인",
      },
      FIRST10000: {
        discount: 10000,
        type: "amount",
        duration: 1,
        maxUses: 500,
        description: "첫 결제 10,000원 할인",
      },
      STUDENT30: {
        discount: 30,
        type: "percentage",
        duration: 6,
        maxUses: 200,
        description: "학생 할인 30%",
      },
    };

    const promo = validCodes[promoCode.toUpperCase()];
    if (!promo) {
      return {
        success: false,
        error: "유효하지 않은 프로모션 코드입니다.",
      };
    }

    // 사용자별 프로모션 코드 사용 확인
    const usageQuery = query(
      collection(db, "promoUsage"),
      where("userId", "==", userId),
      where("promoCode", "==", promoCode.toUpperCase())
    );

    const usageSnapshot = await getDocs(usageQuery);
    if (!usageSnapshot.empty) {
      return {
        success: false,
        error: "이미 사용한 프로모션 코드입니다.",
      };
    }

    // 프로모션 코드 사용 기록
    await addDoc(collection(db, "promoUsage"), {
      userId,
      promoCode: promoCode.toUpperCase(),
      discount: promo.discount,
      type: promo.type,
      duration: promo.duration,
      usedAt: serverTimestamp(),
    });

    // 사용자에게 포인트 지급 (프로모션 보너스)
    const bonusPoints =
      promo.type === "percentage"
        ? promo.discount * 10
        : Math.floor(promo.discount / 100);
    await addDoc(collection(db, "pointHistory"), {
      userId,
      type: "promo_bonus",
      amount: bonusPoints,
      description: `${promoCode} 프로모션 보너스`,
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      discount: promo.discount,
      type: promo.type,
      duration: promo.duration,
      bonusPoints,
      message: `프로모션 코드가 적용되었습니다! ${
        promo.type === "percentage"
          ? promo.discount + "%"
          : promo.discount + "원"
      } 할인 + ${bonusPoints} 포인트 지급`,
    };
  } catch (error) {
    console.error("Error applying promo code:", error);
    return {
      success: false,
      error: "프로모션 코드 적용 중 오류가 발생했습니다.",
    };
  }
};

/**
 * 결제 상태 확인 (URL 파라미터에서)
 */
export const checkPaymentStatus = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("session_id");
  const success = urlParams.get("success");
  const canceled = urlParams.get("canceled");
  const planId = urlParams.get("plan");

  if (success === "true" && sessionId && planId) {
    return {
      status: "success",
      sessionId,
      planId,
      message: "결제가 성공적으로 완료되었습니다!",
    };
  }

  if (canceled === "true") {
    return {
      status: "canceled",
      message: "결제가 취소되었습니다.",
    };
  }

  return null;
};

/**
 * URL에서 결제 상태 파라미터 제거
 */
export const clearPaymentParams = () => {
  const url = new URL(window.location);
  url.searchParams.delete("session_id");
  url.searchParams.delete("success");
  url.searchParams.delete("canceled");
  url.searchParams.delete("plan");
  window.history.replaceState({}, document.title, url.toString());
};

/**
 * 구독 혜택 확인
 */
export const getSubscriptionBenefits = (planId) => {
  const plan =
    SUBSCRIPTION_PLANS[planId?.toUpperCase()] || SUBSCRIPTION_PLANS.FREE;

  return {
    hasAdFree: planId !== "free",
    hasPrioritySupport: ["premium", "pro"].includes(planId),
    hasAnalytics: ["premium", "pro"].includes(planId),
    hasAPI: planId === "pro",
    hasCustomTemplates: planId === "pro",
    unlimitedBattles: plan.limits.battlesPerMonth === -1,
    storageGB: plan.limits.storageGB,
  };
};
