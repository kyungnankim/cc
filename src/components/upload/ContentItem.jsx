// upload/ContentItem.jsx - 개별 콘텐츠 아이템 관리 컴포넌트
import React, { useState, useEffect } from "react";
import {
  Image,
  Link,
  Trash2,
  Youtube,
  Instagram,
  Play,
  Clock,
  SkipForward,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  detectPlatformAndExtract,
  validateUrlInRealTime,
  secondsToTimeFormat,
  parseTimeToSeconds,
} from "../../services/uploadService";

const ContentItem = ({ item, onUpdate, onRemove, canRemove = true }) => {
  const [urlValidation, setUrlValidation] = useState({
    isValid: false,
    message: "",
  });
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);

  // 로컬 상태로 시간 값 관리 (YouTube만)
  const [localStartTime, setLocalStartTime] = useState("");
  const [localEndTime, setLocalEndTime] = useState("");

  // item이 변경될 때 로컬 상태 동기화
  useEffect(() => {
    if (item.type === "media") {
      setLocalStartTime(item.startTime || "");
      setLocalEndTime(item.endTime || "");
    }
  }, [item.startTime, item.endTime]);

  // URL 실시간 검증
  useEffect(() => {
    if (item.type === "media" && item.mediaUrl) {
      const validation = validateUrlInRealTime(item.mediaUrl);
      setUrlValidation(validation);
    } else {
      setUrlValidation({ isValid: false, message: "" });
    }
  }, [item.mediaUrl, item.type]);

  // 이미지 선택 처리
  const handleImageSelect = (file) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("이미지 파일은 5MB를 초과할 수 없습니다.");
        return;
      }

      if (item.imagePreview) {
        URL.revokeObjectURL(item.imagePreview);
      }

      const imagePreview = URL.createObjectURL(file);
      onUpdate(item.id, {
        imageFile: file,
        imagePreview: imagePreview,
      });
    }
  };

  // 미디어 URL 변경 처리
  const handleMediaUrlChange = async (url) => {
    try {
      console.log("🔗 URL 처리 시작:", url);

      const validation = validateUrlInRealTime(url);
      setUrlValidation(validation);

      if (!validation.isValid && url.length > 10) {
        onUpdate(item.id, {
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

          onUpdate(item.id, updates);
        } catch (error) {
          console.error("❌ 플랫폼 감지 오류:", error);
          onUpdate(item.id, {
            mediaUrl: url,
            detectedPlatform: null,
            extractedData: null,
          });
        } finally {
          setIsProcessingUrl(false);
        }
      } else {
        onUpdate(item.id, {
          mediaUrl: url,
          detectedPlatform: null,
          extractedData: null,
        });
      }
    } catch (error) {
      console.error("❌ URL 처리 전체 오류:", error);
      setIsProcessingUrl(false);
      onUpdate(item.id, {
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
    setLocalStartTime(value);

    if (validateTimeInput(value) || value === "") {
      onUpdate(item.id, {
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
    setLocalEndTime(value);

    if (validateTimeInput(value) || value === "") {
      onUpdate(item.id, {
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
      item.urlDetectedStartTime || item.extractedData?.startTime;
    if (urlStartTime > 0) {
      const formattedTime = secondsToTimeFormat(urlStartTime);
      setLocalStartTime(formattedTime);
      onUpdate(item.id, {
        startTime: formattedTime,
        userTimeOverride: true,
      });
    }
  };

  // 사용자 시간 설정 초기화
  const clearUserTimeSettings = () => {
    setLocalStartTime("");
    setLocalEndTime("");
    onUpdate(item.id, {
      startTime: "",
      endTime: "",
      userTimeOverride: false,
    });
  };

  // URL 상태 아이콘
  const getUrlStatusIcon = () => {
    if (isProcessingUrl) {
      return (
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      );
    }

    if (!item.mediaUrl) return null;

    if (urlValidation.isValid) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (item.mediaUrl.length > 5) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }

    return null;
  };

  // 시간 정보 계산
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
    item.extractedData?.startTime > 0 || item.urlDetectedStartTime > 0;
  const hasUserTimeSettings = localStartTime || localEndTime;

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {item.type === "image" ? (
            <>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Image className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-white font-medium">이미지</h4>
                <p className="text-gray-400 text-xs">JPG, PNG, GIF 파일</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Link className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-white font-medium">외부 링크</h4>
                <p className="text-gray-400 text-xs">
                  YouTube, TikTok, Instagram
                </p>
              </div>
            </>
          )}
        </div>

        {canRemove && (
          <button
            onClick={() => onRemove(item.id)}
            className="p-2 text-red-400 hover:text-red-300 transition-colors hover:bg-red-500/10 rounded"
            title="콘텐츠 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 이미지 업로드 */}
      {item.type === "image" && (
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageSelect(e.target.files?.[0])}
            className="hidden"
            id={`image-${item.id}`}
          />
          <label
            htmlFor={`image-${item.id}`}
            className="block border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-pink-500 transition-colors cursor-pointer bg-gray-800/50"
          >
            {item.imagePreview ? (
              <img
                src={item.imagePreview}
                alt="Preview"
                className="w-full h-32 object-cover rounded-md"
              />
            ) : (
              <div className="flex flex-col items-center">
                <Image className="w-10 h-10 text-gray-500 mb-2" />
                <p className="text-gray-400 text-sm">이미지 업로드</p>
                <p className="text-gray-600 text-xs mt-1">(최대 5MB)</p>
              </div>
            )}
          </label>
        </div>
      )}

      {/* 미디어 URL 입력 */}
      {item.type === "media" && (
        <div className="space-y-4">
          <div>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="url"
                value={item.mediaUrl || ""}
                onChange={(e) => handleMediaUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... 또는 TikTok, Instagram URL"
                className={`w-full pl-12 pr-12 py-3 bg-gray-800 text-white rounded-lg border transition-colors ${
                  urlValidation.isValid
                    ? "border-green-500 focus:border-green-400"
                    : item.mediaUrl &&
                      !urlValidation.isValid &&
                      item.mediaUrl.length > 5
                    ? "border-red-500 focus:border-red-400"
                    : "border-gray-700 focus:border-pink-500"
                } focus:outline-none`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getUrlStatusIcon()}
              </div>
            </div>

            {/* URL 검증 메시지 */}
            {item.mediaUrl && urlValidation.message && (
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
            {item.detectedPlatform && (
              <div className="mt-2 flex items-center gap-2">
                {item.detectedPlatform === "youtube" && (
                  <>
                    <Youtube className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-400">
                      YouTube 동영상이 감지되었습니다
                      {item.extractedData?.isLive && (
                        <span className="ml-1 text-xs bg-red-600/20 text-red-300 px-2 py-1 rounded">
                          (라이브)
                        </span>
                      )}
                      {item.extractedData?.isShorts && (
                        <span className="ml-1 text-xs bg-red-600/20 text-red-300 px-2 py-1 rounded">
                          (Shorts)
                        </span>
                      )}
                    </span>
                    {hasUrlDetectedTime && (
                      <span className="text-xs text-blue-400 ml-2">
                        (URL에서 시작시간{" "}
                        {secondsToTimeFormat(
                          item.urlDetectedStartTime ||
                            item.extractedData.startTime
                        )}{" "}
                        감지됨)
                      </span>
                    )}
                  </>
                )}
                {item.detectedPlatform === "tiktok" && (
                  <>
                    <Play className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-purple-400">
                      TikTok 동영상이 감지되었습니다
                    </span>
                  </>
                )}
                {item.detectedPlatform === "instagram" && (
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

          {/* YouTube 시간 설정 */}
          {item.detectedPlatform === "youtube" && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-400" />
                <h4 className="text-blue-300 font-medium">재생 구간 설정</h4>

                {/* 라이브 스트림 안내 */}
                {item.extractedData?.isLive && (
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
                      item.urlDetectedStartTime || item.extractedData.startTime
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
                  <p className="text-xs text-gray-500 mt-1">
                    비워두면 끝까지 재생
                  </p>
                </div>
              </div>

              {/* 시간 정보 표시 */}
              {timeInfo && (
                <div className="mt-4 bg-gray-800/50 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    재생 정보{" "}
                    {item.userTimeOverride && (
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
                        <span className="text-red-400 ml-1">
                          {localEndTime}
                        </span>
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
                    • YouTube URL에 &t=30s가 있어도 위에서 설정한 시간이
                    사용됩니다
                  </li>
                  <li>• 시작시간만 설정하면 해당 시점부터 끝까지 재생</li>
                  <li>• 둘 다 설정하면 지정된 구간만 재생</li>
                  {item.extractedData?.isLive && (
                    <li>
                      • <strong>라이브 스트림:</strong> 실시간 방송이므로 시간
                      설정이 제한적으로 적용됩니다
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 콘텐츠 상태 표시 */}
      <div className="mt-4 flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
        <div className="flex items-center gap-2">
          {item.type === "image" ? (
            <>
              <Image className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">
                {item.imageFile ? "이미지 업로드됨" : "이미지 파일 필요"}
              </span>
            </>
          ) : (
            <>
              <Link className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">
                {item.detectedPlatform
                  ? `${
                      item.detectedPlatform.charAt(0).toUpperCase() +
                      item.detectedPlatform.slice(1)
                    } 링크 분석됨`
                  : item.mediaUrl
                  ? "링크 분석 중..."
                  : "링크 URL 필요"}
              </span>
            </>
          )}
        </div>

        <div className="text-right">
          {item.type === "image" ? (
            item.imageFile ? (
              <span className="text-green-400 text-xs font-medium">
                ✓ 준비됨
              </span>
            ) : (
              <span className="text-yellow-400 text-xs font-medium">
                ⚠️ 파일 필요
              </span>
            )
          ) : item.detectedPlatform ? (
            <span className="text-green-400 text-xs font-medium">
              ✓ 분석 완료
            </span>
          ) : item.mediaUrl ? (
            <span className="text-yellow-400 text-xs font-medium">
              ⏳ 분석 중
            </span>
          ) : (
            <span className="text-gray-400 text-xs font-medium">URL 필요</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentItem;
