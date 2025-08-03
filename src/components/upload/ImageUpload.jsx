// upload/ImageUpload.jsx
import React from "react";
import { Image } from "lucide-react";

const ImageUpload = ({ post, updatePost }) => {
  // 이미지 선택 처리
  const handleImageSelect = (file) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("이미지 파일은 5MB를 초과할 수 없습니다.");
        return;
      }

      if (post.imagePreview) {
        URL.revokeObjectURL(post.imagePreview);
      }

      const imagePreview = URL.createObjectURL(file);
      updatePost(post.id, {
        imageFile: file,
        imagePreview: imagePreview,
      });
    }
  };

  return (
    <div>
      <label className="text-gray-300 text-sm font-medium mb-2 block">
        이미지 *
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleImageSelect(e.target.files?.[0])}
        className="hidden"
        id={`image-${post.id}`}
      />
      <label
        htmlFor={`image-${post.id}`}
        className="block border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-pink-500 transition-colors cursor-pointer bg-gray-800/50"
      >
        {post.imagePreview ? (
          <img
            src={post.imagePreview}
            alt="Preview"
            className="w-full h-32 object-cover rounded-md"
          />
        ) : (
          <div className="flex flex-col items-center">
            <Image className="w-10 h-10 text-gray-500 mb-2" />
            <p className="text-gray-400 text-sm">이미지 업로드</p>
            <p className="text-gray-600 text-xs mt-1">(최대 5MB)</p>
          </div>
        )}
      </label>
    </div>
  );
};

export default ImageUpload;
