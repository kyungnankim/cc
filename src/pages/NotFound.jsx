// 10. pages/NotFound.jsx - 404 페이지
import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-pink-500 mb-4">404</h1>
        <p className="text-2xl text-gray-400 mb-8">페이지를 찾을 수 없습니다</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default NotFound;
