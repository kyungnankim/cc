import React, { useState } from "react";
import {
  Trophy,
  Clock,
  Play,
  Youtube,
  Instagram,
  Image,
  ThumbsUp,
} from "lucide-react";
import MediaPlayerModal from "../MediaPlayerModal";
import { voteOnBattle } from "../../services/battleService";
import toast from "react-hot-toast";

const BattleVSSection = ({
  battle,
  user,
  hasVoted,
  selectedSide,
  onVote,
  onBattleUpdate,
  onNavigate,
}) => {
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);

  const handleVote = async (choice) => {
    if (!user) {
      toast.error("투표하려면 로그인이 필요합니다.");
      onNavigate("/login");
      return;
    }

    if (hasVoted) {
      toast.error("이미 투표하셨습니다. 한 번만 투표할 수 있습니다.");
      return;
    }

    if (battle.status === "ended") {
      toast.error("종료된 배틀입니다.");
      return;
    }

    if (battle.participants?.includes(user.uid)) {
      toast.error("이미 이 배틀에 투표했습니다.");
      onVote(true, choice);
      return;
    }

    try {
      // 낙관적 업데이트 (UI를 먼저 변경)
      const newBattle = { ...battle };
      newBattle[choice].votes += 1;
      newBattle.totalVotes += 1;
      newBattle.participants = [...(newBattle.participants || []), user.uid];

      const itemAVotes = newBattle.itemA.votes;
      const itemBVotes = newBattle.itemB.votes;
      const total = newBattle.totalVotes;

      newBattle.currentLeader = {
        winner:
          itemAVotes > itemBVotes
            ? "itemA"
            : itemBVotes > itemAVotes
            ? "itemB"
            : "tie",
        percentage:
          total > 0
            ? Math.round((Math.max(itemAVotes, itemBVotes) / total) * 100)
            : 50,
        margin: Math.abs(itemAVotes - itemBVotes),
        lastUpdated: new Date(),
      };

      onBattleUpdate(newBattle);
      onVote(true, choice);

      // 서버에 실제 투표 요청
      const result = await voteOnBattle(battle.id, choice);

      if (result.success) {
        toast.success("투표가 완료되었습니다! (+10 포인트)");
      } else {
        throw new Error(result.error || "투표 처리 실패");
      }
    } catch (error) {
      console.error("투표 오류:", error);

      if (error.message.includes("이미 이 배틀에 투표했습니다")) {
        toast.error("이미 투표하셨습니다.");
        onVote(true, choice);
      } else {
        toast.error("투표 중 오류가 발생했습니다.");
        // 실패 시 원래 상태로 롤백
        onBattleUpdate(battle);
        onVote(false, null);
      }
    }
  };

  // ✅ FIX: 새로운 데이터와 옛날 데이터 구조를 모두 처리하도록 로직 개선
  const handleItemImageClick = (item) => {
    console.log("🖱️ 아이템 클릭:", item);

    // 1. contentItems 배열이 있는지 확인하고, 없으면 예전 데이터로 간주하여 임시 배열 생성
    if (!item.contentItems || item.contentItems.length === 0) {
      console.log("🖼️ 단일 콘텐츠 구조를 배열로 변환 (하위 호환성)");
      const fallbackItem = {
        ...item, // title, creatorName 등 기본 정보 유지
        contentItems: [
          {
            // 모달이 요구하는 배열 형태로 변환
            type: item.platform || "image",
            platform: item.platform || "image",
            imageUrl: item.imageUrl,
            thumbnailUrl: item.thumbnailUrl || item.imageUrl,
            extractedData: item.extractedData,
            timeSettings: item.timeSettings,
            youtubeId: item.youtubeId,
            mediaUrl: item.youtubeUrl || item.mediaUrl,
          },
        ],
      };
      setSelectedItemForModal(fallbackItem);
    } else {
      // 2. 새로운 데이터 구조(contentItems 배열 존재)면 그대로 사용
      console.log(
        "✅ 새로운 contentItems 구조 감지:",
        item.contentItems.length,
        "개"
      );
      setSelectedItemForModal(item);
    }

    setShowMediaModal(true);
  };

  const getWinningPercentage = () => {
    const total = (battle.itemA.votes || 0) + (battle.itemB.votes || 0);
    if (total === 0) return { left: 50, right: 50 };
    return {
      left: Math.round(((battle.itemA.votes || 0) / total) * 100),
      right: Math.round(((battle.itemB.votes || 0) / total) * 100),
    };
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case "youtube":
        return <Youtube className="w-4 h-4 text-red-500" />;
      case "instagram":
        return <Instagram className="w-4 h-4 text-pink-500" />;
      case "tiktok":
        return (
          <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">
            T
          </div>
        );
      case "image":
      default:
        return <Image className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPlatformName = (platform) => {
    switch (platform) {
      case "youtube":
        return "YouTube";
      case "instagram":
        return "Instagram";
      case "tiktok":
        return "TikTok";
      case "image":
      default:
        return "이미지";
    }
  };

  const getMediaThumbnail = (item) => {
    return item.imageUrl || item.thumbnailUrl || "/images/popo.png";
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const percentage = getWinningPercentage();
  const totalVotes = (battle.itemA.votes || 0) + (battle.itemB.votes || 0);
  const isEnded = battle.status === "ended";

  const renderContentItem = (item, choice, isLeft = true) => {
    const isSelected = selectedSide === choice;
    const isWinner = isEnded && battle.finalResult?.winner === choice;
    const percentageValue = isLeft ? percentage.left : percentage.right;
    const gradientColor = isLeft ? "pink" : "blue";
    const platform = item.platform || "image";

    return (
      <div className="space-y-4">
        <div
          onClick={() => handleItemImageClick(item)}
          className={`group relative rounded-xl overflow-hidden transition-all cursor-pointer ${
            isSelected
              ? `ring-4 ring-${gradientColor}-500`
              : "hover:scale-[1.02]"
          } ${hasVoted && !isSelected ? "opacity-70" : ""}`}
          title={`클릭하여 ${getPlatformName(platform)} 콘텐츠 보기`}
        >
          <img
            src={getMediaThumbnail(item)}
            alt={item.title}
            className="w-full h-64 object-cover"
            loading="lazy"
            onError={(e) => {
              if (platform === "youtube") {
                e.target.src = `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`;
              } else {
                e.target.src = "/images/popo.png";
              }
            }}
          />
          {platform === "youtube" && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-all group-hover:bg-black/40">
              <div className="bg-red-600 hover:bg-red-700 rounded-full p-3 transition-all transform group-hover:scale-110 shadow-lg">
                <Play className="w-6 h-6 text-white fill-current ml-0.5" />
              </div>
            </div>
          )}
          {isWinner && (
            <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded-full font-bold flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              Winner
            </div>
          )}
          {hasVoted && isSelected && (
            <div
              className={`absolute top-4 left-4 bg-${gradientColor}-500 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1`}
            >
              <ThumbsUp className="w-4 h-4" />내 선택
            </div>
          )}
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
          <p className="text-sm text-gray-400 mb-2">by {item.creatorName}</p>
          {hasVoted && (
            <>
              <div
                className={`text-3xl font-bold text-${gradientColor}-500 mb-2`}
              >
                {percentageValue}%
              </div>
              <p className="text-gray-400">
                {(item.votes || 0).toLocaleString()} 표
              </p>
            </>
          )}
        </div>
        {!hasVoted && !isEnded && (
          <button
            onClick={() => handleVote(choice)}
            disabled={hasVoted}
            className={`w-full py-3 font-semibold rounded-lg transition-all transform ${
              hasVoted
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : `bg-gradient-to-r from-${gradientColor}-500 to-${gradientColor}-600 text-white hover:from-${gradientColor}-600 hover:to-${gradientColor}-700 hover:scale-105`
            }`}
          >
            {hasVoted ? "투표 완료" : "이 항목에 투표"}
          </button>
        )}
        {hasVoted && (
          <div className="w-full py-3 bg-gray-700 text-gray-300 font-semibold rounded-lg text-center">
            투표 완료
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {selectedItemForModal && (
        <MediaPlayerModal
          isOpen={showMediaModal}
          onClose={() => {
            setShowMediaModal(false);
            setSelectedItemForModal(null);
          }}
          postData={selectedItemForModal}
          contentItems={selectedItemForModal.contentItems}
        />
      )}

      <div className="bg-gray-800/50 rounded-2xl p-6 mb-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {getPlatformIcon(battle.itemA.platform || "image")}
              <span>{getPlatformName(battle.itemA.platform || "image")}</span>
            </div>
            <span className="text-gray-600">VS</span>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              {getPlatformIcon(battle.itemB.platform || "image")}
              <span>{getPlatformName(battle.itemB.platform || "image")}</span>
            </div>
          </div>
          {battle.itemA.platform !== battle.itemB.platform && (
            <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-700/50 rounded-full px-4 py-2 text-sm">
              <span className="text-purple-400">크로스 플랫폼 배틀</span>
            </div>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {renderContentItem(battle.itemA, "itemA", true)}
          {renderContentItem(battle.itemB, "itemB", false)}
        </div>
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white px-8 py-3 rounded-full font-bold text-2xl shadow-lg">
            VS
          </div>
        </div>
        {hasVoted && (
          <div className="bg-gray-700 rounded-full h-6 mb-4 overflow-hidden">
            <div className="h-full flex">
              <div
                className="bg-gradient-to-r from-pink-500 to-pink-600 transition-all duration-500 ease-out flex items-center justify-center text-white text-sm font-semibold"
                style={{ width: `${percentage.left}%` }}
              >
                {percentage.left > 15 && `${percentage.left}%`}
              </div>
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out flex items-center justify-center text-white text-sm font-semibold"
                style={{ width: `${percentage.right}%` }}
              >
                {percentage.right > 15 && `${percentage.right}%`}
              </div>
            </div>
          </div>
        )}
        <div className="text-center text-gray-400">
          <p className="text-lg">
            총{" "}
            <span className="font-semibold text-white">
              {totalVotes.toLocaleString()}
            </span>
            명이 투표했습니다
          </p>
        </div>
        {isEnded && battle.finalResult && (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-500 font-semibold">배틀 종료</span>
            </div>
            <p className="text-gray-300">
              {battle.finalResult.winner === "itemA"
                ? battle.itemA.title
                : battle.finalResult.winner === "itemB"
                ? battle.itemB.title
                : "무승부"}
              {battle.finalResult.winner !== "tie" && "이(가) 승리했습니다!"}
              {battle.finalResult.winner === "tie" &&
                "무승부로 종료되었습니다!"}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default BattleVSSection;
