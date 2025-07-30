// MyPage.jsx - 마이페이지 컴포넌트 (완성 버전)
import React, { useState, useEffect } from "react";
import {
  User,
  Trophy,
  Heart,
  MessageCircle,
  Settings,
  Award,
  Calendar,
  CreditCard,
  LogOut,
  Camera,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Bell,
  Shield,
  Trash2,
  Gift,
  Star,
  Clock,
  TrendingUp,
  ThumbsUp,
  Loader2,
  Play,
  Youtube,
  Instagram,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  getUserStats,
  updateProfile,
  getUserBattles,
  getUserVotes,
  getUserPoints,
} from "../services/userService.js";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import toast from "react-hot-toast";

const MyPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [stats, setStats] = useState({
    totalVotes: 0,
    battlesCreated: 0,
    battlesWon: 0,
    points: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      const userStats = await getUserStats(user.uid);
      setStats(userStats);
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("통계를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "프로필", icon: User },
    { id: "battles", label: "내 배틀", icon: Trophy },
    { id: "votes", label: "투표 내역", icon: Heart },
    { id: "points", label: "포인트", icon: Award },
    ,
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
              <button className="absolute bottom-0 right-0 bg-pink-500 p-2 rounded-full hover:bg-pink-600 transition-colors">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {user?.displayName || "사용자"}
              </h1>
              <p className="text-gray-400 mb-4">{user?.email}</p>

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
              </button>
            );
          })}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="bg-gray-800/50 rounded-xl p-6">
          {activeTab === "profile" && <ProfileTab user={user} />}
          {activeTab === "battles" && <BattlesTab userId={user?.uid} />}
          {activeTab === "votes" && <VotesTab userId={user?.uid} />}
          {activeTab === "points" && (
            <PointsTab userId={user?.uid} points={stats.points} />
          )}
          {activeTab === "settings" && <SettingsTab user={user} />}
        </div>
      </div>
    </div>
  );
};

