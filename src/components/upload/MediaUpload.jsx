// upload/MediaUpload.jsx - 시간 입력 문제 완전 해결 버전
import React, { useState, useEffect } from "react";
import {
  Link,
  Youtube,
  Instagram,
  Play,
  Clock,
  SkipForward,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  detectPlatformAndExtract,
  validateUrlInRealTime,
  secondsToTimeFormat,
  parseTimeToSeconds,
} from "../../services/uploadService";
import MediaPreview from "./MediaPreview";

const MediaUpload = ({ post, updatePost }) => {
  const [urlValidation, setUrlValidation] = useState({
    isValid: false,
    message: "",
  });
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);

  // 로컬 상태로 시간 값 관리
  const [localStartTime, setLocalStartTime] = useState("");
  const [localEndTime, setLocalEndTime] = useState("");

  // post가 변경될 때 로컬 상태 동기화
  useEffect(() => {
    setLocalStartTime(post.startTime || "");
    setLocalEndTime(post.endTime || "");
  }, [post.startTime, post.endTime]);

  // URL 실시간 검증
  useEffect(() => {
    if (post.mediaUrl) {
      const validation = validateUrlInRealTime(post.mediaUrl);
      setUrlValidation(validation);
    } else {
      setUrlValidation({ isValid: false, message: "" });
    }
  }, [post.mediaUrl]);

  // 미디어 URL 변경 처리
  const handleMediaUrlChange = async (url) => {
    try {
      console.log("🔗 URL 처리 시작:", url);

      const validation = validateUrlInRealTime(url);
      setUrlValidation(validation);

      if (!validation.isValid && url.length > 10) {
        updatePost(post.id, {
          mediaUrl: url,
          detectedPlatform: null,
          extractedData: null,
        });
        return;
      }

      if (
        validation.isValid ||
        url.includes("youtu") ||
        url.includes("youtube")
      ) {
        setIsProcessingUrl(true);

        try {
          const detected = await detectPlatformAndExtract(url);
          console.log("🎯 감지 결과:", detected);

          const updates = {
            mediaUrl: url,
            detectedPlatform: detected?.platform || null,
            extractedData: detected,
          };

          if (detected?.platform === "youtube" && detected.startTime > 0) {
            if (!localStartTime && !localEndTime) {
              updates.urlDetectedStartTime = detected.startTime;
              const formattedTime = secondsToTimeFormat(detected.startTime);
              updates.startTime = formattedTime;
              setLocalStartTime(formattedTime);
              console.log("⏰ URL 시간 자동 적용:", formattedTime);
            } else {
              updates.urlDetectedStartTime = detected.startTime;
              console.log("👤 사용자 시간 설정 보존");
            }
          }

          updatePost(post.id, updates);
        } catch (error) {
          console.error("❌ 플랫폼 감지 오류:", error);
          updatePost(post.id, {
            mediaUrl: url,
            detectedPlatform: null,
            extractedData: null,
          });
        } finally {
          setIsProcessingUrl(false);
        }
      } else {
        updatePost(post.id, {
          mediaUrl: url,
          detectedPlatform: null,
          extractedData: null,
        });
      }
    } catch (error) {
      console.error("❌ URL 처리 전체 오류:", error);
      setIsProcessingUrl(false);
      updatePost(post.id, {
        mediaUrl: url,
        detectedPlatform: null,
        extractedData: null,
      });
    }
  };

  // 시간 입력 유효성 검사
  const validateTimeInput = (timeStr) => {
    if (!timeStr) return true;
    const timePattern = /^(\d{1,2}:)?\d{1,2}:\d{2}$/;
    return timePattern.test(timeStr);
  };

  // 시작 시간 변경 처리
  const handleStartTimeChange = (value) => {
    console.log("🕐 시작 시간 변경:", value);
    setLocalStartTime(value);

    if (validateTimeInput(value) || value === "") {
      updatePost(post.id, {
        startTime: value,
        userTimeOverride: value !== "",
      });

      // 종료 시간 검증
      if (localEndTime && value) {
        const startSeconds = parseTimeToSeconds(value);
        const endSeconds = parseTimeToSeconds(localEndTime);
        if (endSeconds <= startSeconds) {
          alert("⚠️ 종료 시간은 시작 시간보다 늦어야 합니다.");
        }
      }
    }
  };

  // 종료 시간 변경 처리
  const handleEndTimeChange = (value) => {
    console.log("🕐 종료 시간 변경:", value);
    setLocalEndTime(value);

    if (validateTimeInput(value) || value === "") {
      updatePost(post.id, {
        endTime: value,
        userTimeOverride: value !== "",
      });

      // 시작 시간과 비교 검증
      if (localStartTime && value) {
        const startSeconds = parseTimeToSeconds(localStartTime);
        const endSeconds = parseTimeToSeconds(value);
        if (endSeconds <= startSeconds) {
          alert("⚠️ 종료 시간은 시작 시간보다 늦어야 합니다.");
        }
      }
    }
  };

  // URL에서 감지된 시간을 사용자 필드에 적용
  const applyUrlTimeToUserSetting = () => {
    const urlStartTime =
      post.urlDetectedStartTime || post.extractedData?.startTime;
    if (urlStartTime > 0) {
      const formattedTime = secondsToTimeFormat(urlStartTime);
      setLocalStartTime(formattedTime);
      updatePost(post.id, {
        startTime: formattedTime,
        userTimeOverride: true,
      });
      console.log("🔄 URL 시간을 사용자 설정으로 적용:", formattedTime);
    }
  };

  // 사용자 시간 설정 초기화
  const clearUserTimeSettings = () => {
    setLocalStartTime("");
    setLocalEndTime("");
    updatePost(post.id, {
      startTime: "",
      endTime: "",
      userTimeOverride: false,
    });
    console.log("🧹 사용자 시간 설정 초기화");
  };

  // 현재 설정된 시간 정보 표시
  const getTimeInfo = () => {
    if (!localStartTime && !localEndTime) return null;

    const startSeconds = parseTimeToSeconds(localStartTime);
    const endSeconds = parseTimeToSeconds(localEndTime);
    const duration =
      endSeconds > startSeconds ? endSeconds - startSeconds : null;

    return {
      startSeconds,
      endSeconds,
      duration: duration ? secondsToTimeFormat(duration) : null,
    };
  };

  const timeInfo = getTimeInfo();
  const hasUrlDetectedTime =
    post.extractedData?.startTime > 0 || post.urlDetectedStartTime > 0;
  const hasUserTimeSettings = localStartTime || localEndTime;

  // URL 상태 아이콘
  const getUrlStatusIcon = () => {
    if (isProcessingUrl) {
      return (
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      );
    }

    if (!post.mediaUrl) return null;

    if (urlValidation.isValid) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (post.mediaUrl.length > 5) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-gray-300 text-sm font-medium mb-2 block">
          동영상 링크 * (YouTube, TikTok, Instagram)
        </label>
        <div className="relative">
          <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="url"
            value={post.mediaUrl}
            onChange={(e) => handleMediaUrlChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... 또는 TikTok, Instagram URL"
            className={`w-full pl-12 pr-12 py-3 bg-gray-800 text-white rounded-lg border transition-colors ${
              urlValidation.isValid
                ? "border-green-500 focus:border-green-400"
                : post.mediaUrl &&
                  !urlValidation.isValid &&
                  post.mediaUrl.length > 5
                ? "border-red-500 focus:border-red-400"
                : "border-gray-700 focus:border-pink-500"
            } focus:outline-none`}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getUrlStatusIcon()}
          </div>
        </div>

        {/* URL 검증 메시지 */}
        {post.mediaUrl && urlValidation.message && (
          <div
            className={`mt-2 text-sm flex items-center gap-2 ${
              urlValidation.isValid ? "text-green-400" : "text-red-400"
            }`}
          >
            {urlValidation.isValid ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            <span>{urlValidation.message}</span>
          </div>
        )}

        {/* 플랫폼 감지 표시 */}
        {post.detectedPlatform && (
          <div className="mt-2 flex items-center gap-2">
            {post.detectedPlatform === "youtube" && (
              <>
                <Youtube className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-400">
                  YouTube 동영상이 감지되었습니다
                  {post.extractedData?.isLive && (
                    <span className="ml-1 text-xs bg-red-600/20 text-red-300 px-2 py-1 rounded">
                      (라이브)
                    </span>
                  )}
                  {post.extractedData?.isShorts && (
                    <span className="ml-1 text-xs bg-red-600/20 text-red-300 px-2 py-1 rounded">
                      (Shorts)
                    </span>
                  )}
                </span>
                {hasUrlDetectedTime && (
                  <span className="text-xs text-blue-400 ml-2">
                    (URL에서 시작시간{" "}
                    {secondsToTimeFormat(
                      post.urlDetectedStartTime || post.extractedData.startTime
                    )}{" "}
                    감지됨)
                  </span>
                )}
              </>
            )}
            {post.detectedPlatform === "tiktok" && (
              <>
                <Play className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-purple-400">
                  TikTok 동영상이 감지되었습니다
                </span>
              </>
            )}
            {post.detectedPlatform === "instagram" && (
              <>
                <Instagram className="w-4 h-4 text-pink-500" />
                <span className="text-sm text-pink-400">
                  Instagram 콘텐츠가 감지되었습니다
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* YouTube 시간 설정 - 감지된 경우에만 표시 */}
      {post.detectedPlatform === "youtube" && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-400" />
            <h4 className="text-blue-300 font-medium">재생 구간 설정</h4>

            {/* 라이브 스트림 안내 */}
            {post.extractedData?.isLive && (
              <span className="text-xs bg-red-600/20 text-red-300 px-2 py-1 rounded">
                라이브 스트림 - 시간 설정 제한적 적용
              </span>
            )}

            {/* URL 시간 감지 알림 및 적용 버튼 */}
            {hasUrlDetectedTime && !hasUserTimeSettings && (
              <button
                onClick={applyUrlTimeToUserSetting}
                className="text-xs bg-blue-600/50 text-blue-200 px-2 py-1 rounded hover:bg-blue-600/70 transition-colors"
              >
                URL 시간 적용 (
                {secondsToTimeFormat(
                  post.urlDetectedStartTime || post.extractedData.startTime
                )}
                )
              </button>
            )}

            {/* 시간 설정 초기화 버튼 */}
            {hasUserTimeSettings && (
              <button
                onClick={clearUserTimeSettings}
                className="text-xs bg-gray-600/50 text-gray-200 px-2 py-1 rounded hover:bg-gray-600/70 transition-colors"
              >
                시간 설정 초기화
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block flex items-center gap-2">
                <Clock className="w-4 h-4" />
                시작 시간 (선택)
              </label>
              <input
                type="text"
                value={localStartTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                placeholder="0:30 또는 1:05:30"
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-1">
                형식: 분:초 또는 시:분:초
              </p>
            </div>

            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block flex items-center gap-2">
                <SkipForward className="w-4 h-4" />
                종료 시간 (선택)
              </label>
              <input
                type="text"
                value={localEndTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                placeholder="3:45 또는 1:08:15"
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-1">비워두면 끝까지 재생</p>
            </div>
          </div>

          {/* 시간 정보 표시 */}
          {timeInfo && (
            <div className="mt-4 bg-gray-800/50 rounded-lg p-3">
              <h5 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                재생 정보{" "}
                {post.userTimeOverride && (
                  <span className="text-xs text-green-400">
                    (사용자 설정 적용)
                  </span>
                )}
              </h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {localStartTime && (
                  <div>
                    <span className="text-gray-400">시작:</span>
                    <span className="text-green-400 ml-1">
                      {localStartTime}
                    </span>
                  </div>
                )}
                {localEndTime && (
                  <div>
                    <span className="text-gray-400">종료:</span>
                    <span className="text-red-400 ml-1">{localEndTime}</span>
                  </div>
                )}
                {timeInfo.duration && (
                  <div>
                    <span className="text-gray-400">재생시간:</span>
                    <span className="text-blue-400 ml-1">
                      {timeInfo.duration}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 시간 설정 팁 */}
          <div className="mt-3 text-xs text-gray-400 bg-gray-800/30 rounded p-2">
            <strong>💡 팁:</strong>
            <ul className="mt-1 space-y-1">
              <li>
                • <strong>사용자 시간 설정이 항상 우선</strong> 적용됩니다
              </li>
              <li>
                • YouTube URL에 &t=30s가 있어도 위에서 설정한 시간이 사용됩니다
              </li>
              <li>• 시작시간만 설정하면 해당 시점부터 끝까지 재생</li>
              <li>• 둘 다 설정하면 지정된 구간만 재생</li>
              {post.extractedData?.isLive && (
                <li>
                  • <strong>라이브 스트림:</strong> 실시간 방송이므로 시간
                  설정이 제한적으로 적용됩니다
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* 미리보기 */}
      {post.extractedData && (
        <div className="border-2 border-gray-700 rounded-lg p-4 bg-gray-800/30">
          <h4 className="text-sm font-medium text-gray-300 mb-3">미리보기</h4>
          <MediaPreview post={post} />

          {/* YouTube 시간 설정이 있는 경우 추가 정보 표시 */}
          {post.detectedPlatform === "youtube" && hasUserTimeSettings && (
            <div className="mt-3 p-2 bg-blue-900/20 rounded text-sm">
              <div className="flex items-center gap-2 text-blue-300">
                <Clock className="w-4 h-4" />
                <span>이 동영상은 설정된 구간에서 재생됩니다</span>
                {post.userTimeOverride && (
                  <span className="text-xs bg-green-600/20 text-green-300 px-2 py-1 rounded">
                    사용자 설정
                  </span>
                )}
                {post.extractedData?.isLive && (
                  <span className="text-xs bg-red-600/20 text-red-300 px-2 py-1 rounded">
                    라이브 스트림
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 디버깅 정보
      <div className="mt-4 p-3 bg-gray-900/50 border border-gray-600 rounded text-xs">
        <p className="text-gray-400 font-mono">
          <strong>시간 입력 디버그:</strong>
          <br />
          로컬 시작시간: "{localStartTime}" (길이: {localStartTime.length})
          <br />
          로컬 종료시간: "{localEndTime}" (길이: {localEndTime.length})<br />
          Post 시작시간: "{post.startTime || "undefined"}"<br />
          Post 종료시간: "{post.endTime || "undefined"}"<br />
          사용자 오버라이드: {post.userTimeOverride ? "YES" : "NO"}
          <br />
        </p>
      </div>*/}
    </div>
  );
};

export default MediaUpload;
