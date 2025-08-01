// src/components/MediaPlayerModal.jsx - 시간 설정 및 다중 플랫폼 지원 개선

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  ExternalLink,
  Youtube,
  Instagram,
  Play,
  Clock,
  SkipForward,
} from "lucide-react";

const MediaPlayerModal = ({ isOpen, onClose, contentData }) => {
  const modalRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [youtubeApiReady, setYoutubeApiReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tiktokScriptLoaded, setTiktokScriptLoaded] = useState(false);
  const intervalRef = useRef(null);

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

      // YouTube API 로드
      if (contentData?.platform === "youtube") {
        loadYouTubeAPI();
      }

      // TikTok 스크립트 로드
      if (contentData?.platform === "tiktok") {
        loadTikTokScript();
      }
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, contentData]);

  // TikTok 스크립트 로드 함수
  const loadTikTokScript = () => {
    if (window.tiktokEmbed || tiktokScriptLoaded) {
      // 이미 로드된 경우 위젯 새로고침
      setTimeout(() => {
        if (window.tiktokEmbed && window.tiktokEmbed.load) {
          window.tiktokEmbed.load();
        }
      }, 100);
      return;
    }

    const existingScript = document.querySelector(
      'script[src*="tiktok.com/embed.js"]'
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      script.onload = () => {
        setTiktokScriptLoaded(true);
        // 스크립트 로드 후 위젯 초기화
        setTimeout(() => {
          if (window.tiktokEmbed && window.tiktokEmbed.load) {
            window.tiktokEmbed.load();
          }
        }, 100);
      };
      document.head.appendChild(script);
    }
  };

  // 모달이 닫힐 때 정리
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      if (youtubePlayer) {
        youtubePlayer.destroy();
        setYoutubePlayer(null);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isOpen, youtubePlayer]);

  // YouTube API 로드
  const loadYouTubeAPI = () => {
    if (window.YT && window.YT.Player) {
      setYoutubeApiReady(true);
      return;
    }

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);

      window.onYouTubeIframeAPIReady = () => {
        setYoutubeApiReady(true);
      };
    }
  };

  // YouTube 플레이어 초기화
  const initYouTubePlayer = () => {
    if (youtubePlayer) {
      youtubePlayer.destroy();
    }

    const startTime = contentData?.timeSettings?.startTime || 0;
    const endTime = contentData?.timeSettings?.endTime || 0;

    const player = new window.YT.Player("youtube-player-iframe", {
      height: "400",
      width: "100%",
      videoId: contentData.extractedData.videoId,
      playerVars: {
        start: startTime,
        end: endTime > 0 ? endTime : undefined,
        autoplay: 1,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        enablejsapi: 1,
      },
      events: {
        onReady: (event) => {
          setDuration(event.target.getDuration());
          setCurrentTime(startTime);
          startTimeTracking();
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            startTimeTracking();
          } else if (
            event.data === window.YT.PlayerState.PAUSED ||
            event.data === window.YT.PlayerState.ENDED
          ) {
            setIsPlaying(false);
            stopTimeTracking();
          }

          // 종료 시간 체크
          if (endTime > 0 && event.target.getCurrentTime() >= endTime) {
            event.target.pauseVideo();
          }
        },
      },
    });

    setYoutubePlayer(player);
  };

  // 시간 추적 시작
  const startTimeTracking = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (youtubePlayer && youtubePlayer.getCurrentTime) {
        const current = youtubePlayer.getCurrentTime();
        setCurrentTime(current);

        const endTime = contentData?.timeSettings?.endTime || 0;
        if (endTime > 0 && current >= endTime) {
          youtubePlayer.pauseVideo();
          stopTimeTracking();
        }
      }
    }, 1000);
  };

  // 시간 추적 정지
  const stopTimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
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

  if (!isOpen || !contentData) return null;

  const {
    platform,
    title,
    description,
    creatorName,
    extractedData,
    timeSettings,
  } = contentData;

  const renderYouTubeThumbnail = () => {
    if (!extractedData?.videoId) return null;

    const thumbnail =
      extractedData.thumbnailUrl ||
      `https://img.youtube.com/vi/${extractedData.videoId}/maxresdefault.jpg`;

    return (
      <div className="relative w-full aspect-video bg-gray-800 rounded-lg overflow-hidden group cursor-pointer">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = `https://img.youtube.com/vi/${extractedData.videoId}/hqdefault.jpg`;
          }}
        />

        {/* 재생 버튼 오버레이 */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-all"
          onClick={() => {
            setIsPlaying(true);
            if (youtubeApiReady) {
              setTimeout(() => initYouTubePlayer(), 100);
            }
          }}
        >
          <div className="bg-red-600 hover:bg-red-700 rounded-full p-6 transition-all transform hover:scale-110 shadow-lg">
            <Play className="w-8 h-8 text-white fill-current ml-1" />
          </div>
        </div>

        {/* YouTube 로고 */}
        <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-1">
          <Youtube className="w-4 h-4" />
          YouTube
        </div>

        {/* 시간 설정 표시 */}
        {(timeSettings?.startTime > 0 || timeSettings?.endTime > 0) && (
          <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4" />
              <span className="font-medium">재생 구간</span>
            </div>
            {timeSettings.startTime > 0 && (
              <div className="text-xs text-gray-300">
                시작: {formatTime(timeSettings.startTime)}
              </div>
            )}
            {timeSettings.endTime > 0 && (
              <div className="text-xs text-gray-300">
                종료: {formatTime(timeSettings.endTime)}
              </div>
            )}
          </div>
        )}

        {/* 재생 안내 */}
        <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity">
          클릭하여 재생
        </div>
      </div>
    );
  };

  const renderYouTubePlayer = () => {
    if (!extractedData?.videoId || !isPlaying) return null;

    return (
      <div className="relative w-full aspect-video bg-gray-800 rounded-lg overflow-hidden">
        <div id="youtube-player-iframe" className="w-full h-full"></div>

        {/* 컨트롤 오버레이 */}
        <div className="absolute top-4 left-4 flex gap-2">
          <button
            onClick={() => {
              setIsPlaying(false);
              if (youtubePlayer) {
                youtubePlayer.destroy();
                setYoutubePlayer(null);
              }
            }}
            className="bg-black/80 hover:bg-black/90 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <img src="/images/popo.png" alt="썸네일" className="w-4 h-4" />
            썸네일로 돌아가기
          </button>
        </div>

        {/* 시간 정보 */}
        {(timeSettings?.startTime > 0 || timeSettings?.endTime > 0) && (
          <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatTime(currentTime)}</span>
              {timeSettings.endTime > 0 && (
                <span>/ {formatTime(timeSettings.endTime)}</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTikTokEmbed = () => {
    if (!contentData?.extractedData?.originalUrl) return null;

    const { extractedData } = contentData;

    // oEmbed API에서 받은 HTML이 있는 경우 사용
    if (extractedData.html) {
      return (
        <div className="relative w-full max-w-lg mx-auto">
          <div
            dangerouslySetInnerHTML={{ __html: extractedData.html }}
            className="tiktok-embed-container"
          />
        </div>
      );
    }

    // fallback: 수동으로 blockquote 구조 생성
    const videoId = extractedData.videoId;
    const username = extractedData.username || extractedData.authorName;
    const title = extractedData.title || contentData.title || "TikTok 비디오";
    const originalUrl = extractedData.originalUrl;

    // TikTok 임베드 HTML 구조 생성 (예시 참조)
    const tiktokHTML = `
      <blockquote class="tiktok-embed" cite="${originalUrl}" data-video-id="${videoId}" style="max-width: 605px;min-width: 325px;">
        <section>
          ${
            username
              ? `<a target="_blank" title="@${username}" href="https://www.tiktok.com/@${username}?refer=embed">@${username}</a>`
              : ""
          }
          ${title ? `<p>${title}</p>` : ""}
          <a target="_blank" title="TikTok에서 보기" href="${originalUrl}?refer=embed">TikTok에서 원본 보기</a>
        </section>
      </blockquote>
    `;

    return (
      <div className="relative w-full max-w-lg mx-auto">
        <div
          dangerouslySetInnerHTML={{ __html: tiktokHTML }}
          className="tiktok-embed-container"
        />
      </div>
    );
  };

  const renderInstagramEmbed = () => {
    if (!extractedData?.originalUrl) return null;

    const embedUrl = `${extractedData.originalUrl}embed/`;

    return (
      <div className="relative w-full max-w-md mx-auto">
        <iframe
          src={embedUrl}
          className="w-full h-[600px] border-none rounded-lg"
          frameBorder="0"
          scrolling="no"
          allowTransparency="true"
          title={title}
        />
      </div>
    );
  };

  const renderImageViewer = () => {
    return (
      <div className="relative w-full max-w-4xl mx-auto">
        <img
          src={contentData.imageUrl}
          alt={title}
          className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
        />
      </div>
    );
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case "youtube":
        return <Youtube className="w-5 h-5 text-red-500" />;
      case "tiktok":
        return (
          <div className="w-5 h-5 bg-gradient-to-r from-ff0050 to-00f2ea rounded text-white text-xs flex items-center justify-center font-bold">
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
    return (
      extractedData?.originalUrl ||
      contentData.youtubeUrl ||
      contentData.instagramUrl
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
                  {getPlatformName()} •{" "}
                  {platform === "youtube" && isPlaying ? "재생 중" : "미리보기"}
                </p>
                {/* 시간 설정 표시 */}
                {(timeSettings?.startTime > 0 || timeSettings?.endTime > 0) && (
                  <div className="flex items-center gap-1 text-xs text-blue-400">
                    <Clock className="w-3 h-3" />
                    <span>
                      {timeSettings.startTime > 0 &&
                        formatTime(timeSettings.startTime)}
                      {timeSettings.startTime > 0 &&
                        timeSettings.endTime > 0 &&
                        " ~ "}
                      {timeSettings.endTime > 0 &&
                        formatTime(timeSettings.endTime)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* YouTube 재생/썸네일 토글 버튼 */}
            {platform === "youtube" && (
              <button
                onClick={() => {
                  if (isPlaying) {
                    setIsPlaying(false);
                    if (youtubePlayer) {
                      youtubePlayer.destroy();
                      setYoutubePlayer(null);
                    }
                  } else {
                    setIsPlaying(true);
                    if (youtubeApiReady) {
                      setTimeout(() => initYouTubePlayer(), 100);
                    }
                  }
                }}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
                title={isPlaying ? "썸네일 보기" : "YouTube 재생"}
              >
                {isPlaying ? (
                  <img
                    src="/images/popo.png"
                    alt="썸네일"
                    className="w-5 h-5"
                  />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
            )}

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
          {platform === "youtube" && (
            <>
              {isPlaying && youtubeApiReady
                ? renderYouTubePlayer()
                : renderYouTubeThumbnail()}
            </>
          )}
          {platform === "tiktok" && renderTikTokEmbed()}
          {platform === "instagram" && renderInstagramEmbed()}
          {platform === "image" && renderImageViewer()}

          {/* 설명 */}
          {description && (
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">설명</h3>
              <p className="text-gray-400 leading-relaxed">{description}</p>
            </div>
          )}

          {/* 시간 설정 정보 */}
          {platform === "youtube" &&
            (timeSettings?.startTime > 0 || timeSettings?.endTime > 0) && (
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  재생 구간 설정
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {timeSettings.startTime > 0 && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Play className="w-4 h-4 text-green-500" />
                      <span>시작: {formatTime(timeSettings.startTime)}</span>
                    </div>
                  )}
                  {timeSettings.endTime > 0 && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <SkipForward className="w-4 h-4 text-red-500" />
                      <span>종료: {formatTime(timeSettings.endTime)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* 액션 버튼들 */}
          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            {platform === "youtube" && (
              <button
                onClick={() => {
                  if (isPlaying) {
                    setIsPlaying(false);
                    if (youtubePlayer) {
                      youtubePlayer.destroy();
                      setYoutubePlayer(null);
                    }
                  } else {
                    setIsPlaying(true);
                    if (youtubeApiReady) {
                      setTimeout(() => initYouTubePlayer(), 100);
                    }
                  }
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all transform hover:scale-105 ${
                  isPlaying
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white shadow-lg"
                }`}
              >
                {isPlaying ? (
                  <>
                    <img
                      src="/images/popo.png"
                      alt="썸네일"
                      className="w-4 h-4"
                    />
                    썸네일 보기
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    YouTube 재생
                  </>
                )}
              </button>
            )}

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
        </div>
      </div>
    </div>
  );
};

export default MediaPlayerModal;
