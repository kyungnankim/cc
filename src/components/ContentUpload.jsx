// ContentUpload.jsx - 완전한 최종 수정 버전
import React, { useState } from "react";
import {
  X,
  Image,
  Music,
  Shirt,
  Pizza,
  Loader2,
  Link,
  Youtube,
  Instagram,
  Play,
  Clock,
  SkipForward,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Firebase imports - 직접 import 방식으로 변경
import { auth, db } from "../firebase/config";
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";

const ContentUpload = ({ onClose }) => {
  const [category, setCategory] = useState("music");
  const [isUploading, setIsUploading] = useState(false);
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "",
      description: "",
      contentType: "image",
      mediaUrl: "",
      startTime: "",
      endTime: "",
      imageFile: null,
      imagePreview: "",
      extractedData: null,
      detectedPlatform: null,
      isExpanded: true,
    },
  ]);

  const categories = [
    { value: "music", label: "Music", icon: Music, color: "pink" },
    { value: "fashion", label: "Fashion", icon: Shirt, color: "purple" },
    { value: "food", label: "Food", icon: Pizza, color: "orange" },
  ];

  // URL에서 플랫폼 감지 및 데이터 추출
  const detectPlatformAndExtract = async (url) => {
    if (!url) return null;

    try {
      console.log("🔍 플랫폼 감지 시작:", url);
      
      // YouTube 감지
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const youtubeMatch = url.match(youtubeRegex);
      if (youtubeMatch) {
        const videoId = youtubeMatch[1];
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

      // TikTok 감지
      const tiktokRegex = /(?:tiktok\.com\/@[\w.-]+\/video\/(\d+)|tiktok\.com\/t\/(\w+)|vm\.tiktok\.com\/(\w+)|tiktok\.com\/v\/(\d+))/;
      const tiktokMatch = url.match(tiktokRegex);
      if (tiktokMatch) {
        const videoId = tiktokMatch[1] || tiktokMatch[2] || tiktokMatch[3] || tiktokMatch[4];
        const userMatch = url.match(/@([\w.-]+)/);
        const username = userMatch ? userMatch[1] : null;

        console.log("✅ TikTok 감지됨:", { videoId, username });

        // TikTok oEmbed API 시도
        try {
          const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
          const response = await fetch(oembedUrl, {
            method: "GET",
            headers: { "Accept": "application/json" },
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

  // 시간을 초로 변환
  const parseTimeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(":").reverse();
    let seconds = 0;
    if (parts[0]) seconds += parseInt(parts[0]) || 0;
    if (parts[1]) seconds += (parseInt(parts[1]) || 0) * 60;
    if (parts[2]) seconds += (parseInt(parts[2]) || 0) * 3600;
    return seconds;
  };

  // 초를 시간 형식으로 변환
  const secondsToTimeFormat = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // 게시물 관리 함수들
  const addNewPost = () => {
    const newPost = {
      id: Date.now(),
      title: "",
      description: "",
      contentType: "image",
      mediaUrl: "",
      startTime: "",
      endTime: "",
      imageFile: null,
      imagePreview: "",
      extractedData: null,
      detectedPlatform: null,
      isExpanded: true,
    };
    setPosts([...posts, newPost]);
  };

  const removePost = (postId) => {
    const postToRemove = posts.find((post) => post.id === postId);
    if (postToRemove && postToRemove.id === 1) {
      alert("첫 번째 게시물은 삭제할 수 없습니다.");
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (post && post.imagePreview) {
      URL.revokeObjectURL(post.imagePreview);
    }

    setPosts(posts.filter((post) => post.id !== postId));
  };

  const togglePostExpansion = (postId) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, isExpanded: !post.isExpanded } : post
      )
    );
  };

  const updatePost = (postId, updates) => {
    setPosts(
      posts.map((post) => (post.id === postId ? { ...post, ...updates } : post))
    );
  };

  // 이미지 선택 처리
  const handleImageSelect = (postId, file) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("이미지 파일은 5MB를 초과할 수 없습니다.");
        return;
      }

      const post = posts.find((p) => p.id === postId);
      if (post && post.imagePreview) {
        URL.revokeObjectURL(post.imagePreview);
      }

      const imagePreview = URL.createObjectURL(file);
      updatePost(postId, {
        imageFile: file,
        imagePreview: imagePreview,
      });
    }
  };

  // 미디어 URL 변경 처리
  const handleMediaUrlChange = async (postId, url) => {
    try {
      console.log("🔗 URL 처리 시작:", url);
      const detected = await detectPlatformAndExtract(url);
      
      const updates = {
        mediaUrl: url,
        detectedPlatform: detected?.platform || null,
        extractedData: detected,
      };

      // YouTube URL에서 시작 시간이 감지되면 자동으로 설정
      if (detected?.platform === "youtube" && detected.startTime > 0) {
        updates.startTime = secondsToTimeFormat(detected.startTime);
      }

      console.log("📝 게시물 업데이트:", updates);
      updatePost(postId, updates);
    } catch (error) {
      console.error("❌ URL 처리 오류:", error);
      updatePost(postId, {
        mediaUrl: url,
        detectedPlatform: null,
        extractedData: null,
      });
    }
  };

  // 콘텐츠 타입 변경 처리
  const handleContentTypeChange = (postId, type) => {
    const post = posts.find((p) => p.id === postId);
    const updates = { contentType: type };

    if (type !== "image") {
      if (post.imagePreview) {
        URL.revokeObjectURL(post.imagePreview);
      }
      updates.imageFile = null;
      updates.imagePreview = "";
    }

    if (type !== "media") {
      updates.mediaUrl = "";
      updates.startTime = "";
      updates.endTime = "";
      updates.detectedPlatform = null;
      updates.extractedData = null;
    }

    updatePost(postId, updates);
  };

  // 미리보기 콘텐츠 렌더링
  const renderPreviewContent = (post) => {
    if (post.contentType === "image" && post.imagePreview) {
      return (
        <img
          src={post.imagePreview}
          alt="Preview"
          className="w-full h-32 object-cover rounded-md"
        />
      );
    }

    if (post.contentType === "media" && post.extractedData) {
      const { platform } = post.extractedData;

      if (platform === "youtube") {
        return (
          <div className="relative">
            <img
              src={post.extractedData.thumbnailUrl}
              alt="YouTube thumbnail"
              className="w-full h-32 object-cover rounded-md"
              onError={(e) => {
                e.target.src = `https://img.youtube.com/vi/${post.extractedData.videoId}/hqdefault.jpg`;
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md">
              <div className="bg-red-600 rounded-full p-2">
                <Youtube className="w-4 h-4 text-white" />
              </div>
            </div>
            {(post.startTime || post.endTime) && (
              <div className="absolute bottom-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                {post.startTime && `${post.startTime}`}
                {post.startTime && post.endTime && " ~ "}
                {post.endTime && `${post.endTime}`}
              </div>
            )}
          </div>
        );
      }

      if (platform === "tiktok") {
        const username = post.extractedData?.username || post.extractedData?.authorName;
        const title = post.extractedData?.title || "TikTok 동영상";
        const thumbnailUrl = post.extractedData?.thumbnailUrl;

        return (
          <div className="relative">
            {thumbnailUrl ? (
              <div className="w-full h-32 bg-gray-800 rounded-md overflow-hidden">
                <img
                  src={thumbnailUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div
                  className="w-full h-32 bg-gradient-to-br from-red-500 via-purple-500 to-blue-500 rounded-md items-center justify-center"
                  style={{ display: "none" }}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                      <span className="text-black font-bold text-2xl">T</span>
                    </div>
                    <div className="text-white font-bold text-sm drop-shadow-lg">
                      TikTok
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-32 bg-gradient-to-br from-red-500 via-purple-500 to-blue-500 rounded-md flex items-center justify-center overflow-hidden">
                <div className="text-center relative z-10">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <span className="text-black font-bold text-2xl">T</span>
                  </div>
                  <div className="text-white font-bold text-sm drop-shadow-lg">
                    TikTok
                  </div>
                  {username && (
                    <div className="text-white/90 text-xs mt-1 bg-black/30 px-2 py-1 rounded-full">
                      @{username}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="bg-red-600 hover:bg-red-700 rounded-full p-3 transition-all transform hover:scale-110 shadow-lg">
                <Play className="w-6 h-6 text-white fill-current ml-0.5" />
              </div>
            </div>

          {/* 게시물 목록 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                게시물 ({posts.length}개)
              </h3>
              <button
                onClick={addNewPost}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                게시물 추가
              </button>
            </div>

            {posts.map((post, index) => (
              <div
                key={post.id}
                className="bg-gray-800/50 rounded-xl border border-gray-700"
              >
                {/* 게시물 헤더 */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="bg-gray-700 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <h4 className="text-white font-medium">
                      {post.title || `게시물 ${index + 1}`}
                    </h4>
                    {post.detectedPlatform && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded capitalize">
                        {post.detectedPlatform}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePostExpansion(post.id)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      {post.isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {/* 첫 번째 게시물(id: 1)이 아닌 경우에만 삭제 버튼 표시 */}
                    {post.id !== 1 && (
                      <button
                        onClick={() => removePost(post.id)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors hover:bg-red-500/10 rounded"
                        title="게시물 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 게시물 내용 */}
                {post.isExpanded && (
                  <div className="p-4 space-y-4">
                    {/* 제목 */}
                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-2 block">
                        제목 *
                      </label>
                      <input
                        type="text"
                        value={post.title}
                        onChange={(e) =>
                          updatePost(post.id, { title: e.target.value })
                        }
                        placeholder="콘텐츠 제목"
                        className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* 콘텐츠 타입 선택 */}
                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-3 block">
                        콘텐츠 타입
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() =>
                            handleContentTypeChange(post.id, "image")
                          }
                          className={`p-4 rounded-lg border-2 transition-all ${
                            post.contentType === "image"
                              ? "border-blue-500 bg-blue-500/20 text-white"
                              : "border-gray-700 text-gray-400 hover:border-gray-600"
                          }`}
                        >
                          <Image className="w-6 h-6 mx-auto mb-2" />
                          <span className="text-sm font-medium">이미지</span>
                        </button>

                        <button
                          onClick={() =>
                            handleContentTypeChange(post.id, "media")
                          }
                          className={`p-4 rounded-lg border-2 transition-all ${
                            post.contentType === "media"
                              ? "border-blue-500 bg-blue-500/20 text-white"
                              : "border-gray-700 text-gray-400 hover:border-gray-600"
                          }`}
                        >
                          <Link className="w-6 h-6 mx-auto mb-2" />
                          <span className="text-sm font-medium">외부 링크</span>
                        </button>
                      </div>
                    </div>

                    {/* 이미지 업로드 */}
                    {post.contentType === "image" && (
                      <div>
                        <label className="text-gray-300 text-sm font-medium mb-2 block">
                          이미지 *
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageSelect(post.id, e.target.files?.[0])
                          }
                          className="hidden"
                          id={`image-${post.id}`}
                        />
                        <label
                          htmlFor={`image-${post.id}`}
                          className="block border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-pink-500 transition-colors cursor-pointer bg-gray-800/50"
                        >
                          {renderPreviewContent(post) || (
                            <div className="flex flex-col items-center">
                              <Image className="w-10 h-10 text-gray-500 mb-2" />
                              <p className="text-gray-400 text-sm">
                                이미지 업로드
                              </p>
                              <p className="text-gray-600 text-xs mt-1">
                                (최대 5MB)
                              </p>
                            </div>
                          )}
                        </label>
                      </div>
                    )}

                    {/* 미디어 URL 입력 */}
                    {post.contentType === "media" && (
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
                              onChange={(e) =>
                                handleMediaUrlChange(post.id, e.target.value)
                              }
                              placeholder="https://www.youtube.com/watch?v=... 또는 TikTok, Instagram URL"
                              className="w-full pl-12 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none transition-colors"
                            />
                          </div>

                          {/* 플랫폼 감지 표시 */}
                          {post.detectedPlatform && (
                            <div className="mt-2 flex items-center gap-2">
                              {post.detectedPlatform === "youtube" && (
                                <>
                                  <Youtube className="w-4 h-4 text-red-500" />
                                  <span className="text-sm text-red-400">
                                    YouTube 동영상이 감지되었습니다
                                  </span>
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

                        {/* YouTube 시간 설정 */}
                        {post.detectedPlatform === "youtube" && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-gray-300 text-sm font-medium mb-2 block flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                시작 시간 (선택)
                              </label>
                              <input
                                type="text"
                                value={post.startTime}
                                onChange={(e) =>
                                  updatePost(post.id, {
                                    startTime: e.target.value,
                                  })
                                }
                                placeholder="0:30 또는 1:05:30"
                                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none transition-colors"
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
                                value={post.endTime}
                                onChange={(e) =>
                                  updatePost(post.id, {
                                    endTime: e.target.value,
                                  })
                                }
                                placeholder="3:45 또는 1:08:15"
                                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none transition-colors"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                비워두면 끝까지 재생
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 미리보기 */}
                        {renderPreviewContent(post) && (
                          <div className="border-2 border-gray-700 rounded-lg p-4 bg-gray-800/30">
                            <h4 className="text-sm font-medium text-gray-300 mb-3">
                              미리보기
                            </h4>
                            {renderPreviewContent(post)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 설명 */}
                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-2 block">
                        설명 (선택)
                      </label>
                      <textarea
                        value={post.description}
                        onChange={(e) =>
                          updatePost(post.id, { description: e.target.value })
                        }
                        placeholder="콘텐츠에 대한 간단한 설명"
                        rows="3"
                        className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none transition-colors resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 하단 버튼 */}
          <div className="flex gap-4 pt-4 border-t border-gray-800">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  업로드 중...
                </>
              ) : (
                `${posts.length}개 콘텐츠 등록하기`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentUpload;  <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-blue-500 rounded-full"></div>
              TikTok
            </div>

            <div className="absolute bottom-2 left-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
              <div className="truncate font-medium">{title}</div>
              {username && (
                <div className="text-white/70 text-[10px] truncate mt-0.5">
                  @{username}
                </div>
              )}
            </div>
          </div>
        );
      }

      if (platform === "instagram") {
        return (
          <div className="w-full h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
            <Instagram className="w-6 h-6 text-white" />
          </div>
        );
      }
    }

    return null;
  };

  // 폼 유효성 검사
  const validateForm = () => {
    for (const post of posts) {
      if (!post.title.trim()) {
        alert("모든 게시물의 제목을 입력해주세요.");
        return false;
      }

      if (post.contentType === "image" && !post.imageFile) {
        alert("이미지를 선택해주세요.");
        return false;
      }

      if (post.contentType === "media") {
        if (!post.mediaUrl.trim()) {
          alert("미디어 URL을 입력해주세요.");
          return false;
        }
        if (!post.detectedPlatform) {
          alert("지원하지 않는 플랫폼입니다. YouTube, TikTok, Instagram URL을 입력해주세요.");
          return false;
        }

        // 시간 유효성 검사 (YouTube만)
        if (post.detectedPlatform === "youtube" && (post.startTime || post.endTime)) {
          const startSeconds = parseTimeToSeconds(post.startTime);
          const endSeconds = parseTimeToSeconds(post.endTime);

          if (post.endTime && endSeconds <= startSeconds) {
            alert("종료 시간은 시작 시간보다 늦어야 합니다.");
            return false;
          }
        }
      }
    }
    return true;
  };

  // Cloudinary 이미지 업로드
  const uploadImageToCloudinary = async (imageFile) => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "battle_seoul_preset"
    );

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dcxbv1xno"
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

  // 단일 콘텐츠 업로드 함수
  const uploadSingleContent = async (postData) => {
    try {
      console.log("🚀 콘텐츠 업로드 시작:", postData.title);
      
      // Firebase 인증 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("로그인이 필요합니다.");
      }

      let imageUrl = null;
      let extractedData = null;
      let platform = "image";

      if (postData.contentType === "image" && postData.imageFile) {
        // 이미지 업로드
        console.log("📸 이미지 업로드 중...");
        imageUrl = await uploadImageToCloudinary(postData.imageFile);
        if (!imageUrl) {
          throw new Error("이미지 업로드에 실패했습니다.");
        }
        platform = "image";
        console.log("✅ 이미지 업로드 완료:", imageUrl);
      } else if (postData.contentType === "media" && postData.mediaUrl) {
        // 미디어 URL 처리
        console.log("🎬 미디어 URL 처리 중:", postData.mediaUrl);
        extractedData = await detectPlatformAndExtract(postData.mediaUrl);
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

      // 시간 설정 처리 (YouTube만)
      const timeSettings = {
        startTime: parseTimeToSeconds(postData.startTime),
        endTime: parseTimeToSeconds(postData.endTime),
        startTimeDisplay: postData.startTime || "",
        endTimeDisplay: postData.endTime || "",
      };

      console.log("⏰ 시간 설정:", timeSettings);

      // Firestore에 저장할 데이터
      const contenderData = {
        creatorId: currentUser.uid,
        creatorName:
          currentUser.displayName || currentUser.email?.split("@")[0] || "익명",
        title: postData.title,
        description: postData.description || "",
        imageUrl: imageUrl,
        category: category,
        status: "available",
        createdAt: serverTimestamp(),

        // 플랫폼 및 미디어 정보
        platform: platform,
        contentType: postData.contentType || "image",

        // 추출된 미디어 데이터
        ...(extractedData && {
          extractedData: extractedData,
          mediaUrl: postData.mediaUrl,
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

        // 시간 설정 (YouTube만 해당)
        ...(platform === "youtube" &&
          (timeSettings.startTime > 0 || timeSettings.endTime > 0) && {
            timeSettings: timeSettings,
          }),

        likeCount: 0,
        viewCount: 0,
        tags: [],
        battleCount: 0,
        updatedAt: serverTimestamp(),
        isActive: true,
      };

      console.log("💾 Firestore 저장 데이터:", contenderData);

      // Firestore에 문서 추가
      const docRef = await addDoc(collection(db, "contenders"), contenderData);

      console.log("✅ Firestore 저장 완료! 문서 ID:", docRef.id);

      return {
        success: true,
        contenderId: docRef.id,
        imageUrl: imageUrl,
        platform: platform,
        contentType: postData.contentType,
        extractedData: extractedData,
        timeSettings: platform === "youtube" ? timeSettings : null,
      };
    } catch (error) {
      console.error("❌ 콘텐츠 업로드 오류:", error);

      let errorMessage = error.message;
      if (error.code) {
        switch (error.code) {
          case "permission-denied":
            errorMessage = "권한이 없습니다. 관리자에게 문의하세요.";
            break;
          case "unavailable":
            errorMessage = "데이터베이스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.";
            break;
          case "invalid-argument":
            errorMessage = "잘못된 데이터입니다. 입력 정보를 확인해주세요.";
            break;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // 폼 제출
  const handleSubmit = async () => {
    console.log("📝 폼 제출 시작...");
    
    if (!validateForm()) {
      console.log("❌ 폼 유효성 검사 실패");
      return;
    }

    setIsUploading(true);
    try {
      const results = [];
      const errors = [];

      console.log(`🚀 ${posts.length}개 게시물 업로드 시작...`);

      // 각 게시물을 순차적으로 업로드
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        try {
          console.log(`📤 게시물 ${i + 1}/${posts.length} 업로드:`, post.title);
          const result = await uploadSingleContent(post);
          
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
          console.error(`❌ 게시물 ${i + 1} 업로드 예외:`, error);
          errors.push({
            postIndex: i + 1,
            title: post.title,
            error: error.message,
          });
        }
      }

      const successCount = results.length;
      const totalCount = posts.length;

      console.log(`🎯 업로드 완료: ${successCount}/${totalCount} 성공`);

      if (errors.length === 0) {
        alert(`✅ ${successCount}개의 콘텐츠가 성공적으로 업로드되었습니다!`);
        onClose();
      } else {
        alert(
          `${successCount}개 성공, ${errors.length}개 실패\n\n실패 목록:\n${errors
            .map((e) => `- ${e.title}: ${e.error}`)
            .join("\n")}`
        );
        
        // 성공한 경우가 있으면 성공한 것으로 간주하고 모달 닫기
        if (successCount > 0) {
          onClose();
        }
      }
    } catch (error) {
      console.error("❌ 전체 업로드 실패:", error);
      alert("업로드에 실패했습니다: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
        >
          <X />
        </button>

        <div className="text-center p-6 border-b border-gray-800">
          <h2 className="text-3xl font-bold text-white">콘텐츠 업로드</h2>
          <p className="text-gray-400 mt-2">
            배틀에 사용할 콘텐츠를 등록하세요.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* 카테고리 선택 */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-3 block">
              카테고리 선택
            </label>
            <div className="grid grid-cols-3 gap-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      category === cat.value
                        ? `border-${cat.color}-500 bg-${cat.color}-500/20 text-white`
                        : "border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>