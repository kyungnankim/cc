// upload/PostContent.jsx - 동적 콘텐츠 아이템 지원 버전
import React from "react";
import ContentItemList from "./ContentItemList";

const PostContent = ({ post, updatePost }) => {
  // 콘텐츠 아이템 업데이트 처리
  const handleContentItemsUpdate = (contentItems) => {
    updatePost(post.id, { contentItems });
  };

  // contentItems가 없으면 빈 배열로 초기화
  const contentItems = post.contentItems || [];

  return (
    <div className="p-4 space-y-6">
      {/* 제목 */}
      <div>
        <label className="text-gray-300 text-sm font-medium mb-2 block">
          제목 *
        </label>
        <input
          type="text"
          value={post.title}
          onChange={(e) => updatePost(post.id, { title: e.target.value })}
          placeholder="콘텐츠 제목"
          className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none transition-colors"
        />
      </div>

      {/* 설명 */}
      <div>
        <label className="text-gray-300 text-sm font-medium mb-2 block">
          설명 (선택)
        </label>
        <textarea
          value={post.description}
          onChange={(e) => updatePost(post.id, { description: e.target.value })}
          placeholder="콘텐츠에 대한 간단한 설명"
          rows="3"
          className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* 콘텐츠 아이템 관리 */}
      <div className="bg-gray-800/20 rounded-lg p-4 border border-gray-600">
        <ContentItemList
          contentItems={contentItems}
          onUpdateContentItems={handleContentItemsUpdate}
        />
      </div>

      {/* 콘텐츠 미리보기 (요약) */}
      {contentItems.length > 0 && (
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <h5 className="text-gray-300 font-medium mb-3">
            업로드될 콘텐츠 미리보기
          </h5>
          <div className="space-y-2">
            {contentItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 bg-gray-700/50 rounded"
              >
                {/* 순번 */}
                <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>

                {/* 콘텐츠 정보 */}
                {item.type === "image" ? (
                  <div className="flex items-center gap-2 flex-1">
                    {item.imagePreview && (
                      <img
                        src={item.imagePreview}
                        alt="미리보기"
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">
                        이미지 {item.imageFile ? "✓" : "⚠️"}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {item.imageFile?.name || "파일 선택 필요"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-10 h-10 rounded flex items-center justify-center text-white text-xs font-bold ${
                        item.detectedPlatform === "youtube"
                          ? "bg-red-600"
                          : item.detectedPlatform === "tiktok"
                          ? "bg-black"
                          : item.detectedPlatform === "instagram"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500"
                          : "bg-gray-600"
                      }`}
                    >
                      {item.detectedPlatform?.slice(0, 2).toUpperCase() ||
                        "LINK"}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">
                        {item.detectedPlatform
                          ? `${
                              item.detectedPlatform.charAt(0).toUpperCase() +
                              item.detectedPlatform.slice(1)
                            } 링크`
                          : "외부 링크"}
                        {item.detectedPlatform ? " ✓" : " ⚠️"}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {item.mediaUrl || "URL 입력 필요"}
                      </p>

                      {/* YouTube 시간 정보 */}
                      {item.detectedPlatform === "youtube" &&
                        (item.startTime || item.endTime) && (
                          <p className="text-blue-400 text-xs">
                            시간: {item.startTime || "0:00"} ~{" "}
                            {item.endTime || "끝"}
                          </p>
                        )}
                    </div>
                  </div>
                )}

                {/* 상태 표시 */}
                <div className="text-right">
                  {item.type === "image" ? (
                    item.imageFile ? (
                      <span className="text-green-400 text-xs">준비됨</span>
                    ) : (
                      <span className="text-yellow-400 text-xs">파일 필요</span>
                    )
                  ) : item.detectedPlatform ? (
                    <span className="text-green-400 text-xs">분석 완료</span>
                  ) : (
                    <span className="text-yellow-400 text-xs">URL 필요</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostContent;
