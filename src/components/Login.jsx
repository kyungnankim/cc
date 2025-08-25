// src/components/Login.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Music } from "lucide-react";

// authService에서 로그인 함수들을 import 합니다.
import {
  loginWithEmail,
  handleGoogleLogin,
  handleAppleLogin,
} from "../services/authService";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 이메일/비밀번호 로그인 버튼 클릭 시 실행되는 함수
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error("이메일과 비밀번호를 모두 입력해주세요.");
    }
    setLoading(true);
    try {
      // authService의 loginWithEmail 함수 호출
      await loginWithEmail(email, password);
      toast.success("로그인 되었습니다!");
      navigate("/"); // 로그인 성공 시 메인 페이지로 이동
    } catch (error) {
      console.error("Email login error:", error);
      // Firebase 에러 코드에 따라 사용자에게 친화적인 메시지 표시
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        toast.error("이메일 또는 비밀번호가 잘못되었습니다.");
      } else {
        toast.error("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Google 로그인 처리 함수
  const handleGoogleLoginClick = async () => {
    setLoading(true);
    try {
      const result = await handleGoogleLogin();

      if (result.success) {
        if (result.isExistingUser) {
          // 기존 사용자 - 로그인 성공
          toast.success(result.message);
          navigate("/");
        } else {
          // 신규 사용자 - 회원가입 페이지로 이동
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
    } finally {
      setLoading(false);
    }
  };

  // Apple 로그인 처리 함수
  const handleAppleLoginClick = async () => {
    setLoading(true);
    try {
      const result = await handleAppleLogin();

      if (result.success) {
        if (result.isExistingUser) {
          // 기존 사용자 - 로그인 성공
          toast.success(result.message);
          navigate("/");
        } else {
          // 신규 사용자 - 회원가입 페이지로 이동
          toast.success(
            "Apple 계정 연동이 완료되었습니다. 추가 정보를 입력해주세요."
          );
          navigate("/register");
        }
      } else {
        if (result.error === "popup_closed") {
          toast.error("Apple 로그인이 취소되었습니다.");
        } else if (result.error === "not_configured") {
          toast.error(
            "Apple 로그인이 설정되지 않았습니다. 관리자에게 문의하세요."
          );
        } else {
          toast.error(result.message || "Apple 로그인 중 오류가 발생했습니다.");
        }
      }
    } catch (error) {
      console.error("Apple login error:", error);
      toast.error("Apple 로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Spotify 로그인 함수 (기존 코드 유지)
  const handleSpotifyLogin = () => {
    const CLIENT_ID = "254d6b7f190543e78da436cd3287a60e";
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const REDIRECT_URI = isLocal
      ? "http://127.0.0.1:5173/callback" // 개발 환경일 때
      : "https://cc-gamma-rosy.vercel.app/callback"; // 배포 환경일 때

    // PKCE를 위한 code verifier 생성
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

      // verifier를 세션에 저장
      sessionStorage.setItem("verifier", codeVerifier);

      const scope = "user-read-private user-read-email";

      const authUrl = new URL("https://accounts.spotify.com/authorize");
      authUrl.searchParams.append("client_id", CLIENT_ID);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.append("scope", scope);
      authUrl.searchParams.append("code_challenge_method", "S256");
      authUrl.searchParams.append("code_challenge", codeChallenge);

      // Spotify 로그인 페이지로 리다이렉트
      window.location.href = authUrl.toString();
    };

    // 비동기 함수 실행
    initiateSpotifyLogin().catch((error) => {
      console.error("Spotify login initiation error:", error);
      toast.error("Spotify 로그인 시작 중 오류가 발생했습니다.");
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-center px-4">
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-white">
          <span className="text-pink-500">Battle</span> Seoul
        </h1>
        <p className="text-gray-400 mt-2">
          VS. 포맷으로 만나는 서울의 라이프스타일
        </p>
      </div>

      <div className="w-full max-w-sm p-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700">
        {/* 이메일 로그인 폼 */}
        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div>
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "이메일로 로그인"}
          </button>
        </form>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-600" />
          <span className="mx-4 text-gray-500 text-sm">또는</span>
          <hr className="flex-grow border-gray-600" />
        </div>

        {/* 소셜 로그인 버튼 */}
        <div className="space-y-4">
          <button
            onClick={handleSpotifyLogin}
            disabled={loading}
            className="w-full inline-flex justify-center items-center gap-3 px-6 py-3 bg-[#1DB954] text-white font-bold rounded-lg hover:bg-[#1ED760] transition-colors disabled:opacity-50"
          >
            <Music className="w-5 h-5" />
            Spotify로 계속하기
          </button>

          <button
            onClick={handleGoogleLoginClick}
            disabled={loading}
            className="w-full inline-flex justify-center items-center gap-3 px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {/* Google 로고 SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 계속하기
          </button>

          <button
            onClick={handleAppleLoginClick}
            disabled={loading}
            className="w-full inline-flex justify-center items-center gap-3 px-6 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {/* Apple 로고 SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Apple로 계속하기
          </button>
        </div>

        {/* 회원가입 페이지 링크 */}
        <p className="text-gray-400 text-sm mt-8">
          계정이 없으신가요?{" "}
          <Link
            to="/register"
            className="font-bold text-pink-400 hover:underline"
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
