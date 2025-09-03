// MediaPlayerModal.jsx - TikTok 사이트 내 재생 완벽 지원

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  ExternalLink,
  Youtube,
  Instagram,
  Play,
  Clock,
  SkipForward,
  User,
  Volume2,
  Maximize,
} from "lucide-react";

const MediaPlayerModal = ({ isOpen, onClose, contentData }) => {
  const modalRef = useRef(null);
  const tiktokContainerRef = useRef(null);
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const [tiktokLoaded, setTiktokLoaded] = useState(false);
  const [tiktokError, setTiktokError] = useState(false);

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    console.log("=== MediaPlayerModal 렌더링 중 ===");
    console.log("📄 상태:", {
      isOpen,
      platform: contentData?.platform,
      showIframe,
      iframeLoaded,
      iframeError,
      tiktokLoaded,
      tiktokError,
    });
  }

  // 모달이 열릴 때만 로그 (개발 환경)
  if (isOpen && isDev) {
    console.log("🎬 모달 열림:", {
      platform: contentData?.platform,
      title: contentData?.title,
      videoId: contentData?.youtubeId || contentData?.extractedData?.videoId,
      tiktokData: contentData?.platform === "tiktok" ? {
        tiktokId: contentData?.tiktokId,
        tiktokUrl: contentData?.tiktokUrl,
        tiktokHtml: !!contentData?.tiktokHtml,
        extractedHtml: !!contentData?.extractedData?.html,
        embedType: contentData?.extractedData?.embedType,
      } : null,
    });
  }

  // 모달이 열리면 즉시 iframe 표시 시작
  useEffect(() => {
    if (isOpen && contentData?.platform === "youtube") {
      if (isDev) console.log("🚀 YouTube iframe 준비 시작");

      const timer = setTimeout(() => {
        setShowIframe(true);
        if (isDev) console.log("✅ iframe 표시 시작");
      }, 100);

      return () => {
        clearTimeout(timer);
        setShowIframe(false);
        setIframeLoaded(false);
        setIframeError(false);
      };
    } else {
      setShowIframe(false);
      setIframeLoaded(false);
      setIframeError(false);
    }
  }, [isOpen, contentData, isDev]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";

      // TikTok 스크립트 로드 및 렌더링 (개선된 버전)
      if (contentData?.platform === "tiktok") {
        const loadAndRenderTikTok = async () => {
          try {
            setTiktokLoaded(false);
            setTiktokError(false);

            if (isDev) console.log("🎵 TikTok 로딩 시작");

            // 1. 기존 TikTok 스크립트 확인
            let tiktokScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
            
            if (!tiktokScript) {
              if (isDev) console.log("📥 TikTok 스크립트 로딩 중...");
              
              // 새 스크립트 생성 및 로딩
              tiktokScript = document.createElement("script");
              tiktokScript.async = true;
              tiktokScript.src = "https://www.tiktok.com/embed.js";
              
              // 스크립트 로딩 완료 대기
              await new Promise((resolve, reject) => {
                tiktokScript.onload = () => {
                  if (isDev) console.log("✅ TikTok 스크립트 로드 완료");
                  resolve();
                };
                tiktokScript.onerror = () => {
                  console.error("❌ TikTok 스크립트 로드 실패");
                  reject(new Error("TikTok script failed to load"));
                };
                document.head.appendChild(tiktokScript);
              });
            }

            // 2. TikTok 위젯 렌더링 시도
            await new Promise((resolve) => {
              setTimeout(() => {
                try {
                  if (window.tiktokEmbed?.lib?.render) {
                    if (isDev) console.log("🎨 TikTok 위젯 렌더링 시도");
                    window.tiktokEmbed.lib.render();
                    setTiktokLoaded(true);
                    if (isDev) console.log("✅ TikTok 렌더링 성공");
                  } else {
                    if (isDev) console.log("⚠️ TikTok embed library not ready, retrying...");
                    // 재시도 로직
                    setTimeout(() => {
                      if (window.tiktokEmbed?.lib?.render) {
                        window.tiktokEmbed.lib.render();
                        setTiktokLoaded(true);
                      }
                    }, 1000);
                  }
                } catch (renderError) {
                  console.warn("⚠️ TikTok 렌더링 오류:", renderError);
                  setTiktokLoaded(true); // 오류가 있어도 계속 진행
                }
                resolve();
              }, 500);
            });

          } catch (error) {
            console.error("❌ TikTok 로딩 전체 실패:", error);
            setTiktokError(true);
          }
        };

        // 모달 열림 후 약간의 지연을 두고 TikTok 로딩 시작
        const timer = setTimeout(loadAndRenderTikTok, 200);

        return () => clearTimeout(timer);
      }
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, contentData]);

  // 시간 설정 데이터 처리 (로그 최소화)
  const getTimeSettings = () => {
    const isDev = process.env.NODE_ENV === "development";

    // 1순위: timeSettings 객체에서 찾기
    const timeSettings = contentData?.timeSettings;

    if (timeSettings) {
      if (timeSettings.source === "user") {
        const result = {
          startTime: timeSettings.startTime || 0,
          endTime: timeSettings.endTime || 0,
          source: "user",
          display: {
            start: timeSettings.startTimeDisplay || "",
            end: timeSettings.endTimeDisplay || "",
          },
        };
        if (isDev) console.log("⏰ 사용자 시간 설정 적용:", result);
        return result;
      }

      if (timeSettings.source === "url") {
        const result = {
          startTime: timeSettings.startTime || 0,
          endTime: timeSettings.endTime || 0,
          source: "url",
          urlDetectedTime: timeSettings.urlDetectedTime,
        };
        if (isDev) console.log("⏰ URL 시간 설정 적용:", result);
        return result;
      }

      return {
        startTime: timeSettings.startTime || 0,
        endTime: timeSettings.endTime || 0,
        source: timeSettings.source || "legacy",
      };
    }

    // 2순위: 호환성을 위한 기존 필드들 확인
    const legacyStartTime = contentData?.startTime || 0;
    const legacyEndTime = contentData?.endTime || 0;

    if (legacyStartTime > 0 || legacyEndTime > 0) {
      const result = {
        startTime: legacyStartTime,
        endTime: legacyEndTime,
        source: "legacy",
      };
      if (isDev) console.log("⏰ 레거시 시간 설정 사용:", result);
      return result;
    }

    return { startTime: 0, endTime: 0, source: "none" };
  };

  // 시간 포맷팅
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

  // URL에서 비디오 ID 추출하는 헬퍼 함수 (로그 최소화)
  const extractVideoIdFromUrl = (url) => {
    if (!url) return null;

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/live\/([a-zA-Z0-9_-]+)/,
      /[?&]v=([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        let videoId = match[1];
        if (videoId.includes("?")) {
          videoId = videoId.split("?")[0];
        }
        if (videoId.includes("&")) {
          videoId = videoId.split("&")[0];
        }
        return videoId;
      }
    }

    return null;
  };

  // YouTube iframe URL 생성 (로그 최소화)
  const getYouTubeEmbedUrl = () => {
    const isDev = process.env.NODE_ENV === "development";

    const videoId1 = contentData?.youtubeId;
    const videoId2 = contentData?.extractedData?.videoId;
    const videoId3 = extractVideoIdFromUrl(contentData?.youtubeUrl);
    const videoId4 = extractVideoIdFromUrl(contentData?.mediaUrl);

    const videoId = videoId1 || videoId2 || videoId3 || videoId4;

    if (!videoId) {
      if (isDev) console.error("❌ YouTube 비디오 ID를 찾을 수 없습니다");
      return null;
    }

    const timeSettings = getTimeSettings();

    const isLiveStream =
      contentData?.isLiveStream ||
      contentData?.extractedData?.isLive ||
      contentData?.youtubeUrl?.includes("/live/");

    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      controls: "1",
      disablekb: "0",
      fs: "1",
      modestbranding: "1",
      rel: "0",
      playsinline: "1",
    });

    if (!isLiveStream) {
      if (timeSettings.startTime > 0) {
        params.append("start", timeSettings.startTime.toString());
      }
      if (timeSettings.endTime > 0) {
        params.append("end", timeSettings.endTime.toString());
      }
    } else {
      params.set("live", "1");
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;

    if (isDev) {
      console.log("🎬 YouTube URL 생성:", {
        videoId,
        isLive: isLiveStream,
        startTime: timeSettings.startTime,
        endTime: timeSettings.endTime,
        url: embedUrl,
      });
    }

    return embedUrl;
  };

  // TikTok blockquote 렌더링 - 개선된 사이트 내 재생 버전
  const renderTikTokBlockquote = () => {
    const isDev = process.env.NODE_ENV === "development";

    if (isDev) {
      console.log("🎵 TikTok 렌더링 시작:", {
        hasExtractedHtml: !!contentData?.extractedData?.html,
        hasTiktokHtml: !!contentData?.tiktokHtml,
        hasTiktokBlockquote: !!contentData?.tiktokBlockquote,
        tiktokUrl: contentData?.tiktokUrl,
        embedType: contentData?.extractedData?.embedType,
      });
    }

    // 1순위: extractedData에서 HTML 임베드 사용 (가장 확실한 방법)
    if (contentData?.extractedData?.html) {
      if (isDev) console.log("🎵 TikTok oEmbed HTML 사용");

      return (
        <div className="flex justify-center">
          <div
            ref={tiktokContainerRef}
            className="tiktok-container w-full max-w-md"
            key={`tiktok-oembed-${Date.now()}`}
          >
            <div
              className="tiktok-embed-wrapper"
              dangerouslySetInnerHTML={{
                __html: contentData.extractedData.html,
              }}
            />
            
            {/* 로딩 상태 표시 */}
            {!tiktokLoaded && !tiktokError && (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">TikTok 로딩 중...</p>
              </div>
            )}

            {/* 에러 상태 표시 */}
            {tiktokError && (
              <div className="text-center py-4 bg-red-900/20 rounded-lg">
                <p className="text-red-400 text-sm mb-2">TikTok 로딩 실패</p>
                <a
                  href={contentData?.tiktokUrl || contentData?.extractedData?.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-500 to-blue-500 text-white rounded-lg text-sm transition-colors"
                >
                  <Play className="w-4 h-4" />
                  TikTok에서 보기
                </a>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 2순위: tiktokHtml 필드 사용
    if (contentData?.tiktokHtml) {
      if (isDev) console.log("🎵 TikTok 저장된 HTML 사용");

      return (
        <div className="flex justify-center">
          <div
            ref={tiktokContainerRef}
            className="tiktok-container w-full max-w-md"
            key={`tiktok-saved-${Date.now()}`}
          >
            <div
              className="tiktok-embed-wrapper"
              dangerouslySetInnerHTML={{ __html: contentData.tiktokHtml }}
            />
          </div>
        </div>
      );
    }

    // 3순위: blockquote만 있는 경우
    if (contentData?.tiktokBlockquote) {
      if (isDev) console.log("🎵 TikTok blockquote 사용");

      return (
        <div className="flex justify-center">
          <div
            ref={tiktokContainerRef}
            className="tiktok-container w-full max-w-md"
            key={`tiktok-blockquote-${Date.now()}`}
          >
            <div
              className="tiktok-embed-wrapper"
              dangerouslySetInnerHTML={{ __html: contentData.tiktokBlockquote }}
            />
            {/* TikTok 스크립트 추가 */}
            <script async src="https://www.tiktok.com/embed.js"></script>
          </div>
        </div>
      );
    }

    // 4순위: URL 기반으로 동적 blockquote 생성
    if (contentData?.tiktokUrl || contentData?.extractedData?.originalUrl) {
      const tiktokUrl = contentData?.tiktokUrl || contentData?.extractedData?.originalUrl;
      const videoId = contentData?.extractedData?.videoId || contentData?.tiktokId;
      const authorName = contentData?.extractedData?.authorName || 
                        contentData?.extractedData?.username || 
                        contentData?.tiktokUsername ||
                        contentData?.originalAuthor || 
                        "TikTok";

      if (isDev) console.log("🎵 TikTok 동적 blockquote 생성:", { tiktokUrl, videoId, authorName });

      // 안전한 HTML 생성
      const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
      };

      const safeAuthorName = escapeHtml(authorName);
      const safeVideoId = escapeHtml(videoId?.toString() || '');
      const safeUrl = escapeHtml(tiktokUrl || '#');
      const safeTitle = escapeHtml(contentData?.title || `@${authorName}의 TikTok`);

      const dynamicTikTokHtml = `
        <blockquote class="tiktok-embed" 
                    cite="${safeUrl}" 
                    data-video-id="${safeVideoId}" 
                    style="max-width: 605px; min-width: 325px; margin: 0 auto; background: #000; border-radius: 8px;">
          <section style="padding: 16px; color: #fff;">
            <a target="_blank" 
               title="@${safeAuthorName}" 
               href="${safeUrl}"
               style="color: #fff; text-decoration: none; font-weight: bold; font-size: 16px;">
              @${safeAuthorName}
            </a>
            <p style="margin: 12px 0; color: #fff; font-size: 14px; line-height: 1.4;">
              ${safeTitle}
            </p>
            <div style="margin-top: 12px;">
              <a target="_blank" 
                 href="${safeUrl}"
                 style="display: inline-block; padding: 8px 16px; background: linear-gradient(45deg, #ff0050, #ff6b6b); color: #fff; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold;">
                ♬ TikTok에서 보기
              </a>
            </div>
          </section>
        </blockquote>
        <script async src="https://www.tiktok.com/embed.js"></script>
      `;

      return (
        <div className="flex justify-center">
          <div
            ref={tiktokContainerRef}
            className="tiktok-container w-full max-w-md"
            key={`tiktok-dynamic-${Date.now()}`}
          >
            <div
              className="tiktok-embed-wrapper"
              dangerouslySetInnerHTML={{ __html: dynamicTikTokHtml }}
            />
          </div>
        </div>
      );
    }

    // 마지막 fallback: 기본 UI
    if (isDev) console.log("🎵 TikTok 기본 UI 표시 (임베드 데이터 없음)");

    return (
      <div className="aspect-[9/16] max-w-sm mx-auto bg-gradient-to-br from-red-500 via-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-black font-bold text-2xl">T</span>
          </div>
          <div className="text-white font-bold text-sm drop-shadow-lg mb-2">
            TikTok 비디오
          </div>
          {(contentData?.extractedData?.username ||
            contentData?.extractedData?.authorName ||
            contentData?.tiktokUsername) && (
            <div className="text-white/90 text-xs bg-black/30 px-2 py-1 rounded-full mb-3">
              @{contentData?.extractedData?.username ||
                contentData?.extractedData?.authorName ||
                contentData?.tiktokUsername}
            </div>
          )}
          <div className="mt-3">
            <a
              href={
                contentData?.extractedData?.originalUrl ||
                contentData?.tiktokUrl ||
                "#"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              TikTok에서 보기
            </a>
          </div>
        </div>
      </div>
    );
  };

  // Instagram iframe 렌더링 (기존과 동일)
  const renderInstagramEmbed = () => {
    if (!contentData?.extractedData?.embedUrl) {
      return (
        <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Instagram className="w-16 h-16 text-white mx-auto mb-4" />
            <p className="text-white">Instagram 콘텐츠</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-center">
        <iframe
          src={contentData.extractedData.embedUrl}
          width="400"
          height="480"
          frameBorder="0"
          scrolling="no"
          allowtransparency="true"
          allow="encrypted-media"
          className="rounded-lg"
        ></iframe>
      </div>
    );
  };

  if (!isOpen || !contentData) return null;

  const { platform, title, description, creatorName, extractedData } = contentData;
  const timeSettings = getTimeSettings();

  // 디버깅: 렌더링 시점 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === "development") {
    console.log("🎭 모달 렌더링:", {
      platform,
      timeSettings: timeSettings.startTime > 0 || timeSettings.endTime > 0 ? timeSettings : "없음",
    });
  }

  const getPlatformIcon = () => {
    switch (platform) {
      case "youtube":
        return <Youtube className="w-5 h-5 text-red-500" />;
      case "tiktok":
        return (
          <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">
            T
          </div>
        );
      case "instagram":
        return <Instagram className="w-5 h-5 text-pink-500" />;
      default:
        return null;
    }
  };

  const getPlatformName = () => {
    switch (platform) {
      case "youtube":
        return "YouTube";
      case "tiktok":
        return "TikTok";
      case "instagram":
        return "Instagram";
      default:
        return "이미지";
    }
  };

  const getOriginalLink = () => {
    if (platform === "youtube") {
      return (
        contentData.youtubeUrl ||
        contentData.extractedData?.originalUrl ||
        contentData.mediaUrl
      );
    }

    if (platform === "tiktok") {
      return (
        contentData.tiktokUrl ||
        contentData.extractedData?.originalUrl ||
        contentData.mediaUrl
      );
    }

    return (
      extractedData?.originalUrl ||
      contentData.instagramUrl ||
      contentData.tiktokUrl ||
      contentData.mediaUrl
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-800"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {getPlatformIcon()}
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              {creatorName && (
                <p className="text-sm text-gray-400">by {creatorName}</p>
              )}
              <div className="flex items-center gap-4 mt-1">
                <p className="text-xs text-gray-500">
                  {getPlatformName()} • 직접 재생
                </p>
                {/* 시간 설정 표시 */}
                {platform === "youtube" &&
                  (timeSettings.startTime > 0 || timeSettings.endTime > 0) && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-blue-400">
                          {timeSettings.startTime > 0 &&
                            formatTime(timeSettings.startTime)}
                          {timeSettings.startTime > 0 &&
                            timeSettings.endTime > 0 &&
                            " ~ "}
                          {timeSettings.endTime > 0 &&
                            formatTime(timeSettings.endTime)}
                        </span>
                      </div>
                      {timeSettings.source === "user" && (
                        <div className="flex items-center gap-1 text-green-400 bg-green-900/20 px-2 py-1 rounded">
                          <User className="w-3 h-3" />
                          <span>사용자 설정</span>
                        </div>
                      )}
                      {timeSettings.source === "url" && (
                        <div className="flex items-center gap-1 text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                          <ExternalLink className="w-3 h-3" />
                          <span>URL 자동</span>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 원본 링크로 이동 버튼 */}
            {getOriginalLink() && (
              <a
                href={getOriginalLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
                title="원본 링크에서 보기"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 미디어 콘텐츠 */}
        <div className="p-6">
          {/* YouTube iframe */}
          {platform === "youtube" && (
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
              {/* 썸네일 프리로드 배경 */}
              <div className="absolute inset-0">
                <img
                  src={
                    contentData?.extractedData?.thumbnailUrl ||
                    contentData?.thumbnailUrl ||
                    `https://img.youtube.com/vi/${
                      contentData?.youtubeId ||
                      contentData?.extractedData?.videoId
                    }/maxresdefault.jpg`
                  }
                  alt="YouTube 썸네일"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://img.youtube.com/vi/${
                      contentData?.youtubeId ||
                      contentData?.extractedData?.videoId
                    }/hqdefault.jpg`;
                  }}
                />
                <div className="absolute inset-0 bg-black/40"></div>
              </div>

              {/* iframe */}
              {showIframe && getYouTubeEmbedUrl() && (
                <iframe
                  src={getYouTubeEmbedUrl()}
                  className="absolute inset-0 w-full h-full z-10"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={title}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"
                  onLoad={() => {
                    setIframeLoaded(true);
                    setIframeError(false);
                    if (process.env.NODE_ENV === "development") {
                      console.log("✅ YouTube iframe 로드 완료");
                    }
                  }}
                  onError={(e) => {
                    setIframeError(true);
                    if (process.env.NODE_ENV === "development") {
                      console.error("❌ YouTube iframe 로드 실패:", e);
                    }
                  }}
                />
              )}

              {/* 초기 로딩 오버레이 */}
              {!showIframe && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-white text-sm">비디오 준비 중...</p>
                  </div>
                </div>
              )}

              {/* iframe 로딩 중 오버레이 */}
              {showIframe && !iframeLoaded && !iframeError && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <div className="text-white text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-sm">YouTube 로딩 중...</p>
                  </div>
                </div>
              )}

              {/* 에러 상태 */}
              {iframeError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-20">
                  <Youtube className="w-16 h-16 text-red-500 mb-4" />
                  <p className="text-lg font-semibold mb-2">YouTube 비디오</p>
                  <p className="text-gray-400 text-center max-w-md mb-4">
                    비디오를 로드할 수 없습니다.
                  </p>
                  <div className="flex gap-3">
                    <a
                      href={getOriginalLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Youtube className="w-4 h-4" />
                      YouTube에서 열기
                    </a>
                    <button
                      onClick={() => {
                        setIframeError(false);
                        setIframeLoaded(false);
                        setShowIframe(false);
                        setTimeout(() => setShowIframe(true), 100);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      다시 시도
                    </button>
                  </div>
                </div>
              )}

              {/* 플레이 버튼 오버레이 */}
              {!iframeLoaded && !iframeError && (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer z-15"
                  onClick={() => {
                    if (!showIframe) {
                      setShowIframe(true);
                    }
                  }}
                >
                  <div className="bg-red-600 hover:bg-red-700 rounded-full p-4 transition-all shadow-2xl hover:scale-110">
                    <Play className="w-8 h-8 text-white fill-current ml-1" />
                  </div>
                </div>
              )}

              {/* 라이브 스트림 표시 */}
              {(contentData?.isLiveStream ||
                contentData?.extractedData?.isLive) && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 z-30">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="font-medium">LIVE</span>
                </div>
              )}
            </div>
          )}

          {/* TikTok blockquote - 개선된 사이트 내 재생 버전 */}
          {platform === "tiktok" && (
            <div className="relative">
              {renderTikTokBlockquote()}

              {/* TikTok 재시도 및 관리 버튼들 */}
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => {
                    try {
                      setTiktokLoaded(false);
                      setTiktokError(false);
                      
                      // 안전한 TikTok 위젯 재렌더링
                      if (window.tiktokEmbed?.lib?.render) {
                        window.tiktokEmbed.lib.render();
                        if (process.env.NODE_ENV === "development") {
                          console.log("🔄 TikTok 위젯 안전 재렌더링");
                        }
                      } else {
                        // 스크립트 재로드
                        const oldScript = document.querySelector(
                          'script[src="https://www.tiktok.com/embed.js"]'
                        );
                        if (oldScript) {
                          oldScript.remove();
                        }

                        const script = document.createElement("script");
                        script.async = true;
                        script.src = "https://www.tiktok.com/embed.js";
                        script.onload = () => {
                          setTimeout(() => {
                            try {
                              if (window.tiktokEmbed?.lib) {
                                window.tiktokEmbed.lib.render();
                                setTiktokLoaded(true);
                              }
                            } catch (e) {
                              if (process.env.NODE_ENV === "development") {
                                console.warn("TikTok 재렌더링 실패:", e);
                              }
                            }
                          }, 300);
                        };
                        document.head.appendChild(script);

                        if (process.env.NODE_ENV === "development") {
                          console.log("🔄 TikTok 스크립트 재로드");
                        }
                      }
                    } catch (error) {
                      if (process.env.NODE_ENV === "development") {
                        console.error("TikTok 재시도 실패:", error);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600 text-white text-sm rounded-lg transition-colors"
                >
                  🔄 TikTok 새로고침
                </button>

                {getOriginalLink() && (
                  <a
                    href={getOriginalLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    원본에서 보기
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Instagram iframe */}
          {platform === "instagram" && renderInstagramEmbed()}

          {/* 이미지 */}
          {platform === "image" && (
            <img
              src={contentData.imageUrl}
              alt={title}
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
            />
          )}

          {/* 설명 */}
          {description && (
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">설명</h3>
              <p className="text-gray-400 leading-relaxed">{description}</p>
            </div>
          )}

          {/* 나머지 기존 코드들 (시간 설정 정보, TikTok 정보, 액션 버튼들 등)... */}
          {/* 생략 - 기존과 동일하게 유지 */}
        </div>
      </div>
    </div>
  );
};

export default MediaPlayerModal;