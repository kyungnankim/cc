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
import ContentDetail from "./components/ContentDetail.jsx"; // 2단계에서 만든 컴포넌트 import

import Header from "./components/Header";
import Login from "./components/Login";
import Register from "./components/Register";
import Callback from "./components/SpotifyCallback";
import MyPage from "./components/MyPage";
import BattleList from "./components/BattleList";
import BattleDetail from "./components/BattleDetail";
import ContentUpload from "./components/ContentUpload";
import FloatingButtons from "./components/FloatingButtons";
import Game from "./components/Game";
import DefaultGame from "./components/DefaultGame";
import ApplePublicDomainGame from "./components/ApplePublicDomainGame.jsx";

import About from "./pages/About";
import CultureMagazine from "./pages/CultureMagazine";
import Entertainment from "./pages/Entertainment";
import NotFound from "./pages/NotFound";
import CreateBattlePage from "./pages/CreateBattlePage";

import { logout } from "./services/authService";
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
      />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<BattleList />} />
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/" />}
          />
          <Route
            path="/register"
            element={!user ? <Register /> : <Navigate to="/" />}
          />
          <Route path="/callback" element={<Callback />} />
          <Route
            path="/mypage"
            element={user ? <MyPage user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/create-battle"
            element={user ? <CreateBattlePage /> : <Navigate to="/login" />}
          />
          <Route path="/battle/:id" element={<BattleDetail user={user} />} />
          <Route path="/about/*" element={<About />} />
          <Route path="/magazine/*" element={<CultureMagazine />} />
          <Route path="/entertainment/*" element={<Entertainment />} />
          <Route path="/content/:id" element={<ContentDetail />} />
          <Route path="/game" element={<Game user={user} />} />
          <Route path="/localMusic" element={<DefaultGame user={user} />} />
          <Route
            path="/classicalGame"
            element={<ApplePublicDomainGame user={user} />}
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {showUpload && <ContentUpload onClose={() => setShowUpload(false)} />}
      <FloatingButtons />
      <Toaster
        position="bottom-center"
        toastOptions={{ style: { background: "#333", color: "#fff" } }}
      />
    </div>
  );
}

export default App;
