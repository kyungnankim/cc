// components/mypage/SubscriptionTab.jsx - 구독 관리 탭
import React, { useState, useEffect } from "react";
import {
  Crown,
  CreditCard,
  Star,
  Check,
  X,
  Calendar,
  Receipt,
  Gift,
  Zap,
  Shield,
  TrendingUp,
  Loader2,
  AlertTriangle,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  SUBSCRIPTION_PLANS,
  createCheckoutSession,
  cancelSubscription,
  resumeSubscription,
  getPaymentHistory,
  checkUsageLimit,
  applyPromoCode,
} from "../../services/stripeService";
import toast from "react-hot-toast";

const SubscriptionTab = ({ userId, subscription, onSubscriptionUpdate }) => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [usageStats, setUsageStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, [userId]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [payments, battlesUsage] = await Promise.all([
        getPaymentHistory(userId),
        checkUsageLimit(userId, "battlesPerMonth"),
      ]);

      setPaymentHistory(payments);
      setUsageStats({ battlesThisMonth: battlesUsage });
    } catch (error) {
      console.error("Error loading subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      setActionLoading(true);
      const result = await createCheckoutSession(
        userId,
        planId,
        subscription?.email
      );

      if (result.success) {
        // Stripe Checkout으로 리디렉션됨 (새 탭에서)
        toast.success("결제 페이지로 이동합니다.");
      } else {
        toast.error(result.error || "결제 페이지 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("업그레이드 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (
      !window.confirm(
        "구독을 취소하시겠습니까? 현재 결제 기간이 끝날 때까지 서비스를 이용하실 수 있습니다."
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      const result = await cancelSubscription(userId);

      if (result.success) {
        toast.success(result.message);
        onSubscriptionUpdate();
      } else {
        toast.error(result.error || "구독 취소에 실패했습니다.");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("구독 취소 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setActionLoading(true);
      const result = await resumeSubscription(userId, "premium");

      if (result.success) {
        toast.success(result.message);
        onSubscriptionUpdate();
      } else {
        toast.error(result.error || "구독 재개에 실패했습니다.");
      }
    } catch (error) {
      console.error("Resume error:", error);
      toast.error("구독 재개 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error("프로모션 코드를 입력해주세요.");
      return;
    }

    try {
      setPromoLoading(true);
      const result = await applyPromoCode(userId, promoCode);

      if (result.success) {
        toast.success(result.message);
        setPromoCode("");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Promo code error:", error);
      toast.error("프로모션 코드 적용 중 오류가 발생했습니다.");
    } finally {
      setPromoLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 현재 구독 상태 */}
      <div>
        <h3 className="text-2xl font-semibold mb-6">구독 관리</h3>

        <div
          className={`p-6 rounded-xl border-2 ${
            subscription?.id === "free"
              ? "bg-gray-700/30 border-gray-600"
              : subscription?.id === "pro"
              ? "bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border-yellow-400/30"
              : "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-400/30"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {subscription?.id === "free" ? (
                <CreditCard className="w-8 h-8 text-gray-400" />
              ) : (
                <Crown
                  className={`w-8 h-8 ${
                    subscription?.id === "pro"
                      ? "text-yellow-400"
                      : "text-purple-400"
                  }`}
                />
              )}
              <div>
                <h4 className="text-xl font-bold">{subscription?.name}</h4>
                <p className="text-gray-400">
                  {subscription?.id === "free"
                    ? "무료로 기본 기능을 이용하세요"
                    : `월 ${formatPrice(subscription?.price)}원`}
                </p>
              </div>
            </div>

            {subscription?.status && (
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  subscription.status === "active"
                    ? "bg-green-500/20 text-green-400"
                    : subscription.status === "canceled"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {subscription.status === "active"
                  ? "활성"
                  : subscription.status === "canceled"
                  ? "취소됨"
                  : "대기중"}
              </div>
            )}
          </div>

          {subscription?.currentPeriodEnd && (
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <Calendar className="w-4 h-4" />
              <span>
                다음 결제일:{" "}
                {subscription.currentPeriodEnd.toLocaleDateString("ko-KR")}
              </span>
            </div>
          )}

          {/* 사용량 표시 */}
          {usageStats.battlesThisMonth && (
            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
              <h5 className="font-semibold mb-2">이번 달 사용량</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>배틀 생성</span>
                  <span>
                    {usageStats.battlesThisMonth.currentUsage} /{" "}
                    {usageStats.battlesThisMonth.limit === -1
                      ? "무제한"
                      : usageStats.battlesThisMonth.limit}
                  </span>
                </div>
                {usageStats.battlesThisMonth.limit !== -1 && (
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-pink-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (usageStats.battlesThisMonth.currentUsage /
                            usageStats.battlesThisMonth.limit) *
                            100
                        )}%`,
                      }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="flex gap-3">
            {subscription?.id === "free" ? (
              <>
                <button
                  onClick={() => handleUpgrade("premium")}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Crown className="w-4 h-4" />
                  )}
                  프리미엄 업그레이드
                </button>
                <button
                  onClick={() => handleUpgrade("pro")}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  프로 업그레이드
                </button>
              </>
            ) : subscription?.status === "canceled" ? (
              <button
                onClick={handleResume}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                구독 재개
              </button>
            ) : (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                구독 취소
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 플랜 비교 */}
      <div>
        <h4 className="text-xl font-semibold mb-6">플랜 비교</h4>
        <div className="grid md:grid-cols-3 gap-6">
          {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
            <div
              key={plan.id}
              className={`p-6 rounded-xl border-2 transition-all ${
                subscription?.id === plan.id
                  ? plan.id === "pro"
                    ? "border-yellow-400 bg-gradient-to-b from-yellow-400/10 to-orange-500/10"
                    : plan.id === "premium"
                    ? "border-purple-400 bg-gradient-to-b from-purple-500/10 to-pink-500/10"
                    : "border-gray-400 bg-gray-700/30"
                  : "border-gray-600 bg-gray-800/30 hover:border-gray-500"
              }`}
            >
              <div className="text-center mb-6">
                {plan.id === "pro" ? (
                  <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                ) : plan.id === "premium" ? (
                  <Star className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                ) : (
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                )}

                <h5 className="text-xl font-bold mb-2">{plan.name}</h5>
                <div className="text-3xl font-bold mb-1">
                  {plan.price === 0 ? "무료" : `₩${formatPrice(plan.price)}`}
                </div>
                {plan.price > 0 && (
                  <p className="text-sm text-gray-400">월 결제</p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {subscription?.id !== plan.id && plan.id !== "free" && (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={actionLoading}
                  className={`w-full py-3 rounded-lg font-medium transition-all disabled:opacity-50 ${
                    plan.id === "pro"
                      ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                  }`}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    `${plan.name}로 업그레이드`
                  )}
                </button>
              )}

              {subscription?.id === plan.id && (
                <div className="text-center py-3 text-green-400 font-medium">
                  현재 플랜
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 프로모션 코드 */}
      <div className="bg-gray-800/30 rounded-xl p-6">
        <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-pink-400" />
          프로모션 코드
        </h4>
        <p className="text-gray-400 text-sm mb-4">
          프로모션 코드를 입력하시면 특별 할인 혜택을 받으실 수 있습니다.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="프로모션 코드 입력"
            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
          />
          <button
            onClick={handlePromoCode}
            disabled={promoLoading || !promoCode.trim()}
            className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
          >
            {promoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "적용"
            )}
          </button>
        </div>
      </div>

      {/* 결제 내역 */}
      <div>
        <h4 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          결제 내역
        </h4>

        {paymentHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>결제 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentHistory.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      payment.status === "succeeded"
                        ? "bg-green-500/20 text-green-400"
                        : payment.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {payment.status === "succeeded" ? (
                      <Check className="w-4 h-4" />
                    ) : payment.status === "pending" ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {payment.description || "구독 결제"}
                    </p>
                    <p className="text-sm text-gray-400">
                      {payment.createdAt.toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ₩{formatPrice(payment.amount || 0)}
                  </p>
                  <p
                    className={`text-sm ${
                      payment.status === "succeeded"
                        ? "text-green-400"
                        : payment.status === "pending"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {payment.status === "succeeded"
                      ? "결제 완료"
                      : payment.status === "pending"
                      ? "결제 대기"
                      : "결제 실패"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 구독 혜택 안내 */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-xl p-6">
        <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          구독 혜택
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm">무제한 배틀 생성 (프리미엄/프로)</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm">광고 제거 (프리미엄/프로)</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-400" />
              <span className="text-sm">프리미엄 배지 (프리미엄/프로)</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-sm">상세 분석 리포트 (프리미엄/프로)</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-sm">API 액세스 (프로)</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-pink-400" />
              <span className="text-sm">전용 계정 매니저 (프로)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTab;
