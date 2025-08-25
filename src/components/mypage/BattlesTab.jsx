// components/mypage/BattlesTab.jsx - 내 배틀 탭
import React, { useState, useEffect } from "react";
import {
  Trophy,
  Heart,
  MessageCircle,
  Clock,
  Youtube,
  Instagram,
  Image as ImageIcon,
  TrendingUp,
  Eye,
  Play,
  Filter,
  Search,
  Calendar,
  BarChart3,
  ExternalLink,
  Award,
  Users,
} from "lucide-react";
import { getUserBattles } from "../../services/userService.js";
import toast from "react-hot-toast";

const BattlesTab = ({ userId }) => {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, completed
  const [sortBy, setSortBy] = useState("recent"); // recent, popular, votes
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUserBattles();
  }, [userId, filter]);

  const loadUserBattles = async () => {
    try {
      setLoading(true);
      const userBattles = await getUserBattles(userId, filter);
      setBattles(userBattles);
    } catch (error) {
      console.error("Error loading battles:", error);
      toast.error("배틀 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getContentIcon = (contentType) => {
    switch (contentType) {
      case "youtube":
        return <Youtube className="w-4 h-4 text-red-500" />;
      case "instagram":
        return <Instagram className="w-4 h-4 text-pink-500" />;
      default:
        return <ImageIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      music: "text-purple-400 bg-purple-500/20",
      fashion: "text-pink-400 bg-pink-500/20",
      food: "text-orange-400 bg-orange-500/20",
      other: "text-gray-400 bg-gray-500/20",
    };
    return colors[category] || colors.other;
  };

  const getStatusBadge = (battle) => {
    const now = new Date();
    const endDate = battle.endDate ? new Date(battle.endDate) : null;
    const isActive = !endDate || endDate > now;

    if (isActive) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
          진행중
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
          완료
        </span>
      );
    }
  };

  const getWinnerSide = (battle) => {
    const aVotes = battle.itemA?.votes || 0;
    const bVotes = battle.itemB?.votes || 0;

    if (aVotes === bVotes) return "tie";
    return aVotes > bVotes ? "A" : "B";
  };

  const filteredAndSortedBattles = battles
    .filter((battle) => {
      if (searchTerm) {
        return (
          battle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          battle.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.totalVotes || 0) - (a.totalVotes || 0);
        case "votes":
          return (b.viewCount || 0) - (a.viewCount || 0);
        case "recent":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  const getPerformanceStats = () => {
    if (battles.length === 0) return null;

    const totalVotes = battles.reduce(
      (sum, battle) => sum + (battle.totalVotes || 0),
      0
    );
    const totalViews = battles.reduce(
      (sum, battle) => sum + (battle.viewCount || 0),
      0
    );
    const activeBattles = battles.filter((battle) => {
      const endDate = battle.endDate ? new Date(battle.endDate) : null;
      return !endDate || endDate > new Date();
    }).length;

    const avgVotes = Math.round(totalVotes / battles.length);
    const avgViews = Math.round(totalViews / battles.length);

    return {
      totalBattles: battles.length,
      activeBattles,
      totalVotes,
      totalViews,
      avgVotes,
      avgViews,
    };
  };

  const stats = getPerformanceStats();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-2xl font-semibold">내가 만든 배틀</h3>

        <div className="flex flex-wrap gap-2">
          {/* 필터 */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none text-sm"
          >
            <option value="all">전체</option>
            <option value="active">진행중</option>
            <option value="completed">완료됨</option>
          </select>

          {/* 정렬 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none text-sm"
          >
            <option value="recent">최신순</option>
            <option value="popular">인기순</option>
            <option value="votes">조회수순</option>
          </select>
        </div>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="배틀 제목이나 카테고리로 검색..."
          className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
        />
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-400">총 배틀</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalBattles}</p>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-400">진행중</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {stats.activeBattles}
            </p>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-pink-500" />
              <span className="text-sm text-gray-400">총 투표</span>
            </div>
            <p className="text-2xl font-bold text-pink-400">
              {stats.totalVotes}
            </p>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-400">총 조회</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {stats.totalViews}
            </p>
          </div>
        </div>
      )}

      {/* 배틀 목록 */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-700/30 rounded-xl p-6"
            >
              <div className="h-6 bg-gray-600 rounded mb-4"></div>
              <div className="h-4 bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-600 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedBattles.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {searchTerm
              ? "검색 결과가 없습니다."
              : "아직 생성한 배틀이 없습니다."}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {searchTerm
              ? "다른 검색어를 시도해보세요."
              : "첫 번째 배틀을 만들어보세요!"}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredAndSortedBattles.map((battle) => {
            const winner = getWinnerSide(battle);
            const totalVotes =
              (battle.itemA?.votes || 0) + (battle.itemB?.votes || 0);

            return (
              <div
                key={battle.id}
                className="bg-gray-700/30 rounded-xl p-6 hover:bg-gray-700/50 transition-all group cursor-pointer"
                onClick={() => window.open(`/battle/${battle.id}`, "_blank")}
              >
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white group-hover:text-pink-400 transition-colors line-clamp-2">
                      {battle.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                          battle.category
                        )}`}
                      >
                        {battle.category}
                      </span>
                      {getStatusBadge(battle)}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* 배틀 콘텐츠 */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* A 사이드 */}
                  <div
                    className={`text-center p-3 rounded-lg border-2 transition-all ${
                      winner === "A"
                        ? "border-yellow-400 bg-yellow-400/10"
                        : winner === "tie"
                        ? "border-gray-400 bg-gray-400/10"
                        : "border-gray-600 bg-gray-600/10"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {getContentIcon(battle.itemA?.contentType)}
                      <span className="text-sm text-gray-300 truncate">
                        {battle.itemA?.title || "콘텐츠 A"}
                      </span>
                      {winner === "A" && (
                        <Award className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                    <p className="text-xl font-bold text-pink-500">
                      {battle.itemA?.votes || 0}
                    </p>
                    <p className="text-xs text-gray-400">
                      {totalVotes > 0
                        ? Math.round(
                            ((battle.itemA?.votes || 0) / totalVotes) * 100
                          )
                        : 0}
                      %
                    </p>
                  </div>

                  {/* B 사이드 */}
                  <div
                    className={`text-center p-3 rounded-lg border-2 transition-all ${
                      winner === "B"
                        ? "border-yellow-400 bg-yellow-400/10"
                        : winner === "tie"
                        ? "border-gray-400 bg-gray-400/10"
                        : "border-gray-600 bg-gray-600/10"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {getContentIcon(battle.itemB?.contentType)}
                      <span className="text-sm text-gray-300 truncate">
                        {battle.itemB?.title || "콘텐츠 B"}
                      </span>
                      {winner === "B" && (
                        <Award className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                    <p className="text-xl font-bold text-blue-500">
                      {battle.itemB?.votes || 0}
                    </p>
                    <p className="text-xs text-gray-400">
                      {totalVotes > 0
                        ? Math.round(
                            ((battle.itemB?.votes || 0) / totalVotes) * 100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>

                {/* 통계 */}
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {totalVotes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {battle.viewCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {battle.commentsCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {battle.participants?.length || 0}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(battle.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>

                {/* 성과 표시 */}
                {totalVotes > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">참여율</span>
                      <span className="text-green-400">
                        {Math.round(
                          (totalVotes / Math.max(battle.viewCount || 1, 1)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 평균 성과 카드 */}
      {stats && stats.totalBattles > 0 && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-xl p-6">
          <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            평균 성과
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-pink-400">
                {stats.avgVotes}
              </p>
              <p className="text-sm text-gray-400">평균 투표수</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {stats.avgViews}
              </p>
              <p className="text-sm text-gray-400">평균 조회수</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {Math.round(
                  (stats.avgVotes / Math.max(stats.avgViews, 1)) * 100
                )}
                %
              </p>
              <p className="text-sm text-gray-400">평균 참여율</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {Math.round((stats.activeBattles / stats.totalBattles) * 100)}%
              </p>
              <p className="text-sm text-gray-400">활성 배틀 비율</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BattlesTab;
