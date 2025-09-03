// src/services/contentService.js - 완전 통합 버전
// 다중 콘텐츠 타입 지원 + YouTube 라이브 스트림 + TikTok 임베드 개선 + 모든 유틸리티 함수

import { auth, db } from "../firebase/config";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

// ==================== 세션 및 사용자 관리 ====================

// 세션에서 현재 사용자 가져오기 함수
const getCurrentUser = () => {
  try {
    const userData = sessionStorage.getItem("currentUser");
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error("사용자 정보 파싱 오류:", error);
    return null;
  }
};

// ==================== 유틸리티 함수들 ====================

// TikTok blockquote HTML 생성 함수 (개선된 버전)
const createTikTokBlockquote = (
  videoId,
  username,
  url,
  title = null,
  hashtags = []
) => {
  // 안전한 HTML 생성을 위한 이스케이프 함수
  const escapeHtml = (text) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  const safeUsername = username ? escapeHtml(username) : "tiktok";
  const safeTitle = title
    ? escapeHtml(title)
    : `@${safeUsername}의 TikTok 영상`;
  const safeVideoId = videoId ? escapeHtml(videoId.toString()) : "";
  const safeUrl = url ? escapeHtml(url) : "#";

  // 해시태그 HTML 생성
  const hashtagsHtml =
    hashtags && hashtags.length > 0
      ? hashtags
          .map(
            (tag) =>
              `<a title="${escapeHtml(
                tag
              )}" target="_blank" href="https://www.tiktok.com/tag/${encodeURIComponent(
                tag
              )}?refer=embed">#${escapeHtml(tag)}</a>`
          )
          .join(" ")
      : "";

  return `<blockquote class="tiktok-embed" 
                    cite="${safeUrl}" 
                    data-video-id="${safeVideoId}" 
                    style="max-width: 605px; min-width: 325px; margin: 0 auto; background: #000; border-radius: 8px;">
    <section style="padding: 16px; color: #fff;">
      <a target="_blank" 
         title="@${safeUsername}" 
         href="${safeUrl}"
         style="color: #fff; text-decoration: none; font-weight: bold;">
        @${safeUsername}
      </a>
      <p style="margin: 8px 0; color: #fff; font-size: 14px; line-height: 1.4;">
        ${safeTitle}
      </p>
      ${
        hashtagsHtml
          ? `<div style="margin: 8px 0; font-size: 12px;">${hashtagsHtml}</div>`
          : ""
      }
      <a target="_blank" 
         href="${safeUrl}"
         style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #ff0050; color: #fff; text-decoration: none; border-radius: 4px; font-size: 12px;">
        TikTok에서 보기
      </a>
    </section>
  </blockquote>`;
};

// 이미지 업로드 함수
const uploadImage = async (imageFile) => {
  if (!imageFile) return null;

  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append(
    "upload_preset",
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  );

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
      }/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error(data.error?.message || "Cloudinary upload failed");
    }
  } catch (error) {
    console.error("Image upload error:", error);
    return null;
  }
};

// 시간을 초로 변환 (mm:ss 또는 h:mm:ss 형식)
export const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return 0;

  const parts = timeStr.split(":").reverse();
  let seconds = 0;

  if (parts[0]) seconds += parseInt(parts[0]) || 0; // 초
  if (parts[1]) seconds += (parseInt(parts[1]) || 0) * 60; // 분
  if (parts[2]) seconds += (parseInt(parts[2]) || 0) * 3600; // 시간

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

// ==================== 플랫폼 감지 및 데이터 추출 ====================

