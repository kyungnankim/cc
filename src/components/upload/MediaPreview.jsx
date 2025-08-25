// upload/MediaPreview.jsx
import React from "react";
import { Youtube, Instagram, Play } from "lucide-react";

const MediaPreview = ({ post }) => {
  if (!post.extractedData) return null;

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
    const username =
      post.extractedData?.username || post.extractedData?.authorName;
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

        <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
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

  return null;
};

export default MediaPreview;
