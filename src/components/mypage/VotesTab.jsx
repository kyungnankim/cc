// components/mypage/VotesTab.jsx - 투표 내역 탭
import React, { useState, useEffect } from "react";
import {
  Heart,
  Clock,
  Trophy,
  ThumbsUp,
  Target,
  TrendingUp,
  Calendar,
  Filter,
  Search,
  Award,
  Zap,
  ExternalLink,
  BarChart3,
  Users,
  Eye,
} from "lucide-react";
import { getUserVotes } from "../../services/userService.js";
import toast from "react-hot-toast";

const VotesTab = ({ userId }) => {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, winner, loser
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("all"); // all, week, month, year

  useEffect(() => {
    loadUserVotes();
  }, [userId]);

  const loadUserVotes = async () => {
    try {
      setLoading(true);
      const userVotes = await getUserVotes(userId);

      // 실제 투표 데이터 형태로 변환 (실제 구현에서는 백엔드에서 제공)
      const enhancedVotes = userVotes.map((vote, index) => ({
        ...vote,
        // 임시 데이터 추가 (실제로는 데이터베이스에서 가져옴)
        selectedSide: Math.random() > 0.5 ? "A" : "B",
        isCorrectPrediction: Math.random() > 0.3,
        pointsEarned: Math.floor(Math.random() * 50) + 10,
        battleResult: Math.random() > 0.5 ? "A" : "B",
        confidence: Math.floor(Math.random() * 5) + 1, // 1-5
        battleEndDate: new Date(
          Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000
        ),
        totalVotes: Math.floor(Math.random() * 1000) + 100,
        myVoteNumber: Math.floor(Math.random() * 500) + 1,
      }));

      setVotes(enhancedVotes);
    } catch (error) {
      console.error("Error loading votes:", error);
      toast.error("투표 내역을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getTimeFilteredVotes = (votes) => {
    const now = new Date();
    return votes.filter((vote) => {
      const voteDate = new Date(vote.votedAt);
      switch (timeFilter) {
        case "week":
          return now - voteDate <= 7 * 24 * 60 * 60 * 1000;
        case "month":
          return now - voteDate <= 30 * 24 * 60 * 60 * 1000;
        case "year":
          return now - voteDate <= 365 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    });
  };

  const filteredVotes = getTimeFilteredVotes(votes)
    .filter((vote) => {
      // 검색 필터
      if (
        searchTerm &&
        !vote.battleTitle.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // 결과 필터
      switch (filter) {
        case "winner":
          return vote.isCorrectPrediction;
        case "loser":
          return !vote.isCorrectPrediction;
        default:
          return true;
      }
    })
    .sort((a, b) => new Date(b.votedAt) - new Date(a.votedAt));

  const getVoteStats = () => {
    if (votes.length === 0) return null;

    const timeFilteredVotes = getTimeFilteredVotes(votes);
    const correctPredictions = timeFilteredVotes.filter(
      (v) => v.isCorrectPrediction
    ).length;
    const totalPoints = timeFilteredVotes.reduce(
      (sum, v) => sum + (v.pointsEarned || 0),
      0
    );
    const averageConfidence =
      timeFilteredVotes.reduce((sum, v) => sum + (v.confidence || 0), 0) /
      timeFilteredVotes.length;

    return {
      totalVotes: timeFilteredVotes.length,
      correctPredictions,
      accuracy:
        timeFilteredVotes.length > 0
          ? Math.round((correctPredictions / timeFilteredVotes.length) * 100)
          : 0,
      totalPoints,
      averagePoints:
        timeFilteredVotes.length > 0
          ? Math.round(totalPoints / timeFilteredVotes.length)
          : 0,
      averageConfidence: Math.round(averageConfidence * 10) / 10,
    };
  };

  const stats = getVoteStats();

  const getConfidenceColor = (confidence) => {
    if (confidence >= 4) return "text-green-400 bg-green-500/20";
    if (confidence >= 3) return "text-yellow-400 bg-yellow-500/20";
    return "text-red-400 bg-red-500/20";
  };

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days === 0) return "오늘";
    if (days === 1) return "어제";
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return new Date(date).toLocaleDateString("ko-KR");
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-2xl font-semibold">투표 내역</h3>

        <div className="flex flex-wrap gap-2">
          {/* 시간 필터 */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none text-sm"
          >
            <option value="all">전체</option>
            <option value="week">최근 1주</option>
            <option value="month">최근 1개월</option>
            <option value="year">최근 1년</option>
          </select>

          {/* 결과 필터 */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none text-sm"
          >
            <option value="all">전체</option>
            <option value="winner">맞힌 예측</option>
            <option value="loser">틀린 예측</option>
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
          placeholder="배틀 제목으로 검색..."
          className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
        />
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-pink-500" />
              <span className="text-sm text-gray-400">총 투표</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalVotes}</p>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-400">정확도</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {stats.accuracy}%
            </p>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-400">획득 포인트</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">
              {stats.totalPoints}
            </p>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-400">평균 확신도</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">
              {stats.averageConfidence}/5
            </p>
          </div>
        </div>
      )}

      {/* 성과 요약 */}
      {stats && stats.totalVotes > 0 && (
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-400/30 rounded-xl p-6">
          <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            투표 성과 분석
          </h4>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h5 className="font-semibold mb-2">예측 정확도</h5>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.accuracy}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{stats.accuracy}%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {stats.correctPredictions}/{stats.totalVotes} 예측 성공
              </p>
            </div>

            <div>
              <h5 className="font-semibold mb-2">포인트 효율</h5>
              <p className="text-lg font-bold text-yellow-400">
                평균 {stats.averagePoints}pt
              </p>
              <p className="text-xs text-gray-400 mt-1">
                투표당 평균 획득 포인트
              </p>
            </div>

            <div>
              <h5 className="font-semibold mb-2">투표 신중도</h5>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full mr-1 ${
                        i <= stats.averageConfidence
                          ? "bg-purple-400"
                          : "bg-gray-600"
                      }`}
                    ></div>
                  ))}
                </div>
                <span className="text-sm">{stats.averageConfidence}/5</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">평균 확신도</p>
            </div>
          </div>
        </div>
      )}

      {/* 투표 목록 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-700/30 rounded-xl p-6"
            >
              <div className="h-6 bg-gray-600 rounded mb-4"></div>
              <div className="h-4 bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-600 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredVotes.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {searchTerm
              ? "검색 결과가 없습니다."
              : "아직 투표 내역이 없습니다."}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {searchTerm
              ? "다른 검색어를 시도해보세요."
              : "배틀에 참여해서 투표해보세요!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVotes.map((vote) => {
            const isBattleEnded = new Date() > new Date(vote.battleEndDate);
            const isWinner = vote.isCorrectPrediction;

            return (
              <div
                key={vote.id}
                className="bg-gray-700/30 rounded-xl p-6 hover:bg-gray-700/50 transition-all group cursor-pointer"
                onClick={() => window.open(`/battle/${vote.id}`, "_blank")}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white group-hover:text-pink-400 transition-colors">
                      {vote.battleTitle}
                    </h4>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                        {vote.category}
                      </span>

                      {isBattleEnded && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isWinner
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {isWinner ? "예측 성공" : "예측 실패"}
                        </span>
                      )}

                      {!isBattleEnded && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                          진행중
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* 투표 정보 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <ThumbsUp
                        className={`w-5 h-5 ${
                          vote.selectedSide === "A"
                            ? "text-pink-500"
                            : "text-blue-500"
                        }`}
                      />
                      <div>
                        <p className="font-semibold">
                          선택: {vote.selectedSide === "A" ? "왼쪽" : "오른쪽"}{" "}
                          콘텐츠
                        </p>
                        <p className="text-sm text-gray-400">
                          {vote.myVoteNumber}번째 투표
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(
                          vote.confidence
                        )}`}
                      >
                        확신도 {vote.confidence}/5
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full mr-1 ${
                              i <= vote.confidence
                                ? "bg-yellow-400"
                                : "bg-gray-600"
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="font-semibold text-yellow-400">
                          +{vote.pointsEarned} 포인트
                        </p>
                        <p className="text-sm text-gray-400">투표 참여 보상</p>
                      </div>
                    </div>
                  </div>

                  {/* 배틀 통계 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">총 투표수</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{vote.totalVotes}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        내 투표 시점
                      </span>
                      <span className="font-medium">
                        {formatDate(vote.votedAt)}
                      </span>
                    </div>

                    {isBattleEnded && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">최종 결과</span>
                        <span
                          className={`font-medium ${
                            vote.battleResult === vote.selectedSide
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {vote.battleResult === "A" ? "왼쪽" : "오른쪽"} 승리
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">배틀 상태</span>
                      <span
                        className={`font-medium ${
                          isBattleEnded ? "text-gray-400" : "text-blue-400"
                        }`}
                      >
                        {isBattleEnded ? "종료됨" : "진행중"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 추가 정보 */}
                {isWinner && isBattleEnded && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <div className="flex items-center gap-2 text-green-400">
                      <Trophy className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        정확한 예측으로 보너스 포인트 획득!
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 투표 팁 */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/30 rounded-xl p-6">
        <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          투표 성과 높이는 팁
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-pink-400 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">트렌드 파악하기</p>
                <p className="text-sm text-gray-400">
                  최근 인기 있는 콘텐츠 유형을 파악해보세요
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">초기 투표 참여</p>
                <p className="text-sm text-gray-400">
                  배틀 초반에 투표하면 더 많은 포인트를 얻을 수 있어요
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">콘텐츠 분석</p>
                <p className="text-sm text-gray-400">
                  조회수, 좋아요 등의 지표를 참고해보세요
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">다양한 카테고리 참여</p>
                <p className="text-sm text-gray-400">
                  여러 분야에 투표해서 경험을 쌓아보세요
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotesTab;
