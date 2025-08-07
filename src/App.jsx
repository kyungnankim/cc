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
import Callback from "./components/SpotifyCallback";
import MyPage from "./components/MyPage";
import BattleList from "./components/BattleList";
import BattleDetail from "./components/BattleDetail";
import ContentUpload from "./components/ContentUpload";
import FloatingButtons from "./components/FloatingButtons";

import About from "./pages/About";
import CultureMagazine from "./pages/CultureMagazine";
import Entertainment from "./pages/Entertainment";
import NotFound from "./pages/NotFound";
import CreateBattlePage from "./pages/CreateBattlePage";

import { logout, handleGoogleLogin } from "./services/authService";
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
  const { user, loading, refreshAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("로그아웃 되었습니다.");
      // 로그아웃 후 인증 상태 새로고침
      if (refreshAuth) {
        refreshAuth();
      }
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("로그아웃 중 오류가 발생했습니다.");
    }
  };

  const handleGoogleLoginClick = async () => {
    try {
      const result = await handleGoogleLogin();

      if (result.success) {
        if (result.isExistingUser) {
          toast.success(result.message);
          // 약간의 지연 후 상태 새로고침
          setTimeout(() => {
            if (refreshAuth) refreshAuth();
          }, 500);
          navigate("/");
        } else {
          toast.success(
            "Google 계정 연동이 완료되었습니다. 추가 정보를 입력해주세요."
          );
          navigate("/register");
        }
      } else {
        if (result.error === "popup_closed") {
          toast.error("Google 로그인이 취소되었습니다.");
        } else {
          toast.error(
            result.message || "Google 로그인 중 오류가 발생했습니다."
          );
        }
      }
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Google 로그인 중 오류가 발생했습니다.");
    }
  };

  const handleSpotifyLogin = () => {
    const CLIENT_ID = "254d6b7f190543e78da436cd3287a60e";
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const REDIRECT_URI = isLocal
      ? "http://127.0.0.1:5173/callback" // 개발 환경일 때
      : "https://cc-gamma-rosy.vercel.app/callback"; // 배포 환경일 때

    const generateCodeVerifier = (length) => {
      let text = "";
      const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    };

    const generateCodeChallenge = async (codeVerifier) => {
      const data = new TextEncoder().encode(codeVerifier);
      const digest = await window.crypto.subtle.digest("SHA-256", data);
      return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    };

    const initiateSpotifyLogin = async () => {
      const codeVerifier = generateCodeVerifier(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      sessionStorage.setItem("verifier", codeVerifier);

      const scope = "user-read-private user-read-email";
      const authUrl = new URL("https://accounts.spotify.com/authorize");
      authUrl.searchParams.append("client_id", CLIENT_ID);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.append("scope", scope);
      authUrl.searchParams.append("code_challenge_method", "S256");
      authUrl.searchParams.append("code_challenge", codeChallenge);

      window.location.href = authUrl.toString();
    };

    initiateSpotifyLogin().catch((error) => {
      console.error("Spotify login initiation error:", error);
      toast.error("Spotify 로그인 시작 중 오류가 발생했습니다.");
    });
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

      <main className="pt-16">
        <Routes>
          <Route path="/" element={<BattleList />} />
          <Route
            path="/login"
            element={
              <Login
                onGoogleLogin={handleGoogleLoginClick}
                onSpotifyLogin={handleSpotifyLogin}
              />
            }
          />
          <Route path="/register" element={<Register />} />
          <Route path="/callback" element={<Callback />} />

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

      {showUpload && <ContentUpload onClose={() => setShowUpload(false)} />}
      <FloatingButtons />

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
