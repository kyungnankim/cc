// utils/mediaUtils.js - 개선된 YouTube URL 감지 버전
export const detectPlatformAndExtract = async (url) => {
  if (!url) return null;

  try {
    console.log("🔍 플랫폼 감지 시작:", url);

    // 먼저 YouTube 관련 키워드가 있는지 확인
    const hasYouTubeKeywords = /youtu\.?be|youtube/i.test(url);
    
    if (hasYouTubeKeywords) {
      console.log("🎬 YouTube 관련 키워드 감지됨");
      
      // YouTube 감지 - 더 관대한 정규식 사용
      const youtubeRegex = 
        /(?:(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:music\.)?youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/|shorts\/|.*[?&]v=)|(?:https?:\/\/)?youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11}|[a-zA-Z0-9_-]+)/i;
      
      const youtubeMatch = url.match(youtubeRegex);
      
      if (youtubeMatch) {
        // 비디오 ID 추출
        let videoId = youtubeMatch[1];
        
        // 라이브 스트림의 경우 ID가 11자리가 아닐 수 있음
        if (!videoId || videoId.length < 8) {
          // 대체 방법으로 ID 추출 시도
          const liveMatch = url.match(/\/live\/([a-zA-Z0-9_-]+)/i);
          const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/i);
          const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i);
          
          videoId = liveMatch?.[1] || watchMatch?.[1] || shortMatch?.[1] || videoId;
        }
        
        // URL 타입 감지
        const isLive = /\/live\/|live\//i.test(url);
        const isShorts = /\/shorts\/|shorts\//i.test(url);
        
        // URL에서 시작 시간 추출
        const timeRegex = /[?&](?:t|start)=(\d+)/i;
        const timeMatch = url.match(timeRegex);
        const startTime = timeMatch ? parseInt(timeMatch[1]) : 0;

        console.log("✅ YouTube 감지 성공:", { 
          videoId, 
          startTime, 
          type: isLive ? 'live' : isShorts ? 'shorts' : 'video',
          originalUrl: url
        });

        return {
          platform: "youtube",
          videoId,
          originalUrl: url,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          startTime: startTime,
          contentType: isLive ? 'live' : isShorts ? 'shorts' : 'video',
          isLive: isLive,
          isShorts: isShorts,
        };
      } else {
        console.log("⚠️ YouTube 키워드는 있지만 올바른 형식이 아님");
        return {
          platform: "youtube_invalid",
          error: "YouTube URL 형식이 올바르지 않습니다.",
          suggestion: "올바른 형식: https://www.youtube.com/watch?v=VIDEO_ID 또는 https://youtu.be/VIDEO_ID",
          detectedKeywords: true
        };
      }
    }

    // TikTok 감지
    const tiktokRegex =
      /(?:tiktok\.com\/@[\w.-]+\/video\/(\d+)|tiktok\.com\/t\/(\w+)|vm\.tiktok\.com\/(\w+)|tiktok\.com\/v\/(\d+))/i;
    const tiktokMatch = url.match(tiktokRegex);
    if (tiktokMatch) {
      const videoId =
        tiktokMatch[1] || tiktokMatch[2] || tiktokMatch[3] || tiktokMatch[4];
      const userMatch = url.match(/@([\w.-]+)/);
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
    const instagramRegex = /instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i;
    const instagramMatch = url.match(instagramRegex);
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
  const hasYouTube = /youtu\.?be|youtube/i.test(url);
  const hasTikTok = /tiktok/i.test(url);
  const hasInstagram = /instagram/i.test(url);

  if (hasYouTube) {
    // YouTube URL 형식 체크
    const isValidYouTube = /(?:(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:music\.)?youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/|shorts\/|.*[?&]v=)|(?:https?:\/\/)?youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{8,})/i.test(url);
    
    if (isValidYouTube) {
      return { 
        isValid: true, 
        platform: "youtube",
        message: "✅ 올바른 YouTube URL" 
      };
    } else {
      return { 
        isValid: false, 
        platform: "youtube",
        message: "⚠️ YouTube URL 형식이 올바르지 않습니다",
        suggestion: "예: https://www.youtube.com/watch?v=VIDEO_ID"
      };
    }
  }

  if (hasTikTok) {
    const isValidTikTok = /tiktok\.com\/@[\w.-]+\/video\/\d+|tiktok\.com\/t\/\w+|vm\.tiktok\.com\/\w+/i.test(url);
    
    if (isValidTikTok) {
      return { 
        isValid: true, 
        platform: "tiktok",
        message: "✅ 올바른 TikTok URL" 
      };
    } else {
      return { 
        isValid: false, 
        platform: "tiktok",
        message: "⚠️ TikTok URL 형식이 올바르지 않습니다" 
      };
    }
  }

  if (hasInstagram) {
    const isValidInstagram = /instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/i.test(url);
    
    if (isValidInstagram) {
      return { 
        isValid: true, 
        platform: "instagram",
        message: "✅ 올바른 Instagram URL" 
      };
    } else {
      return { 
        isValid: false, 
        platform: "instagram",
        message: "⚠️ Instagram URL 형식이 올바르지 않습니다" 
      };
    }
  }

  // URL 같은 형태이지만 지원하지 않는 플랫폼
  if (url.includes('http') || url.includes('www.')) {
    return { 
      isValid: false, 
      message: "❌ 지원하지 않는 플랫폼입니다",
      suggestion: "YouTube, TikTok, Instagram URL만 지원됩니다"
    };
  }

  return { 
    isValid: false, 
    message: "올바른 URL을 입력해주세요" 
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