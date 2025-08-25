// components/PaymentStatusHandler.jsx - 간단한 결제 상태 처리
import React, { useEffect } from "react";
import {
  checkPaymentStatus,
  clearPaymentParams,
  updateSubscriptionStatus,
} from "../services/stripeService";
import toast from "react-hot-toast";

const PaymentStatusHandler = ({ userId, onSubscriptionUpdate }) => {
  useEffect(() => {
    if (userId) {
      handlePaymentStatus();
    }
  }, [userId]);

  const handlePaymentStatus = async () => {
    const paymentStatus = checkPaymentStatus();

    if (paymentStatus && userId) {
      if (paymentStatus.status === "success") {
        try {
          // Firebase에 구독 정보 업데이트
          const result = await updateSubscriptionStatus(
            userId,
            paymentStatus.planId,
            paymentStatus.sessionId
          );

          if (result.success) {
            toast.success("🎉 " + paymentStatus.message);

            // 구독 정보 새로고침
            if (onSubscriptionUpdate) {
              setTimeout(() => {
                onSubscriptionUpdate();
              }, 1000);
            }
          } else {
            toast.error("구독 정보 업데이트에 실패했습니다.");
          }
        } catch (error) {
          console.error("Payment processing error:", error);
          toast.error("결제 처리 중 오류가 발생했습니다.");
        }
      } else if (paymentStatus.status === "canceled") {
        toast.error(paymentStatus.message);
      }

      // URL에서 결제 관련 파라미터 제거
      clearPaymentParams();
    }
  };

  return null;
};

export default PaymentStatusHandler;