// URL에서 플랫폼 감지 및 데이터 추출 - 라이브 스트림 지원 + TikTok 임베드 개선
export const detectPlatformAndExtract = async (url) => {
  if (!url) return null;

  try {
    console.log("🔍 플랫폼 감지 시작:", url);

    // YouTube 감지 - 라이브 스트림, Shorts, 일반 영상 모두 지원
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
      }
    }

    // TikTok 감지 및 처리 (개선된 버전)
    const tiktokPattern = new RegExp(
      "(?:(?:https?:\\/\\/)?(?:www\\.|vm\\.|m\\.)?tiktok\\.com\\/(?:@[\\w.-]+\\/video\\/(\\d+)|t\\/(\\w+)|v\\/(\\d+))|(?:https?:\\/\\/)?vm\\.tiktok\\.com\\/(\\w+))",
      "i"
    );
    const tiktokMatch = url.match(tiktokPattern);

    if (tiktokMatch) {
      console.log("🎵 TikTok URL 감지됨");

      // 비디오 ID와 사용자명 추출
      const videoId =
        tiktokMatch[1] ||
        tiktokMatch[2] ||
        tiktokMatch[3] ||
        tiktokMatch[4] ||
        "unknown";
      const userMatch = url.match(/@([\w.-]+)/);
      const username = userMatch ? userMatch[1] : null;

      console.log("🎵 TikTok 정보 추출:", { videoId, username, url });

      // 1차: TikTok oEmbed API 시도 (공식 방법)
      try {
        console.log("📡 TikTok oEmbed API 호출 시도:", url);

        const oembedResponse = await fetch(
          `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            timeout: 10000, // 10초 타임아웃
          }
        );

        if (oembedResponse.ok) {
          const oembedData = await oembedResponse.json();
          console.log("✅ TikTok oEmbed 성공:", oembedData);

          // oEmbed에서 받은 HTML이 있으면 사용
          if (oembedData.html) {
            return {
              platform: "tiktok",
              videoId,
              username: username || oembedData.author_name,
              originalUrl: url,
              embedUrl: url,
              title: oembedData.title,
              authorName: oembedData.author_name,
              authorUrl: oembedData.author_url,
              thumbnailUrl: oembedData.thumbnail_url,
              thumbnailWidth: oembedData.thumbnail_width,
              thumbnailHeight: oembedData.thumbnail_height,
              html: oembedData.html, // 공식 oEmbed HTML 사용
              providerName: oembedData.provider_name,
              providerUrl: oembedData.provider_url,
              version: oembedData.version,
              type: oembedData.type,
              embedType: "oembed", // 임베드 타입 표시
            };
          }
        } else {
          console.warn(
            "⚠️ TikTok oEmbed API 응답 오류:",
            oembedResponse.status,
            oembedResponse.statusText
          );
        }
      } catch (error) {
        console.warn("⚠️ TikTok oEmbed API 호출 실패:", error.message);
      }

      // 2차: 직접 blockquote HTML 생성 (fallback)
      console.log("🔧 TikTok blockquote HTML 직접 생성");

      // URL에서 더 많은 정보 추출 시도
      let extractedTitle = null;
      let extractedHashtags = [];

      // 제목이나 해시태그를 URL에서 추출할 수 있다면 (실제로는 제한적)
      if (username) {
        extractedTitle = `@${username}의 TikTok`;
      }

      // 직접 생성한 blockquote HTML
      const generatedBlockquoteHtml = createTikTokBlockquote(
        videoId,
        username,
        url,
        extractedTitle,
        extractedHashtags
      );

      // TikTok 스크립트도 포함된 완전한 HTML
      const completeHtml = `
        ${generatedBlockquoteHtml}
        <script async src="https://www.tiktok.com/embed.js"></script>
      `;

      console.log("✅ TikTok 사용자 정의 blockquote 생성 완료");

      return {
        platform: "tiktok",
        videoId,
        username,
        originalUrl: url,
        embedUrl: url,
        title: extractedTitle || "TikTok 비디오",
        authorName: username,
        thumbnailUrl: null, // TikTok은 직접 썸네일 URL 제공 안함
        html: completeHtml, // 생성된 완전한 HTML
        blockquoteHtml: generatedBlockquoteHtml, // blockquote만 따로 저장
        embedType: "custom", // 사용자 정의 임베드임을 표시
        displayInfo: {
          title: extractedTitle || "TikTok 비디오",
          description: "TikTok 동영상 콘텐츠 - 사이트 내 재생 지원",
        },
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

    console.log("❌ 지원하지 않는 플랫폼:", url);
    return null;
  } catch (error) {
    console.error("❌ 플랫폼 감지 오류:", error);
    return null;
  }
};

// ==================== 메인 콘텐츠 서비스 함수들 ====================

/**
 * 다중 콘텐츠를 지원하는 통합 업로드 함수
 * postData에서 imageFile과 mediaUrl을 모두 처리할 수 있음

export const uploadContender = async (postData) => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error("로그인이 필요합니다.");
  }

  try {
    console.log("🚀 콘텐츠 업로드 시작:", postData.title);

    // 이미지와 미디어 URL 중 최소 하나는 있어야 함
    const hasImage = postData.imageFile;
    const hasMedia = postData.mediaUrl && postData.mediaUrl.trim();

    if (!hasImage && !hasMedia) {
      throw new Error("이미지 또는 외부 링크 중 최소 하나를 추가해주세요.");
    }

    let imageUrl = null;
    let extractedData = null;
    let platforms = [];

    // 이미지 처리
    if (hasImage) {
      console.log("📸 이미지 업로드 중...");
      imageUrl = await uploadImage(postData.imageFile);
      if (!imageUrl) {
        throw new Error("이미지 업로드에 실패했습니다.");
      }
      platforms.push("image");
      console.log("✅ 이미지 업로드 완료:", imageUrl);
    }

    // 미디어 URL 처리
    if (hasMedia) {
      console.log("🎬 미디어 URL 처리 중:", postData.mediaUrl);
      extractedData = await detectPlatformAndExtract(postData.mediaUrl);
      if (!extractedData) {
        throw new Error("지원하지 않는 미디어 URL입니다.");
      }
      platforms.push(extractedData.platform);
      console.log("✅ 플랫폼 감지 완료:", extractedData.platform);

      // 플랫폼별 기본 이미지 설정 (이미지가 없는 경우)
      if (!imageUrl) {
        if (extractedData.platform === "youtube") {
          imageUrl = extractedData.thumbnailUrl || "/images/popo.png";
        } else if (extractedData.platform === "tiktok") {
          imageUrl =
            extractedData.thumbnailUrl || "/images/tiktok-placeholder.png";
        } else {
          imageUrl = "/images/popo.png";
        }
      }
    }

    // 기본 이미지가 없는 경우
    if (!imageUrl) {
      imageUrl = "/images/popo.png";
    }

    // 사용자 시간 설정 우선 처리 (YouTube만)
    let timeSettings = null;
    if (extractedData && extractedData.platform === "youtube") {
      const userStartTime = parseTimeToSeconds(postData.startTime);
      const userEndTime = parseTimeToSeconds(postData.endTime);
      const urlStartTime =
        extractedData?.urlDetectedTime || extractedData?.startTime || 0;

      console.log("⏰ 시간 설정 분석:", {
        userStart: userStartTime,
        userEnd: userEndTime,
        urlStart: urlStartTime,
        userStartInput: postData.startTime,
        userEndInput: postData.endTime,
        isLive: extractedData?.isLive,
        contentType: extractedData?.contentType,
      });

      // 사용자가 시간을 설정했는지 확인
      const hasUserTimeSettings = postData.startTime || postData.endTime;

      if (hasUserTimeSettings) {
        // 사용자 설정이 있으면 사용자 설정 우선
        timeSettings = {
          startTime: userStartTime,
          endTime: userEndTime,
          startTimeDisplay: postData.startTime || "",
          endTimeDisplay: postData.endTime || "",
          source: "user", // 사용자 설정임을 명시
          urlDetectedTime: urlStartTime, // 참고용으로 URL 시간 저장
        };
        console.log("👤 사용자 시간 설정 우선 적용");
      } else if (urlStartTime > 0 && !extractedData?.isLive) {
        // 사용자 설정이 없고 URL에서 시간이 감지된 경우 (라이브가 아닌 경우만)
        timeSettings = {
          startTime: urlStartTime,
          endTime: 0,
          startTimeDisplay: secondsToTimeFormat(urlStartTime),
          endTimeDisplay: "",
          source: "url", // URL에서 자동 추출됨을 명시
          urlDetectedTime: urlStartTime,
        };
        console.log("🔗 URL 시간 자동 적용 (사용자 설정 없음)");
      }

      // 라이브 스트림의 경우 시간 설정 제한
      if (extractedData?.isLive && timeSettings) {
        console.log("📺 라이브 스트림 감지 - 시간 설정 제한적 적용");
        timeSettings.isLiveContent = true;
      }
    }

    // 주요 플랫폼 결정 (첫 번째 플랫폼 사용)
    const primaryPlatform = platforms[0] || "mixed";

    const contenderData = {
      creatorId: currentUser.uid,
      creatorName:
        currentUser.displayName || currentUser.email?.split("@")[0] || "익명",
      title: postData.title,
      description: postData.description || "",
      imageUrl: imageUrl,
      category: postData.category,
      status: "available",
      createdAt: serverTimestamp(),

      // 다중 플랫폼 정보
      platform: primaryPlatform,
      platforms: platforms, // 모든 플랫폼 목록
      contentTypes: platforms, // 각 콘텐츠 타입들

      // 이미지 정보
      ...(hasImage && {
        hasImage: true,
        originalImageFile: postData.imageFile?.name,
      }),

      // 미디어 정보
      ...(hasMedia && {
        hasMedia: true,
        mediaUrl: postData.mediaUrl,
        extractedData: extractedData,
      }),

      // YouTube 특별 처리 (호환성)
      ...(extractedData?.platform === "youtube" && {
        youtubeUrl: extractedData.originalUrl,
        youtubeId: extractedData.videoId,
        thumbnailUrl: extractedData.thumbnailUrl,
        // 라이브 스트림 정보
        ...(extractedData.isLive && {
          isLiveStream: true,
          youtubeContentType: extractedData.contentType,
        }),
        // Shorts 정보
        ...(extractedData.isShorts && {
          isYouTubeShorts: true,
          youtubeContentType: extractedData.contentType,
        }),
      }),

      // TikTok 특별 처리 (개선된 버전)
      ...(extractedData?.platform === "tiktok" && {
        tiktokUrl: extractedData.originalUrl,
        tiktokId: extractedData.videoId,
        tiktokUsername: extractedData.username,
        // TikTok HTML 임베드 저장 (핵심!)
        ...(extractedData.html && { tiktokHtml: extractedData.html }),
        ...(extractedData.blockquoteHtml && {
          tiktokBlockquote: extractedData.blockquoteHtml,
        }),
        ...(extractedData.title && { originalTitle: extractedData.title }),
        ...(extractedData.authorName && {
          originalAuthor: extractedData.authorName,
        }),
        // 임베드 타입 정보 저장
        embedType: extractedData.embedType || "custom",
      }),

      // Instagram 특별 처리
      ...(extractedData?.platform === "instagram" && {
        instagramUrl: extractedData.originalUrl,
        postType: extractedData.postType,
      }),

      // 시간 설정 (사용자 설정 우선)
      ...(timeSettings && {
        timeSettings: timeSettings,
      }),

      likeCount: 0,
      viewCount: 0,
      tags: postData.tags || [],
      battleCount: 0,
      updatedAt: serverTimestamp(),
      isActive: true,
    };

    console.log("💾 Firestore 저장 데이터:", contenderData);

    const docRef = await addDoc(collection(db, "contenders"), contenderData);

    console.log("✅ Firestore 저장 완료! 문서 ID:", docRef.id);

    // 플랫폼별 특별 로그
    if (extractedData?.platform === "tiktok") {
      console.log("🎵 TikTok 콘텐츠 업로드 완료:");
      console.log("  - 비디오 ID:", extractedData.videoId);
      console.log("  - 사용자명:", extractedData.username);
      console.log("  - 임베드 타입:", extractedData.embedType);
      console.log("  - HTML 임베드 있음:", !!extractedData.html);
    }

    // 자동 매칭 시도 (선택적)
    try {
      const { findAndCreateRandomBattle } = await import("./matchingService");
      setTimeout(() => {
        findAndCreateRandomBattle({ maxMatches: 2 })
          .then((result) => {
            if (result.success) {
              console.log(
                `📈 새 콘텐츠 업로드로 ${result.matchesCreated}개의 배틀이 생성되었습니다.`
              );
            }
          })
          .catch((error) => {
            console.error("자동 매칭 실패:", error);
          });
      }, 2000);
    } catch (error) {
      console.warn("매칭 서비스를 찾을 수 없습니다:", error);
    }

    return {
      success: true,
      contenderId: docRef.id,
      imageUrl: imageUrl,
      platforms: platforms,
      primaryPlatform: primaryPlatform,
      extractedData: extractedData,
      timeSettings: timeSettings,
    };
  } catch (error) {
    console.error("❌ Contender upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
 */
export const uploadContender = async (postData) => {
  const currentUser = getCurrentUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");
  if (!postData.contentItems || postData.contentItems.length === 0) {
    throw new Error("최소 하나 이상의 콘텐츠를 추가해주세요.");
  }

  try {
    console.log("🚀 다중 콘텐츠 업로드 시작:", postData.title);

    // 1. contentItems 배열을 순회하며 비동기 처리 준비 (이미지 업로드 등)
    const processedContentItemsPromises = postData.contentItems.map(
      async (item) => {
        if (item.type === "image" && item.imageFile) {
          console.log(`📸 '${item.imageFile.name}' 이미지 업로드 중...`);
          const imageUrl = await uploadImage(item.imageFile);
          if (!imageUrl) {
            throw new Error(`'${item.imageFile.name}' 이미지 업로드 실패`);
          }
          return {
            type: "image",
            platform: "image",
            imageUrl: imageUrl,
            thumbnailUrl: imageUrl, // 이미지 자체를 썸네일로 사용
          };
        } else if (item.type === "media" && item.mediaUrl) {
          console.log(`🎬 '${item.mediaUrl}' 미디어 처리 중...`);
          const extractedData = await detectPlatformAndExtract(item.mediaUrl);
          if (!extractedData) {
            throw new Error(`지원하지 않는 미디어 URL입니다: ${item.mediaUrl}`);
          }

          let timeSettings = null;
          if (extractedData.platform === "youtube") {
            const userStartTime = parseTimeToSeconds(item.startTime);
            const userEndTime = parseTimeToSeconds(item.endTime);
            const urlStartTime =
              extractedData.urlDetectedTime || extractedData.startTime || 0;

            if (item.startTime || item.endTime) {
              timeSettings = {
                startTime: userStartTime,
                endTime: userEndTime,
                source: "user",
              };
            } else if (urlStartTime > 0 && !extractedData.isLive) {
              timeSettings = {
                startTime: urlStartTime,
                endTime: 0,
                source: "url",
              };
            }
          }

          return {
            type: "media",
            platform: extractedData.platform,
            mediaUrl: item.mediaUrl,
            thumbnailUrl:
              extractedData.thumbnailUrl || "/images/default-thumbnail.png",
            extractedData: extractedData,
            ...(timeSettings && { timeSettings }),
          };
        }
        return null; // 유효하지 않은 아이템은 null 반환
      }
    );

    // 2. 모든 비동기 작업(이미지 업로드 등)을 병렬로 실행
    const processedContentItems = (
      await Promise.all(processedContentItemsPromises)
    ).filter(Boolean);

    if (processedContentItems.length === 0) {
      throw new Error("처리할 유효한 콘텐츠가 없습니다.");
    }
    console.log("✅ 모든 콘텐츠 처리 완료:", processedContentItems);

    // 3. 대표 썸네일 결정 (첫 번째 아이템의 썸네일을 사용)
    const representativeThumbnail =
      processedContentItems[0].thumbnailUrl || "/images/popo.png";
    const platforms = [
      ...new Set(processedContentItems.map((item) => item.platform)),
    ];

    // 4. Firestore에 저장할 최종 데이터 구조화
    const contenderData = {
      creatorId: currentUser.uid,
      creatorName:
        currentUser.displayName || currentUser.email?.split("@")[0] || "익명",
      title: postData.title,
      description: postData.description || "",
      category: postData.category,
      tags: postData.tags || [],

      thumbnailUrl: representativeThumbnail, // 리스트 표시에 사용할 대표 썸네일
      platform: platforms[0] || "mixed", // 대표 플랫폼
      platforms: platforms, // 포함된 모든 플랫폼 목록

      // 핵심: 처리 완료된 모든 콘텐츠 아이템 배열 저장
      contentItems: processedContentItems,

      status: "available",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likeCount: 0,
      viewCount: 0,
      battleCount: 0,
      isActive: true,
    };

    console.log("💾 Firestore 저장 데이터:", contenderData);
    const docRef = await addDoc(collection(db, "contenders"), contenderData);
    console.log("✅ Firestore 저장 완료! 문서 ID:", docRef.id);

    return {
      success: true,
      contenderId: docRef.id,
    };
  } catch (error) {
    console.error("❌ Contender upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 다중 콘텐츠 업로드
 */
export const uploadMultipleContenders = async (postsData, category) => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error("로그인이 필요합니다.");
  }

  console.log(`🚀 다중 콘텐츠 업로드 시작: ${postsData.length}개`);

  const results = [];
  const errors = [];

  for (let i = 0; i < postsData.length; i++) {
    const post = postsData[i];
    try {
      console.log(
        `📤 게시물 ${i + 1}/${postsData.length} 처리 중: ${post.title}`
      );

      const postData = {
        title: post.title,
        description: post.description,
        category: category,
        mediaUrl: post.mediaUrl,
        startTime: post.startTime,
        endTime: post.endTime,
        tags: post.tags || [],
        imageFile: post.imageFile,
      };

      const result = await uploadContender(postData);

      if (result.success) {
        results.push(result);
        console.log(`✅ 게시물 ${i + 1} 업로드 성공`);
      } else {
        errors.push({
          postIndex: i + 1,
          title: post.title,
          error: result.error,
        });
        console.error(`❌ 게시물 ${i + 1} 업로드 실패:`, result.error);
      }
    } catch (error) {
      console.error(`❌ 게시물 ${i + 1} 처리 중 예외:`, error);
      errors.push({
        postIndex: i + 1,
        title: post.title,
        error: error.message,
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;

  console.log(`🎯 다중 업로드 완료: ${successCount}/${postsData.length} 성공`);

  return {
    success: errors.length === 0,
    results: results,
    errors: errors,
    successCount: successCount,
    totalCount: postsData.length,
  };
};

// ==================== 콘텐츠 조회 함수들 ====================

/**
 * 사용자 콘텐츠 조회
 */
export const getUserContenders = async (userId) => {
  if (!userId) {
    console.warn("getUserContenders 호출 시 userId가 필요합니다.");
    return [];
  }

  try {
    const q = query(
      collection(db, "contenders"),
      where("creatorId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const contenders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return contenders;
  } catch (error) {
    console.error("사용자 contender 조회 오류:", error);
    return []; // 오류 발생 시 빈 배열 반환
  }
};
/**
 * 사용 가능한 콘텐츠 조회
 */
export const getAvailableContenders = async (
  category = null,
  limitCount = 50
) => {
  try {
    let q;

    if (category) {
      q = query(
        collection(db, "contenders"),
        where("status", "==", "available"),
        where("category", "==", category),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, "contenders"),
        where("status", "==", "available"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    const contenders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));

    return {
      success: true,
      contenders,
    };
  } catch (error) {
    console.error("Contender 목록 조회 오류:", error);
    return {
      success: false,
      error: error.message,
      contenders: [],
    };
  }
};

/**
 * ID로 단일 Contender 상세 정보 조회
 */
export const getContenderDetail = async (contenderId) => {
  try {
    if (!contenderId) {
      return { success: false, message: "콘텐츠 ID가 필요합니다." };
    }
    const contenderRef = doc(db, "contenders", contenderId);
    const contenderDoc = await getDoc(contenderRef);

    if (!contenderDoc.exists()) {
      return { success: false, message: "콘텐츠를 찾을 수 없습니다." };
    }

    const contenderData = contenderDoc.data();

    const processedData = {
      id: contenderDoc.id,
      ...contenderData,
      createdAt: contenderData.createdAt?.toDate() || new Date(),
      updatedAt: contenderData.updatedAt?.toDate() || new Date(),
    };

    return { success: true, contender: processedData };
  } catch (error) {
    console.error("단일 콘텐츠 조회 실패:", error);
    return { success: false, error: error.message };
  }
};

// ==================== 콘텐츠 관리 함수들 ====================

/**
 * 콘텐츠 삭제
 */
export const deleteContender = async (contenderId, userId) => {
  try {
    if (!userId) {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error("로그인이 필요합니다.");
      }
      userId = currentUser.uid;
    }

    const contenderRef = doc(db, "contenders", contenderId);
    const contenderDoc = await getDoc(contenderRef);

    if (!contenderDoc.exists()) {
      throw new Error("콘텐츠를 찾을 수 없습니다.");
    }

    const contenderData = contenderDoc.data();

    if (contenderData.creatorId !== userId) {
      throw new Error("삭제 권한이 없습니다.");
    }

    if (contenderData.status === "in_battle") {
      throw new Error("배틀 진행 중인 콘텐츠는 삭제할 수 없습니다.");
    }

    await updateDoc(contenderRef, {
      status: "deleted",
      isActive: false,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Contender 삭제 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 콘텐츠 업데이트 (시간 설정 등)
 */
export const updateContenderTimeSettings = async (
  contenderId,
  timeSettings,
  userId
) => {
  try {
    if (!userId) {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error("로그인이 필요합니다.");
      }
      userId = currentUser.uid;
    }

    const contenderRef = doc(db, "contenders", contenderId);
    const contenderDoc = await getDoc(contenderRef);

    if (!contenderDoc.exists()) {
      throw new Error("콘텐츠를 찾을 수 없습니다.");
    }

    const contenderData = contenderDoc.data();

    if (contenderData.creatorId !== userId) {
      throw new Error("수정 권한이 없습니다.");
    }

    if (contenderData.platform !== "youtube") {
      throw new Error("YouTube 콘텐츠만 시간 설정을 수정할 수 있습니다.");
    }

    const updates = {
      timeSettings: {
        ...timeSettings,
        source: "user", // 수동 업데이트는 항상 사용자 설정
        updatedAt: new Date().toISOString(),
      },
      updatedAt: serverTimestamp(),
    };

    await updateDoc(contenderRef, updates);

    return {
      success: true,
      message: "시간 설정이 업데이트되었습니다.",
    };
  } catch (error) {
    console.error("시간 설정 업데이트 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ==================== 디버깅 및 관리 함수들 ====================

/**
 * 콘텐츠 상태 디버깅
 */
export const debugContenderStatus = async () => {
  try {
    const contendersQuery = query(collection(db, "contenders"));
    const snapshot = await getDocs(contendersQuery);

    const contenders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("📋 모든 콘텐츠 상태:");
    contenders.forEach((c) => {
      console.log(
        `- ${c.title}: status=${c.status}, creator=${c.creatorId?.slice(
          0,
          8
        )}, category=${c.category}, platforms=${JSON.stringify(
          c.platforms || [c.platform]
        )}, timeSource=${c.timeSettings?.source || "none"}, isLive=${
          c.isLiveStream || false
        }, isTikTok=${c.platform === "tiktok"}`
      );
    });

    return {
      success: true,
      total: contenders.length,
      available: contenders.filter((c) => c.status === "available").length,
      inBattle: contenders.filter((c) => c.status === "in_battle").length,
      withUserTimeSettings: contenders.filter(
        (c) => c.timeSettings?.source === "user"
      ).length,
      withUrlTimeSettings: contenders.filter(
        (c) => c.timeSettings?.source === "url"
      ).length,
      liveStreams: contenders.filter((c) => c.isLiveStream).length,
      youtubeShorts: contenders.filter((c) => c.isYouTubeShorts).length,
      tiktokVideos: contenders.filter((c) => c.platform === "tiktok").length,
      multiPlatform: contenders.filter(
        (c) => c.platforms && c.platforms.length > 1
      ).length,
      contenders,
    };
  } catch (error) {
    console.error("콘텐츠 상태 확인 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 모든 콘텐츠를 available 상태로 리셋
 */
export const resetAllContendersToAvailable = async () => {
  try {
    const contendersQuery = query(
      collection(db, "contenders"),
      where("status", "!=", "available")
    );

    const snapshot = await getDocs(contendersQuery);
    const batch = [];

    snapshot.docs.forEach((doc) => {
      batch.push(
        updateDoc(doc.ref, {
          status: "available",
          lastBattleId: null,
          updatedAt: serverTimestamp(),
        })
      );
    });

    await Promise.all(batch);

    return {
      success: true,
      resetCount: snapshot.size,
      message: `${snapshot.size}개 콘텐츠를 available 상태로 리셋했습니다.`,
    };
  } catch (error) {
    console.error("콘텐츠 상태 리셋 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ==================== 통계 및 분석 함수들 ====================

/**
 * 콘텐츠 플랫폼별 통계 - 다중 플랫폼 지원
 */
export const getContentStatsByPlatform = async () => {
  try {
    const contendersQuery = query(
      collection(db, "contenders"),
      where("status", "==", "available")
    );
    const snapshot = await getDocs(contendersQuery);

    const stats = {
      total: snapshot.size,
      byPlatform: {},
      byCategory: {},
      multiPlatform: {
        total: 0,
        combinations: {},
      },
      timeSettings: {
        total: 0,
        userSet: 0,
        urlDetected: 0,
        noTimeSettings: 0,
      },
      youtubeContent: {
        total: 0,
        regularVideos: 0,
        liveStreams: 0,
        shorts: 0,
      },
      tiktokContent: {
        total: 0,
        withOembedHtml: 0,
        withCustomHtml: 0,
        withUsername: 0,
      },
    };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const platforms = data.platforms || [data.platform || "image"];
      const category = data.category || "unknown";
      const timeSettings = data.timeSettings;

      // 플랫폼별 통계 (다중 플랫폼 지원)
      platforms.forEach((platform) => {
        stats.byPlatform[platform] = (stats.byPlatform[platform] || 0) + 1;
      });

      // 다중 플랫폼 통계
      if (platforms.length > 1) {
        stats.multiPlatform.total++;
        const combination = platforms.sort().join("+");
        stats.multiPlatform.combinations[combination] =
          (stats.multiPlatform.combinations[combination] || 0) + 1;
      }

      // 카테고리별 통계
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      // YouTube 관련 통계
      if (platforms.includes("youtube")) {
        stats.youtubeContent.total++;

        if (data.isLiveStream) {
          stats.youtubeContent.liveStreams++;
        } else if (data.isYouTubeShorts) {
          stats.youtubeContent.shorts++;
        } else {
          stats.youtubeContent.regularVideos++;
        }

        // 시간 설정 통계
        if (timeSettings) {
          stats.timeSettings.total++;
          if (timeSettings.source === "user") {
            stats.timeSettings.userSet++;
          } else if (timeSettings.source === "url") {
            stats.timeSettings.urlDetected++;
          }
        } else {
          stats.timeSettings.noTimeSettings++;
        }
      }

      // TikTok 관련 통계
      if (platforms.includes("tiktok")) {
        stats.tiktokContent.total++;

        if (data.embedType === "oembed") {
          stats.tiktokContent.withOembedHtml++;
        } else if (data.embedType === "custom") {
          stats.tiktokContent.withCustomHtml++;
        }

        if (data.tiktokUsername) {
          stats.tiktokContent.withUsername++;
        }
      }
    });

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error("콘텐츠 통계 조회 오류:", error);
    return {
      success: false,
      error: error.message,
      stats: null,
    };
  }
};

// ==================== 특화 콘텐츠 조회 함수들 ====================

/**
 * 라이브 스트림 콘텐츠만 조회
 */
export const getLiveStreamContenders = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, "contenders"),
      where("status", "==", "available"),
      where("isLiveStream", "==", true),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const contenders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));

    return {
      success: true,
      contenders,
      count: contenders.length,
    };
  } catch (error) {
    console.error("라이브 스트림 조회 오류:", error);
    return {
      success: false,
      error: error.message,
      contenders: [],
    };
  }
};

/**
 * TikTok 콘텐츠만 조회
 */
export const getTikTokContenders = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, "contenders"),
      where("status", "==", "available"),
      where("platform", "==", "tiktok"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const contenders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));

    return {
      success: true,
      contenders,
      count: contenders.length,
    };
  } catch (error) {
    console.error("TikTok 콘텐츠 조회 오류:", error);
    return {
      success: false,
      error: error.message,
      contenders: [],
    };
  }
};

/**
 * YouTube Shorts 콘텐츠만 조회
 */
export const getYouTubeShortsContenders = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, "contenders"),
      where("status", "==", "available"),
      where("isYouTubeShorts", "==", true),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const contenders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));

    return {
      success: true,
      contenders,
      count: contenders.length,
    };
  } catch (error) {
    console.error("YouTube Shorts 조회 오류:", error);
    return {
      success: false,
      error: error.message,
      contenders: [],
    };
  }
};

/**
 * 다중 플랫폼 콘텐츠만 조회
 */
export const getMultiPlatformContenders = async (limitCount = 20) => {
  try {
    const contendersQuery = query(
      collection(db, "contenders"),
      where("status", "==", "available"),
      orderBy("createdAt", "desc"),
      limit(limitCount * 2) // 더 많이 가져와서 필터링
    );

    const querySnapshot = await getDocs(contendersQuery);
    const allContenders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));

    // 다중 플랫폼 콘텐츠만 필터링
    const multiPlatformContenders = allContenders
      .filter((contender) => {
        const platforms = contender.platforms || [contender.platform];
        return platforms.length > 1;
      })
      .slice(0, limitCount);

    return {
      success: true,
      contenders: multiPlatformContenders,
      count: multiPlatformContenders.length,
    };
  } catch (error) {
    console.error("다중 플랫폼 콘텐츠 조회 오류:", error);
    return {
      success: false,
      error: error.message,
      contenders: [],
    };
  }
};

// ==================== URL 검증 및 유틸리티 함수들 ====================

/**
 * URL 유효성 검사 및 타입 감지
 */
export const validateAndDetectUrl = async (url) => {
  try {
    const detected = await detectPlatformAndExtract(url);

    if (!detected) {
      return {
        isValid: false,
        error: "지원하지 않는 URL입니다.",
        supportedPlatforms: ["YouTube", "TikTok", "Instagram"],
      };
    }

    const validation = {
      isValid: true,
      platform: detected.platform,
      contentType: detected.contentType || "video",
      isLive: detected.isLive || false,
      isShorts: detected.isShorts || false,
      hasTimeParams: (detected.startTime || 0) > 0,
      videoId: detected.videoId,
      extractedData: detected,
    };

    // YouTube 특별 검증
    if (detected.platform === "youtube") {
      validation.youtubeSpecific = {
        videoId: detected.videoId,
        isLiveStream: detected.isLive,
        isShorts: detected.isShorts,
        hasUrlTime: detected.startTime > 0,
        urlTimeSeconds: detected.startTime,
        thumbnailAvailable: !!detected.thumbnailUrl,
      };

      if (detected.isLive) {
        validation.liveStreamNote =
          "라이브 스트림은 실시간 콘텐츠입니다. 시간 설정이 제한적일 수 있습니다.";
      }

      if (detected.isShorts) {
        validation.shortsNote =
          "YouTube Shorts는 짧은 세로 영상입니다. 시간 설정은 60초 이내로 제한됩니다.";
      }
    }

    // TikTok 특별 검증
    if (detected.platform === "tiktok") {
      validation.tiktokSpecific = {
        videoId: detected.videoId,
        username: detected.username,
        hasOembedHtml: detected.embedType === "oembed",
        hasCustomHtml: detected.embedType === "custom",
        htmlEmbedAvailable: !!detected.html,
      };

      validation.tiktokNote =
        "TikTok 콘텐츠는 사이트 내에서 직접 재생 가능합니다.";
    }

    return validation;
  } catch (error) {
    console.error("URL 검증 오류:", error);
    return {
      isValid: false,
      error: error.message || "URL 처리 중 오류가 발생했습니다.",
    };
  }
};

/**
 * 배치 업로드를 위한 URL 검증
 */
export const validateMultipleUrls = async (urls) => {
  const results = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const validation = await validateAndDetectUrl(url);
      results.push({
        index: i,
        url: url,
        ...validation,
      });
    } catch (error) {
      results.push({
        index: i,
        url: url,
        isValid: false,
        error: error.message,
      });
    }
  }

  const validCount = results.filter((r) => r.isValid).length;
  const invalidCount = results.length - validCount;

  return {
    results,
    summary: {
      total: results.length,
      valid: validCount,
      invalid: invalidCount,
      validRate: Math.round((validCount / results.length) * 100),
    },
  };
};

/**
 * 고급 콘텐츠 필터링
 */
export const getFilteredContenders = async (filters = {}) => {
  try {
    let whereConditions = [where("status", "==", "available")];

    // 카테고리 필터
    if (filters.category) {
      whereConditions.push(where("category", "==", filters.category));
    }

    // 플랫폼 필터 (다중 플랫폼 지원)
    if (filters.platform) {
      // 단일 플랫폼이거나 플랫폼 배열에 포함된 경우
      whereConditions.push(
        where("platforms", "array-contains", filters.platform)
      );
    }

    // 시간 설정 소스 필터
    if (filters.timeSource) {
      whereConditions.push(
        where("timeSettings.source", "==", filters.timeSource)
      );
    }

    // YouTube 특별 필터
    if (filters.youtubeType) {
      whereConditions.push(where("platforms", "array-contains", "youtube"));

      switch (filters.youtubeType) {
        case "live":
          whereConditions.push(where("isLiveStream", "==", true));
          break;
        case "shorts":
          whereConditions.push(where("isYouTubeShorts", "==", true));
          break;
        case "regular":
          whereConditions.push(where("isLiveStream", "!=", true));
          whereConditions.push(where("isYouTubeShorts", "!=", true));
          break;
      }
    }

    // TikTok 특별 필터
    if (filters.tiktokType) {
      whereConditions.push(where("platforms", "array-contains", "tiktok"));

      switch (filters.tiktokType) {
        case "oembed":
          whereConditions.push(where("embedType", "==", "oembed"));
          break;
        case "custom":
          whereConditions.push(where("embedType", "==", "custom"));
          break;
      }
    }

    // 다중 플랫폼 필터
    if (filters.multiPlatform) {
      // 이 경우는 클라이언트에서 필터링해야 함 (Firestore 제한)
    }

    // 생성자 필터
    if (filters.creatorId) {
      whereConditions.push(where("creatorId", "==", filters.creatorId));
    }

    const q = query(
      collection(db, "contenders"),
      ...whereConditions,
      orderBy(filters.orderBy || "createdAt", filters.order || "desc"),
      limit(filters.limit || 50)
    );

    const querySnapshot = await getDocs(q);
    let contenders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    }));

    // 다중 플랫폼 필터 적용 (클라이언트 사이드)
    if (filters.multiPlatform) {
      contenders = contenders.filter((contender) => {
        const platforms = contender.platforms || [contender.platform];
        return platforms.length > 1;
      });
    }

    return {
      success: true,
      contenders,
      count: contenders.length,
      filters: filters,
    };
  } catch (error) {
    console.error("필터링된 콘텐츠 조회 오류:", error);
    return {
      success: false,
      error: error.message,
      contenders: [],
    };
  }
};

// ==================== 추가 유틸리티 함수들 ====================

/**
 * YouTube 시간 설정 유틸리티 함수들
 */
export const formatTimeSettings = (timeSettings) => {
  if (!timeSettings) return null;

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return {
    ...timeSettings,
    startTimeFormatted:
      timeSettings.startTime > 0 ? formatTime(timeSettings.startTime) : null,
    endTimeFormatted:
      timeSettings.endTime > 0 ? formatTime(timeSettings.endTime) : null,
    isUserSetting: timeSettings.source === "user",
    isUrlSetting: timeSettings.source === "url",
    isLiveContent: timeSettings.isLiveContent || false,
  };
};
// ... (contentService.js 파일의 기존 내용)

/**
 * 특정 사용자가 업로드한 모든 Contender 조회
 */
