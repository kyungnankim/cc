// pages/About.jsx - About 페이지 (완성 버전)
import React from "react";
import { Routes, Route } from "react-router-dom";
import {
  Zap,
  Users,
  Trophy,
  Sparkles,
  Target,
  Lightbulb,
  Crown,
  Award,
  Calendar,
  MapPin,
  Mail,
} from "lucide-react";

const Introduction = () => (
  <div className="max-w-6xl mx-auto px-4 py-8">
    <div className="text-center mb-12">
      <h1 className="text-5xl font-bold text-white mb-6">
        What is <span className="text-pink-500">Battle</span> Seoul?
      </h1>
      <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
        Battle Seoul은 트렌드 시뮬레이션을 통해 음악, 음식, 패션 등 서울 내 문화
        트렌드를 예측하고 다양한 서울의 라이프스타일을 여러분과 함께 만들어
        갑니다.
      </p>
    </div>

    {/* 주요 기능들 */}
    <div className="grid md:grid-cols-3 gap-8 mb-16">
      <div className="bg-gray-800/50 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-pink-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">실시간 배틀</h3>
        <p className="text-gray-400">
          음악, 패션, 음식 등 다양한 카테고리의 콘텐츠들이 실시간으로 경쟁하며
          트렌드를 만들어갑니다.
        </p>
      </div>

      <div className="bg-gray-800/50 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-purple-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">커뮤니티 참여</h3>
        <p className="text-gray-400">
          서울 시민들이 직접 참여하여 투표하고 댓글을 통해 소통하며 문화를
          만들어갑니다.
        </p>
      </div>

      <div className="bg-gray-800/50 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-yellow-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">트렌드 예측</h3>
        <p className="text-gray-400">
          배틀 결과를 통해 서울의 다음 문화 트렌드를 예측하고 앞서 나가는
          라이프스타일을 제안합니다.
        </p>
      </div>
    </div>

    {/* 미션과 비전 */}
    <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl p-8 mb-12">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-8 h-8 text-pink-500" />
            <h2 className="text-3xl font-bold text-white">Our Mission</h2>
          </div>
          <p className="text-gray-300 leading-relaxed">
            서울의 다양한 문화와 라이프스타일을 발굴하고, 시민들의 참여를 통해
            새로운 트렌드를 만들어가며, 더 풍성하고 역동적인 서울 문화를
            조성하는 것입니다.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-8 h-8 text-yellow-500" />
            <h2 className="text-3xl font-bold text-white">Our Vision</h2>
          </div>
          <p className="text-gray-300 leading-relaxed">
            Battle Seoul을 통해 서울이 아시아의 문화 허브로 자리잡고, 전 세계
            사람들이 서울의 트렌드를 주목하며 참여하는 글로벌 플랫폼으로
            성장하는 것입니다.
          </p>
        </div>
      </div>
    </div>

    {/* 통계 */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div className="text-center">
        <div className="text-3xl font-bold text-pink-500 mb-2">10K+</div>
        <div className="text-gray-400">활성 사용자</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-purple-500 mb-2">500+</div>
        <div className="text-gray-400">진행된 배틀</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-yellow-500 mb-2">50K+</div>
        <div className="text-gray-400">총 투표수</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-green-500 mb-2">25</div>
        <div className="text-gray-400">서울 지역구</div>
      </div>
    </div>
  </div>
);

const Mayor = () => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <h1 className="text-4xl font-bold text-white mb-8 text-center">
      <Crown className="inline-block w-10 h-10 text-yellow-500 mr-3" />
      Battle Seoul Mayor
    </h1>

    <div className="bg-gray-800/50 rounded-2xl p-8 mb-8">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <img
            src="/images/popo.png"
            alt="Mayor"
            className="w-48 h-48 rounded-full object-cover border-4 border-pink-500"
          />
          <div className="absolute -top-2 -right-2 bg-yellow-500 text-black rounded-full p-2">
            <Crown className="w-6 h-6" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-bold text-white mb-2">Mc mrrr</h2>
          <p className="text-pink-500 text-lg mb-4">Battle Seoul 시장</p>
          <blockquote className="text-xl text-gray-300 italic border-l-4 border-pink-500 pl-4 mb-6">
            "서울의 문화는 시민들의 손에서 만들어집니다. Battle Seoul을 통해
            모든 시민이 문화의 주인공이 되기를 바랍니다."
          </blockquote>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>2025년 취임</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>Seoul, Korea</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* 시장의 업적 */}
    <div className="grid md:grid-cols-2 gap-8">
      <div className="bg-gray-800/30 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          주요 업적
        </h3>
        <ul className="space-y-3 text-gray-300">
          <li className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-pink-500 mt-1 flex-shrink-0" />
            <span>Battle Seoul 플랫폼 런칭 및 성장 주도</span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-pink-500 mt-1 flex-shrink-0" />
            <span>서울시 문화 진흥 정책 수립</span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-pink-500 mt-1 flex-shrink-0" />
            <span>글로벌 문화 교류 프로그램 개발</span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-pink-500 mt-1 flex-shrink-0" />
            <span>시민 참여형 문화 생태계 구축</span>
          </li>
        </ul>
      </div>

      <div className="bg-gray-800/30 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">MICO Company</h3>
        <p className="text-gray-300 mb-4">
          시장이 설립한 문화 기술 회사로, Battle Seoul의 기술적 기반을 제공하며
          서울의 디지털 문화 혁신을 선도하고 있습니다.
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">설립연도:</span>
            <span className="text-white">2022</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">직원수:</span>
            <span className="text-white">50+ 명</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">주요사업:</span>
            <span className="text-white">문화 플랫폼 개발</span>
          </div>
        </div>
      </div>
    </div>

    {/* 연락처 */}
    <div className="mt-8 text-center">
      <div className="bg-pink-500/10 rounded-xl p-6 inline-block">
        <h3 className="text-lg font-bold text-white mb-3">연락처</h3>
        <div className="flex items-center gap-2 text-gray-300">
          <Mail className="w-4 h-4" />
          <span>mayor@battleseoul.com</span>
        </div>
      </div>
    </div>
  </div>
);

