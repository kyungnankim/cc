// services/uploadService.js - 사용자 인증 정보 전달 수정 버전

// URL에서 플랫폼 감지 및 데이터 추출
export const detectPlatformAndExtract = async (url) => {
  if (!url) return null;

  try {
    console.log("🔍 플랫폼 감지 시작:", url);

    // YouTube 관련 키워드 감지
    const youtubeKeywords = new RegExp("youtu\\.?be|youtube|yt\\.be", "i");
    const hasYouTubeKeywords = youtubeKeywords.test(url);

    if (hasYouTubeKeywords) {
      console.log("🎬 YouTube 관련 키워드 감지됨");

      let videoId = null;
      let isLive = false;
      let isShorts = false;

      // 다양한 YouTube URL 패턴 시도
      console.log("🔍 YouTube URL 패턴 분석 중...");

      // 1. 라이브 스트림 패턴: /live/VIDEO_ID
      const livePattern = new RegExp(
        "youtube\\.com\\/live\\/([a-zA-Z0-9_-]+)",
        "i"
      );
      const liveMatch = url.match(livePattern);
      if (liveMatch) {
        videoId = liveMatch[1];
        isLive = true;
        console.log("✅ 라이브 스트림 감지:", videoId);
      }

      // 2. 일반 watch 패턴: ?v=VIDEO_ID 또는 &v=VIDEO_ID
      if (!videoId) {
        const watchPattern = new RegExp("[?&]v=([a-zA-Z0-9_-]+)", "i");
        const watchMatch = url.match(watchPattern);
        if (watchMatch) {
          videoId = watchMatch[1];
          console.log("✅ 일반 영상 감지:", videoId);
        }
      }

      // 3. youtu.be 단축 링크: youtu.be/VIDEO_ID
      if (!videoId) {
        const shortPattern = new RegExp("youtu\\.be\\/([a-zA-Z0-9_-]+)", "i");
        const shortMatch = url.match(shortPattern);
        if (shortMatch) {
          videoId = shortMatch[1];
          console.log("✅ 단축 링크 감지:", videoId);
        }
      }

      // 4. Shorts 패턴: /shorts/VIDEO_ID
      if (!videoId) {
        const shortsPattern = new RegExp(
          "youtube\\.com\\/shorts\\/([a-zA-Z0-9_-]+)",
          "i"
        );
        const shortsMatch = url.match(shortsPattern);
        if (shortsMatch) {
          videoId = shortsMatch[1];
          isShorts = true;
          console.log("✅ Shorts 감지:", videoId);
        }
      }

      // 5. 임베드 패턴: /embed/VIDEO_ID
      if (!videoId) {
        const embedPattern = new RegExp(
          "youtube\\.com\\/embed\\/([a-zA-Z0-9_-]+)",
          "i"
        );
        const embedMatch = url.match(embedPattern);
        if (embedMatch) {
          videoId = embedMatch[1];
          console.log("✅ 임베드 링크 감지:", videoId);
        }
      }

      // 비디오 ID 후처리 (쿼리 파라미터 제거)
      if (videoId) {
        // ?나 &로 시작하는 추가 파라미터 제거
        if (videoId.includes("?")) {
          videoId = videoId.split("?")[0];
        }
        if (videoId.includes("&")) {
          videoId = videoId.split("&")[0];
        }

        console.log("🎯 최종 비디오 ID:", videoId);

        // 비디오 ID 유효성 검사 (YouTube ID는 보통 11자리)
        if (videoId.length < 8) {
          console.log("❌ 비디오 ID가 너무 짧음:", videoId);
          return {
            platform: "youtube_invalid",
            error: "YouTube 비디오 ID가 올바르지 않습니다.",
            suggestion: "올바른 YouTube URL을 입력해주세요.",
            detectedKeywords: true,
          };
        }

        // URL에서 시작 시간 추출
        const timePattern = new RegExp("[?&](?:t|start)=(\\d+)", "i");
        const timeMatch = url.match(timePattern);
        const startTime = timeMatch ? parseInt(timeMatch[1]) : 0;

        console.log("✅ YouTube 감지 완료:", {
          videoId,
          startTime,
          type: isLive ? "live" : isShorts ? "shorts" : "video",
          originalUrl: url,
          isLive,
          isShorts,
        });

        return {
          platform: "youtube",
          videoId,
          originalUrl: url,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          startTime: startTime,
          urlDetectedTime: startTime,
          contentType: isLive ? "live" : isShorts ? "shorts" : "video",
          isLive: isLive,
          isShorts: isShorts,
        };
      } else {
        console.log("❌ 비디오 ID를 추출할 수 없음");

        // 패턴 테스트 결과
        const liveTest = new RegExp(
          "youtube\\.com\\/live\\/([a-zA-Z0-9_-]+)",
          "i"
        );
        const watchTest = new RegExp("[?&]v=([a-zA-Z0-9_-]+)", "i");
        const shortTest = new RegExp("youtu\\.be\\/([a-zA-Z0-9_-]+)", "i");
        const shortsTest = new RegExp(
          "youtube\\.com\\/shorts\\/([a-zA-Z0-9_-]+)",
          "i"
        );
        const embedTest = new RegExp(
          "youtube\\.com\\/embed\\/([a-zA-Z0-9_-]+)",
          "i"
        );

        return {
          platform: "youtube_invalid",
          error: "YouTube 비디오 ID를 찾을 수 없습니다.",
          suggestion: "URL 형식을 확인해주세요.",
          detectedKeywords: true,
          debugInfo: {
            originalUrl: url,
            hasKeywords: true,
            testedPatterns: {
              live: liveTest.test(url),
              watch: watchTest.test(url),
              short: shortTest.test(url),
              shorts: shortsTest.test(url),
              embed: embedTest.test(url),
            },
          },
        };
      }
    }

    // TikTok 감지
    const tiktokPattern = new RegExp(
      "(?:tiktok\\.com\\/@[\\w.-]+\\/video\\/(\\d+)|tiktok\\.com\\/t\\/(\\w+)|vm\\.tiktok\\.com\\/(\\w+)|tiktok\\.com\\/v\\/(\\d+))",
      "i"
    );
    const tiktokMatch = url.match(tiktokPattern);
    if (tiktokMatch) {
      const videoId =
        tiktokMatch[1] || tiktokMatch[2] || tiktokMatch[3] || tiktokMatch[4];
      const userPattern = new RegExp("@([\\w.-]+)");
      const userMatch = url.match(userPattern);
      const username = userMatch ? userMatch[1] : null;

      console.log("✅ TikTok 감지됨:", { videoId, username });

      // TikTok oEmbed API 시도
      try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(
          url
        )}`;
        const response = await fetch(oembedUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          const oembedData = await response.json();
          console.log("✅ TikTok oEmbed 성공:", oembedData);

          return {
            platform: "tiktok",
            videoId,
            username: username || oembedData.author_name,
            originalUrl: url,
            embedUrl: url,
            title: oembedData.title,
            authorName: oembedData.author_name,
            thumbnailUrl: oembedData.thumbnail_url,
            html: oembedData.html,
          };
        }
      } catch (error) {
        console.warn("⚠️ TikTok oEmbed 실패, 기본 처리:", error);
      }

      // API 실패 시 기본 처리
      return {
        platform: "tiktok",
        videoId,
        username,
        originalUrl: url,
        embedUrl: url,
        title: username ? `@${username}의 TikTok` : "TikTok 비디오",
        authorName: username,
      };
    }

    // Instagram 감지
    const instagramPattern = new RegExp(
      "instagram\\.com\\/(p|reel|tv)\\/([A-Za-z0-9_-]+)",
      "i"
    );
    const instagramMatch = url.match(instagramPattern);
    if (instagramMatch) {
      const postId = instagramMatch[2];
      const postType = instagramMatch[1];

      console.log("✅ Instagram 감지됨:", { postId, postType });

      return {
        platform: "instagram",
        postId,
        postType,
        originalUrl: url,
        embedUrl: `${url}embed/`,
      };
    }

    // 아무것도 감지되지 않은 경우
    console.log("❌ 지원하지 않는 플랫폼:", url);
    return null;
  } catch (error) {
    console.error("❌ 플랫폼 감지 오류:", error);
    return null;
  }
};

// URL 유효성 실시간 검사
export const validateUrlInRealTime = (url) => {
  if (!url) return { isValid: false, message: "" };

  // YouTube 키워드 체크
  const youtubePattern = new RegExp("youtu\\.?be|youtube|yt\\.be", "i");
  const tiktokPattern = new RegExp("tiktok", "i");
  const instagramPattern = new RegExp("instagram", "i");

  const hasYouTube = youtubePattern.test(url);
  const hasTikTok = tiktokPattern.test(url);
  const hasInstagram = instagramPattern.test(url);

  if (hasYouTube) {
    console.log("🎯 YouTube 키워드 감지:", url);

    // YouTube URL 형식 체크
    const livePattern = new RegExp(
      "youtube\\.com\\/live\\/([a-zA-Z0-9_-]{8,})",
      "i"
    );
    const watchPattern = new RegExp("[?&]v=([a-zA-Z0-9_-]{8,})", "i");
    const shortPattern = new RegExp("youtu\\.be\\/([a-zA-Z0-9_-]{8,})", "i");
    const shortsPattern = new RegExp(
      "youtube\\.com\\/shorts\\/([a-zA-Z0-9_-]{8,})",
      "i"
    );
    const embedPattern = new RegExp(
      "youtube\\.com\\/embed\\/([a-zA-Z0-9_-]{8,})",
      "i"
    );

    const isValidYouTube =
      livePattern.test(url) ||
      watchPattern.test(url) ||
      shortPattern.test(url) ||
      shortsPattern.test(url) ||
      embedPattern.test(url);

    if (isValidYouTube) {
      // 라이브 스트림 감지
      const isLive = new RegExp("\\/live\\/|live\\/", "i").test(url);
      const isShorts = new RegExp("\\/shorts\\/|shorts\\/", "i").test(url);

      let typeMessage = "✅ 올바른 YouTube URL";
      if (isLive) typeMessage += " (라이브 스트림)";
      else if (isShorts) typeMessage += " (Shorts)";

      return {
        isValid: true,
        platform: "youtube",
        message: typeMessage,
        isLive,
        isShorts,
      };
    } else {
      return {
        isValid: false,
        platform: "youtube",
        message: "⚠️ YouTube URL 형식이 올바르지 않습니다",
        suggestion: "올바른 형식을 확인해주세요",
      };
    }
  }

  if (hasTikTok) {
    const tiktokValidPattern = new RegExp(
      "tiktok\\.com\\/@[\\w.-]+\\/video\\/\\d+|tiktok\\.com\\/t\\/\\w+|vm\\.tiktok\\.com\\/\\w+",
      "i"
    );

    if (tiktokValidPattern.test(url)) {
      return {
        isValid: true,
        platform: "tiktok",
        message: "✅ 올바른 TikTok URL",
      };
    } else {
      return {
        isValid: false,
        platform: "tiktok",
        message: "⚠️ TikTok URL 형식이 올바르지 않습니다",
      };
    }
  }

  if (hasInstagram) {
    const instagramValidPattern = new RegExp(
      "instagram\\.com\\/(p|reel|tv)\\/[A-Za-z0-9_-]+",
      "i"
    );

    if (instagramValidPattern.test(url)) {
      return {
        isValid: true,
        platform: "instagram",
        message: "✅ 올바른 Instagram URL",
      };
    } else {
      return {
        isValid: false,
        platform: "instagram",
        message: "⚠️ Instagram URL 형식이 올바르지 않습니다",
      };
    }
  }

  // URL 같은 형태이지만 지원하지 않는 플랫폼
  if (url.includes("http") || url.includes("www.")) {
    return {
      isValid: false,
      message: "❌ 지원하지 않는 플랫폼입니다",
      suggestion: "YouTube, TikTok, Instagram URL만 지원됩니다",
    };
  }

  return {
    isValid: false,
    message: "올바른 URL을 입력해주세요",
  };
};

// 시간을 초로 변환
export const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").reverse();
  let seconds = 0;
  if (parts[0]) seconds += parseInt(parts[0]) || 0;
  if (parts[1]) seconds += (parseInt(parts[1]) || 0) * 60;
  if (parts[2]) seconds += (parseInt(parts[2]) || 0) * 3600;
  return seconds;
};

// 초를 시간 형식으로 변환
export const secondsToTimeFormat = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// 다중 콘텐츠 업로드 - 사용자 정보를 명시적으로 전달하는 버전
export const uploadMultipleContents = async (
  postsData,
  category,
  userInfo = null
) => {
  try {
    console.log("🚀 업로드 서비스 시작:", {
      postsCount: postsData.length,
      category,
      userInfo: userInfo ? userInfo.email : "not provided",
    });

    // 사용자 정보 확인
    let currentUser = userInfo;
    if (!currentUser) {
      // userInfo가 전달되지 않은 경우 세션에서 가져오기 시도
      try {
        const sessionUser = sessionStorage.getItem("currentUser");
        if (sessionUser) {
          currentUser = JSON.parse(sessionUser);
          console.log("📱 세션에서 사용자 정보 복원:", currentUser.email);
        }
      } catch (error) {
        console.error("세션 사용자 정보 파싱 오류:", error);
      }
    }

    if (!currentUser || !currentUser.email) {
      throw new Error("로그인이 필요합니다. 사용자 정보가 없습니다.");
    }

    console.log(
      "✅ 사용자 인증 확인 완료:",
      currentUser.email,
      currentUser.provider
    );

    // contentService.js의 uploadMultipleContenders 함수 호출 - 사용자 정보 전달
    const { uploadMultipleContenders } = await import("./contentService");
    return await uploadMultipleContenders(postsData, category, currentUser);
  } catch (error) {
    console.error("❌ uploadService 오류:", error);
    throw error;
  }
};

// 디버깅용 URL 테스트
export const testYouTubeUrl = (url) => {
  console.log("🧪 YouTube URL 테스트:", url);

  const hasKeywords = new RegExp("youtu\\.?be|youtube", "i").test(url);
  console.log("키워드 감지:", hasKeywords);

  const livePattern = new RegExp(
    "youtube\\.com\\/live\\/([a-zA-Z0-9_-]+)",
    "i"
  );
  const match = url.match(livePattern);
  console.log("라이브 패턴 매치:", match);

  if (match) {
    let videoId = match[1];
    if (videoId.includes("?")) {
      videoId = videoId.split("?")[0];
    }
    if (videoId.includes("&")) {
      videoId = videoId.split("&")[0];
    }
    console.log("추출된 비디오 ID:", videoId);
  }

  return match;
};
