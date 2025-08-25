// src/components/BattleDetail/BattleDetailHeader.jsx - 배틀 상세 헤더

import React, { useState } from "react";
import { ArrowLeft, Heart, Share2, Flag } from "lucide-react";
import toast from "react-hot-toast";

const BattleDetailHeader = ({
  battle,
  liked,
  onBack,
  onLike,
  onBattleUpdate,
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleLike = async () => {
    try {
      // 낙관적 업데이트
      const newLiked = !liked;
      onLike(newLiked);

      const updatedBattle = {
        ...battle,
        likeCount: newLiked ? battle.likeCount + 1 : battle.likeCount - 1,
        likedBy: newLiked
          ? [...(battle.likedBy || []), "current_user"] // 실제로는 user.uid 사용
          : (battle.likedBy || []).filter((id) => id !== "current_user"),
      };

      onBattleUpdate(updatedBattle);

      // 실제 좋아요 처리 (향후 구현)
      // await toggleBattleLike(battle.id, user.uid);
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
      // 실패 시 원래 상태로 복구
      onLike(liked);
      onBattleUpdate(battle);
      toast.error("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  const handleShare = (platform) => {
    const battleUrl = window.location.href;
    const title = `${battle.title} - Battle Seoul`;

    switch (platform) {
      case "copy":
        navigator.clipboard.writeText(battleUrl);
        toast.success("링크가 복사되었습니다!");
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            title
          )}&url=${encodeURIComponent(battleUrl)}`
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            battleUrl
          )}`
        );
        break;
      default:
        break;
    }
    setShowShareMenu(false);
  };

  const handleReport = () => {
    // 신고 기능 (향후 구현)
    toast("신고 기능은 현재 개발 중입니다.");
  };

  return (
    <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>목록으로</span>
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`p-2 rounded-lg transition-colors ${
              liked
                ? "bg-pink-500/20 text-pink-500"
                : "text-gray-400 hover:text-white"
            }`}
            title={liked ? "좋아요 취소" : "좋아요"}
          >
            <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="공유하기"
            >
              <Share2 className="w-5 h-5" />
            </button>

            {showShareMenu && (
              <div className="absolute right-0 top-full mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 w-48 z-50">
                <button
                  onClick={() => handleShare("copy")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors text-sm"
                >
                  📋 링크 복사
                </button>
                <button
                  onClick={() => handleShare("twitter")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors text-sm"
                >
                  🐦 Twitter 공유
                </button>
                <button
                  onClick={() => handleShare("facebook")}
                  className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors text-sm"
                >
                  📘 Facebook 공유
                </button>
                <div className="border-t border-gray-700 my-1"></div>
                <button
                  onClick={() => {
                    navigator
                      .share?.({
                        title: battle.title,
                        text: `${battle.title} - Battle Seoul에서 투표해보세요!`,
                        url: window.location.href,
                      })
                      .catch(() => handleShare("copy"));
                    setShowShareMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors text-sm"
                >
                  📱 모바일 공유
                </button>
              </div>
            )}

            {/* 클릭 외부 영역 감지 */}
            {showShareMenu && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowShareMenu(false)}
              />
            )}
          </div>

          <button
            onClick={handleReport}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            title="신고하기"
          >
            <Flag className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleDetailHeader;
