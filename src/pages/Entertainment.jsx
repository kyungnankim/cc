// 5. pages/Entertainment.jsx - 완성된 기본 구조
import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";

const SocialButton = ({ icon, bgColor, label }) => (
  <div
    className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center transition-all hover:scale-110`}
  >
    <span className="text-white font-bold text-lg">{icon}</span>
  </div>
);

const ArtistCard = ({ artist, isProducer = false }) => (
  <div className="bg-gray-800/50 rounded-2xl p-8 mb-12">
    <div className="flex flex-col lg:flex-row items-center gap-8">
      {/* Artist Image */}
      <div className="flex-shrink-0">
        <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center">
          <span className="text-6xl">🎨</span>
        </div>
      </div>

      {/* Artist Info */}
      <div className="flex-1">
        <h2 className="text-3xl font-bold text-pink-500 mb-2">{artist.name}</h2>
        {isProducer && (
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white mb-2">History</h3>
            <ul className="space-y-2 text-gray-300">
              {artist.history.map((item, index) => (
                <li key={index} className="flex justify-between">
                  <span>• {item.period}</span>
                  <span>{item.role}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Social Links */}
        <div className="flex gap-4 mb-6">
          <SocialButton icon="📺" bgColor="bg-red-500" label="YouTube" />
          <SocialButton icon="🎵" bgColor="bg-pink-500" label="Music" />
          <SocialButton icon="🎧" bgColor="bg-green-500" label="Spotify" />
          <SocialButton icon="🐦" bgColor="bg-black" label="Twitter" />
        </div>
      </div>

      {/* New Album Section */}
      <div className="flex-shrink-0 w-full lg:w-96">
        <h3 className="text-xl font-bold text-white mb-4">New Album</h3>
        <div className="bg-gray-700/50 rounded-xl p-4">
          <div className="w-full h-48 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-lg mb-4 flex items-center justify-center">
            <span className="text-4xl">🎬</span>
          </div>
          <h4 className="text-white font-semibold">{artist.newAlbum.title}</h4>
          <p className="text-gray-400 text-sm">{artist.newAlbum.description}</p>
        </div>
      </div>
    </div>
  </div>
);

const Artist = () => {
  const artists = [
    {
      name: "Artist Name 1",
      newAlbum: {
        title: "I Really Want to Stay at Your House",
        description: "사이버펑크 엣지러너 OST",
      },
    },
    {
      name: "Artist Name 2",
      newAlbum: {
        title: "I Really Want to Stay at Your House",
        description: "사이버펑크 엣지러너 OST",
      },
    },
  ];

  const producer = {
    name: "HOWSAM",
    history: [
      { period: "2025", role: "2tom Producer" },
      { period: "2023 - 2024", role: "Battle Seoul" },
      { period: "2021 - 2022", role: "Battle Seoul" },
    ],
    newAlbum: {
      title: "Latest Production",
      description: "최신 프로듀싱 작품",
    },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">
        Artists
      </h1>

      {/* Artists */}
      {artists.map((artist, index) => (
        <ArtistCard key={index} artist={artist} />
      ))}

      {/* Producer Section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-pink-500 mb-8">Producer</h2>
        <ArtistCard artist={producer} isProducer={true} />
      </div>
    </div>
  );
};

const Game = () => (
  <div className="max-w-6xl mx-auto px-4 py-8">
    <h1 className="text-4xl font-bold text-white mb-8 text-center">Games</h1>
    <div className="text-center py-20">
      <div className="text-8xl mb-8">🎮</div>
      <p className="text-4xl text-gray-400 font-bold">WIP</p>
      <p className="text-xl text-gray-500 mt-4">게임 섹션이 곧 출시됩니다!</p>
    </div>
  </div>
);

const SVC = () => {
  const [errorCode] = useState("0505");
  const [showModal, setShowModal] = useState(true);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Error Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                fiddle.jshell.net에 삽입된 페이지 내용:
              </h3>
              <p className="text-gray-700 mb-2">준비 중입니다.</p>
              <p className="text-gray-700 mb-6 font-mono">
                error : {errorCode}
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 rounded-2xl p-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
        <div className="text-6xl mb-8">🔒</div>

        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-6 py-4 rounded-lg inline-block mb-8">
          <p className="font-semibold">준비 중입니다.</p>
          <p className="font-mono mt-2">error : {errorCode}</p>
        </div>

        <div className="max-w-md mx-auto">
          <p className="text-sm text-gray-500 leading-relaxed">
            SVC는 Mayor가 막아놓은 시스템입니다.
            <br />
            Error 넘버는 SVC가 잠깐 열리는 날짜를 뜻합니다.
          </p>

          <div className="mt-8 p-4 bg-gray-700/30 rounded-lg">
            <p className="text-xs text-gray-400">
              💡 힌트: {errorCode}는 5월 5일을 의미할 수 있습니다.
            </p>
          </div>
        </div>
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
