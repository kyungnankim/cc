import React, { useState, useRef } from "react";
import {
  X,
  Image,
  Music,
  Shirt,
  Pizza,
  Loader2,
  Link,
  Youtube,
  Instagram,
  Play,
} from "lucide-react";
import toast from "react-hot-toast";
import { uploadContender } from "../services/battleService";

const ContentUpload = ({ onClose }) => {
  const [formData, setFormData] = useState({
    category: "music",
    title: "",
    description: "",
    youtubeUrl: "",
    instagramUrl: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [contentType, setContentType] = useState("image"); // "image", "youtube", "instagram"
  const inputRef = useRef(null);

  const categories = [
    { value: "music", label: "Music", icon: Music, color: "pink" },
    { value: "fashion", label: "Fashion", icon: Shirt, color: "purple" },
    { value: "food", label: "Food", icon: Pizza, color: "orange" },
  ];

  const contentTypes = [
    { value: "image", label: "이미지", icon: Image },
    { value: "youtube", label: "YouTube", icon: Youtube },
    { value: "instagram", label: "Instagram", icon: Instagram },
  ];

  // YouTube URL에서 비디오 ID 추출
  const extractYouTubeId = (url) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Instagram URL 유효성 검사
  const isValidInstagramUrl = (url) => {
    const regex =
      /^https?:\/\/(www\.)?instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?/;
    return regex.test(url);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return toast.error("이미지 파일은 5MB를 초과할 수 없습니다.");
      }
      setImageFile(file);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentTypeChange = (type) => {
    setContentType(type);
    // 타입 변경 시 관련 데이터 초기화
    if (type !== "image") {
      setImageFile(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview("");
    }
    if (type !== "youtube") {
      setFormData((prev) => ({ ...prev, youtubeUrl: "" }));
    }
    if (type !== "instagram") {
      setFormData((prev) => ({ ...prev, instagramUrl: "" }));
    }
  };

  const getPreviewImage = () => {
    if (contentType === "image" && imagePreview) {
      return imagePreview;
    }

    if (contentType === "youtube" && formData.youtubeUrl) {
      const videoId = extractYouTubeId(formData.youtubeUrl);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }

    // YouTube나 Instagram URL이 있으면 default.png 사용
    if (
      (contentType === "youtube" && formData.youtubeUrl) ||
      (contentType === "instagram" && formData.instagramUrl)
    ) {
      return "/images/popo.png";
    }

    return null;
  };

  const validateForm = () => {
    if (!formData.title) {
      toast.error("제목을 입력해주세요.");
      return false;
    }

    if (contentType === "image" && !imageFile) {
      toast.error("이미지를 선택해주세요.");
      return false;
    }

    if (contentType === "youtube") {
      if (!formData.youtubeUrl) {
        toast.error("YouTube URL을 입력해주세요.");
        return false;
      }
      if (!extractYouTubeId(formData.youtubeUrl)) {
        toast.error("올바른 YouTube URL을 입력해주세요.");
        return false;
      }
    }

    if (contentType === "instagram") {
      if (!formData.instagramUrl) {
        toast.error("Instagram URL을 입력해주세요.");
        return false;
      }
      if (!isValidInstagramUrl(formData.instagramUrl)) {
        toast.error("올바른 Instagram URL을 입력해주세요.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsUploading(true);
    try {
      // 콘텐츠 타입에 따라 다른 데이터 구성
      const contentData = {
        ...formData,
        contentType,
        ...(contentType === "youtube" && {
          youtubeId: extractYouTubeId(formData.youtubeUrl),
        }),
      };

      // 이미지가 있으면 파일을 함께 전송, 없으면 default.png URL 사용
      const imageToUpload = contentType === "image" ? imageFile : null;

      await uploadContender(contentData, imageToUpload);
      toast.success("콘텐츠가 성공적으로 업로드되었습니다!");
      onClose();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const previewImage = getPreviewImage();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">콘텐츠 업로드</h2>
          <p className="text-gray-400 mt-2">
            배틀에 사용할 콘텐츠를 등록하세요.
          </p>
        </div>

        <div className="space-y-6">
          {/* 카테고리 선택 */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-3 block">
              카테고리 선택
            </label>
            <div className="grid grid-cols-3 gap-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() =>
                      setFormData({ ...formData, category: cat.value })
                    }
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.category === cat.value
                        ? `border-${cat.color}-500 bg-${cat.color}-500/20 text-white`
                        : "border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 콘텐츠 타입 선택 */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-3 block">
              콘텐츠 타입
            </label>
            <div className="grid grid-cols-3 gap-4">
              {contentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => handleContentTypeChange(type.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      contentType === type.value
                        ? "border-blue-500 bg-blue-500/20 text-white"
                        : "border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {/* 제목 */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                제목 *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
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
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="콘텐츠에 대한 간단한 설명"
                rows="3"
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* 콘텐츠별 입력 필드 */}
            {contentType === "image" && (
              <div>
                <label className="text-gray-300 text-sm font-medium mb-2 block">
                  이미지 *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={inputRef}
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div
                  onClick={() => inputRef.current?.click()}
                  className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-pink-500 transition-colors cursor-pointer bg-gray-800/50 relative aspect-video flex items-center justify-center"
                >
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-contain rounded-md"
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Image className="w-10 h-10 text-gray-500 mb-2" />
                      <p className="text-gray-400 text-sm">이미지 업로드</p>
                      <p className="text-gray-600 text-xs mt-1">(최대 5MB)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {contentType === "youtube" && (
              <div>
                <label className="text-gray-300 text-sm font-medium mb-2 block">
                  YouTube URL *
                </label>
                <div className="relative">
                  <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
                  <input
                    type="url"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleInputChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none transition-colors"
                  />
                </div>
                {formData.youtubeUrl &&
                  extractYouTubeId(formData.youtubeUrl) && (
                    <div className="mt-3 relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                      <img
                        src={`https://img.youtube.com/vi/${extractYouTubeId(
                          formData.youtubeUrl
                        )}/maxresdefault.jpg`}
                        alt="YouTube thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="bg-red-600 rounded-full p-3">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {contentType === "instagram" && (
              <div>
                <label className="text-gray-300 text-sm font-medium mb-2 block">
                  Instagram URL *
                </label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500 w-5 h-5" />
                  <input
                    type="url"
                    name="instagramUrl"
                    value={formData.instagramUrl}
                    onChange={handleInputChange}
                    placeholder="https://www.instagram.com/p/..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none transition-colors"
                  />
                </div>
                {formData.instagramUrl &&
                  isValidInstagramUrl(formData.instagramUrl) && (
                    <div className="mt-3 relative aspect-square bg-gray-800 rounded-lg overflow-hidden">
                      <img
                        src="/images/default.jpg"
                        alt="Instagram content"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-3">
                          <Instagram className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
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
                "콘텐츠 등록하기"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentUpload;