// 🔥 프로필 탭 - 프로필 정보 수정
const ProfileTab = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile(user.uid, formData);
      toast.success("프로필이 업데이트되었습니다!");
      setIsEditing(false);
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("프로필 업데이트에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">프로필 정보</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          {isEditing ? (
            <X className="w-4 h-4" />
          ) : (
            <Edit3 className="w-4 h-4" />
          )}
          {isEditing ? "취소" : "수정하기"}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              표시 이름
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
              />
            ) : (
              <p className="text-white bg-gray-700/50 px-4 py-3 rounded-lg">
                {user?.displayName || "설정되지 않음"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              이메일
            </label>
            <p className="text-gray-400 bg-gray-700/30 px-4 py-3 rounded-lg">
              {user?.email}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              위치
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="예: 서울, 대한민국"
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
              />
            ) : (
              <p className="text-white bg-gray-700/50 px-4 py-3 rounded-lg">
                {formData.location || "설정되지 않음"}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              자기소개
            </label>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="자신을 소개해보세요..."
                rows="4"
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none resize-none"
              />
            ) : (
              <p className="text-white bg-gray-700/50 px-4 py-3 rounded-lg min-h-[100px]">
                {formData.bio || "설정되지 않음"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              웹사이트
            </label>
            {isEditing ? (
              <input
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
              />
            ) : (
              <p className="text-white bg-gray-700/50 px-4 py-3 rounded-lg">
                {formData.website ? (
                  <a
                    href={formData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-400 hover:underline"
                  >
                    {formData.website}
                  </a>
                ) : (
                  "설정되지 않음"
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setIsEditing(false)}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      )}
    </div>
  );
};

// 🔥 내 배틀 탭
const BattlesTab = ({ userId }) => {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, completed

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">내가 만든 배틀</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
        >
          <option value="all">전체</option>
          <option value="active">진행중</option>
          <option value="completed">완료됨</option>
        </select>
      </div>

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
      ) : battles.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">아직 생성한 배틀이 없습니다.</p>
          <p className="text-gray-500 text-sm mt-2">
            첫 번째 배틀을 만들어보세요!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {battles.map((battle) => (
            <div
              key={battle.id}
              className="bg-gray-700/30 rounded-xl p-6 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">
                  {battle.title}
                </h4>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    battle.status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {battle.status === "active" ? "진행중" : "완료"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getContentIcon(battle.itemA?.contentType)}
                    <span className="text-sm text-gray-300">
                      {battle.itemA?.title}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-pink-500">
                    {battle.itemA?.votes || 0}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getContentIcon(battle.itemB?.contentType)}
                    <span className="text-sm text-gray-300">
                      {battle.itemB?.title}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-blue-500">
                    {battle.itemB?.votes || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {battle.totalVotes || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {battle.commentsCount || 0}
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(battle.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 🔥 투표 내역 탭
const VotesTab = ({ userId }) => {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserVotes();
  }, [userId]);

  const loadUserVotes = async () => {
    try {
      setLoading(true);
      const userVotes = await getUserVotes(userId);
      setVotes(userVotes);
    } catch (error) {
      console.error("Error loading votes:", error);
      toast.error("투표 내역을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold">투표 내역</h3>

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
      ) : votes.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">아직 투표 내역이 없습니다.</p>
          <p className="text-gray-500 text-sm mt-2">
            배틀에 참여해서 투표해보세요!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {votes.map((vote) => (
            <div key={vote.id} className="bg-gray-700/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-white">
                  {vote.battleTitle}
                </h4>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  {new Date(vote.votedAt).toLocaleDateString("ko-KR")}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-pink-500" />
                  <span className="text-pink-400 font-medium">
                    선택: {vote.selectedItem}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  카테고리: {vote.category}
                </div>
              </div>

              {vote.isWinner && (
                <div className="mt-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="text-yellow-400 text-sm font-medium">
                    승리한 선택!
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 🔥 포인트 탭
const PointsTab = ({ userId, points }) => {
  const [pointHistory, setPointHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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
      default:
        return "기타";
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl">
        <h3 className="text-2xl font-semibold mb-2">보유 포인트</h3>
        <p className="text-6xl font-bold text-yellow-500 mb-4">{points}</p>
        <p className="text-gray-400">포인트로 특별한 혜택을 받아보세요!</p>
      </div>

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

      <div>
        <h4 className="text-xl font-semibold mb-4">최근 포인트 내역</h4>
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
        ) : pointHistory.length === 0 ? (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">아직 포인트 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pointHistory.map((history) => (
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

// 🔥 설정 탭
const SettingsTab = ({ user }) => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      battleResults: true,
      newBattles: false,
      comments: true,
    },
    privacy: {
      profilePublic: true,
      showStats: true,
      allowMessages: true,
    },
    preferences: {
      theme: "dark",
      language: "ko",
      autoPlay: false,
    },
  });
  const [saving, setSaving] = useState(false);

  const handleNotificationChange = (key) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handlePrivacyChange = (key) => {
    setSettings((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key],
      },
    }));
  };

  const handlePreferenceChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      // 실제로는 사용자 설정을 저장하는 API 호출
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 임시 지연
      toast.success("설정이 저장되었습니다!");
    } catch (error) {
      console.error("Settings save error:", error);
      toast.error("설정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleAccountDelete = async () => {
    const confirmed = window.confirm(
      "정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다."
    );
    if (confirmed) {
      const doubleConfirm = window.confirm(
        "모든 데이터가 영구적으로 삭제됩니다.\n정말 진행하시겠습니까?"
      );
      if (doubleConfirm) {
        try {
          // 실제로는 계정 삭제 API 호출
          toast.success("계정 삭제 요청이 처리되었습니다.");
        } catch (error) {
          console.error("Account delete error:", error);
          toast.error("계정 삭제 요청에 실패했습니다.");
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-semibold">설정</h3>

      {/* 알림 설정 */}
      <div className="space-y-4">
        <h4 className="text-xl font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          알림 설정
        </h4>
        <div className="bg-gray-700/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">이메일 알림</p>
              <p className="text-sm text-gray-400">
                중요한 소식을 이메일로 받아보세요
              </p>
            </div>
            <button
              onClick={() => handleNotificationChange("email")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications.email ? "bg-pink-500" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications.email
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">배틀 결과 알림</p>
              <p className="text-sm text-gray-400">
                참여한 배틀의 결과를 알려드려요
              </p>
            </div>
            <button
              onClick={() => handleNotificationChange("battleResults")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications.battleResults
                  ? "bg-pink-500"
                  : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications.battleResults
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">새 배틀 알림</p>
              <p className="text-sm text-gray-400">
                관심 카테고리의 새 배틀을 알려드려요
              </p>
            </div>
            <button
              onClick={() => handleNotificationChange("newBattles")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications.newBattles
                  ? "bg-pink-500"
                  : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications.newBattles
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">댓글 알림</p>
              <p className="text-sm text-gray-400">
                내 콘텐츠에 댓글이 달리면 알려드려요
              </p>
            </div>
            <button
              onClick={() => handleNotificationChange("comments")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications.comments ? "bg-pink-500" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications.comments
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 개인정보 설정 */}
      <div className="space-y-4">
        <h4 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          개인정보 설정
        </h4>
        <div className="bg-gray-700/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">프로필 공개</p>
              <p className="text-sm text-gray-400">
                다른 사용자가 내 프로필을 볼 수 있어요
              </p>
            </div>
            <button
              onClick={() => handlePrivacyChange("profilePublic")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.privacy.profilePublic ? "bg-pink-500" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.privacy.profilePublic
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">통계 공개</p>
              <p className="text-sm text-gray-400">
                내 활동 통계를 다른 사용자에게 보여줘요
              </p>
            </div>
            <button
              onClick={() => handlePrivacyChange("showStats")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.privacy.showStats ? "bg-pink-500" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.privacy.showStats ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 환경 설정 */}
      <div className="space-y-4">
        <h4 className="text-xl font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          환경 설정
        </h4>
        <div className="bg-gray-700/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">언어</p>
              <p className="text-sm text-gray-400">사용할 언어를 선택하세요</p>
            </div>
            <select
              value={settings.preferences.language}
              onChange={(e) =>
                handlePreferenceChange("language", e.target.value)
              }
              className="bg-gray-600 text-white px-3 py-2 rounded-lg border border-gray-500 focus:border-pink-500 focus:outline-none"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">자동 재생</p>
              <p className="text-sm text-gray-400">
                YouTube 콘텐츠를 자동으로 재생해요
              </p>
            </div>
            <button
              onClick={() =>
                handlePreferenceChange(
                  "autoPlay",
                  !settings.preferences.autoPlay
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.preferences.autoPlay ? "bg-pink-500" : "bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.preferences.autoPlay
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 계정 관리 */}
      <div className="space-y-4">
        <h4 className="text-xl font-semibold flex items-center gap-2 text-red-400">
          <Trash2 className="w-5 h-5" />
          계정 관리
        </h4>
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-400">계정 삭제</p>
              <p className="text-sm text-gray-400">
                계정과 모든 데이터가 영구적으로 삭제됩니다
              </p>
            </div>
            <button
              onClick={handleAccountDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              계정 삭제
            </button>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end pt-6 border-t border-gray-700">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? "저장 중..." : "설정 저장"}
        </button>
      </div>
    </div>
  );
};

export default MyPage;
