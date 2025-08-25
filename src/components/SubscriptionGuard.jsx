// components/SubscriptionGuard.jsx - 구독 제한 확인 컴포넌트
import React, { useState, useEffect } from "react";
import {
  checkUsageLimit,
  getUserSubscription,
} from "../services/stripeService";
import { Crown, Zap, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const SubscriptionGuard = ({
  userId,
  limitType,
  children,
  fallback = null,
  showUpgradeModal = false,
}) => {
  const [canAccess, setCanAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (userId && limitType) {
      checkAccess();
    }
  }, [userId, limitType]);

  const checkAccess = async () => {
    try {
      setLoading(true);
      const [usageResult, subscriptionResult] = await Promise.all([
        checkUsageLimit(userId, limitType),
        getUserSubscription(userId),
      ]);

      setUsage(usageResult);
      setSubscription(subscriptionResult);
      setCanAccess(usageResult.allowed);

      if (!usageResult.allowed && showUpgradeModal) {
        toast.error("플랜 제한에 도달했습니다. 업그레이드를 고려해보세요.");
      }
    } catch (error) {
      console.error("Access check failed:", error);
      setCanAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      fallback || (
        <UpgradePrompt
          subscription={subscription}
          usage={usage}
          limitType={limitType}
        />
      )
    );
  }

  return children;
};

// 업그레이드 안내 컴포넌트
const UpgradePrompt = ({ subscription, usage, limitType }) => {
  const getLimitMessage = () => {
    switch (limitType) {
      case "battlesPerMonth":
        return {
          title: "배틀 생성 제한",
          message: `이번 달 배틀 생성 한도(${usage.limit}개)에 도달했습니다.`,
          icon: <Zap className="w-8 h-8 text-yellow-400" />,
        };
      case "uploadsPerDay":
        return {
          title: "업로드 제한",
          message: `오늘 업로드 한도(${usage.limit}개)에 도달했습니다.`,
          icon: <AlertCircle className="w-8 h-8 text-orange-400" />,
        };
      default:
        return {
          title: "기능 제한",
          message: "이 기능을 사용하려면 플랜 업그레이드가 필요합니다.",
          icon: <Crown className="w-8 h-8 text-purple-400" />,
        };
    }
  };

  const limitInfo = getLimitMessage();

  return (
    <div className="bg-gray-800/50 rounded-xl p-8 text-center">
      <div className="mb-4">{limitInfo.icon}</div>

      <h3 className="text-xl font-semibold mb-2">{limitInfo.title}</h3>
      <p className="text-gray-400 mb-6">{limitInfo.message}</p>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => {
            // 구독 탭으로 이동
            window.location.href = "/mypage?tab=subscription";
          }}
          className="flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          <Crown className="w-4 h-4" />
          프리미엄 업그레이드
        </button>

        <button
          onClick={() => {
            window.location.href = "/mypage?tab=subscription";
          }}
          className="flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all"
        >
          <Zap className="w-4 h-4" />
          프로 업그레이드
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        현재 플랜: <span className="font-medium">{subscription?.name}</span>
        {usage?.currentUsage !== undefined && (
          <span className="block mt-1">
            사용량: {usage.currentUsage}/
            {usage.limit === -1 ? "무제한" : usage.limit}
          </span>
        )}
      </div>
    </div>
  );
};

export default SubscriptionGuard;
export { UpgradePrompt };
