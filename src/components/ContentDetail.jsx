import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getContenderDetail } from "../services/contentService";
import MediaPlayerModal from "./MediaPlayerModal";
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  Film,
  Image as ImageIcon,
  Play,
  Maximize,
} from "lucide-react";
import toast from "react-hot-toast";

// 1. 각 콘텐츠 아이템을 렌더링하는 새로운 헬퍼 컴포넌트
const ContentItemRenderer = ({ item, onOpenModal }) => {
  const getYouTubeEmbedUrl = () => {
    const videoId = item.extractedData?.videoId ?? item.youtubeId;
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  };

  if (item.platform === "image") {
    return (
      <div className="relative group">
        <img
          src={item.imageUrl}
          alt="콘텐츠 이미지"
          className="w-full h-auto rounded-lg object-contain"
        />
        <div
          onClick={() => onOpenModal(item)}
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
        >
          <Maximize className="w-10 h-10 text-white" />
        </div>
      </div>
    );
  }

  if (item.platform === "youtube") {
    const embedUrl = getYouTubeEmbedUrl();
    if (!embedUrl)
      return <p className="text-red-400">잘못된 YouTube 정보입니다.</p>;

    return (
      <div className="relative aspect-video">
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full rounded-lg"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={item.title || "YouTube video"}
        ></iframe>
      </div>
    );
  }

  return <p>지원하지 않는 콘텐츠 타입입니다.</p>;
};

const ContentDetail = () => {
  const { id: contentId } = useParams();
  const navigate = useNavigate();

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 2. 모달에 어떤 contentItems 배열을 보여줄지 관리하는 상태
  const [modalContentItems, setModalContentItems] = useState([]);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      const result = await getContenderDetail(contentId);
      if (result.success) {
        setContent(result.contender);
      } else {
        toast.error(result.message || "콘텐츠를 불러오는 데 실패했습니다.");
        navigate("/");
      }
      setLoading(false);
    };
    loadContent();
  }, [contentId, navigate]);

  const openMediaModal = (clickedItem) => {
    const reorderedItems = [
      clickedItem,
      ...(content.contentItems || []).filter((item) => item !== clickedItem),
    ];
    setModalContentItems(reorderedItems);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">콘텐츠 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">콘텐츠를 찾을 수 없습니다.</div>
      </div>
    );
  }

  const platformIcon =
    content.platform === "youtube" ? (
      <Film className="w-4 h-4 text-red-400" />
    ) : content.platform === "tiktok" ? (
      <Film className="w-4 h-4 text-cyan-400" />
    ) : (
      <ImageIcon className="w-4 h-4 text-gray-400" />
    );

  const platformName = content.platform === "youtube" ? "YouTube" : "이미지";

  return (
    <>
      <MediaPlayerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        postData={content}
        contentItems={modalContentItems}
      />
      <div className="min-h-screen bg-gray-900 text-white">
        {/* 헤더 */}
        <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
          {/* ✅ 생략되었던 헤더 JSX 부분 */}
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>뒤로가기</span>
            </button>
            <h1 className="text-lg font-semibold truncate">{content.title}</h1>
            <div className="w-24"></div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* 콘텐츠 정보 */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
            <h2 className="text-3xl font-bold mb-3">{content.title}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400 mb-4">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>{content.creatorName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(
                    content.createdAt.seconds * 1000
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                <span>{content.category}</span>
              </div>
            </div>
            {content.description && (
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {content.description}
              </p>
            )}
          </div>

          {/* ✅ 3. 모든 콘텐츠 아이템을 렌더링하는 섹션 */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold border-b border-gray-700 pb-2">
              등록된 콘텐츠 ({content.contentItems?.length || 0}개)
            </h3>
            {content.contentItems && content.contentItems.length > 0 ? (
              content.contentItems.map((item, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                  <ContentItemRenderer
                    item={item}
                    onOpenModal={openMediaModal}
                  />
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-10">
                <p>표시할 상세 콘텐츠가 없습니다.</p>
                <p className="text-xs mt-2">
                  이 콘텐츠는 예전 데이터 구조로 작성되었을 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ContentDetail;
