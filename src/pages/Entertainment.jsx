// 5. pages/Entertainment.jsx
import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";

const Artist = () => (
  <div className="max-w-6xl mx-auto px-4 py-8">
    <h1 className="text-4xl font-bold text-white mb-8">Artists</h1>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 아티스트 카드들 */}
    </div>
  </div>
);

const Game = () => (
  <div className="max-w-6xl mx-auto px-4 py-8">
    <h1 className="text-4xl font-bold text-white mb-8">Games</h1>
    <div className="text-center py-20">
      <p className="text-2xl text-gray-400">Coming Soon...</p>
    </div>
  </div>
);

const SVC = () => {
  const [errorCode] = useState("0505");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gray-800/50 rounded-2xl p-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-gray-400 mb-8">
          fiddle.jshell.net에 삽입된 페이지 내용:
        </p>
        <div className="bg-red-900/20 text-red-400 px-6 py-3 rounded-lg inline-block">
          <p>준비 중입니다.</p>
          <p className="font-mono mt-2">error : {errorCode}</p>
        </div>
        <p className="text-sm text-gray-500 mt-8">
          SVC는 Mayor가 막아놓은 시스템입니다.
          <br />
          Error 넘버는 SVC가 잠깐 열리는 날짜를 뜻합니다.
        </p>
      </div>
    </div>
  );
};

const Entertainment = () => (
  <Routes>
    <Route path="artist" element={<Artist />} />
    <Route path="game" element={<Game />} />
    <Route path="svc" element={<SVC />} />
    <Route index element={<Artist />} />
  </Routes>
);

export default Entertainment;
