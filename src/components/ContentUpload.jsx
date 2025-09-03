// ContentUpload.jsx - 단일 게시물에 다중 콘텐츠 추가 버전
import React, { useState } from "react";
import { X, Plus, Loader2, Image, Link, Trash2 } from "lucide-react";
import CategorySelector from "./upload/CategorySelector";
import ContentItemList from "./upload/ContentItemList";
import { uploadContender } from "../services/contentService";
import toast from "react-hot-toast";

const ContentUpload = ({ onClose }) => {
  const [category, setCategory] = useState("music");
  const [isUploading, setIsUploading] = useState(false);

  // 단일 게시물 정보
  const [post, setPost] = useState({
    title: "",
    description: "",
    contentItems: [], // 빈 콘텐츠 아이템 배열로 시작
    tags: [],
  });

  // 게시물 정보 업데이트
  const updatePost = (field, value) => {
    setPost((prev) => ({ ...prev, [field]: value }));
  };

  // 콘텐츠 아이템 업데이트
  const updateContentItems = (contentItems) => {
    setPost((prev) => ({ ...prev, contentItems }));
  };

  // 태그 추가/제거
  const addTag = (tag) => {
    if (tag.trim() && !post.tags.includes(tag.trim())) {
      updatePost("tags", [...post.tags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove) => {
    updatePost(
      "tags",
      post.tags.filter((tag) => tag !== tagToRemove)
    );
  };

  // 폼 유효성 검사
  const validateForm = () => {
    if (!post.title.trim()) {
      alert("제목을 입력해주세요.");
      return false;
    }

    if (!post.contentItems || post.contentItems.length === 0) {
      alert("최소 하나 이상의 콘텐츠(이미지 또는 링크)를 추가해주세요.");
      return false;
    }

    // 각 콘텐츠 아이템 검증
    for (let i = 0; i < post.contentItems.length; i++) {
      const item = post.contentItems[i];

      if (item.type === "image") {
        if (!item.imageFile) {
          alert(`${i + 1}번째 이미지: 파일을 선택해주세요.`);
          return false;
        }
      } else if (item.type === "media") {
        if (!item.mediaUrl || !item.mediaUrl.trim()) {
          alert(`${i + 1}번째 미디어: URL을 입력해주세요.`);
          return false;
        }

        if (!item.detectedPlatform) {
          alert(
            `${
              i + 1
            }번째 미디어: 지원하지 않는 플랫폼입니다. YouTube, TikTok, Instagram URL을 입력해주세요.`
          );
          return false;
        }

        // YouTube 시간 형식 검증
        if (item.detectedPlatform === "youtube") {
          const timePattern = /^(\d{1,2}:)?\d{1,2}:\d{2}$/;

          if (item.startTime && !timePattern.test(item.startTime)) {
            alert(
              `${
                i + 1
              }번째 YouTube 미디어: 시작 시간 형식이 올바르지 않습니다. (예: 1:30, 1:05:30)`
            );
            return false;
          }

          if (item.endTime && !timePattern.test(item.endTime)) {
            alert(
              `${
                i + 1
              }번째 YouTube 미디어: 종료 시간 형식이 올바르지 않습니다. (예: 3:45, 1:08:15)`
            );
            return false;
          }
        }
      }
    }

    return true;
  };

  // 업로드를 위한 데이터 변환
  /*
  const transformPostForUpload = () => {
    // 통합된 uploadContender 함수에 맞는 데이터 구조로 변환
    return {
      title: post.title,
      description: post.description,
      category: category,
      tags: post.tags,

      // 첫 번째 이미지를 메인 이미지로 설정
      imageFile:
        post.contentItems.find((item) => item.type === "image")?.imageFile ||
        null,

      // 첫 번째 미디어를 메인 미디어로 설정
      mediaUrl:
        post.contentItems.find((item) => item.type === "media")?.mediaUrl || "",

      // YouTube 시간 설정 (첫 번째 YouTube 미디어 기준)
      startTime:
        post.contentItems.find(
          (item) => item.type === "media" && item.detectedPlatform === "youtube"
        )?.startTime || "",
      endTime:
        post.contentItems.find(
          (item) => item.type === "media" && item.detectedPlatform === "youtube"
        )?.endTime || "",

      // 모든 콘텐츠 아이템 정보 (추가 처리용)
      contentItems: post.contentItems,
    };
  };
*/
  const transformPostForUpload = () => {
    // 이제 uploadContender가 모든 것을 처리하므로, post 상태를 거의 그대로 전달합니다.
    return {
      title: post.title,
      description: post.description,
      category: category,
      tags: post.tags,
      // 핵심: 모든 콘텐츠 아이템 정보를 배열 그대로 전달합니다.
      contentItems: post.contentItems,
    };
  };
  // 폼 제출
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsUploading(true);
    try {
      const uploadData = transformPostForUpload();
      const result = await uploadContender(uploadData);

      if (result.success) {
        toast.success("콘텐츠가 성공적으로 업로드되었습니다!");

        // 업로드된 콘텐츠로 이동하기 옵션
        toast(
          (t) => (
            <span>
              업로드된 콘텐츠를 확인하시겠습니까?
              <a
                href={`/content/${result.contenderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-400 ml-2 underline"
                onClick={() => toast.dismiss(t)}
              >
                바로가기
              </a>
            </span>
          ),
          { duration: 8000 }
        );

        onClose();
      } else {
        toast.error("업로드에 실패했습니다: " + result.error);
      }
    } catch (error) {
      toast.error("업로드에 실패했습니다: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 콘텐츠 통계 계산
  const getContentStats = () => {
    const imageCount = post.contentItems.filter(
      (item) => item.type === "image"
    ).length;
    const mediaCount = post.contentItems.filter(
      (item) => item.type === "media"
    ).length;
    const validMediaCount = post.contentItems.filter(
      (item) => item.type === "media" && item.detectedPlatform
    ).length;

    return { imageCount, mediaCount, validMediaCount };
  };

  const { imageCount, mediaCount, validMediaCount } = getContentStats();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-800 relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
        >
          <X />
        </button>

        {/* 헤더 */}
        <div className="text-center p-6 border-b border-gray-800">
          <h2 className="text-3xl font-bold text-white">콘텐츠 업로드</h2>
          <p className="text-gray-400 mt-2">
            하나의 게시물에 원하는 만큼 이미지와 외부 링크를 추가하여 배틀에
            참가하세요.
          </p>

          {/* 통계 정보 */}
          {post.contentItems.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 rounded-full">
                <span className="text-blue-400 text-sm font-medium">
                  총 {post.contentItems.length}개 콘텐츠
                </span>
              </div>
              {imageCount > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-600/20 rounded-full">
                  <Image className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">
                    이미지 {imageCount}개
                  </span>
                </div>
              )}
              {mediaCount > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-600/20 rounded-full">
                  <Link className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400 text-sm">
                    링크 {validMediaCount}/{mediaCount}개
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* 카테고리 선택 */}
          <CategorySelector category={category} setCategory={setCategory} />

          {/* 기본 정보 입력 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">기본 정보</h3>

            {/* 제목 */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                제목 *
              </label>
              <input
                type="text"
                value={post.title}
                onChange={(e) => updatePost("title", e.target.value)}
                placeholder="콘텐츠 제목을 입력하세요"
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
                onChange={(e) => updatePost("description", e.target.value)}
                placeholder="콘텐츠에 대한 간단한 설명을 입력하세요"
                rows="3"
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* 태그 */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                태그 (선택)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-blue-400 hover:text-blue-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="태그를 입력하고 Enter를 누르세요"
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none transition-colors"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    addTag(e.target.value);
                    e.target.value = "";
                  }
                }}
              />
            </div>
          </div>

          {/* 콘텐츠 아이템 관리 */}
          <div className="bg-gray-800/20 rounded-lg p-4 border border-gray-600">
            <ContentItemList
              contentItems={post.contentItems}
              onUpdateContentItems={updateContentItems}
            />
          </div>

          {/* 업로드 미리보기 */}
          {post.contentItems.length > 0 && (
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
              <h5 className="text-gray-300 font-medium mb-3 flex items-center gap-2">
                <span>업로드 미리보기</span>
                <span className="text-sm text-gray-400">
                  (하나의 게시물에 {post.contentItems.length}개 콘텐츠가
                  업로드됩니다)
                </span>
              </h5>

              <div className="space-y-3">
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <h6 className="text-white font-medium">
                    {post.title || "제목 미입력"}
                  </h6>
                  {post.description && (
                    <p className="text-gray-400 text-sm mt-1">
                      {post.description}
                    </p>
                  )}
                  {post.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-3">
                  {post.contentItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600"
                    >
                      {/* 순번 */}
                      <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>

                      {/* 콘텐츠 정보 */}
                      {item.type === "image" ? (
                        <div className="flex items-center gap-3 flex-1">
                          {item.imagePreview && (
                            <img
                              src={item.imagePreview}
                              alt="미리보기"
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="text-white text-sm font-medium flex items-center gap-2">
                              <Image className="w-4 h-4 text-blue-400" />
                              이미지 파일
                              {item.imageFile ? (
                                <span className="text-green-400">✓</span>
                              ) : (
                                <span className="text-red-400">⚠️</span>
                              )}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {item.imageFile?.name || "파일 선택 필요"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`w-12 h-12 rounded flex items-center justify-center text-white text-xs font-bold ${
                              item.detectedPlatform === "youtube"
                                ? "bg-red-600"
                                : item.detectedPlatform === "tiktok"
                                ? "bg-black"
                                : item.detectedPlatform === "instagram"
                                ? "bg-gradient-to-r from-purple-500 to-pink-500"
                                : "bg-gray-600"
                            }`}
                          >
                            <Link className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium flex items-center gap-2">
                              {item.detectedPlatform
                                ? `${
                                    item.detectedPlatform
                                      .charAt(0)
                                      .toUpperCase() +
                                    item.detectedPlatform.slice(1)
                                  } 링크`
                                : "외부 링크"}
                              {item.detectedPlatform ? (
                                <span className="text-green-400">✓</span>
                              ) : (
                                <span className="text-red-400">⚠️</span>
                              )}
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
                            <span className="text-green-400 text-xs font-medium">
                              준비됨
                            </span>
                          ) : (
                            <span className="text-yellow-400 text-xs font-medium">
                              파일 필요
                            </span>
                          )
                        ) : item.detectedPlatform ? (
                          <span className="text-green-400 text-xs font-medium">
                            분석 완료
                          </span>
                        ) : (
                          <span className="text-yellow-400 text-xs font-medium">
                            URL 필요
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 하단 버튼 */}
          <div className="flex gap-4 pt-4 border-t border-gray-800">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isUploading ||
                post.contentItems.length === 0 ||
                !post.title.trim()
              }
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  업로드 중...
                </>
              ) : post.contentItems.length > 0 && post.title.trim() ? (
                `${post.contentItems.length}개 콘텐츠로 게시물 등록하기`
              ) : (
                "제목과 콘텐츠를 추가해주세요"
              )}
            </button>
          </div>
        </div>

        {/* 도움말 */}
        <div className="p-4 bg-gray-800/30 border-t border-gray-700">
          <div className="text-xs text-gray-400 space-y-2">
            <h6 className="font-medium text-gray-300">사용법:</h6>
            <ul className="space-y-1">
              <li>
                • 하나의 게시물에 여러 이미지와 외부 링크를 자유롭게 조합할 수
                있습니다
              </li>
              <li>
                • 이미지는 JPG, PNG, GIF 형식을 지원하며 최대 5MB까지 가능합니다
              </li>
              <li>• 외부 링크는 YouTube, TikTok, Instagram을 지원합니다</li>
              <li>
                • YouTube 링크의 경우 재생 시작/종료 시간을 설정할 수 있습니다
              </li>
              <li>
                • 모든 콘텐츠가 하나의 게시물로 통합되어 배틀에 참여합니다
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentUpload;
