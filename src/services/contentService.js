// src/services/contentService.js - 수정된 콘텐츠 관리 서비스

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

// ==================== 유틸리티 함수들 ====================

// URL에서 플랫폼 감지 및 데이터 추출 (async 버전)
export const detectPlatformAndExtract = async (url) => {
  if (!url) return null;

  try {
    console.log("🔍 플랫폼 감지 시작:", url);

    // YouTube 감지
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];

      // URL에서 시작 시간 추출 (t 또는 start 파라미터)
      const timeRegex = /[?&](?:t|start)=(\d+)/;
      const timeMatch = url.match(timeRegex);
      const startTime = timeMatch ? parseInt(timeMatch[1]) : 0;

      console.log("✅ YouTube 감지됨:", { videoId, startTime });

      return {
        platform: "youtube",
        videoId,
        originalUrl: url,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        startTime: startTime,
      };
    }

    // TikTok 감지 및 oEmbed API 호출
    const tiktokRegex =
      /(?:tiktok\.com\/@[\w.-]+\/video\/(\d+)|tiktok\.com\/t\/(\w+)|vm\.tiktok\.com\/(\w+)|tiktok\.com\/v\/(\d+)|m\.tiktok\.com)/;
    const tiktokMatch = url.match(tiktokRegex);
    if (tiktokMatch) {
      console.log("🎵 TikTok URL 감지됨");

      // 먼저 TikTok oEmbed API 시도
      try {
        console.log("📡 TikTok oEmbed API 호출 시도:", url);

        const response = await fetch(
          `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (response.ok) {
          const oembedData = await response.json();
          console.log("✅ TikTok oEmbed 성공:", oembedData);

          // 비디오 ID 추출
          const videoId =
            tiktokMatch[1] ||
            tiktokMatch[2] ||
            tiktokMatch[3] ||
            tiktokMatch[4] ||
            "unknown";

          // 사용자명 추출 (URL에서 또는 oEmbed 데이터에서)
          const userMatch = url.match(/@([\w.-]+)/);
          const username = userMatch ? userMatch[1] : null;

          return {
            platform: "tiktok",
            videoId,
            username: username || oembedData.author_name,
            originalUrl: url,
            embedUrl: url,
            // oEmbed API 데이터
            title: oembedData.title,
            authorName: oembedData.author_name,
            authorUrl: oembedData.author_url,
            thumbnailUrl: oembedData.thumbnail_url,
            thumbnailWidth: oembedData.thumbnail_width,
            thumbnailHeight: oembedData.thumbnail_height,
            html: oembedData.html, // 중요: 실제 임베드 HTML
            providerName: oembedData.provider_name,
            providerUrl: oembedData.provider_url,
            version: oembedData.version,
            type: oembedData.type,
          };
        } else {
          console.warn(
            "⚠️ TikTok oEmbed API 응답 오류:",
            response.status,
            response.statusText
          );
        }
      } catch (error) {
        console.warn(
          "⚠️ TikTok oEmbed API 호출 실패, 기본 처리로 fallback:",
          error
        );
      }

      // API 실패 시 기본 처리
      const videoId =
        tiktokMatch[1] ||
        tiktokMatch[2] ||
        tiktokMatch[3] ||
        tiktokMatch[4] ||
        "unknown";
      const userMatch = url.match(/@([\w.-]+)/);
      const username = userMatch ? userMatch[1] : null;

      console.log("✅ TikTok 기본 처리:", { videoId, username });

      return {
        platform: "tiktok",
        videoId,
        username,
        originalUrl: url,
        embedUrl: url,
        title: username ? `@${username}의 TikTok` : "TikTok 비디오",
        authorName: username,
        displayInfo: {
          title: username ? `@${username}의 TikTok` : "TikTok 비디오",
          description: "TikTok 동영상 콘텐츠",
        },
      };
    }

    // Instagram 감지
    const instagramRegex = /instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/;
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

    console.log("❌ 지원하지 않는 플랫폼:", url);
    return null;
  } catch (error) {
    console.error("❌ 플랫폼 감지 오류:", error);
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

// ==================== 메인 콘텐츠 서비스 함수들 ====================

/**
 * 단일 콘텐츠 업로드
 */
export const uploadContender = async (formData, imageFile) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("로그인이 필요합니다.");
  }

  try {
    console.log("🚀 콘텐츠 업로드 시작:", formData.title);

    let imageUrl = null;
    let extractedData = null;
    let platform = "image";

    if (formData.contentType === "image" && imageFile) {
      // 이미지 업로드
      console.log("📸 이미지 업로드 중...");
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) {
        throw new Error("이미지 업로드에 실패했습니다.");
      }
      platform = "image";
      console.log("✅ 이미지 업로드 완료:", imageUrl);
    } else if (formData.contentType === "media" && formData.mediaUrl) {
      // 미디어 URL 처리 (await 추가)
      console.log("🎬 미디어 URL 처리 중:", formData.mediaUrl);
      extractedData = await detectPlatformAndExtract(formData.mediaUrl);
      if (!extractedData) {
        throw new Error("지원하지 않는 미디어 URL입니다.");
      }

      platform = extractedData.platform;
      console.log("✅ 플랫폼 감지 완료:", platform);

      // 플랫폼별 기본 이미지 설정
      if (platform === "youtube") {
        imageUrl = extractedData.thumbnailUrl || "/images/popo.png";
      } else {
        imageUrl = "/images/popo.png";
      }
    } else {
      throw new Error("콘텐츠 정보가 올바르지 않습니다.");
    }

    // 시간 설정 처리
    const timeSettings = {
      startTime: parseTimeToSeconds(formData.startTime),
      endTime: parseTimeToSeconds(formData.endTime),
      startTimeDisplay: formData.startTime || "",
      endTimeDisplay: formData.endTime || "",
    };

    console.log("⏰ 시간 설정:", timeSettings);

    const contenderData = {
      creatorId: currentUser.uid,
      creatorName:
        currentUser.displayName || currentUser.email?.split("@")[0] || "익명",
      title: formData.title,
      description: formData.description || "",
      imageUrl: imageUrl,
      category: formData.category,
      status: "available",
      createdAt: serverTimestamp(),

      // 플랫폼 및 미디어 정보
      platform: platform,
      contentType: formData.contentType || "image",

      // 추출된 미디어 데이터
      ...(extractedData && {
        extractedData: extractedData,
        mediaUrl: formData.mediaUrl,
      }),

      // YouTube 특별 처리 (호환성)
      ...(platform === "youtube" && {
        youtubeUrl: extractedData.originalUrl,
        youtubeId: extractedData.videoId,
        thumbnailUrl: extractedData.thumbnailUrl,
      }),

      // Instagram 특별 처리 (호환성)
      ...(platform === "instagram" && {
        instagramUrl: extractedData.originalUrl,
        postType: extractedData.postType,
      }),

      // TikTok 특별 처리
      ...(platform === "tiktok" && {
        tiktokUrl: extractedData.originalUrl,
        tiktokId: extractedData.videoId,
        // TikTok HTML 임베드 저장
        ...(extractedData.html && { tiktokHtml: extractedData.html }),
        ...(extractedData.title && { originalTitle: extractedData.title }),
        ...(extractedData.authorName && {
          originalAuthor: extractedData.authorName,
        }),
      }),

      // 시간 설정 (YouTube만 해당 - 조건 수정)
      ...(platform === "youtube" &&
        (timeSettings.startTime > 0 || timeSettings.endTime > 0) && {
          timeSettings: timeSettings,
        }),

      likeCount: 0,
      viewCount: 0,
      tags: formData.tags || [],
      battleCount: 0,
      updatedAt: serverTimestamp(),
      isActive: true,
    };

    console.log("💾 Firestore 저장 데이터:", contenderData);

    const docRef = await addDoc(collection(db, "contenders"), contenderData);

    console.log("✅ Firestore 저장 완료! 문서 ID:", docRef.id);

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
      platform: platform,
      contentType: formData.contentType,
      extractedData: extractedData,
      timeSettings: platform === "youtube" ? timeSettings : null,
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
 * 다중 콘텐츠 업로드 (수정됨)
 */
export const uploadMultipleContenders = async (postsData, category) => {
  const currentUser = auth.currentUser;
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

      const formData = {
        title: post.title,
        description: post.description,
        category: category,
        contentType: post.contentType,
        mediaUrl: post.mediaUrl,
        startTime: post.startTime,
        endTime: post.endTime,
        tags: post.tags || [],
      };

      const result = await uploadContender(formData, post.imageFile);

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

/**
 * 사용자 콘텐츠 조회
 */
export const getUserContenders = async (userId, limitCount = 20) => {
  try {
    const q = query(
      collection(db, "contenders"),
      where("creatorId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const contenders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    }));

    return {
      success: true,
      contenders,
    };
  } catch (error) {
    console.error("사용자 contender 조회 오류:", error);
    return {
      success: false,
      error: error.message,
      contenders: [],
    };
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
 * 콘텐츠 삭제
 */
export const deleteContender = async (contenderId, userId) => {
  try {
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
        )}, category=${c.category}, platform=${c.platform}`
      );
    });

    return {
      success: true,
      total: contenders.length,
      available: contenders.filter((c) => c.status === "available").length,
      inBattle: contenders.filter((c) => c.status === "in_battle").length,
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
  };
};

/**
 * 콘텐츠 플랫폼별 통계
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
      withTimeSettings: 0,
    };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const platform = data.platform || "image";
      const category = data.category || "unknown";

      // 플랫폼별 통계
      stats.byPlatform[platform] = (stats.byPlatform[platform] || 0) + 1;

      // 카테고리별 통계
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      // YouTube 시간 설정 통계
      if (platform === "youtube" && data.timeSettings) {
        stats.withTimeSettings++;
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
