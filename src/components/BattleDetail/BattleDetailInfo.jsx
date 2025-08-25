// src/components/BattleDetail/BattleDetailInfo.jsx - 배틀 정보 표시

import React from "react";
import { Calendar, Eye, Clock, Zap, Target } from "lucide-react";

const BattleDetailInfo = ({ battle }) => {
  const getDaysRemaining = () => {
    // battle.endsAt는 getBattleDetail에서 이미 Date 객체로 변환되었습니다.
    if (!battle.endsAt) return null;
    const endTime = new Date(battle.endsAt);
    const now = new Date();
    const diffInDays = Math.ceil((endTime - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffInDays);
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case "music":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30";
      case "fashion":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "food":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const isEnded = battle.status === "ended";
  const daysRemaining = getDaysRemaining();

  return (
    <div className="mb-8">
      {/* 배지 및 메타 정보 */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* 카테고리 배지 */}
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(
            battle.category
          )}`}
        >
          {battle.category}
        </span>

        {/* 스마트 매칭 배지 */}
        {battle.matchingMethod === "smart_algorithm" && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            AI 매칭
          </span>
        )}

        {/* 생성일 */}
        <span className="text-gray-500 text-sm flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {/* 수정: .toDate() 제거 */}
          {new Date(battle.createdAt).toLocaleDateString()}
        </span>

        {/* 조회수 */}
        <span className="text-gray-500 text-sm flex items-center gap-1">
          <Eye className="w-4 h-4" />
          {(battle.viewCount || 0).toLocaleString()} views
        </span>

        {/* 남은 시간 또는 종료 상태 */}
        {!isEnded && daysRemaining !== null ? (
          <span className="text-yellow-400 text-sm flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {daysRemaining === 0 ? "오늘 종료" : `${daysRemaining}일 남음`}
          </span>
        ) : isEnded ? (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
            종료됨
          </span>
        ) : null}
      </div>

      {/* 제목 및 작성자 */}
      <h1 className="text-3xl font-bold mb-2">{battle.title}</h1>
      <p className="text-gray-400 mb-4">by {battle.creatorName}</p>

      {/* 실시간 승부 상황 */}
      {battle.liveStatus && (
        <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">
              실시간 현황
            </span>
            {/* 수정: 옵셔널 체이닝으로 안전하게 접근 */}
            {battle.currentLeader?.lastUpdated && (
              <span className="text-xs text-gray-500">
                업데이트: {/* 수정: .toDate() 제거 */}
                {new Date(
                  battle.currentLeader.lastUpdated
                ).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-300 text-sm mb-1">
                {battle.liveStatus.message}
              </p>
              {battle.liveStatus.margin > 0 && (
                <p className="text-xs text-gray-500">
                  현재 {battle.liveStatus.margin}표 차이
                </p>
              )}
            </div>

            {battle.currentLeader && (
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  {battle.currentLeader.winner === "tie"
                    ? "동점"
                    : `${battle.currentLeader.percentage}% 앞서는 중`}
                </div>
                <div className="text-xs text-gray-500">
                  총 {battle.totalVotes || 0}표
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 매칭 점수 정보 (스마트 매칭인 경우) */}
      {battle.matchingMethod === "smart_algorithm" && battle.matchingScore && (
        <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-300">
              🤖 매칭 점수:{" "}
              <span className="font-bold">
                {Math.round(battle.matchingScore)}/100
              </span>
            </span>
            <span className="text-xs text-purple-400">
              {battle.matchingScore >= 80
                ? "최적 매칭"
                : battle.matchingScore >= 60
                ? "좋은 매칭"
                : "평균 매칭"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleDetailInfo;
