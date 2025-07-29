import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

import Header from "./components/Header";
import Login from "./components/Login";
import Register from "./components/Register";
import Callback from "./components/Callback";
import MyPage from "./components/MyPage";
import BattleList from "./components/BattleList";
import BattleDetail from "./components/BattleDetail";
import ContentUpload from "./components/ContentUpload";
import FloatingButtons from "./components/FloatingButtons"; // ← 추가

import About from "./pages/About";
import CultureMagazine from "./pages/CultureMagazine";
import Entertainment from "./pages/Entertainment";
import NotFound from "./pages/NotFound";
import CreateBattlePage from "./pages/CreateBattlePage"; // 새로 만든 페이지 import

import { logout, loginOrRegisterWithGoogle } from "./services/authService";
import { useAuth } from "./hooks/useAuth";

function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}

function MainApp() {
  const [showUpload, setShowUpload] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("로그아웃 되었습니다.");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("로그아웃 중 오류가 발생했습니다.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await loginOrRegisterWithGoogle();
      if (result.success) {
        toast.success(
          result.isNewUser
            ? "환영합니다! 회원가입이 완료되었습니다."
            : "로그인 되었습니다."
        );
        navigate("/");
      }
    } catch (error) {
      console.error("Google login process failed:", error);
      toast.error("Google 로그인 중 오류가 발생했습니다.");
    }
  };

  const handleSpotifyLogin = () => {
    console.log("Spotify login initiated");
    toast("Spotify 로그인 기능은 현재 개발 중입니다.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <Header
        user={user}
        onLogout={handleLogout}
        onCreateBattle={() => setShowUpload(true)}
        onNavigate={navigate}
      />

      {/* 헤더의 높이가 64px(h-16)이므로, 콘텐츠 영역이 헤더에 가려지지 않도록 패딩을 줍니다. */}
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<BattleList />} />
          <Route
            path="/login"
            element={
              <Login
                onGoogleLogin={handleGoogleLogin}
                onSpotifyLogin={handleSpotifyLogin}
              />
            }
          />
          <Route path="/register" element={<Register />} />
          <Route path="/callback" element={<Callback />} />

          {/* 로그인한 사용자만 접근 가능한 보호된 라우트들 */}
          <Route
            path="/mypage"
            element={user ? <MyPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/create-battle"
            element={user ? <CreateBattlePage /> : <Navigate to="/login" />}
          />

          <Route path="/battle/:id" element={<BattleDetail />} />
          <Route path="/about/*" element={<About />} />
          <Route path="/magazine/*" element={<CultureMagazine />} />
          <Route path="/entertainment/*" element={<Entertainment />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* 콘텐츠 업로드 모달 */}
      {showUpload && <ContentUpload onClose={() => setShowUpload(false)} />}

      {/* 🔥 플로팅 버튼들 - 모든 페이지에서 보임 */}
      <FloatingButtons />

      {/* Toast 알림 */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#333",
            color: "#fff",
          },
        }}
      />
    </div>
  );
}

export default App;
