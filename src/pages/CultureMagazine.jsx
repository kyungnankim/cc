// 4. pages/CultureMagazine.jsx - 완성된 기본 구조
import React, { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Users, Search, Plus } from "lucide-react";

const CategoryButton = ({ category, isActive, onClick }) => (
  <button
    onClick={() => onClick(category)}
    className={`px-4 py-2 rounded-full font-medium transition-all ${
      isActive
        ? "bg-white text-black"
        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
    }`}
  >
    {category}
  </button>
);

const Hot = () => {
  const [activeCategory, setActiveCategory] = useState("Music");
  const categories = ["Music", "Food", "Fashion"];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Battle in progress
        </h1>
        <h2 className="text-2xl text-pink-500 mb-6">Who win ?</h2>
        <p className="text-gray-400 mb-8">
          지금 진행중인 배틀 • 가장 인기있는 배틀
        </p>

        {/* Category Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          {categories.map((category) => (
            <CategoryButton
              key={category}
              category={category}
              isActive={activeCategory === category}
              onClick={setActiveCategory}
            />
          ))}
        </div>
      </div>

      {/* Featured Battle Display */}
      <div className="mb-12 bg-gray-800/30 rounded-2xl p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="text-center">
            <div className="w-full max-w-sm mx-auto h-64 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-4xl">🎵</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Tomorrow Comes Today
            </h3>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-pink-500 mb-4">VS</div>
            <div className="space-y-2">
              <div className="text-sm text-gray-400">실시간 커뮤니티 반응</div>
              <div className="bg-gray-700 rounded-full p-2">
                💬 댓글 실시간 업데이트
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="w-full max-w-sm mx-auto h-64 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-4xl">🎬</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              I Really Want to Stay at Your House
            </h3>
          </div>
        </div>
      </div>

      {/* Sample Battle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="group bg-gray-800/50 rounded-xl p-4 hover:bg-gray-800 transition-all duration-300 hover:scale-105"
          >
            <div className="relative mb-4">
              <div className="grid grid-cols-3 gap-2 h-40">
                <div className="bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎵</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-xl font-bold text-pink-500">VS</span>
                </div>
                <div className="bg-gradient-to-br from-green-500/30 to-blue-500/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎬</span>
                </div>
              </div>
              <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded">
                진행중
              </div>
            </div>

            <h3 className="text-white font-semibold mb-2 group-hover:text-pink-500 transition-colors">
              Sample Battle {index + 1}
            </h3>

            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{Math.floor(Math.random() * 1000)}표</span>
              </div>
              <span>{activeCategory}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Best = () => {
  const [selectedMonth, setSelectedMonth] = useState("2025.11");
  const [activeCategory, setActiveCategory] = useState("Music");
  const categories = ["Music", "Food", "Fashion"];
  const months = [
    "2025.11",
    "2025.10",
    "2025.09",
    "2025.08",
    "2025.07",
    "2025.06",
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-pink-500 mb-4">
          Previous Battle
        </h1>
        <p className="text-gray-400 mb-8">
          지난 배틀 중 우승한 콘텐츠들 • 월별 베스트 선정
        </p>

        {/* Category Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          {categories.map((category) => (
            <CategoryButton
              key={category}
              category={category}
              isActive={activeCategory === category}
              onClick={setActiveCategory}
            />
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Timeline */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-bold text-white mb-4">
            월별 베스트 선정
          </h3>
          <div className="space-y-3">
            {months.map((month) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedMonth === month
                    ? "bg-pink-500 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                  <span>{month} Best</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Battle */}
        <div className="lg:col-span-3">
          <div className="bg-gray-800/30 rounded-2xl p-6 mb-8">
            <div className="w-full h-64 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-6xl">🏆</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {selectedMonth} 베스트 배틀
            </h3>
            <p className="text-gray-400">
              이달의 가장 인기있었던 {activeCategory} 배틀
            </p>
          </div>

          {/* Best Battles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="group bg-gray-800/50 rounded-xl p-4 hover:bg-gray-800 transition-all"
              >
                <div className="relative mb-4">
                  <div className="grid grid-cols-3 gap-2 h-40">
                    <div className="bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🏆</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-xl font-bold text-yellow-500">
                        W
                      </span>
                    </div>
                    <div className="bg-gradient-to-br from-gray-500/30 to-gray-600/30 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🥈</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-white font-semibold mb-2">
                  Best Battle {index + 1}
                </h3>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Winner</span>
                  <span>{activeCategory}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Application = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = ["All", "Music", "Fashion", "Food"];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-pink-500 mb-4">Next Who?</h1>
        <p className="text-gray-400 mb-6">
          Posts that violate the rules may be immediately removed.
        </p>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Search</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="검색어를 입력하세요"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-full px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Category */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Category</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${
                      selectedCategory === category
                        ? "bg-white text-black"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* New Battle Button */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">New Battle</h3>
              <Link
                to="/create-battle"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-6 rounded-full hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create
              </Link>
            </div>
          </div>

          {/* Applications Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-xl overflow-hidden hover:bg-gray-800 transition-all cursor-pointer"
                >
                  <div className="w-full h-32 bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                    <span className="text-3xl">📝</span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-2">
                      Gorillaz vs C... [52]
                    </h3>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>25.05.13</span>
                      <span>Music</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CultureMagazine = () => (
  <Routes>
    <Route path="hot" element={<Hot />} />
    <Route path="best" element={<Best />} />
    <Route path="application" element={<Application />} />
    <Route index element={<Hot />} />
  </Routes>
);

export default CultureMagazine;
