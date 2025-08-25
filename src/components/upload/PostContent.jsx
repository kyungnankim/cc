// upload/PostContent.jsx
import React from "react";
import { Image, Link } from "lucide-react";
import ImageUpload from "./ImageUpload";
import MediaUpload from "./MediaUpload";

const PostContent = ({ post, updatePost }) => {
  // 콘텐츠 타입 변경 처리
  const handleContentTypeChange = (type) => {
    const updates = { contentType: type };

    if (type !== "image") {
      if (post.imagePreview) {
        URL.revokeObjectURL(post.imagePreview);
      }
      updates.imageFile = null;
      updates.imagePreview = "";
    }

    if (type !== "media") {
      updates.mediaUrl = "";
      updates.startTime = "";
      updates.endTime = "";
      updates.detectedPlatform = null;
      updates.extractedData = null;
    }

    updatePost(post.id, updates);
  };

  return (
    <div className="p-4 space-y-4">
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

      {/* 콘텐츠 타입 선택 */}
      <div>
        <label className="text-gray-300 text-sm font-medium mb-3 block">
          콘텐츠 타입
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleContentTypeChange("image")}
            className={`p-4 rounded-lg border-2 transition-all ${
              post.contentType === "image"
                ? "border-blue-500 bg-blue-500/20 text-white"
                : "border-gray-700 text-gray-400 hover:border-gray-600"
            }`}
          >
            <Image className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">이미지</span>
          </button>

          <button
            onClick={() => handleContentTypeChange("media")}
            className={`p-4 rounded-lg border-2 transition-all ${
              post.contentType === "media"
                ? "border-blue-500 bg-blue-500/20 text-white"
                : "border-gray-700 text-gray-400 hover:border-gray-600"
            }`}
          >
            <Link className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">외부 링크</span>
          </button>
        </div>
      </div>

      {/* 이미지 업로드 */}
      {post.contentType === "image" && (
        <ImageUpload post={post} updatePost={updatePost} />
      )}

      {/* 미디어 URL 입력 */}
      {post.contentType === "media" && (
        <MediaUpload post={post} updatePost={updatePost} />
      )}

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
    </div>
  );
};

export default PostContent;
