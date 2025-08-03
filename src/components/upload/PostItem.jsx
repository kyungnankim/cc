// upload/PostItem.jsx
import React from "react";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import PostContent from "./PostContent";

const PostItem = ({ post, index, updatePost, removePost, toggleExpansion }) => {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700">
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
            onClick={toggleExpansion}
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
      {post.isExpanded && <PostContent post={post} updatePost={updatePost} />}
    </div>
  );
};

export default PostItem;
