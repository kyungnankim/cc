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
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showIframe, setShowIframe] = useState(false);

  // 개발 환경에서만 로그 출력
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    console.log("=== MediaPlayerModal 렌더링 중 ===");
    console.log("🔄 상태:", {
      isOpen,
      platform: contentData?.platform,
      showIframe,
      iframeLoaded,
      iframeError,
    });
  }

  // 모달이 열릴 때만 로그 (개발 환경)
  if (isOpen && isDev) {
    console.log("🎬 모달 열림:", {
      platform: contentData?.platform,
      title: contentData?.title,
      videoId: contentData?.youtubeId || contentData?.extractedData?.videoId,
    });
  }

  // 모달이 열리면 즉시 iframe 표시 시작
  useEffect(() => {
    if (isOpen && contentData?.platform === "youtube") {
      if (isDev) console.log("🚀 YouTube iframe 준비 시작");

      // 약간의 지연 후 iframe 표시
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

      // TikTok 스크립트 로드 (안정성 개선)
      if (contentData?.platform === "tiktok") {
        const loadTikTokScript = () => {
          const existingScript = document.querySelector(
            'script[src="https://www.tiktok.com/embed.js"]'
          );

          if (!existingScript) {
            const script = document.createElement("script");
            script.async = true;
            script.src = "https://www.tiktok.com/embed.js";
            script.onload = () => {
              if (process.env.NODE_ENV === "development") {
                console.log("✅ TikTok 스크립트 로드 완료");
              }
              // 스크립트 로드 후 위젯 렌더링 (안전하게)
              setTimeout(() => {
                try {
                  if (
                    window.tiktokEmbed &&
                    window.tiktokEmbed.lib &&
                    window.tiktokEmbed.lib.render
                  ) {
                    window.tiktokEmbed.lib.render();
                  }
                } catch (error) {
                  if (process.env.NODE_ENV === "development") {
                    console.warn("TikTok 위젯 렌더링 실패:", error);
                  }
                }
              }, 500);
            };
            script.onerror = () => {
              if (process.env.NODE_ENV === "development") {
                console.error("❌ TikTok 스크립트 로드 실패");
              }
            };
            document.head.appendChild(script);
          } else {
            // 기존 스크립트가 있으면 위젯 렌더링 (안전하게)
            setTimeout(() => {
              try {
                if (
                  window.tiktokEmbed &&
                  window.tiktokEmbed.lib &&
                  window.tiktokEmbed.lib.render
                ) {
                  window.tiktokEmbed.lib.render();
                }
              } catch (error) {
                if (process.env.NODE_ENV === "development") {
                  console.warn("TikTok 위젯 재렌더링 실패:", error);
                }
              }
            }, 300);
          }
        };

        // 모달 열림 후 약간의 지연을 두고 스크립트 로드
        const timer = setTimeout(loadTikTokScript, 200);

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
      // 사용자 설정이 있으면 항상 우선 적용
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

      // URL에서 자동 감지된 시간
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

      // 기본 timeSettings 데이터
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

    // 시간 설정 없음
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

    // 다양한 YouTube URL 패턴에서 ID 추출
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/live\/([a-zA-Z0-9_-]+)/,
      /[?&]v=([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        let videoId = match[1];
        // 쿼리 파라미터 제거
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

    // 다양한 소스에서 videoId 찾기
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

    // 라이브 스트림 감지
    const isLiveStream =
      contentData?.isLiveStream ||
      contentData?.extractedData?.isLive ||
      contentData?.youtubeUrl?.includes("/live/");

    // 구글 채팅 스타일 파라미터
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

    // 시간 설정 적용 (라이브가 아닌 경우에만)
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

    // 개발 환경에서만 요약 로그
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

  // TikTok blockquote 렌더링 - 안정성 개선 버전
  const renderTikTokBlockquote = () => {
    const isDev = process.env.NODE_ENV === "development";

    // TikTok HTML 임베드가 있는 경우 (가장 확실한 방법)
    if (contentData?.extractedData?.html) {
      if (isDev) console.log("🎵 TikTok HTML 임베드 사용");

      return (
        <div className="flex justify-center">
          <div
            className="tiktok-container w-full max-w-md"
            key={`tiktok-${Date.now()}`} // 강제 리렌더링을 위한 key
          >
            {/* TikTok HTML 임베드 사용 */}
            <div
              className="tiktok-embed"
              dangerouslySetInnerHTML={{
                __html: contentData.extractedData.html,
              }}
            />
          </div>
        </div>
      );
    }

    // TikTok HTML이 tiktokHtml 필드에 있는 경우
    if (contentData?.tiktokHtml) {
      if (isDev) console.log("🎵 TikTok HTML (tiktokHtml 필드) 사용");

      return (
        <div className="flex justify-center">
          <div
            className="tiktok-container w-full max-w-md"
            key={`tiktok-html-${Date.now()}`}
          >
            <div
              className="tiktok-embed"
              dangerouslySetInnerHTML={{ __html: contentData.tiktokHtml }}
            />
          </div>
        </div>
      );
    }

    // TikTok URL이 있는 경우 - 간단한 임베드 생성 (더 안정적)
    if (contentData?.tiktokUrl || contentData?.extractedData?.originalUrl) {
      const tiktokUrl =
        contentData?.tiktokUrl || contentData?.extractedData?.originalUrl;
      const videoId =
        contentData?.extractedData?.videoId || contentData?.tiktokId;
      const authorName =
        contentData?.extractedData?.authorName ||
        contentData?.extractedData?.username ||
        contentData?.originalAuthor ||
        "TikTok";

      if (isDev)
        console.log("🎵 TikTok 간단 임베드 생성:", {
          tiktokUrl,
          videoId,
          authorName,
        });

      // 더 간단하고 안정적인 TikTok 임베드 HTML
      const simpleTikTokHtml = `
        <blockquote class="tiktok-embed" 
                    cite="${tiktokUrl}" 
                    data-video-id="${videoId || ""}" 
                    style="max-width: 605px; min-width: 325px; margin: 0 auto;">
          <section>
            <a target="_blank" 
               title="@${authorName}" 
               href="${tiktokUrl}">
              ${contentData?.title || "@" + authorName}
            </a>
          </section>
        </blockquote>
      `;

      return (
        <div className="flex justify-center">
          <div
            className="tiktok-container w-full max-w-md"
            key={`tiktok-simple-${Date.now()}`}
          >
            <div
              className="tiktok-embed"
              dangerouslySetInnerHTML={{ __html: simpleTikTokHtml }}
            />
          </div>
        </div>
      );
    }

    // 모든 방법이 실패한 경우 기본 UI
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
          {(contentData.extractedData?.username ||
            contentData.extractedData?.authorName) && (
            <div className="text-white/90 text-xs bg-black/30 px-2 py-1 rounded-full mb-3">
              @
              {contentData.extractedData?.username ||
                contentData.extractedData?.authorName}
            </div>
          )}
          <div className="mt-3">
            <a
              href={
                contentData.extractedData?.originalUrl ||
                contentData.tiktokUrl ||
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

  // Instagram iframe 렌더링
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

  const { platform, title, description, creatorName, extractedData } =
    contentData;
  const timeSettings = getTimeSettings();

  // 디버깅: 렌더링 시점 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === "development") {
    console.log("🎭 모달 렌더링:", {
      platform,
      timeSettings:
        timeSettings.startTime > 0 || timeSettings.endTime > 0
          ? timeSettings
          : "없음",
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
    // YouTube URL 우선순위: youtubeUrl > extractedData.originalUrl > mediaUrl
    if (platform === "youtube") {
      return (
        contentData.youtubeUrl ||
        contentData.extractedData?.originalUrl ||
        contentData.mediaUrl
      );
    }

    // 다른 플랫폼
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
                {/* 시간 설정 표시 - 소스 정보 포함 */}
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
          {/* YouTube iframe - 빠른 로딩 최적화 버전 */}
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
                {/* 썸네일 위 어두운 오버레이 */}
                <div className="absolute inset-0 bg-black/40"></div>
              </div>

              {/* iframe - 조건부 렌더링으로 빠른 로딩 */}
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

              {/* 초기 로딩 오버레이 (썸네일 위에 표시) */}
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

                  {/* 대체 재생 옵션들 */}
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
                        // 재시도
                        setTimeout(() => setShowIframe(true), 100);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      다시 시도
                    </button>
                  </div>

                  {/* 비디오 정보 */}
                  <div className="mt-6 text-xs text-gray-500 text-center">
                    <p>
                      비디오 ID:{" "}
                      {contentData?.youtubeId ||
                        contentData?.extractedData?.videoId}
                    </p>
                    {timeSettings.startTime > 0 && (
                      <p>시작 시간: {formatTime(timeSettings.startTime)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 플레이 버튼 오버레이 (iframe 로딩 전까지 표시) */}
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

          {/* TikTok blockquote - 안정성 개선 버전 */}
          {platform === "tiktok" && (
            <div className="relative">
              {renderTikTokBlockquote()}

              {/* TikTok 재시도 버튼 (에러 방지 개선) */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    try {
                      // 안전한 TikTok 위젯 재렌더링
                      if (
                        window.tiktokEmbed &&
                        window.tiktokEmbed.lib &&
                        typeof window.tiktokEmbed.lib.render === "function"
                      ) {
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
                              if (
                                window.tiktokEmbed &&
                                window.tiktokEmbed.lib
                              ) {
                                window.tiktokEmbed.lib.render();
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                >
                  TikTok 다시 로드
                </button>
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

          {/* 시간 설정 정보 - YouTube만 표시 (개선된 버전) */}
          {platform === "youtube" && (
            <div className="mt-6">
              {/* 라이브 스트림인 경우 */}
              {(contentData?.isLiveStream ||
                contentData?.extractedData?.isLive) && (
                <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-300">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    라이브 스트림
                  </h3>
                  <div className="text-sm text-gray-300 space-y-2">
                    <p>• 현재 실시간으로 방송 중인 콘텐츠입니다</p>
                    <p>• 라이브 스트림에서는 구간 재생 기능이 제한됩니다</p>
                    {timeSettings.startTime > 0 || timeSettings.endTime > 0 ? (
                      <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded">
                        <p className="text-yellow-300 text-sm">
                          <strong>알림:</strong> 설정된 시간 구간은 라이브
                          스트림에서 적용되지 않습니다.
                        </p>
                        <div className="mt-2 text-xs text-yellow-400">
                          설정된 구간:{" "}
                          {timeSettings.startTime > 0 &&
                            formatTime(timeSettings.startTime)}
                          {timeSettings.startTime > 0 &&
                            timeSettings.endTime > 0 &&
                            " ~ "}
                          {timeSettings.endTime > 0 &&
                            formatTime(timeSettings.endTime)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* 일반 비디오에서 시간 설정이 있는 경우 */}
              {!(
                contentData?.isLiveStream || contentData?.extractedData?.isLive
              ) &&
                (timeSettings.startTime > 0 || timeSettings.endTime > 0) && (
                  <div
                    className={`p-4 border rounded-lg ${
                      timeSettings.source === "user"
                        ? "bg-green-900/20 border-green-700/30"
                        : "bg-blue-900/20 border-blue-700/30"
                    }`}
                  >
                    <h3
                      className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
                        timeSettings.source === "user"
                          ? "text-green-300"
                          : "text-blue-300"
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      재생 구간 설정
                      {timeSettings.source === "user" && (
                        <div className="flex items-center gap-1 text-green-300 bg-green-800/30 px-2 py-1 rounded text-xs">
                          <User className="w-3 h-3" />
                          <span>사용자가 직접 설정</span>
                        </div>
                      )}
                      {timeSettings.source === "url" && (
                        <div className="flex items-center gap-1 text-blue-300 bg-blue-800/30 px-2 py-1 rounded text-xs">
                          <ExternalLink className="w-3 h-3" />
                          <span>URL에서 자동 감지</span>
                        </div>
                      )}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {timeSettings.startTime > 0 && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Play className="w-4 h-4 text-green-500" />
                          <span>
                            시작: {formatTime(timeSettings.startTime)}
                          </span>
                        </div>
                      )}
                      {timeSettings.endTime > 0 && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <SkipForward className="w-4 h-4 text-red-500" />
                          <span>종료: {formatTime(timeSettings.endTime)}</span>
                        </div>
                      )}
                    </div>
                    {timeSettings.startTime > 0 && timeSettings.endTime > 0 && (
                      <div
                        className={`mt-2 text-sm ${
                          timeSettings.source === "user"
                            ? "text-green-300"
                            : "text-blue-300"
                        }`}
                      >
                        재생 시간:{" "}
                        {formatTime(
                          timeSettings.endTime - timeSettings.startTime
                        )}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-400 bg-gray-800/30 rounded p-2">
                      <strong>💡 정보:</strong>
                      <ul className="mt-1 space-y-1">
                        <li>
                          • iframe으로 직접 재생되며 설정된 구간이 자동
                          적용됩니다
                        </li>
                        <li>
                          •{" "}
                          {timeSettings.source === "user"
                            ? "사용자가 설정한"
                            : "URL에서 감지된"}{" "}
                          시간이 적용됩니다
                        </li>
                        {timeSettings.endTime > 0 && (
                          <li>• 종료 시간에 도달하면 자동으로 정지됩니다</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

              {/* 일반 비디오에서 시간 설정이 없는 경우 */}
              {!(
                contentData?.isLiveStream || contentData?.extractedData?.isLive
              ) &&
                timeSettings.startTime === 0 &&
                timeSettings.endTime === 0 && (
                  <div className="p-4 bg-gray-800/30 border border-gray-600/30 rounded-lg">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-gray-300">
                      <Play className="w-4 h-4" />
                      전체 영상 재생
                    </h3>
                    <p className="text-sm text-gray-400">
                      구간 설정이 없어 영상 전체가 재생됩니다.
                    </p>
                  </div>
                )}
            </div>
          )}

          {/* TikTok 정보 - 개선된 버전 */}
          {platform === "tiktok" && contentData.extractedData && (
            <div className="mt-6 p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
              <h3 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">
                  T
                </div>
                TikTok 비디오 정보
              </h3>
              <div className="text-sm text-gray-300 space-y-2">
                {contentData.extractedData.authorName && (
                  <p>
                    <strong>작성자:</strong> @
                    {contentData.extractedData.authorName}
                  </p>
                )}
                {contentData.extractedData.title && (
                  <p>
                    <strong>제목:</strong> {contentData.extractedData.title}
                  </p>
                )}

                {/* HTML 임베드 상태 표시 */}
                {contentData.extractedData.html || contentData.tiktokHtml ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>임베드 재생 활성화됨</span>
                  </div>
                ) : contentData.extractedData.originalUrl ||
                  contentData.tiktokUrl ? (
                  <div className="flex items-center gap-2 text-blue-400 text-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>동적 임베드 생성 시도</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span>원본 링크에서 확인 가능</span>
                  </div>
                )}

                {/* 임베드 타입 정보 */}
                {contentData.extractedData.type && (
                  <p className="text-xs text-gray-400">
                    콘텐츠 타입: {contentData.extractedData.type}
                  </p>
                )}

                {/* TikTok URL 정보 */}
                {(contentData.extractedData.originalUrl ||
                  contentData.tiktokUrl) && (
                  <p className="text-xs text-gray-400 break-all">
                    URL:{" "}
                    {contentData.extractedData.originalUrl ||
                      contentData.tiktokUrl}
                  </p>
                )}

                <div className="text-xs text-gray-400 mt-3 p-2 bg-gray-800/30 rounded">
                  <strong>💡 TikTok 재생 안내:</strong>
                  <br />
                  • HTML 임베드가 있는 경우 모달에서 바로 재생됩니다
                  <br />
                  • 동적 임베드 생성으로 더 많은 TikTok 비디오 지원
                  <br />
                  • 로딩이 안 되면 "TikTok 다시 로드" 버튼을 눌러보세요
                  <br />• 일부 비디오는 TikTok 앱에서만 재생 가능할 수 있습니다
                </div>
              </div>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            {getOriginalLink() && (
              <a
                href={getOriginalLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all transform hover:scale-105"
              >
                {getPlatformIcon()}
                {getPlatformName()}에서 보기
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all transform hover:scale-105"
            >
              닫기
            </button>
          </div>

          {/* 디버깅 정보 - 개발 환경에서만 표시 */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 p-3 bg-gray-900/50 border border-gray-600 rounded text-xs">
              <details className="text-gray-400 font-mono">
                <summary className="cursor-pointer text-gray-300 font-semibold mb-2">
                  🔧 개발자 디버그 정보 (클릭하여 열기)
                </summary>
                <div className="mt-2 space-y-1">
                  <p>
                    <strong>플랫폼:</strong> {platform}
                  </p>
                  {platform === "youtube" && (
                    <>
                      <p>
                        <strong>YouTube 정보:</strong>
                      </p>
                      <div className="ml-2 space-y-1">
                        <p>- youtubeId: {contentData?.youtubeId || "없음"}</p>
                        <p>- youtubeUrl: {contentData?.youtubeUrl || "없음"}</p>
                        <p>
                          - extractedData.videoId:{" "}
                          {extractedData?.videoId || "없음"}
                        </p>
                        <p>- mediaUrl: {contentData?.mediaUrl || "없음"}</p>
                        <p>
                          - 최종 사용된 비디오 ID:{" "}
                          {contentData?.youtubeId ||
                            contentData?.extractedData?.videoId ||
                            extractVideoIdFromUrl(
                              contentData?.youtubeUrl || contentData?.mediaUrl
                            ) ||
                            "없음"}
                        </p>
                      </div>

                      <p>
                        <strong>라이브 스트림:</strong>
                      </p>
                      <div className="ml-2 space-y-1">
                        <p>
                          - isLiveStream:{" "}
                          {contentData?.isLiveStream ? "YES" : "NO"}
                        </p>
                        <p>
                          - extractedData.isLive:{" "}
                          {contentData?.extractedData?.isLive ? "YES" : "NO"}
                        </p>
                      </div>

                      <p>
                        <strong>시간 설정:</strong>
                      </p>
                      <div className="ml-2 space-y-1">
                        <p>- 소스: {timeSettings.source}</p>
                        <p>
                          - 시작: {timeSettings.startTime}초 (
                          {formatTime(timeSettings.startTime)})
                        </p>
                        <p>
                          - 종료: {timeSettings.endTime}초 (
                          {formatTime(timeSettings.endTime)})
                        </p>
                      </div>

                      <p>
                        <strong>생성된 iframe URL:</strong>
                      </p>
                      <div className="ml-2 break-all text-blue-400">
                        {getYouTubeEmbedUrl()}
                      </div>

                      <p>
                        <strong>iframe 상태:</strong>
                      </p>
                      <div className="ml-2 space-y-1">
                        <p>- 로드됨: {iframeLoaded ? "YES" : "NO"}</p>
                        <p>- 에러: {iframeError ? "YES" : "NO"}</p>
                      </div>
                    </>
                  )}

                  {platform === "tiktok" && (
                    <>
                      <p>
                        <strong>TikTok 정보:</strong>
                      </p>
                      <div className="ml-2 space-y-1">
                        <p>
                          - HTML 임베드 있음:{" "}
                          {contentData.extractedData?.html ? "YES" : "NO"}
                        </p>
                        <p>
                          - 작성자:{" "}
                          {contentData.extractedData?.authorName || "없음"}
                        </p>
                        <p>
                          - 원본 URL:{" "}
                          {contentData.extractedData?.originalUrl || "없음"}
                        </p>
                      </div>
                    </>
                  )}

                  {platform === "instagram" && (
                    <>
                      <p>
                        <strong>Instagram 정보:</strong>
                      </p>
                      <div className="ml-2 space-y-1">
                        <p>
                          - 임베드 URL:{" "}
                          {contentData.extractedData?.embedUrl || "없음"}
                        </p>
                        <p>
                          - 포스트 타입:{" "}
                          {contentData.extractedData?.postType || "없음"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPlayerModal;
