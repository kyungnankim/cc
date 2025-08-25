// hooks/useSubscription.js - 구독 관련 커스텀 훅
import { useState, useEffect } from "react";
import {
  getUserSubscription,
  checkUsageLimit,
} from "../services/stripeService";

export const useSubscription = (userId) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSubscription = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const subscriptionData = await getUserSubscription(userId);
      setSubscription(subscriptionData);
    } catch (err) {
      console.error("Failed to load subscription:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, [userId]);

  const refreshSubscription = () => {
    loadSubscription();
  };

  return {
    subscription,
    loading,
    error,
    refreshSubscription,
  };
};

export const useUsageLimit = (userId, limitType) => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkUsage = async () => {
    if (!userId || !limitType) return;

    try {
      setLoading(true);
      setError(null);
      const usageData = await checkUsageLimit(userId, limitType);
      setUsage(usageData);
    } catch (err) {
      console.error("Failed to check usage limit:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUsage();
  }, [userId, limitType]);

  const refreshUsage = () => {
    checkUsage();
  };

  return {
    usage,
    loading,
    error,
    refreshUsage,
    canUse: usage?.allowed || false,
    remaining: usage?.remaining || 0,
  };
};
