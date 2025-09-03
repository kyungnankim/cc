import React, { useState, useEffect } from "react";
import {
  User,
  Trophy,
  Heart,
  Settings,
  Award,
  LogOut,
  Loader2,
  CreditCard,
  Crown,
  List, // ✅ 1. 아이콘 추가
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getUserStats } from "../services/userService.js";
import { getUserSubscription } from "../services/stripeService.js";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import toast from "react-hot-toast";

import ProfileTab from "./mypage/ProfileTab.jsx";
import BattlesTab from "./mypage/BattlesTab.jsx";
import MyContentTab from "./mypage/MyContentTab.jsx"; // ✅ 2. 새로 만든 컴포넌트 import
import VotesTab from "./mypage/VotesTab.jsx";
import PointsTab from "./mypage/PointsTab.jsx";
import SubscriptionTab from "./mypage/SubscriptionTab.jsx";
import SettingsTab from "./mypage/SettingsTab.jsx";
import PaymentStatusHandler from "./PaymentStatusHandler.jsx";

const MyPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [stats, setStats] = useState({
    totalVotes: 0,
    battlesCreated: 0,
    battlesWon: 0,
    points: 0,
  });
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [userStats, userSubscription] = await Promise.all([
        getUserStats(user.uid),
        getUserSubscription(user.uid),
      ]);
      setStats(userStats);
      setSubscription(userSubscription);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("사용자 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "프로필", icon: User },
    { id: "my-content", label: "내 콘텐츠", icon: List }, // ✅ 3. "내 콘텐츠" 탭 추가
    { id: "battles", label: "내 배틀", icon: Trophy },
    { id: "votes", label: "투표 내역", icon: Heart },
    { id: "points", label: "포인트", icon: Award },
    {
      id: "subscription",
      label: "구독 관리",
      icon: subscription?.id === "free" ? CreditCard : Crown,
    },
    { id: "settings", label: "설정", icon: Settings },
  ];

  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      try {
        await signOut(auth);
        toast.success("로그아웃되었습니다.");
        window.location.href = "/";
      } catch (error) {
        console.error("Logout error:", error);
        toast.error("로그아웃 중 오류가 발생했습니다.");
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-white">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <PaymentStatusHandler
        userId={user?.uid}
        onSubscriptionUpdate={loadUserData}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 프로필 헤더 */}
        <div className="bg-gray-800/50 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              {subscription && subscription.id !== "free" && (
                <div className="absolute -top-2 -right-2">
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      subscription.id === "pro"
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black"
                        : "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    }`}
                  >
                    {subscription.id === "pro" ? "PRO" : "PREMIUM"}
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  {user?.displayName || "사용자"}
                </h1>
                {subscription && subscription.id !== "free" && (
                  <Crown
                    className={`w-6 h-6 ${
                      subscription.id === "pro"
                        ? "text-yellow-400"
                        : "text-purple-400"
                    }`}
                  />
                )}
              </div>
              <p className="text-gray-400 mb-2">{user?.email}</p>
              {subscription && (
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      subscription.id === "free"
                        ? "bg-gray-700 text-gray-300"
                        : subscription.id === "pro"
                        ? "bg-gradient-to-r from-yellow-400/20 to-orange-500/20 text-yellow-400 border border-yellow-400/30"
                        : "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-400/30"
                    }`}
                  >
                    {subscription.name}
                  </span>
                </div>
              )}
              {loading ? (
                <div className="flex gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-8 w-12 bg-gray-700 rounded mb-1"></div>
                      <div className="h-4 w-16 bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-6">
                  <div>
                    <p className="text-2xl font-bold text-pink-500">
                      {stats.totalVotes}
                    </p>
                    <p className="text-sm text-gray-400">총 투표</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-500">
                      {stats.battlesCreated}
                    </p>
                    <p className="text-sm text-gray-400">생성한 배틀</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-500">
                      {stats.points}
                    </p>
                    <p className="text-sm text-gray-400">포인트</p>
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="bg-gray-700/50 px-4 py-2 rounded-lg mb-2">
                <p className="text-xs text-gray-400">시민권 번호</p>
                <p className="font-mono">
                  BS{user.uid.slice(-8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-pink-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === "subscription" && subscription?.id !== "free" && (
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="bg-gray-800/50 rounded-xl p-6">
          {activeTab === "profile" && <ProfileTab user={user} />}
          {activeTab === "my-content" && (
            <MyContentTab userId={user?.uid} />
          )}{" "}
          {/* ✅ 4. 탭 콘텐츠 렌더링 추가 */}
          {activeTab === "battles" && <BattlesTab userId={user?.uid} />}
          {activeTab === "votes" && <VotesTab userId={user?.uid} />}
          {activeTab === "points" && (
            <PointsTab userId={user?.uid} points={stats.points} />
          )}
          {activeTab === "subscription" && (
            <SubscriptionTab
              userId={user?.uid}
              subscription={subscription}
              onSubscriptionUpdate={loadUserData}
            />
          )}
          {activeTab === "settings" && <SettingsTab user={user} />}
        </div>
      </div>
    </div>
  );
};

export default MyPage;
