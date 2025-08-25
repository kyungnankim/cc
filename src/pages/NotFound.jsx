// pages/NotFound.jsx - 향상된 404 페이지
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const popularPages = [
    { path: "/", label: "홈페이지", icon: "🏠" },
    { path: "/about", label: "소개", icon: "ℹ️" },
    { path: "/culture-magazine", label: "문화 매거진", icon: "📰" },
    { path: "/entertainment", label: "엔터테인먼트", icon: "🎭" },
    { path: "/create-battle", label: "배틀 만들기", icon: "⚔️" },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* 404 Animation */}
        <div className="mb-8 relative">
          <h1 className="text-8xl md:text-9xl font-bold text-pink-500 mb-4 animate-pulse">
            404
          </h1>
          <div className="absolute inset-0 text-8xl md:text-9xl font-bold text-pink-500/20 transform translate-x-2 translate-y-2">
            404
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-xl text-gray-400 mb-6">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>

          {/* Battle Seoul Theme */}
          <div className="bg-gray-800/50 rounded-2xl p-6 mb-8">
            <p className="text-gray-300">
              <span className="text-pink-500 font-bold">Battle Seoul</span>에서
              새로운 문화 배틀을 찾아보세요!
            </p>
          </div>
        </div>

        {/* Auto Redirect Info */}
        <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400">
            🕐 <span className="font-bold">{countdown}초</span> 후 자동으로
            홈페이지로 이동합니다
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg hover:scale-105 transition-transform"
          >
            <Home className="w-5 h-5" />
            홈으로 돌아가기
          </button>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            이전 페이지
          </button>
        </div>

        {/* Popular Pages */}
        <div className="text-left">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-pink-500" />
            인기 페이지
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {popularPages.map((page, index) => (
              <Link
                key={index}
                to={page.path}
                className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors group"
              >
                <span className="text-xl">{page.icon}</span>
                <span className="text-gray-300 group-hover:text-white transition-colors">
                  {page.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Fun Element */}
        <div className="mt-12 text-center">
          <div className="text-4xl mb-2">🎭</div>
          <p className="text-gray-500 text-sm">
            길을 잃은 것도 새로운 발견의 시작입니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
