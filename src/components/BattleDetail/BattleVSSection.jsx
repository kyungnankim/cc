import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Trophy,
  Users,
  Clock,
  Play,
  Youtube,
  Instagram,
  Image,
  ExternalLink,
  ThumbsUp,
  SkipForward,
} from "lucide-react";

// 실제 MediaPlayerModal import (경로는 실제 파일 위치에 맞게 수정)
import MediaPlayerModal from "../MediaPlayerModal"; // 또는 적절한 경로

// 모의 voteOnBattle 함수
const voteOnBattle = async (battleId, choice) => {
  // 실제 구현에서는 실제 API 호출
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        newVoteCount: Math.floor(Math.random() * 100),
        newTotalVotes: Math.floor(Math.random() * 1000),
        currentLeader: {
          winner: choice,
          percentage: Math.floor(Math.random() * 100),
          margin: Math.floor(Math.random() * 50),
        },
      });
    }, 1000);
  });
};

// 간단한 toast 함수
const toast = {
  success: (message) => {
    console.log("✅ Success:", message);
    alert("✅ " + message);
  },
  error: (message) => {
    console.log("❌ Error:", message);
    alert("❌ " + message);
  },
};

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
  const [selectedContent, setSelectedContent] = useState(null);

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
      // 낙관적 업데이트
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

      // UI 먼저 업데이트
      onBattleUpdate(newBattle);
      onVote(true, choice);

      // 서버에 투표 요청
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
        onBattleUpdate(battle);
        onVote(false, null);
      }
    }
  };

  const handleItemImageClick = (item, choice) => {
    // 🚨 클릭 이벤트 상세 로그
    console.log("🖱️ === 이미지 클릭 이벤트 발생 ===");
    console.log("📅 클릭 시간:", new Date().toLocaleTimeString());
    console.log("🎯 클릭된 아이템:", choice, "(itemA 또는 itemB)");
    console.log("📄 아이템 데이터:", item);
    console.log("🔧 아이템 상세 정보:");
    console.log("  - 제목:", item.title);
    console.log("  - 플랫폼:", item.platform);
    console.log("  - 생성자:", item.creatorName);
    console.log("  - YouTube ID:", item.youtubeId);
    console.log("  - YouTube URL:", item.youtubeUrl);
    console.log("  - 추출 데이터:", item.extractedData);
    console.log("  - 시간 설정:", item.timeSettings);
    console.log("  - 이미지 URL:", item.imageUrl);

    const platform = item.platform || "image";
    console.log("🔍 감지된 플랫폼:", platform);

    // 컨텐츠 데이터 준비
    let contentData = {
      platform: platform,
      title: item.title,
      description: item.description,
      creatorName: item.creatorName,
      imageUrl: item.imageUrl,
    };

    console.log("📦 기본 contentData 생성:", contentData);

    // 플랫폼별 데이터 추가
    if (platform === "youtube") {
      console.log("🎬 YouTube 콘텐츠 처리 중...");

      contentData = {
        ...contentData,
        youtubeId: item.youtubeId,
        youtubeUrl: item.youtubeUrl,
        extractedData: item.extractedData || {
          videoId: item.youtubeId,
          originalUrl: item.youtubeUrl,
          thumbnailUrl:
            item.thumbnailUrl ||
            `https://img.youtube.com/vi/${item.youtubeId}/maxresdefault.jpg`,
        },
        timeSettings: item.timeSettings || null,
        isLiveStream: item.isLiveStream || false,
      };

      console.log("✅ YouTube contentData 완성:", contentData);
    } else if (platform === "instagram") {
      console.log("📷 Instagram 콘텐츠 처리 중...");

      contentData = {
        ...contentData,
        extractedData: item.extractedData || {
          originalUrl: item.instagramUrl,
          postType: item.postType || "p",
        },
      };

      console.log("✅ Instagram contentData 완성:", contentData);
    } else if (platform === "tiktok") {
      console.log("🎵 TikTok 콘텐츠 처리 중...");

      contentData = {
        ...contentData,
        extractedData: item.extractedData || {
          originalUrl: item.tiktokUrl,
          videoId: item.tiktokId,
        },
      };

      console.log("✅ TikTok contentData 완성:", contentData);
    }

    console.log("🎯 최종 contentData:", contentData);
    console.log("🚀 모달 열기 시도...");

    setSelectedContent(contentData);
    setShowMediaModal(true);

    console.log("✅ 모달 상태 업데이트 완료!");
    console.log("  - showMediaModal:", true);
    console.log("  - selectedContent 설정됨");
    console.log("================================");
  };

  const handleVoteButtonClick = (choice) => {
    console.log("🗳️ 투표 버튼 클릭:", choice);

    if (hasVoted) {
      toast.error("이미 투표하셨습니다. 한 번만 투표할 수 있습니다.");
      return;
    }

    if (battle.status === "ended") {
      toast.error("종료된 배틀입니다.");
      return;
    }

    handleVote(choice);
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
    const platform = item.platform || "image";

    if (platform === "youtube") {
      return (
        item.extractedData?.thumbnailUrl ||
        item.thumbnailUrl ||
        `https://img.youtube.com/vi/${item.youtubeId}/maxresdefault.jpg`
      );
    }

    return item.imageUrl || "/images/popo.png";
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
          onClick={() => {
            console.log(`🖱️ 썸네일 클릭! ${choice} (${platform})`);
            handleItemImageClick(item, choice);
          }}
          className={`group relative rounded-xl overflow-hidden transition-all cursor-pointer
            ${
              isSelected
                ? `ring-4 ring-${gradientColor}-500`
                : "hover:scale-[1.02]"
            }
            ${hasVoted && !isSelected ? "opacity-70" : ""}
          `}
          title={`클릭하여 ${getPlatformName(platform)} 콘텐츠 보기`}
        >
          {/* 이미지 또는 썸네일 */}
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

          {/* 플랫폼별 오버레이 */}
          {platform === "youtube" && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-all group-hover:bg-black/40">
              <div className="bg-red-600 hover:bg-red-700 rounded-full p-3 transition-all transform group-hover:scale-110 shadow-lg">
                <Play className="w-6 h-6 text-white fill-current ml-0.5" />
              </div>
            </div>
          )}

          {(platform === "instagram" || platform === "tiktok") && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-all group-hover:bg-black/40">
              <div
                className={`${
                  platform === "instagram"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500"
                    : "bg-gradient-to-r from-red-500 to-blue-500"
                } hover:scale-110 rounded-full p-3 transition-all shadow-lg`}
              >
                {platform === "instagram" ? (
                  <Instagram className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white fill-current ml-0.5" />
                )}
              </div>
            </div>
          )}

          {platform === "image" && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-center bg-black/70 rounded-xl p-3">
                <div className="text-white text-sm font-medium">
                  클릭하여 확대
                </div>
              </div>
            </div>
          )}

          {/* 플랫폼 로고/배지 */}
          <div className="absolute top-4 right-4">
            {platform === "youtube" && (
              <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                <Youtube className="w-3 h-3" />
                YouTube
              </div>
            )}
            {platform === "instagram" && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                <Instagram className="w-3 h-3" />
                Instagram
              </div>
            )}
            {platform === "tiktok" && (
              <div className="bg-gradient-to-r from-red-500 to-blue-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                <div className="w-3 h-3 flex items-center justify-center font-bold text-[10px]">
                  T
                </div>
                TikTok
              </div>
            )}
          </div>

          {/* 시간 설정 표시 (YouTube만) */}
          {platform === "youtube" &&
            item.timeSettings &&
            (item.timeSettings.startTime > 0 ||
              item.timeSettings.endTime > 0) && (
              <div className="absolute bottom-4 left-4 bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.timeSettings.startTime > 0 &&
                  formatTime(item.timeSettings.startTime)}
                {item.timeSettings.startTime > 0 &&
                  item.timeSettings.endTime > 0 &&
                  " ~ "}
                {item.timeSettings.endTime > 0 &&
                  formatTime(item.timeSettings.endTime)}
              </div>
            )}

          {/* 승자 배지 */}
          {isWinner && (
            <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded-full font-bold flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              Winner
            </div>
          )}

          {/* 내 선택 배지 */}
          {hasVoted && isSelected && (
            <div
              className={`absolute top-4 left-4 bg-${gradientColor}-500 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1`}
            >
              <ThumbsUp className="w-4 h-4" />내 선택
            </div>
          )}
        </div>

        {/* 콘텐츠 정보 */}
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
          <p className="text-sm text-gray-400 mb-2">by {item.creatorName}</p>

          {/* 콘텐츠 타입 및 플랫폼 표시 */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {getPlatformIcon(platform)}
            <span className="text-xs text-gray-400">
              {getPlatformName(platform)}
            </span>
            {platform === "youtube" &&
              item.timeSettings &&
              (item.timeSettings.startTime > 0 ||
                item.timeSettings.endTime > 0) && (
                <>
                  <span className="text-gray-600">•</span>
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span className="text-xs text-blue-400">구간 재생</span>
                </>
              )}
          </div>

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

        {/* 투표 버튼 */}
        {!hasVoted && !isEnded && (
          <button
            onClick={() => handleVoteButtonClick(choice)}
            disabled={hasVoted}
            className={`w-full py-3 font-semibold rounded-lg transition-all transform 
              ${
                hasVoted
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : `bg-gradient-to-r from-${gradientColor}-500 to-${gradientColor}-600 text-white hover:from-${gradientColor}-600 hover:to-${gradientColor}-700 hover:scale-105`
              }`}
          >
            {hasVoted ? "투표 완료" : "이 항목에 투표"}
          </button>
        )}

        {/* 투표 완료 상태 표시 */}
        {hasVoted && (
          <div className="w-full py-3 bg-gray-700 text-gray-300 font-semibold rounded-lg text-center">
            투표 완료
          </div>
        )}
      </div>
    );
  };

  // 모달 상태 로그
  console.log("🎭 BattleVSSection 모달 상태:");
  console.log("  - showMediaModal:", showMediaModal);
  console.log("  - selectedContent:", selectedContent);

  return (
    <>
      {/* 미디어 재생 모달 */}
      {console.log("🔄 MediaPlayerModal 렌더링 시도:", {
        showMediaModal,
        selectedContent: !!selectedContent,
      })}
      <MediaPlayerModal
        isOpen={showMediaModal}
        onClose={() => {
          console.log("🚪 모달 닫기 요청");
          setShowMediaModal(false);
        }}
        contentData={selectedContent}
      />

      <div className="bg-gray-800/50 rounded-2xl p-6 mb-8">
        {/* 배틀 헤더 정보 */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {getPlatformIcon(battle.itemA.platform || "image")}
              <span>{getPlatformName(battle.itemA.platform || "image")}</span>
            </div>
            <span className="text-gray-600">VS</span>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {getPlatformIcon(battle.itemB.platform || "image")}
              <span>{getPlatformName(battle.itemB.platform || "image")}</span>
            </div>
          </div>

          {/* 플랫폼 간 배틀 표시 */}
          {battle.itemA.platform !== battle.itemB.platform && (
            <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-700/50 rounded-full px-4 py-2 text-sm">
              <span className="text-purple-400">크로스 플랫폼 배틀</span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* 왼쪽 콘텐츠 (itemA) */}
          {renderContentItem(battle.itemA, "itemA", true)}

          {/* 오른쪽 콘텐츠 (itemB) */}
          {renderContentItem(battle.itemB, "itemB", false)}
        </div>

        {/* VS 표시 */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white px-8 py-3 rounded-full font-bold text-2xl shadow-lg">
            VS
          </div>
        </div>

        {/* 투표 결과 바 */}
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

        {/* 총 투표수 */}
        <div className="text-center text-gray-400">
          <p className="text-lg">
            총{" "}
            <span className="font-semibold text-white">
              {totalVotes.toLocaleString()}
            </span>
            명이 투표했습니다
          </p>
        </div>

        {/* 배틀 특징 표시 */}
        <div className="mt-4 flex justify-center gap-2 flex-wrap">
          {/* 미디어 콘텐츠 배틀 */}
          {(battle.itemA.platform !== "image" ||
            battle.itemB.platform !== "image") && (
            <div className="inline-flex items-center gap-1 bg-blue-900/30 border border-blue-700/50 rounded-full px-3 py-1 text-xs text-blue-400">
              <Play className="w-3 h-3" />
              미디어 배틀
            </div>
          )}

          {/* YouTube 시간 설정 배틀 */}
          {((battle.itemA.platform === "youtube" &&
            battle.itemA.timeSettings) ||
            (battle.itemB.platform === "youtube" &&
              battle.itemB.timeSettings)) && (
            <div className="inline-flex items-center gap-1 bg-red-900/30 border border-red-700/50 rounded-full px-3 py-1 text-xs text-red-400">
              <Clock className="w-3 h-3" />
              구간 재생
            </div>
          )}

          {/* HOT 배틀 */}
          {battle.isHot && (
            <div className="inline-flex items-center gap-1 bg-orange-900/30 border border-orange-700/50 rounded-full px-3 py-1 text-xs text-orange-400">
              🔥 HOT
            </div>
          )}
        </div>

        {/* 배틀 종료 결과 */}
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
            <p className="text-sm text-gray-400 mt-1">
              최종 점수: {battle.itemA.votes}표 vs {battle.itemB.votes}표
            </p>

            {/* 승리한 플랫폼 표시 */}
            {battle.finalResult.winner !== "tie" && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-xs text-gray-500">승리 플랫폼:</span>
                {getPlatformIcon(
                  battle.finalResult.winner === "itemA"
                    ? battle.itemA.platform
                    : battle.itemB.platform
                )}
                <span className="text-xs text-gray-400">
                  {getPlatformName(
                    battle.finalResult.winner === "itemA"
                      ? battle.itemA.platform
                      : battle.itemB.platform
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default BattleVSSection;
