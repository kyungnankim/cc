// src/components/MediaPlayerModal.jsx - YouTube 썸네일 표시 및 재생 개선

import React, { useEffect, useRef, useState } from "react";
import { X, ExternalLink, Youtube, Instagram, Play } from "lucide-react";

const MediaPlayerModal = ({ isOpen, onClose, contentData }) => {
  const modalRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // 모달이 닫힐 때 재생 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen || !contentData) return null;

  const {
    contentType,
    title,
    description,
    youtubeId,
    youtubeUrl,
    instagramUrl,
    creatorName,
    thumbnailUrl,
    imageUrl,
  } = contentData;

  const renderYouTubeThumbnail = () => {
    if (!youtubeId) return null;

    const thumbnail =
      thumbnailUrl ||
      `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

    return (
      <div className="relative w-full aspect-video bg-gray-800 rounded-lg overflow-hidden group cursor-pointer">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // maxresdefault가 없으면 hqdefault로 fallback
            e.target.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
          }}
        />

        {/* 재생 버튼 오버레이 */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-all"
          onClick={() => setIsPlaying(true)}
        >
          <div className="bg-red-600 hover:bg-red-700 rounded-full p-4 transition-all transform hover:scale-110 shadow-lg">
            <Play className="w-8 h-8 text-white fill-current ml-1" />
          </div>
        </div>

        {/* YouTube 로고 */}
        <div className="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
          <Youtube className="w-3 h-3" />
          YouTube
        </div>

        {/* 재생 안내 */}
        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          클릭하여 재생
        </div>
      </div>
    );
  };

  const renderYouTubePlayer = () => {
    if (!youtubeId || !isPlaying) return null;

    return (
      <div className="relative w-full aspect-video bg-gray-800 rounded-lg overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
          title={title}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

        {/* 썸네일로 돌아가기 버튼 */}
        <button
          onClick={() => setIsPlaying(false)}
          className="absolute top-4 left-4 bg-black/80 hover:bg-black/90 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1"
        >
          <img src="/images/popo.png" alt="썸네일" className="w-4 h-4" />
          썸네일로 돌아가기
        </button>
      </div>
    );
  };

  const renderInstagramEmbed = () => {
    if (!instagramUrl) return null;

    const embedUrl = `${instagramUrl}embed/`;

    return (
      <div className="relative w-full max-w-md mx-auto">
        <iframe
          src={embedUrl}
          className="w-full h-[600px] border-none"
          frameBorder="0"
          scrolling="no"
          allowTransparency="true"
          title={title}
        />
      </div>
    );
  };

  const renderImageViewer = () => {
    return (
      <div className="relative w-full max-w-4xl mx-auto">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
        />
      </div>
    );
  };

  const getContentIcon = () => {
    switch (contentType) {
      case "youtube":
        return <Youtube className="w-5 h-5 text-red-500" />;
      case "instagram":
        return <Instagram className="w-5 h-5 text-pink-500" />;
      default:
        return null;
    }
  };

  const getOriginalLink = () => {
    switch (contentType) {
      case "youtube":
        return youtubeUrl;
      case "instagram":
        return instagramUrl;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-800"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {getContentIcon()}
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              {creatorName && (
                <p className="text-sm text-gray-400">by {creatorName}</p>
              )}
              {/* YouTube인 경우 재생 상태 표시 */}
              {contentType === "youtube" && (
                <p className="text-xs text-gray-500">
                  {isPlaying ? "재생 중" : "썸네일 표시 중"}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* YouTube 재생/썸네일 토글 버튼 */}
            {contentType === "youtube" && (
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
                title={isPlaying ? "썸네일 보기" : "YouTube 재생"}
              >
                {isPlaying ? (
                  <img
                    src="/images/popo.png"
                    alt="썸네일"
                    className="w-5 h-5"
                  />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
            )}

            {/* 원본 링크로 이동 버튼 */}
            {getOriginalLink() && (
              <a
                href={getOriginalLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
                title="원본 링크에서 보기"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 미디어 콘텐츠 */}
        <div className="p-6">
          {contentType === "youtube" && (
            <>
              {/* YouTube 썸네일 또는 플레이어 */}
              {isPlaying ? renderYouTubePlayer() : renderYouTubeThumbnail()}
            </>
          )}
          {contentType === "instagram" && renderInstagramEmbed()}
          {contentType === "image" && renderImageViewer()}

          {/* 설명 */}
          {description && (
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">설명</h3>
              <p className="text-gray-400 leading-relaxed">{description}</p>
            </div>
          )}

          {/* YouTube 컨트롤 */}
          {contentType === "youtube" && (
            <div className="mt-6 flex justify-center gap-4 flex-wrap">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all transform hover:scale-105 ${
                  isPlaying
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white shadow-lg"
                }`}
              >
                {isPlaying ? (
                  <>
                    <img
                      src="/images/popo.png"
                      alt="썸네일"
                      className="w-4 h-4"
                    />
                    썸네일 보기
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    YouTube 재생
                  </>
                )}
              </button>

              {getOriginalLink() && (
                <a
                  href={getOriginalLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all transform hover:scale-105"
                >
                  <Youtube className="w-4 h-4" />
                  YouTube에서 보기
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          )}

          {/* 다른 콘텐츠 타입의 액션 버튼들 */}
          {contentType !== "youtube" && (
            <div className="mt-6 flex justify-center gap-4 flex-wrap">
              {getOriginalLink() && (
                <a
                  href={getOriginalLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all transform hover:scale-105"
                >
                  {getContentIcon()}
                  원본에서 보기
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all transform hover:scale-105"
              >
                닫기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPlayerModal;
