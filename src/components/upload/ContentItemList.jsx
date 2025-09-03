// upload/ContentItemList.jsx - 콘텐츠 아이템들을 관리하는 컴포넌트
import React, { useState } from "react";
import { Plus, Image, Link, X } from "lucide-react";
import ContentItem from "./ContentItem";

const ContentItemList = ({ contentItems, onUpdateContentItems }) => {
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  // 새 콘텐츠 아이템 추가
  const addContentItem = (type) => {
    const newItem = {
      id: Date.now() + Math.random(), // 고유 ID 생성
      type: type, // 'image' 또는 'media'

      // 이미지 관련
      ...(type === "image" && {
        imageFile: null,
        imagePreview: null,
      }),

      // 미디어 관련
      ...(type === "media" && {
        mediaUrl: "",
        startTime: "",
        endTime: "",
        detectedPlatform: null,
        extractedData: null,
        urlDetectedStartTime: 0,
      }),
    };

    onUpdateContentItems([...contentItems, newItem]);
    setShowTypeSelector(false);
  };

  // 콘텐츠 아이템 업데이트
  const updateContentItem = (itemId, updates) => {
    const updatedItems = contentItems.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    onUpdateContentItems(updatedItems);
  };

  // 콘텐츠 아이템 삭제
  const removeContentItem = (itemId) => {
    // 이미지 미리보기 URL 해제
    const item = contentItems.find((item) => item.id === itemId);
    if (item && item.imagePreview) {
      URL.revokeObjectURL(item.imagePreview);
    }

    const filteredItems = contentItems.filter((item) => item.id !== itemId);
    onUpdateContentItems(filteredItems);
  };

  // 콘텐츠 통계
  const imageCount = contentItems.filter(
    (item) => item.type === "image"
  ).length;
  const mediaCount = contentItems.filter(
    (item) => item.type === "media"
  ).length;

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-gray-300 font-medium">콘텐츠</h5>
          <p className="text-gray-500 text-sm">
            이미지 {imageCount}개, 링크 {mediaCount}개 · 총{" "}
            {contentItems.length}개
          </p>
        </div>

        {/* 콘텐츠 추가 버튼 */}
        <div className="relative">
          <button
            onClick={() => setShowTypeSelector(!showTypeSelector)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            콘텐츠 추가
          </button>

          {/* 타입 선택 드롭다운 */}
          {showTypeSelector && (
            <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-10 min-w-48">
              <div className="p-2">
                <button
                  onClick={() => addContentItem("image")}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700 rounded text-white transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Image className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium">이미지</div>
                    <div className="text-xs text-gray-400">
                      JPG, PNG, GIF 파일
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => addContentItem("media")}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700 rounded text-white transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Link className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium">외부 링크</div>
                    <div className="text-xs text-gray-400">
                      YouTube, TikTok, Instagram
                    </div>
                  </div>
                </button>
              </div>

              <div className="border-t border-gray-700 p-2">
                <button
                  onClick={() => setShowTypeSelector(false)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <X className="w-3 h-3" />
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 콘텐츠가 없는 경우 */}
      {contentItems.length === 0 && (
        <div className="bg-gray-800/20 rounded-lg p-8 text-center border-2 border-dashed border-gray-600">
          <div className="text-gray-400 mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8" />
            </div>
            <h6 className="font-medium mb-2">콘텐츠를 추가해주세요</h6>
            <p className="text-sm">
              이미지나 외부 링크를 최소 하나 이상 추가해야 합니다.
            </p>
          </div>
          <button
            onClick={() => setShowTypeSelector(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />첫 번째 콘텐츠 추가
          </button>
        </div>
      )}

      {/* 콘텐츠 아이템 목록 */}
      {contentItems.length > 0 && (
        <div className="space-y-3">
          {contentItems.map((item, index) => (
            <div key={item.id} className="relative">
              {/* 인덱스 번호 */}
              <div className="absolute -left-3 -top-3 z-10">
                <div className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
              </div>

              <ContentItem
                item={item}
                onUpdate={updateContentItem}
                onRemove={removeContentItem}
                canRemove={contentItems.length > 1} // 하나만 남으면 삭제 불가
              />
            </div>
          ))}
        </div>
      )}

      {/* 콘텐츠 요약 정보 */}
      {contentItems.length > 0 && (
        <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-700">
          <h6 className="text-gray-300 font-medium mb-2">콘텐츠 요약</h6>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">이미지:</span>
              <span className="text-white ml-2">{imageCount}개</span>
            </div>
            <div>
              <span className="text-gray-400">외부 링크:</span>
              <span className="text-white ml-2">{mediaCount}개</span>
            </div>
          </div>

          {mediaCount > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <span className="text-gray-400 text-xs">플랫폼: </span>
              {contentItems
                .filter(
                  (item) => item.type === "media" && item.detectedPlatform
                )
                .map((item) => item.detectedPlatform)
                .filter(
                  (platform, index, arr) => arr.indexOf(platform) === index
                )
                .map((platform) => (
                  <span
                    key={platform}
                    className="text-xs bg-gray-700 text-white px-2 py-1 rounded mr-1 capitalize"
                  >
                    {platform}
                  </span>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 배경 클릭 시 드롭다운 닫기 */}
      {showTypeSelector && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowTypeSelector(false)}
        />
      )}
    </div>
  );
};

export default ContentItemList;
