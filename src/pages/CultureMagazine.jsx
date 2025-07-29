// 4. pages/CultureMagazine.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

const Hot = () => (
  <div className="max-w-6xl mx-auto px-4 py-8">
    <h1 className="text-4xl font-bold text-white mb-8">Hot Battles</h1>
    {/* 인기 배틀 콘텐츠 */}
  </div>
);

const Best = () => (
  <div className="max-w-6xl mx-auto px-4 py-8">
    <h1 className="text-4xl font-bold text-white mb-8">Best of the Month</h1>
    {/* 월별 베스트 콘텐츠 */}
  </div>
);

const Application = () => (
  <div className="max-w-6xl mx-auto px-4 py-8">
    <h1 className="text-4xl font-bold text-white mb-8">Battle Applications</h1>
    {/* 배틀 신청 목록 */}
  </div>
);

const CultureMagazine = () => (
  <Routes>
    <Route path="hot" element={<Hot />} />
    <Route path="best" element={<Best />} />
    <Route path="application" element={<Application />} />
    <Route index element={<Hot />} />
  </Routes>
);

export default CultureMagazine;