const History = () => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <h1 className="text-4xl font-bold text-white mb-8 text-center">
      Battle Seoul History
    </h1>

    <div className="relative">
      {/* 타임라인 라인 */}
      <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 via-purple-500 to-blue-500"></div>

      <div className="space-y-8">
        {[
          {
            year: "2025",
            event: "Mc mrrr 시장 취임",
            description:
              "새로운 비전과 함께 Battle Seoul의 새 시대가 시작되었습니다.",
            color: "pink",
          },
          {
            year: "2024",
            event: "Battle Seoul 리뉴얼",
            description:
              "사용자 경험 개선과 새로운 기능들이 대거 추가되었습니다.",
            color: "purple",
          },
          {
            year: "2023",
            event: "Battle Seoul 런칭",
            description:
              "서울 시민들을 위한 문화 배틀 플랫폼이 정식 오픈했습니다.",
            color: "blue",
          },
          {
            year: "2022",
            event: "Battle Seoul 개발 시작",
            description:
              "MICO Company가 설립되며 플랫폼 개발이 본격적으로 시작되었습니다.",
            color: "green",
          },
        ].map((item, index) => (
          <div key={index} className="relative flex items-center gap-6">
            {/* 타임라인 점 */}
            <div
              className={`absolute left-6 w-6 h-6 bg-${item.color}-500 rounded-full border-4 border-gray-900 z-10`}
            ></div>

            {/* 연도 */}
            <div className="ml-16 flex-shrink-0">
              <div className={`text-3xl font-bold text-${item.color}-500 mb-1`}>
                {item.year}
              </div>
            </div>

            {/* 내용 */}
            <div className="flex-1 bg-gray-800/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">
                {item.event}
              </h3>
              <p className="text-gray-300">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* 미래 계획 */}
    <div className="mt-16 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl p-8">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        🚀 앞으로의 계획
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-4xl mb-3">🌍</div>
          <h3 className="font-bold text-white mb-2">글로벌 확장</h3>
          <p className="text-gray-400 text-sm">
            아시아 주요 도시로 서비스 확대
          </p>
        </div>
        <div className="text-center">
          <div className="text-4xl mb-3">🤖</div>
          <h3 className="font-bold text-white mb-2">AI 기능 강화</h3>
          <p className="text-gray-400 text-sm">개인 맞춤형 추천 시스템 도입</p>
        </div>
        <div className="text-center">
          <div className="text-4xl mb-3">🎨</div>
          <h3 className="font-bold text-white mb-2">창작자 지원</h3>
          <p className="text-gray-400 text-sm">창작자 수익화 모델 개발</p>
        </div>
      </div>
    </div>
  </div>
);

const About = () => (
  <Routes>
    <Route path="introduction" element={<Introduction />} />
    <Route path="mayor" element={<Mayor />} />
    <Route path="history" element={<History />} />
    <Route index element={<Introduction />} />
  </Routes>
);

export default About;
