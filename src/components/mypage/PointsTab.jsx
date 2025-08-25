// components/mypage/PointsTab.jsx - 포인트 탭
import React, { useState, useEffect } from "react";
import {
  Star,
  Gift,
  Heart,
  Trophy,
  Award,
  TrendingUp,
  Calendar,
  Zap,
  Crown,
  ShoppingBag,
  ExternalLink,
  Clock,
  Target,
  Loader2,
  Users,
} from "lucide-react";
import { getUserPoints } from "../../services/userService.js";
import toast from "react-hot-toast";

const PointsTab = ({ userId, points }) => {
  const [pointHistory, setPointHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  useEffect(() => {
    loadPointHistory();
  }, [userId]);

  const loadPointHistory = async () => {
    try {
      setLoading(true);
      const history = await getUserPoints(userId);
      setPointHistory(history);
    } catch (error) {
      console.error("Error loading point history:", error);
      toast.error("포인트 내역을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getPointIcon = (type) => {
    switch (type) {
      case "vote":
        return <Heart className="w-5 h-5 text-pink-500" />;
      case "battle_create":
        return <Trophy className="w-5 h-5 text-purple-500" />;
      case "battle_win":
        return <Award className="w-5 h-5 text-yellow-500" />;
      case "daily_bonus":
        return <Gift className="w-5 h-5 text-green-500" />;
      case "referral":
        return <Users className="w-5 h-5 text-blue-500" />;
      default:
        return <Star className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPointTypeText = (type) => {
    switch (type) {
      case "vote":
        return "투표 참여";
      case "battle_create":
        return "배틀 생성";
      case "battle_win":
        return "배틀 승리";
      case "daily_bonus":
        return "일일 보너스";
      case "referral":
        return "친구 추천";
      case "purchase":
        return "구독 보너스";
      default:
        return "기타";
    }
  };

  const rewardItems = [
    {
      id: 1,
      name: "프리미엄 배지",
      description: "30일간 프리미엄 배지 사용",
      cost: 500,
      icon: <Crown className="w-6 h-6 text-yellow-400" />,
      category: "badge",
    },
    {
      id: 2,
      name: "프로필 테마",
      description: "특별한 프로필 테마 잠금 해제",
      cost: 300,
      icon: <Star className="w-6 h-6 text-purple-400" />,
      category: "theme",
    },
    {
      id: 3,
      name: "우선 투표권",
      description: "24시간 우선 투표 기회",
      cost: 200,
      icon: <Zap className="w-6 h-6 text-blue-400" />,
      category: "boost",
    },
    {
      id: 4,
      name: "배틀 부스트",
      description: "내 배틀을 추천 목록에 노출",
      cost: 400,
      icon: <TrendingUp className="w-6 h-6 text-green-400" />,
      category: "boost",
    },
  ];

  const getFilteredHistory = () => {
    const now = new Date();
    return pointHistory.filter((item) => {
      const itemDate = new Date(item.createdAt);
      switch (selectedPeriod) {
        case "week":
          return now - itemDate <= 7 * 24 * 60 * 60 * 1000;
        case "month":
          return now - itemDate <= 30 * 24 * 60 * 60 * 1000;
        case "year":
          return now - itemDate <= 365 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    });
  };

  const filteredHistory = getFilteredHistory();
  const periodPoints = filteredHistory.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* 포인트 현황 */}
      <div className="text-center py-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl">
        <h3 className="text-2xl font-semibold mb-2">보유 포인트</h3>
        <p className="text-6xl font-bold text-yellow-500 mb-4">{points}</p>
        <p className="text-gray-400">포인트로 특별한 혜택을 받아보세요!</p>
      </div>

      {/* 포인트 리워드 상점 */}
      <div>
        <h4 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          포인트 상점
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          {rewardItems.map((item) => (
            <div
              key={item.id}
              className="bg-gray-700/30 rounded-lg p-6 hover:bg-gray-700/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {item.icon}
                  <div>
                    <h5 className="font-semibold">{item.name}</h5>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="font-bold text-yellow-400">
                    {item.cost} 포인트
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (points >= item.cost) {
                      toast.success(`${item.name}를 구매했습니다!`);
                    } else {
                      toast.error("포인트가 부족합니다.");
                    }
                  }}
                  disabled={points < item.cost}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    points >= item.cost
                      ? "bg-yellow-500 text-black hover:bg-yellow-600"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {points >= item.cost ? "구매하기" : "포인트 부족"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 포인트 획득 방법 */}
      <div>
        <h4 className="text-xl font-semibold mb-4">포인트 획득 방법</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-6 h-6 text-pink-500" />
              <span className="font-semibold">투표 참여</span>
            </div>
            <p className="text-gray-400 text-sm">
              배틀에 투표하면 <span className="text-pink-400">+10 포인트</span>
            </p>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-purple-500" />
              <span className="font-semibold">배틀 생성</span>
            </div>
            <p className="text-gray-400 text-sm">
              새 배틀 생성 시{" "}
              <span className="text-purple-400">+50 포인트</span>
            </p>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-yellow-500" />
              <span className="font-semibold">배틀 승리</span>
            </div>
            <p className="text-gray-400 text-sm">
              내 콘텐츠 승리 시{" "}
              <span className="text-yellow-400">+100 포인트</span>
            </p>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-6 h-6 text-green-500" />
              <span className="font-semibold">일일 보너스</span>
            </div>
            <p className="text-gray-400 text-sm">
              매일 첫 로그인 시{" "}
              <span className="text-green-400">+20 포인트</span>
            </p>
          </div>
        </div>
      </div>

      {/* 포인트 내역 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-semibold">포인트 내역</h4>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none text-sm"
          >
            <option value="all">전체</option>
            <option value="week">최근 1주</option>
            <option value="month">최근 1개월</option>
            <option value="year">최근 1년</option>
          </select>
        </div>

        {selectedPeriod !== "all" && (
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mb-4">
            <p className="text-blue-400 text-sm">
              선택한 기간 동안 총{" "}
              <span className="font-bold">
                {periodPoints > 0 ? "+" : ""}
                {periodPoints}
              </span>{" "}
              포인트를 획득했습니다.
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-gray-700/30 rounded-lg p-4"
              >
                <div className="h-4 bg-gray-600 rounded mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">
              선택한 기간에 포인트 내역이 없습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((history) => (
              <div
                key={history.id}
                className="flex items-center justify-between bg-gray-700/30 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  {getPointIcon(history.type)}
                  <div>
                    <p className="font-medium">
                      {getPointTypeText(history.type)}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(history.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      history.amount > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {history.amount > 0 ? "+" : ""}
                    {history.amount}
                  </span>
                  <span className="text-gray-400 text-sm">포인트</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PointsTab;
