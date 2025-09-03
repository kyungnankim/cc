import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// 각 미디어 아이템을 렌더링하는 헬퍼 컴포넌트
const ContentItemRenderer = ({ item }) => {
  // 어떤 형태의 URL이든 YouTube 비디오 ID를 추출하는 강력한 함수
  const extractVideoId = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:v=|\/)([a-zA-Z0-9_-]{11})(?=&|\/|$)/, // watch?v=, youtu.be/, /v/
      /(?:embed\/|live\/)([a-zA-Z0-9_-]+)/, // embed/, live/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const getYouTubeEmbedUrl = () => {
    // 1. extractedData에서 먼저 찾기
    let videoId = item.extractedData?.videoId ?? item.youtubeId;
    // 2. 없으면 mediaUrl, youtubeUrl, imageUrl 순서로 다시 추출 시도
    if (!videoId)
      videoId = extractVideoId(
        item.mediaUrl || item.youtubeUrl || item.imageUrl
      );

    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
  };

  if (item.type === "image" || item.platform === "image") {
    return (
      <div className="flex justify-center items-center p-2">
        <img
          src={item.imageUrl}
          alt={item.title || "콘텐츠 이미지"}
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
        />
      </div>
    );
  }

  if (item.type === "media" && item.platform === "youtube") {
    const embedUrl = getYouTubeEmbedUrl();
    if (!embedUrl)
      return (
        <p className="text-red-400 p-4 text-center">
          YouTube 비디오 ID를 찾을 수 없습니다.
        </p>
      );

    return (
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        {" "}
        {/* 16:9 비율 */}
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={item.title || "YouTube video"}
        ></iframe>
      </div>
    );
  }

  return (
    <div className="p-4 text-center text-gray-400">
      <p>지원하지 않는 미디어 타입입니다: {item.platform || item.type}</p>
    </div>
  );
};

const MediaPlayerModal = ({ isOpen, onClose, postData, contentItems }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !postData) return null;

  const hasContentItems =
    Array.isArray(contentItems) && contentItems.length > 0;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
      onClick={handleOutsideClick}
    >
      <div
        ref={modalRef}
        className="relative bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white truncate">
            {postData.title || "콘텐츠 상세"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-6">
          {postData.description && (
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">
              {postData.description}
            </p>
          )}
          {hasContentItems ? (
            contentItems.map((item, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-2">
                <ContentItemRenderer item={item} />
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-10">
              <p>표시할 상세 콘텐츠가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MediaPlayerModal;
