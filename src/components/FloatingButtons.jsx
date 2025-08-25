// src/components/FloatingButtons.jsx - 플로팅 버튼들 (게임 버튼 추가)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronUp,
  Instagram,
  Youtube,
  MessageCircle,
  ExternalLink,
  Gamepad2,
  Music,
} from "lucide-react";

const FloatingButtons = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  // 스크롤 위치 감지
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 맨 위로 스크롤
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // 게임으로 이동
  const goToGame = () => {
    navigate("/game");
    setIsExpanded(false); // 메뉴 닫기
  };

  // 소셜 미디어 링크들
  const socialLinks = [
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://www.instagram.com/battleseoul",
      color: "from-purple-500 to-pink-500",
      hoverColor: "hover:from-purple-600 hover:to-pink-600",
    },
    {
      name: "YouTube",
      icon: Youtube,
      url: "https://www.youtube.com/@battleseoul",
      color: "from-red-500 to-red-600",
      hoverColor: "hover:from-red-600 hover:to-red-700",
    },
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* 확장된 버튼들 */}
        <div
          className={`flex flex-col gap-3 transition-all duration-300 ${
            isExpanded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          {/* 게임 버튼 */}
          <button
            onClick={goToGame}
            className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl"
            title="Into You 리듬 게임"
          >
            <Gamepad2 className="w-6 h-6" />

            {/* 툴팁 */}
            <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              Into You 게임
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-y-4 border-y-transparent"></div>
            </div>
          </button>

          {/* 소셜 미디어 버튼들 */}
          {socialLinks.map((social) => {
            const IconComponent = social.icon;
            return (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${social.color} ${social.hoverColor} text-white shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl`}
                title={`Battle Seoul ${social.name}`}
              >
                <IconComponent className="w-6 h-6" />

                {/* 툴팁 */}
                <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  {social.name}
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-y-4 border-y-transparent"></div>
                </div>
              </a>
            );
          })}
        </div>

        {/* 메인 토글 버튼 (게임/소셜 미디어) */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl ${
            isExpanded ? "rotate-45" : "rotate-0"
          }`}
          title="게임 & 소셜 미디어"
        >
          {isExpanded ? (
            <ExternalLink className="w-6 h-6" />
          ) : (
            <Music className="w-6 h-6" />
          )}

          {/* 툴팁 */}
          <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            게임 & 소셜
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-y-4 border-y-transparent"></div>
          </div>
        </button>

        {/* 맨 위로 버튼 */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 text-white shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl animate-bounce-in"
            title="맨 위로"
          >
            <ChevronUp className="w-6 h-6" />

            {/* 툴팁 */}
            <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              맨 위로
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-y-4 border-y-transparent"></div>
            </div>
          </button>
        )}

        {/* 확장 상태 표시 배경 */}
        {isExpanded && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </div>

      {/* 인라인 스타일로 애니메이션 추가 */}
      <style>{`
        .animate-bounce-in {
          animation: bounceIn 0.5s ease-out;
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(20px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default FloatingButtons;