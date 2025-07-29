// src/components/Callback.jsx

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const Callback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("인증 처리 중...");
  const hasProcessed = useRef(false); // 중복 처리 방지

  useEffect(() => {
    // 이미 처리되었다면 실행하지 않음
    if (hasProcessed.current) return;

    const handleCallback = async () => {
      hasProcessed.current = true; // 처리 시작 표시

      const CLIENT_ID = "254d6b7f190543e78da436cd3287a60e";
      const REDIRECT_URI = "http://127.0.0.1:5173/callback";

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const error = urlParams.get("error");

      // 사용자가 권한을 거부한 경우
      if (error) {
        console.log("User denied access:", error);
        toast.error("Spotify 로그인이 취소되었습니다.");
        navigate("/login");
        return;
      }

      // 인증 코드가 없는 경우
      if (!code) {
        console.log("No authorization code found");
        toast.error("인증 코드가 없습니다. 다시 시도해주세요.");
        navigate("/login");
        return;
      }

      // verifier 확인
      const verifier = sessionStorage.getItem("verifier");
      if (!verifier) {
        console.log("No code verifier found");
        toast.error("인증 정보가 누락되었습니다. 다시 로그인해주세요.");
        navigate("/login");
        return;
      }

      console.log(
        "Starting Spotify callback process with code:",
        code.substring(0, 10) + "..."
      );

      try {
        // --- 1. Access Token 요청 ---
        setStatus("액세스 토큰 발급 중...");

        const tokenParams = new URLSearchParams();
        tokenParams.append("client_id", CLIENT_ID);
        tokenParams.append("grant_type", "authorization_code");
        tokenParams.append("code", code);
        tokenParams.append("redirect_uri", REDIRECT_URI);
        tokenParams.append("code_verifier", verifier);

        console.log("Requesting access token...");

        const tokenResponse = await fetch(
          "https://accounts.spotify.com/api/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
            body: tokenParams,
          }
        );

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
          console.error("Token request failed:", {
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            error: tokenData,
          });

          if (tokenData.error === "invalid_grant") {
            toast.error("인증 코드가 만료되었습니다. 다시 로그인해주세요.");
          } else {
            toast.error(
              `토큰 발급 실패: ${
                tokenData.error_description || tokenData.error
              }`
            );
          }

          // URL을 정리하고 로그인 페이지로 이동
          window.history.replaceState({}, document.title, "/login");
          navigate("/login");
          return;
        }

        if (!tokenData.access_token) {
          throw new Error("액세스 토큰을 받지 못했습니다.");
        }

        console.log("Access token received successfully");

        // --- 2. 프로필 정보 요청 ---
        setStatus("프로필 정보 가져오는 중...");

        const profileResponse = await fetch("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            Accept: "application/json",
          },
        });

        if (!profileResponse.ok) {
          throw new Error("프로필 정보를 가져오는데 실패했습니다.");
        }

        const profile = await profileResponse.json();
        console.log("Profile received:", {
          id: profile.id,
          email: profile.email,
          name: profile.display_name,
        });

        if (!profile.email) {
          toast.error(
            "Spotify 계정에서 이메일 정보를 가져올 수 없습니다. 이메일 공개 설정을 확인해주세요."
          );
          navigate("/login");
          return;
        }

        // --- 3. Firebase에서 사용자 존재 여부 확인 ---
        setStatus("사용자 정보 확인 중...");

        try {
          const userDocRef = doc(db, "users", profile.email);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            // 🔵 기존 사용자 - 로그인 처리
            setStatus("로그인 처리 중...");
            console.log("Existing user found, logging in...");

            const userData = userDoc.data();

            // 마지막 로그인 시간 및 Spotify 정보 업데이트
            await setDoc(
              userDocRef,
              {
                ...userData,
                lastLogin: serverTimestamp(),
                spotifyProfile: {
                  id: profile.id,
                  displayName: profile.display_name,
                  email: profile.email,
                  images: profile.images || [],
                  country: profile.country,
                  followers: profile.followers,
                },
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );

            // 사용자 정보를 세션에 저장
            const loginData = {
              uid: userData.uid || profile.id,
              email: profile.email,
              displayName: userData.displayName || profile.display_name,
              photoURL: userData.photoURL || profile.images?.[0]?.url || null,
              provider: "spotify",
              spotifyId: profile.id,
              isLoggedIn: true,
            };

            sessionStorage.setItem("currentUser", JSON.stringify(loginData));

            toast.success(
              `다시 오신 것을 환영합니다, ${
                userData.displayName || profile.display_name
              }님!`
            );

            // URL 정리 후 메인 페이지로 이동
            window.history.replaceState({}, document.title, "/");
            navigate("/");
          } else {
            // 🟢 신규 사용자 - 회원가입으로 이동
            setStatus("회원가입 준비 중...");
            console.log("New user, redirecting to registration...");

            // Spotify 정보를 세션에 저장
            sessionStorage.setItem(
              "spotifyAccessToken",
              tokenData.access_token
            );
            sessionStorage.setItem("spotifyProfile", JSON.stringify(profile));

            toast.success("Spotify 인증 완료! 추가 정보를 입력해주세요.");

            // URL 정리 후 회원가입 페이지로 이동
            window.history.replaceState({}, document.title, "/register");
            navigate("/register");
          }
        } catch (firebaseError) {
          console.error("Firebase 작업 오류:", firebaseError);
          toast.error("사용자 정보 처리 중 오류가 발생했습니다.");
          navigate("/login");
        }
      } catch (error) {
        console.error("Spotify callback error:", error);
        toast.error(`로그인 처리 중 오류가 발생했습니다: ${error.message}`);

        // URL 정리 후 로그인 페이지로 이동
        window.history.replaceState({}, document.title, "/login");
        navigate("/login");
      } finally {
        // 세션 정리
        sessionStorage.removeItem("verifier");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-pink-500">Battle</span> Seoul
          </h1>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg mb-2">{status}</p>
          <p className="text-gray-400 text-sm">잠시만 기다려주세요...</p>

          {/* 디버깅용 - 개발 중에만 표시 */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 text-xs text-gray-500">
              <p>페이지를 새로고침하지 마세요</p>
              <p>인증 코드는 일회용입니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Callback;
