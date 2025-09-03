// upload/PostItem.jsx - 다중 콘텐츠 타입 지원 버전
import React from "react";
import { Trash2, ChevronDown, ChevronUp, Image, Link } from "lucide-react";
import PostContent from "./PostContent";

const PostItem = ({ post, index, updatePost, removePost, toggleExpansion }) => {
  // 콘텐츠 상태 확인
  const hasImage = !!post.imageFile;
  const hasMedia = !!(post.mediaUrl && post.detectedPlatform);
  const contentCount = (hasImage ? 1 : 0) + (hasMedia ? 1 : 0);

  // 콘텐츠 타입 표시를 위한 배지들
  const getContentBadges = () => {
    const badges = [];

    if (hasImage) {
      badges.push(
        <span
          key="image"
          className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1"
        >
          <Image className="w-3 h-3" />
          이미지
        </span>
      );
    }

    if (hasMedia) {
      const platformColors = {
        youtube: "bg-red-600",
        tiktok: "bg-black",
        instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
      };

      badges.push(
        <span
          key="media"
          className={`text-xs text-white px-2 py-1 rounded flex items-center gap-1 ${
            platformColors[post.detectedPlatform] || "bg-gray-600"
          }`}
        >
          <Link className="w-3 h-3" />
          {post.detectedPlatform?.charAt(0).toUpperCase() +
            post.detectedPlatform?.slice(1) || "링크"}
        </span>
      );
    }

    return badges;
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700">
      {/* 게시물 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3 flex-1">
          <span className="bg-gray-700 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium truncate">
              {post.title || `게시물 ${index + 1}`}
            </h4>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {getContentBadges()}
              {contentCount > 0 && (
                <span className="text-xs text-gray-400">
                  ({contentCount}개 콘텐츠)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleExpansion}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title={post.isExpanded ? "접기" : "펼치기"}
          >
            {post.isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {/* 첫 번째 게시물(id: 1)이 아닌 경우에만 삭제 버튼 표시 */}
          {post.id !== 1 && (
            <button
              onClick={() => removePost(post.id)}
              className="p-2 text-red-400 hover:text-red-300 transition-colors hover:bg-red-500/10 rounded"
              title="게시물 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 게시물 내용 */}
      {post.isExpanded && <PostContent post={post} updatePost={updatePost} />}

      {/* 접힌 상태에서도 미리보기 정보 표시 */}
      {!post.isExpanded && (hasImage || hasMedia) && (
        <div className="p-4 pt-0">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            {hasImage && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
                  <Image className="w-3 h-3" />
                </div>
                <span>이미지 업로드됨</span>
              </div>
            )}
            {hasMedia && (
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                    post.detectedPlatform === "youtube"
                      ? "bg-red-600"
                      : post.detectedPlatform === "tiktok"
                      ? "bg-black"
                      : post.detectedPlatform === "instagram"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500"
                      : "bg-gray-600"
                  } text-white`}
                >
                  {post.detectedPlatform?.slice(0, 1).toUpperCase() || "L"}
                </div>
                <span className="truncate max-w-xs">
                  {post.detectedPlatform} 링크
                </span>
              </div>
            )}
            {post.description && (
              <span className="text-gray-500 truncate max-w-xs">
                • {post.description}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostItem;
