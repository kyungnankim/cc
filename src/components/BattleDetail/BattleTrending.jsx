// src/components/BattleDetail/BattleTrending.jsx - 관련 배틀 추천 (수정됨)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ← 추가
import {
  TrendingUp,
  Flame, // Fire 대신 Flame 사용
  Users,
  Clock,
  Eye,
  ArrowRight,
  Heart,
  MessageCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  Zap,
  Trophy,
  Target,
} from "lucide-react";
import {
  getTrendingBattles,
  getRelatedBattles,
} from "../../services/battleService";

const BattleTrending = ({ battle, onNavigate }) => {
  const navigate = useNavigate(); // ← 추가 (fallback용)
  const [trendingBattles, setTrendingBattles] = useState([]);
  const [relatedBattles, setRelatedBattles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("trending"); // trending, related, hot
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    loadTrendingData();
  }, [battle.id, activeTab]);

  // 🔧 안전한 네비게이션 함수
  const safeNavigate = (path) => {
    try {
      if (onNavigate && typeof onNavigate === "function") {
        onNavigate(path);
      } else if (navigate && typeof navigate === "function") {
        navigate(path);
      } else {
        // 마지막 fallback
        window.location.href = path;
      }
    } catch (error) {
      console.error("Navigation error:", error);
      // 완전 fallback
      window.location.href = path;
    }
  };

  const loadTrendingData = async () => {
    try {
      setLoading(true);

      if (activeTab === "trending") {
        const result = await getTrendingBattles(8);
        if (result.success) {
          setTrendingBattles(result.battles.filter((b) => b.id !== battle.id));
        }
      } else if (activeTab === "related") {
        const result = await getRelatedBattles(battle.id, battle.category, 8);
        if (result.success) {
          setRelatedBattles(result.battles);
        }
      }
    } catch (error) {
      console.error("추천 배틀 로드 오류:", error);
      // 🔧 에러 시 기본 데이터 제공
      if (activeTab === "trending") {
        setTrendingBattles([]);
      } else {
        setRelatedBattles([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (!num || num === 0) return "0";
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const getTimeRemaining = (endDate) => {
    if (!endDate) return "진행중";

    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;

    if (diff <= 0) return "종료됨";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}일 남음`;
    if (hours > 0) return `${hours}시간 남음`;
    return "곧 종료";
  };

  const getCurrentBattles = () => {
    switch (activeTab) {
      case "trending":
        return trendingBattles;
      case "related":
        return relatedBattles;
      default:
        return trendingBattles;
    }
  };

  const currentBattles = getCurrentBattles();
  const itemsPerSlide = 2;
  const maxSlides = Math.max(
    0,
    Math.ceil(currentBattles.length / itemsPerSlide) - 1
  );

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev >= maxSlides ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev <= 0 ? maxSlides : prev - 1));
  };

  const getVisibleBattles = () => {
    const startIndex = currentSlide * itemsPerSlide;
    return currentBattles.slice(startIndex, startIndex + itemsPerSlide);
  };

  const tabs = [
    {
      id: "trending",
      label: "트렌딩",
      icon: TrendingUp,
      color: "text-orange-400",
    },
    {
      id: "related",
      label: "관련 배틀",
      icon: Target,
      color: "text-blue-400",
    },
  ];

  return (
    <div className="bg-gray-800/50 rounded-2xl p-6">
      {/* 헤더와 탭 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Flame className="w-6 h-6 text-orange-400" />
          <h2 className="text-2xl font-bold">추천 배틀</h2>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex bg-gray-700/50 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentSlide(0);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-gray-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <tab.icon
                className={`w-4 h-4 ${activeTab === tab.id ? tab.color : ""}`}
              />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 배틀 카드 슬라이더 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-400 mt-2">추천 배틀을 불러오는 중...</p>
        </div>
      ) : currentBattles.length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">추천할 배틀이 없습니다.</p>
          <p className="text-gray-500 text-sm mt-2">
            {activeTab === "trending"
              ? "인기 배틀이 곧 업데이트됩니다."
              : "관련 배틀을 찾을 수 없습니다."}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* 슬라이더 컨트롤 */}
          {currentBattles.length > itemsPerSlide && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* 배틀 카드 그리드 */}
          <div className="grid md:grid-cols-2 gap-6">
            {getVisibleBattles().map((recommendedBattle, index) => (
              <div
                key={recommendedBattle.id}
                onClick={() => safeNavigate(`/battle/${recommendedBattle.id}`)} // 🔧 수정된 부분
                className="bg-gray-700/50 rounded-xl overflow-hidden hover:bg-gray-700/70 transition-all cursor-pointer group"
              >
                {/* 배틀 이미지 섹션 */}
                <div className="relative h-48">
                  <div className="grid grid-cols-2 h-full">
                    <div className="relative overflow-hidden">
                      <img
                        src={
                          recommendedBattle.itemA?.imageUrl ||
                          "/images/popo.png"
                        }
                        alt={recommendedBattle.itemA?.title || "Item A"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.src = "/images/popo.png";
                        }}
                      />
                      <div className="absolute inset-0 bg-pink-500/20"></div>
                    </div>
                    <div className="relative overflow-hidden">
                      <img
                        src={
                          recommendedBattle.itemB?.imageUrl ||
                          "/images/popo.png"
                        }
                        alt={recommendedBattle.itemB?.title || "Item B"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.src = "/images/popo.png";
                        }}
                      />
                      <div className="absolute inset-0 bg-blue-500/20"></div>
                    </div>
                  </div>

                  {/* 상태 배지 */}
                  <div className="absolute top-3 left-3">
                    {recommendedBattle.status === "active" ? (
                      <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        진행중
                      </div>
                    ) : (
                      <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        종료
                      </div>
                    )}
                  </div>

                  {/* HOT 배지 */}
                  {recommendedBattle.isHot && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      HOT
                    </div>
                  )}

                  {/* VS 오버레이 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/70 text-white px-4 py-2 rounded-full font-bold text-lg">
                      VS
                    </div>
                  </div>
                </div>

                {/* 배틀 정보 */}
                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {recommendedBattle.title || "제목 없음"}
                    </h3>
                    <p className="text-sm text-gray-400 capitalize">
                      {recommendedBattle.category || "general"}
                    </p>
                  </div>

                  {/* 항목 제목들 */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div className="text-pink-400 font-medium truncate">
                      {recommendedBattle.itemA?.title || "Item A"}
                    </div>
                    <div className="text-blue-400 font-medium truncate">
                      {recommendedBattle.itemB?.title || "Item B"}
                    </div>
                  </div>

                  {/* 통계 정보 */}
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {formatNumber(recommendedBattle.totalVotes || 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>
                          {formatNumber(
                            recommendedBattle.viewsCount ||
                              recommendedBattle.viewCount ||
                              0
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>
                          {formatNumber(
                            recommendedBattle.commentsCount ||
                              recommendedBattle.commentCount ||
                              0
                          )}
                        </span>
                      </div>
                    </div>

                    {/* 남은 시간 */}
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">
                        {getTimeRemaining(recommendedBattle.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* 호버 시 표시되는 더보기 버튼 */}
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        by {recommendedBattle.creatorName || "익명"}
                      </span>
                      <div className="flex items-center gap-1 text-blue-400 text-sm font-semibold">
                        <span>참여하기</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 슬라이더 인디케이터 */}
          {currentBattles.length > itemsPerSlide && (
            <div className="flex justify-center mt-6 gap-2">
              {[...Array(maxSlides + 1)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentSlide === index ? "bg-orange-400 w-6" : "bg-gray-600"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 더 많은 배틀 보기 */}
      <div className="mt-8 text-center">
        <button
          onClick={() => safeNavigate("/")} // 🔧 수정된 부분 (메인 페이지로 이동)
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
        >
          <TrendingUp className="w-5 h-5" />
          더 많은 배틀 탐색하기
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default BattleTrending;
