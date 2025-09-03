import React, { useState, useEffect } from "react";
import { getUserContenders } from "../../services/contentService";
import { Loader2, FileVideo, CheckCircle, Swords, Image } from "lucide-react";
import { Link } from "react-router-dom";

const MyContentTab = ({ userId }) => {
  const [contenders, setContenders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContenders = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const userContenders = await getUserContenders(userId);
        setContenders(userContenders);
      } catch (error) {
        console.error("사용자 콘텐츠 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContenders();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (contenders.length === 0) {
    return (
      <div className="text-center h-64 flex flex-col justify-center items-center">
        <FileVideo className="w-12 h-12 text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-white">
          아직 업로드한 콘텐츠가 없습니다.
        </h3>
        <p className="text-gray-400 mt-2">
          첫 번째 콘텐츠를 업로드하고 배틀에 참여해보세요!
        </p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    if (status === "in_battle") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-red-400 bg-red-900/50 rounded-full">
          <Swords className="w-3 h-3" />
          배틀 진행 중
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-green-400 bg-green-900/50 rounded-full">
        <CheckCircle className="w-3 h-3" />
        배틀 가능
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">
        내가 업로드한 콘텐츠 ({contenders.length}개)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contenders.map((contender) => (
          <Link
            to={`/content/${contender.id}`}
            key={contender.id}
            className="bg-gray-800 rounded-lg overflow-hidden group transition-transform hover:scale-105"
          >
            <div className="relative">
              <img
                src={
                  contender.thumbnailUrl ||
                  contender.imageUrl ||
                  "/images/popo.png"
                }
                alt={contender.title}
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-white truncate pr-2">
                  {contender.title}
                </h3>
                {getStatusBadge(contender.status)}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {contender.createdAt?.toDate().toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                {contender.platform === "image" ? (
                  <Image className="w-3 h-3" />
                ) : (
                  <FileVideo className="w-3 h-3" />
                )}
                <span className="capitalize">{contender.platform}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MyContentTab;
