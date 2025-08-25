// ContentUpload.jsx - 시간 필드 초기화 수정 버전
import React, { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import CategorySelector from "./upload/CategorySelector";
import PostList from "./upload/PostList";
import { uploadMultipleContents } from "../services/uploadService";

const ContentUpload = ({ onClose }) => {
  const [category, setCategory] = useState("music");
  const [isUploading, setIsUploading] = useState(false);
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "",
      description: "",
      contentType: "image",
      mediaUrl: "",
      startTime: "", // 빈 문자열로 초기화
      endTime: "", // 빈 문자열로 초기화
      imageFile: null,
      imagePreview: "",
      extractedData: null,
      detectedPlatform: null,
      isExpanded: true,
      userTimeOverride: false, // 사용자 시간 우선 플래그
      urlDetectedStartTime: 0, // URL에서 감지된 시간
    },
  ]);

  // 새 게시물 추가
  const addNewPost = () => {
    const newPost = {
      id: Date.now(),
      title: "",
      description: "",
      contentType: "image",
      mediaUrl: "",
      startTime: "", // 빈 문자열로 초기화
      endTime: "", // 빈 문자열로 초기화
      imageFile: null,
      imagePreview: "",
      extractedData: null,
      detectedPlatform: null,
      isExpanded: true,
      userTimeOverride: false, // 사용자 시간 우선 플래그
      urlDetectedStartTime: 0, // URL에서 감지된 시간
    };
    setPosts([...posts, newPost]);
  };

  // 게시물 삭제
  const removePost = (postId) => {
    const postToRemove = posts.find((post) => post.id === postId);
    if (postToRemove && postToRemove.id === 1) {
      alert("첫 번째 게시물은 삭제할 수 없습니다.");
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (post && post.imagePreview) {
      URL.revokeObjectURL(post.imagePreview);
    }

    setPosts(posts.filter((post) => post.id !== postId));
  };

  // 게시물 업데이트
  const updatePost = (postId, updates) => {
    console.log("🔄 게시물 업데이트:", { postId, updates });
    setPosts(
      posts.map((post) => (post.id === postId ? { ...post, ...updates } : post))
    );
  };

  // 폼 유효성 검사
  const validateForm = () => {
    for (const post of posts) {
      if (!post.title.trim()) {
        alert("모든 게시물의 제목을 입력해주세요.");
        return false;
      }

      if (post.contentType === "image" && !post.imageFile) {
        alert("이미지를 선택해주세요.");
        return false;
      }

      if (post.contentType === "media") {
        if (!post.mediaUrl.trim()) {
          alert("미디어 URL을 입력해주세요.");
          return false;
        }
        if (!post.detectedPlatform) {
          alert(
            "지원하지 않는 플랫폼입니다. YouTube, TikTok, Instagram URL을 입력해주세요."
          );
          return false;
        }
      }

      // 시간 형식 검증 (YouTube인 경우만)
      if (post.detectedPlatform === "youtube") {
        const timePattern = /^(\d{1,2}:)?\d{1,2}:\d{2}$/;

        if (post.startTime && !timePattern.test(post.startTime)) {
          alert(
            `게시물 "${post.title}": 시작 시간 형식이 올바르지 않습니다. (예: 1:30, 1:05:30)`
          );
          return false;
        }

        if (post.endTime && !timePattern.test(post.endTime)) {
          alert(
            `게시물 "${post.title}": 종료 시간 형식이 올바르지 않습니다. (예: 3:45, 1:08:15)`
          );
          return false;
        }
      }
    }
    return true;
  };

  // 폼 제출
  const handleSubmit = async () => {
    console.log("📝 폼 제출 시작...");
    console.log("현재 게시물 상태:", posts);

    if (!validateForm()) {
      console.log("❌ 폼 유효성 검사 실패");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadMultipleContents(posts, category);

      if (result.success) {
        alert(
          `✅ ${result.successCount}개의 콘텐츠가 성공적으로 업로드되었습니다!`
        );
        onClose();
      } else {
        alert(
          `${result.successCount}개 성공, ${
            result.errors.length
          }개 실패\n\n실패 목록:\n${result.errors
            .map((e) => `- ${e.title}: ${e.error}`)
            .join("\n")}`
        );

        if (result.successCount > 0) {
          onClose();
        }
      }
    } catch (error) {
      console.error("❌ 전체 업로드 실패:", error);
      alert("업로드에 실패했습니다: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800 relative">
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
            배틀에 사용할 콘텐츠를 등록하세요.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* 카테고리 선택 */}
          <CategorySelector category={category} setCategory={setCategory} />

          {/* 게시물 목록 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                게시물 ({posts.length}개)
              </h3>
              <button
                onClick={addNewPost}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                게시물 추가
              </button>
            </div>

            <PostList
              posts={posts}
              updatePost={updatePost}
              removePost={removePost}
            />
          </div>

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
              disabled={isUploading}
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  업로드 중...
                </>
              ) : (
                `${posts.length}개 콘텐츠 등록하기`
              )}
            </button>
          </div>
        </div>

        {/* 디버깅 정보 (개발 중에만 표시) */}
        {(process.env.NODE_ENV === "development" || true) && (
          <div className="p-4 bg-gray-800/50 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              디버깅 정보
            </h4>
            <div className="text-xs text-gray-400 font-mono space-y-1">
              <p>총 게시물: {posts.length}개</p>
              <p>현재 카테고리: {category}</p>
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  className="border-l-2 border-gray-600 pl-2 mt-2"
                >
                  <p>게시물 {index + 1}:</p>
                  <p> - 제목: "{post.title || "미입력"}"</p>
                  <p> - 타입: {post.contentType}</p>
                  <p> - 플랫폼: {post.detectedPlatform || "none"}</p>
                  <p>
                    {" "}
                    - 시작시간: "{post.startTime}" (type:{" "}
                    {typeof post.startTime})
                  </p>
                  <p>
                    {" "}
                    - 종료시간: "{post.endTime}" (type: {typeof post.endTime})
                  </p>
                  <p> - URL: {post.mediaUrl || "미입력"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentUpload;
