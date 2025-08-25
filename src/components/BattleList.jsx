// src/components/BattleList.jsx - 콘텐츠 업로드 버튼 추가 버전

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import {
  Heart,
  MessageCircle,
  Trophy,
  TrendingUp,
  Clock,
  RefreshCw,
  Loader2,
  Zap,
  BarChart3,
  Timer,
  AlertCircle,
  Plus, // 추가된 아이콘
  Upload, // 추가된 아이콘
} from "lucide-react";
import {
  findAndCreateRandomBattle,
  getMatchingStatistics,
  executeForceMatching,
} from "../services/matchingService";
import ContentUpload from "./ContentUpload"; // ContentUpload 컴포넌트 import
import toast from "react-hot-toast";

const BattleList = () => {
  const navigate = useNavigate();
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("hot");
  const [matchingStats, setMatchingStats] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [lastMatchingAttempt, setLastMatchingAttempt] = useState(null);

  // 콘텐츠 업로드 모달 상태 추가
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchBattles = useCallback(async () => {
    setLoading(true);
    try {
      const battlesRef = collection(db, "battles");
      const q = query(battlesRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const battlesData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          itemA: data.itemA || { title: "", imageUrl: "", votes: 0 },
          itemB: data.itemB || { title: "", imageUrl: "", votes: 0 },
        };
      });
      setBattles(battlesData);
    } catch (error) {
      console.error("Error fetching battles:", error);
      toast.error("배틀 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMatchingStats = useCallback(async () => {
    try {
      const statsResult = await getMatchingStatistics();
      if (statsResult.success) {
        setMatchingStats(statsResult.stats);
      }
    } catch (error) {
      console.error("Error fetching matching stats:", error);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchBattles(), fetchMatchingStats()]);
      trySmartMatching();
    };

    loadInitialData();
  }, [fetchBattles, fetchMatchingStats]);

  // 스마트 매칭 실행
  const trySmartMatching = async (force = false) => {
    if (isMatching) return;

    setIsMatching(true);
    setLastMatchingAttempt(new Date());

    try {
      const result = force
        ? await executeForceMatching(3)
        : await findAndCreateRandomBattle({ maxMatches: 3 });

      if (result.success) {
        toast.success(
          `🎉 ${result.matchesCreated}개의 새로운 배틀이 생성되었습니다!`
        );

        await Promise.all([fetchBattles(), fetchMatchingStats()]);

        if (result.matchingScores && result.matchingScores.length > 0) {
          console.log("생성된 배틀들:", result.matchingScores);
        }
      } else {
        switch (result.reason) {
          case "cooldown":
            const nextTime = new Date(result.nextMatchingTime);
            const minutes = Math.ceil((nextTime - new Date()) / (1000 * 60));
            toast(
              `⏰ 매칭 쿨다운 중입니다. ${minutes}분 후 다시 시도해주세요.`
            );
            break;
          case "insufficient_contenders":
            toast(
              "📤 매칭할 콘텐츠가 부족합니다. 새로운 콘텐츠를 업로드해보세요!"
            );
            break;
          case "no_valid_matches":
            toast(
              "🔍 현재 매칭 가능한 조합이 없습니다. 잠시 후 다시 시도해주세요."
            );
            break;
          default:
            console.log("매칭 실패:", result.message);
        }
      }
    } catch (error) {
      console.error("Smart matching error:", error);
      toast.error("매칭 시스템 오류가 발생했습니다.");
    } finally {
      setIsMatching(false);
    }
  };

  // 콘텐츠 업로드 모달 열기
  const handleOpenUpload = () => {
    setShowUploadModal(true);
  };

  // 콘텐츠 업로드 모달 닫기
  const handleCloseUpload = () => {
    setShowUploadModal(false);
    // 업로드 완료 후 데이터 새로고침
    fetchBattles();
    fetchMatchingStats();
  };

  const filteredAndSortedBattles = battles
    .filter(
      (battle) => filter === "all" || battle.category.toLowerCase() === filter
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "hot":
          return (
            (b.likeCount || 0) +
            (b.commentCount || 0) -
            ((a.likeCount || 0) + (a.commentCount || 0))
          );
        case "new":
          return b.createdAt - a.createdAt;
        case "top":
          return (
            b.itemA.votes + b.itemB.votes - (a.itemA.votes + a.itemB.votes)
          );
        default:
          return 0;
      }
    });

  const getCategoryColor = (category = "") => {
    switch (category.toLowerCase()) {
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

  const getWinningPercentage = (itemA, itemB) => {
    const total = itemA.votes + itemB.votes;
    if (total === 0) return { left: 50, right: 50 };
    return {
      left: Math.round((itemA.votes / total) * 100),
      right: Math.round((itemB.votes / total) * 100),
    };
  };

  const handleBattleClick = (battleId) => {
    navigate(`/battle/${battleId}`);
  };

  const formatCooldownTime = (cooldownMs) => {
    if (cooldownMs <= 0) return "매칭 가능";
    const minutes = Math.ceil(cooldownMs / (1000 * 60));
    return `${minutes}분 후 가능`;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                지금 <span className="text-pink-500">서울</span>, 어떤 배틀 중?
              </h1>
              <p className="text-gray-400">
                음식, 패션, 음악까지 VS. 포맷으로 만나는 서울의 라이프스타일
              </p>
            </div>

            {/* 콘텐츠 업로드 버튼 */}
            <button
              onClick={handleOpenUpload}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg"
            >
              <Upload className="w-5 h-5" />
              <span className="font-semibold">콘텐츠 업로드</span>
            </button>
          </div>
        </div>

        {/* 매칭 상태 및 통계 카드 */}
        {matchingStats && (
          <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">
                    매칭 가능 콘텐츠
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {matchingStats.totalAvailableContenders}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Timer className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400">매칭 상태</span>
                </div>
                <p className="text-sm font-medium text-white">
                  {formatCooldownTime(matchingStats.cooldownRemaining)}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-gray-400">카테고리 분포</span>
                </div>
                <div className="text-xs text-gray-300">
                  {Object.entries(matchingStats.categoryDistribution || {}).map(
                    ([cat, count]) => (
                      <span key={cat} className="inline-block mr-2">
                        {cat}: {count}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => trySmartMatching(false)}
                  disabled={isMatching || matchingStats.cooldownRemaining > 0}
                  className={`flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg font-medium transition-all ${
                    isMatching || matchingStats.cooldownRemaining > 0
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
                  }`}
                >
                  {isMatching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      매칭 중...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      스마트 매칭
                    </>
                  )}
                </button>
              </div>

              {/* 추가 업로드 버튼 (작은 크기) */}
              <div className="text-center">
                <button
                  onClick={handleOpenUpload}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                >
                  <Plus className="w-4 h-4" />
                  업로드
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 필터 & 정렬 UI */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex gap-2">
            {["all", "music", "fashion", "food"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  filter === cat
                    ? "bg-pink-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {cat === "all"
                  ? "전체"
                  : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
            {[
              { value: "hot", label: "Hot", icon: TrendingUp },
              { value: "new", label: "New", icon: Clock },
              { value: "top", label: "Top", icon: Trophy },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSortBy(value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  sortBy === value
                    ? "bg-gray-700 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}

            <button
              onClick={fetchBattles}
              className="p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors"
              title="새로고침"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* 강제 매칭 버튼 (개발자/관리자용) */}
            <button
              onClick={() => trySmartMatching(true)}
              disabled={isMatching}
              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              title="강제 매칭 (쿨다운 무시)"
            >
              <AlertCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 배틀 그리드 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
          </div>
        ) : filteredAndSortedBattles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedBattles.map((battle) => {
              const percentage = getWinningPercentage(
                battle.itemA,
                battle.itemB
              );
              const isSmartMatched =
                battle.matchingMethod === "smart_algorithm";

              return (
                <div
                  key={battle.id}
                  onClick={() => handleBattleClick(battle.id)}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700 hover:border-pink-500/50 transition-all cursor-pointer group relative"
                >
                  {/* 스마트 매칭 배지 */}
                  {isSmartMatched && (
                    <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      AI
                    </div>
                  )}

                  <div className="relative h-48 overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-2">
                      <img
                        src={battle.itemA.imageUrl}
                        alt={battle.itemA.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <img
                        src={battle.itemB.imageUrl}
                        alt={battle.itemB.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>

                    {/* 그라데이션 오버레이 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* VS 중앙 배지 */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-gray-900/90 backdrop-blur-sm text-white font-bold text-xl px-3 py-1 rounded-lg border border-pink-500/50">
                        VS
                      </div>
                    </div>

                    {/* 카테고리 배지 */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                          battle.category
                        )}`}
                      >
                        {battle.category}
                      </span>
                    </div>

                    {/* 상태 배지 */}
                    {battle.status === "ended" && (
                      <div className="absolute top-3 right-3 bg-gray-900/80 text-gray-400 px-2 py-1 rounded text-xs font-medium">
                        종료됨
                      </div>
                    )}

                    {/* 매칭 점수 표시 (스마트 매칭인 경우) */}
                    {isSmartMatched && battle.matchingScore && (
                      <div className="absolute bottom-16 right-3 bg-purple-900/80 text-purple-200 px-2 py-1 rounded text-xs font-medium">
                        매칭점수: {Math.round(battle.matchingScore)}
                      </div>
                    )}

                    {/* 투표 진행 바 */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex justify-between text-white text-sm font-medium mb-1">
                        <span>{percentage.left}%</span>
                        <span>{percentage.right}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                        <div className="h-full flex">
                          <div
                            className="bg-pink-500 transition-all"
                            style={{ width: `${percentage.left}%` }}
                          />
                          <div
                            className="bg-blue-500 transition-all"
                            style={{ width: `${percentage.right}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 배틀 정보 */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 group-hover:text-pink-400 transition-colors line-clamp-2 h-12">
                      {battle.title}
                    </h3>

                    <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {battle.likeCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {battle.commentCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-4 h-4" />
                          {battle.totalVotes || 0}
                        </span>
                      </div>
                      <span className="text-gray-500 text-xs truncate max-w-[100px]">
                        {battle.creatorName}
                      </span>
                    </div>

                    {/* 배틀 메타 정보 */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(battle.createdAt).toLocaleDateString()}
                      </span>

                      {battle.viewCount && (
                        <span className="flex items-center gap-1">
                          👁️ {battle.viewCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-12 h-12 text-gray-600" />
              </div>
              <p className="text-2xl text-gray-500 mb-2">
                진행 중인 배틀이 없습니다.
              </p>
              <p className="text-gray-600 mb-6">
                새로운 콘텐츠를 업로드해서 배틀을 시작해보세요!
              </p>

              {/* 빈 상태일 때 업로드 버튼 */}
              <button
                onClick={handleOpenUpload}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
              >
                <Upload className="w-5 h-5" />첫 콘텐츠 업로드하기
              </button>
            </div>

            {/* 매칭 통계가 있을 때만 표시 */}
            {matchingStats && (
              <div className="bg-gray-800/30 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-white mb-4">
                  매칭 현황
                </h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>
                    매칭 가능한 콘텐츠: {matchingStats.totalAvailableContenders}
                    개
                  </p>
                  {matchingStats.totalAvailableContenders >= 2 ? (
                    <button
                      onClick={() => trySmartMatching(true)}
                      disabled={isMatching}
                      className="mt-4 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                      {isMatching ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          매칭 중...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          지금 매칭하기
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                      <p className="text-yellow-400 text-sm">
                        매칭하려면 최소 2개의 콘텐츠가 필요합니다.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 마지막 매칭 시도 정보 */}
        {lastMatchingAttempt && (
          <div className="text-center mt-8">
            <p className="text-xs text-gray-500">
              마지막 매칭 시도: {lastMatchingAttempt.toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>

      {/* 콘텐츠 업로드 모달 */}
      {showUploadModal && <ContentUpload onClose={handleCloseUpload} />}
    </div>
  );
};

export default BattleList;
