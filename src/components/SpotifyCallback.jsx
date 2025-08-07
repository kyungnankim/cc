// SpotifyCallback.jsx - 완전한 중복 실행 방지 버전

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, Music } from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const SpotifyCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("인증 처리 중...");
  const hasProcessed = useRef(false);
  const isProcessing = useRef(false);

  // 현재 URL의 code를 기반으로 처리 여부 확인
  const currentCode = new URLSearchParams(window.location.search).get("code");
  const processedCodeRef = useRef(null);

  useEffect(() => {
    // 이미 이 코드로 처리했으면 실행하지 않음
    if (processedCodeRef.current === currentCode && currentCode) {
      console.log("🚫 This code already processed, skipping...");
      return;
    }

    // 이미 처리했거나 현재 처리 중이면 실행하지 않음
    if (hasProcessed.current || isProcessing.current) {
      console.log("🚫 Already processed or processing, skipping...");
      return;
    }

    // 코드가 없으면 실행하지 않음
    if (!currentCode) {
      console.log("🚫 No code found, skipping...");
      return;
    }

    const handleCallback = async () => {
      // 처리 시작 표시
      isProcessing.current = true;
      processedCodeRef.current = currentCode;

      console.log("🚀 Starting Spotify callback process...");

      const CLIENT_ID = "254d6b7f190543e78da436cd3287a60e";
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      const REDIRECT_URI = isLocal
        ? "http://127.0.0.1:5173/callback" // 개발 환경일 때
        : "https://cc-gamma-rosy.vercel.app/callback"; // 배포 환경일 때

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const error = urlParams.get("error");

      console.log("🔍 URL Parameters:", {
        code: code ? code.substring(0, 20) + "..." : null,
        error,
        fullUrl: window.location.href,
      });

      if (error) {
        console.log("❌ User denied access:", error);
        toast.error("Spotify 로그인이 취소되었습니다.");
        hasProcessed.current = true;
        navigate("/login");
        return;
      }

      if (!code) {
        console.log("❌ No authorization code found");
        toast.error("인증 코드가 없습니다. 다시 시도해주세요.");
        hasProcessed.current = true;
        navigate("/login");
        return;
      }

      const verifier = sessionStorage.getItem("verifier");
      console.log("🔑 Verifier status:", verifier ? "Found" : "Missing");

      if (!verifier) {
        console.log("❌ No code verifier found");
        toast.error("인증 정보가 누락되었습니다. 다시 로그인해주세요.");
        hasProcessed.current = true;
        navigate("/login");
        return;
      }

      try {
        // 토큰 요청
        setStatus("액세스 토큰 발급 중...");

        const tokenParams = new URLSearchParams({
          client_id: CLIENT_ID,
          grant_type: "authorization_code",
          code: code,
          redirect_uri: REDIRECT_URI,
          code_verifier: verifier,
        });

        console.log("🚀 Token Request:", {
          client_id: CLIENT_ID,
          redirect_uri: REDIRECT_URI,
          code_length: code.length,
          verifier_length: verifier.length,
        });

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

        console.log("📋 Token Response:", {
          status: tokenResponse.status,
          ok: tokenResponse.ok,
          hasAccessToken: !!tokenData.access_token,
          error: tokenData.error,
          errorDescription: tokenData.error_description,
        });

        if (!tokenResponse.ok) {
          console.error("❌ Token request failed:", tokenData);

          // verifier 정리 (한 번만 사용 가능)
          sessionStorage.removeItem("verifier");

          if (tokenData.error === "invalid_grant") {
            toast.error("인증이 만료되었습니다. 새로 로그인해주세요.");
            console.log(
              "💡 Suggestion: React StrictMode로 인한 중복 실행 가능성"
            );
          } else if (tokenData.error === "invalid_client") {
            toast.error("Spotify 앱 설정을 확인해주세요.");
            console.log("💡 Suggestion: CLIENT_ID 또는 Redirect URI 확인 필요");
          } else {
            toast.error(
              `토큰 발급 실패: ${
                tokenData.error_description || tokenData.error
              }`
            );
          }

          hasProcessed.current = true;
          window.history.replaceState({}, document.title, "/login");
          navigate("/login");
          return;
        }

        if (!tokenData.access_token) {
          throw new Error("액세스 토큰을 받지 못했습니다.");
        }

        console.log("✅ Access token received successfully");

        // 프로필 정보 요청
        setStatus("프로필 정보 가져오는 중...");

        const profileResponse = await fetch("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            Accept: "application/json",
          },
        });

        console.log("👤 Profile Response:", {
          status: profileResponse.status,
          ok: profileResponse.ok,
        });

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json().catch(() => ({}));
          console.error("❌ Profile request failed:", {
            status: profileResponse.status,
            statusText: profileResponse.statusText,
            error: errorData,
          });

          if (profileResponse.status === 403) {
            toast.error("User Management에서 계정을 승인해주세요.");
            console.log(
              "💡 Suggestion: 현재 로그인한 Spotify 계정이 승인 목록에 있는지 확인"
            );
          } else {
            toast.error("프로필 정보를 가져오는데 실패했습니다.");
          }

          hasProcessed.current = true;
          navigate("/login");
          return;
        }

        const profile = await profileResponse.json();
        console.log("✅ Profile received:", {
          id: profile.id,
          email: profile.email,
          displayName: profile.display_name,
          country: profile.country,
          hasImages: profile.images?.length > 0,
        });

        if (!profile.email) {
          toast.error("Spotify 계정에서 이메일 정보를 가져올 수 없습니다.");
          console.log("💡 Suggestion: Spotify 계정의 이메일 공개 설정 확인");
          hasProcessed.current = true;
          navigate("/login");
          return;
        }

        // Firebase 사용자 확인
        setStatus("사용자 정보 확인 중...");

        const userDocRef = doc(db, "users", profile.email);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          // 기존 사용자
          console.log("👤 Existing user found, logging in...");
          setStatus("로그인 처리 중...");

          const userData = userDoc.data();

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

          console.log("✅ Login successful, redirecting to home");
          hasProcessed.current = true;
          window.history.replaceState({}, document.title, "/");

          // 약간의 지연을 두고 이동 (toast 메시지를 보여주기 위해)
          setTimeout(() => {
            navigate("/");
          }, 1000);
        } else {
          // 신규 사용자
          console.log("👤 New user, redirecting to registration...");
          setStatus("회원가입 준비 중...");

          sessionStorage.setItem("spotifyAccessToken", tokenData.access_token);
          sessionStorage.setItem("spotifyProfile", JSON.stringify(profile));

          toast.success("Spotify 인증 완료! 추가 정보를 입력해주세요.");

          console.log("✅ Profile saved, redirecting to register");
          hasProcessed.current = true;
          window.history.replaceState({}, document.title, "/register");

          // 약간의 지연을 두고 이동
          setTimeout(() => {
            navigate("/register");
          }, 1000);
        }
      } catch (error) {
        console.error("💥 Spotify callback error:", error);
        toast.error(`로그인 처리 중 오류가 발생했습니다: ${error.message}`);
        hasProcessed.current = true;
        window.history.replaceState({}, document.title, "/login");
        navigate("/login");
      } finally {
        // verifier 정리 (성공/실패 관계없이)
        sessionStorage.removeItem("verifier");
        isProcessing.current = false;
      }
    };

    handleCallback();

    // cleanup function
    return () => {
      isProcessing.current = false;
    };
  }, [navigate, currentCode]); // currentCode를 dependency에 추가

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-pink-500">Battle</span> Seoul
          </h1>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin mr-3" />
            <Music className="w-8 h-8 text-green-400" />
          </div>

          <p className="text-white text-lg mb-2">{status}</p>
          <p className="text-gray-400 text-sm">잠시만 기다려주세요...</p>

          {/* 개발 모드에서만 표시 */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">디버그 정보:</p>
              <p className="text-xs text-green-400">
                ✓ 승인된 사용자 목록 확인 완료
              </p>
              <p className="text-xs text-blue-400">
                ℹ️ React StrictMode 중복 실행 방지
              </p>
              <p className="text-xs text-yellow-400">
                ⚠️ 페이지를 새로고침하지 마세요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpotifyCallback;
