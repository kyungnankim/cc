// src/components/BattleDetail/BattleStats.jsx - 배틀 통계

import React from "react";
import {
  Users,
  TrendingUp,
  Clock,
  Eye,
  Share2,
  Heart,
  MessageCircle,
  Trophy,
  Target,
  Calendar,
  BarChart3,
} from "lucide-react";

const BattleStats = ({ battle, user }) => {
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = () => {
    if (battle.status === "ended") return null;

    const endTime = new Date(battle.endDate);
    const now = new Date();
    const diff = endTime - now;

    if (diff <= 0) return "종료됨";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  };

  const getEngagementRate = () => {
    const totalEngagement =
      (battle.totalVotes || 0) +
      (battle.commentsCount || 0) +
      (battle.sharesCount || 0);
    const views = battle.viewsCount || 1;
    return ((totalEngagement / views) * 100).toFixed(1);
  };

  const timeRemaining = getTimeRemaining();
  const engagementRate = getEngagementRate();

  const statsData = [
    {
      icon: Users,
      label: "총 투표수",
      value: formatNumber(battle.totalVotes || 0),
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Eye,
      label: "조회수",
      value: formatNumber(battle.viewsCount || 0),
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      icon: MessageCircle,
      label: "댓글",
      value: formatNumber(battle.commentsCount || 0),
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Heart,
      label: "좋아요",
      value: formatNumber(battle.likesCount || 0),
      color: "text-pink-400",
      bgColor: "bg-pink-500/10",
    },
    {
      icon: Share2,
      label: "공유",
      value: formatNumber(battle.sharesCount || 0),
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
    {
      icon: TrendingUp,
      label: "참여율",
      value: `${engagementRate}%`,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold">배틀 통계</h2>
      </div>

      {/* 메인 통계 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} rounded-xl p-4 transition-all hover:scale-105`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 배틀 정보 섹션 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* 시간 정보 */}
        <div className="bg-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="font-semibold">시간 정보</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">시작일</span>
              <span className="text-white">{formatDate(battle.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">종료일</span>
              <span className="text-white">{formatDate(battle.endDate)}</span>
            </div>
            {timeRemaining && (
              <div className="flex justify-between">
                <span className="text-gray-400">남은 시간</span>
                <span
                  className={`font-semibold ${
                    battle.status === "ended"
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {timeRemaining}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 배틀 현황 */}
        <div className="bg-gray-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-purple-400" />
            <span className="font-semibold">배틀 현황</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">상태</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  battle.status === "active"
                    ? "bg-green-500/20 text-green-400"
                    : battle.status === "ended"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {battle.status === "active"
                  ? "진행중"
                  : battle.status === "ended"
                  ? "종료됨"
                  : "대기중"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">카테고리</span>
              <span className="text-white capitalize">{battle.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">난이도</span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < (battle.difficulty || 3)
                        ? "bg-yellow-400"
                        : "bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 승부 현황 */}
      {battle.totalVotes > 0 && (
        <div className="bg-gradient-to-r from-pink-500/10 to-blue-500/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="font-semibold">실시간 승부 현황</span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* ItemA 현황 */}
            <div className="text-center">
              <div className="mb-2">
                <img
                  src={battle.itemA.imageUrl}
                  alt={battle.itemA.title}
                  className="w-16 h-16 object-cover rounded-lg mx-auto mb-2"
                />
                <h4 className="font-semibold">{battle.itemA.title}</h4>
              </div>
              <div className="text-3xl font-bold text-pink-400 mb-1">
                {battle.itemA.votes || 0}표
              </div>
              <div className="text-sm text-gray-400">
                {battle.totalVotes > 0
                  ? Math.round((battle.itemA.votes / battle.totalVotes) * 100)
                  : 0}
                %
              </div>
            </div>

            {/* ItemB 현황 */}
            <div className="text-center">
              <div className="mb-2">
                <img
                  src={battle.itemB.imageUrl}
                  alt={battle.itemB.title}
                  className="w-16 h-16 object-cover rounded-lg mx-auto mb-2"
                />
                <h4 className="font-semibold">{battle.itemB.title}</h4>
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {battle.itemB.votes || 0}표
              </div>
              <div className="text-sm text-gray-400">
                {battle.totalVotes > 0
                  ? Math.round((battle.itemB.votes / battle.totalVotes) * 100)
                  : 0}
                %
              </div>
            </div>
          </div>

          {/* 승부 차이 */}
          <div className="mt-4 text-center">
            <p className="text-gray-400">
              승부 차이:{" "}
              <span className="text-white font-semibold">
                {Math.abs(
                  (battle.itemA.votes || 0) - (battle.itemB.votes || 0)
                )}
                표
              </span>
            </p>
          </div>
        </div>
      )}

      {/* 배틀 생성자 정보 */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="flex items-center gap-4">
          <img
            src={battle.creatorAvatar || "/default-avatar.png"}
            alt={battle.creatorName}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold">{battle.creatorName}</p>
            <p className="text-sm text-gray-400">배틀 생성자</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-gray-400">생성일</p>
            <p className="text-sm text-white">{formatDate(battle.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleStats;
