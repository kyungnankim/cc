// src/components/BattleDetail/BattleComments.jsx - 배틀 댓글 (수정 완료)

import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  Send,
  Heart,
  Reply,
  MoreVertical,
  Flag,
  Trash2,
  Clock,
  Loader2,
} from "lucide-react";
import {
  getComments,
  addComment,
  likeComment,
  deleteComment,
  reportComment,
} from "../../services/commentService";
import toast from "react-hot-toast";

const BattleComments = ({ battle, user, onBattleUpdate, onNavigate }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState("latest");
  const [showDropdown, setShowDropdown] = useState(null);

  useEffect(() => {
    loadComments();
  }, [battle.id, sortBy]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const result = await getComments(battle.id, sortBy);
      if (result.success) {
        setComments(result.comments);
      }
    } catch (error) {
      console.error("댓글 로드 오류:", error);
      toast.error("댓글을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    // 🔧 기본 검증 강화
    if (!user) {
      toast.error("댓글을 작성하려면 로그인이 필요합니다.");
      onNavigate("/login");
      return;
    }

    if (!newComment.trim()) {
      toast.error("댓글 내용을 입력해주세요.");
      return;
    }

    if (newComment.length > 500) {
      toast.error("댓글은 500자를 초과할 수 없습니다.");
      return;
    }

    setIsSubmitting(true);

    // 🔧 낙관적 업데이트용 임시 댓글
    const tempId = `temp_${Date.now()}`;
    const tempComment = {
      id: tempId,
      content: newComment.trim(),
      createdAt: new Date(),
      likes: 0,
      isLiked: false,
      userId: user.uid,
      userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
      userAvatar: user.photoURL || "/images/default.jpg",
      replies: [],
      likedBy: [],
      isDeleted: false,
      parentId: replyTo?.id || null,
    };

    // UI 즉시 업데이트
    setComments((prev) => [tempComment, ...prev]);
    setNewComment("");
    const currentReplyTo = replyTo;
    setReplyTo(null);

    try {
      console.log("댓글 작성 시도:", {
        battleId: battle.id,
        content: tempComment.content,
        parentId: currentReplyTo?.id || null,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        },
      });

      // 🔧 서비스 호출 (사용자 정보는 서비스에서 처리)
      const result = await addComment(battle.id, {
        content: tempComment.content,
        parentId: currentReplyTo?.id || null,
        // 사용자 정보는 commentService에서 auth를 통해 직접 가져옴
      });

      if (result.success) {
        toast.success("댓글이 작성되었습니다!");

        // 임시 댓글을 실제 댓글 데이터로 교체
        setComments((prev) =>
          prev.map((c) =>
            c.id === tempId
              ? { ...result.comment, isLiked: false } // isLiked 추가
              : c
          )
        );

        // 배틀 정보 업데이트
        if (onBattleUpdate) {
          onBattleUpdate({
            ...battle,
            commentCount: (battle.commentCount || 0) + 1,
            commentsCount: (battle.commentsCount || 0) + 1,
          });
        }
      } else {
        throw new Error(
          result.error || "서버에서 댓글을 추가하는데 실패했습니다."
        );
      }
    } catch (error) {
      console.error("댓글 작성 오류:", error);

      // 🔧 구체적인 에러 메시지
      let errorMessage = "댓글 작성에 실패했습니다.";

      if (error.message.includes("로그인이 필요합니다")) {
        errorMessage = "다시 로그인해주세요.";
        onNavigate("/login");
      } else if (error.message.includes("invalid data")) {
        errorMessage =
          "댓글 데이터에 문제가 있습니다. 새로고침 후 다시 시도해주세요.";
      } else if (error.message.includes("permission")) {
        errorMessage = "댓글 작성 권한이 없습니다.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);

      // 실패한 임시 댓글 제거
      setComments((prev) => prev.filter((c) => c.id !== tempId));

      // 입력 내용 복원
      setNewComment(tempComment.content);
      setReplyTo(currentReplyTo);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      toast.error("좋아요를 누르려면 로그인이 필요합니다.");
      onNavigate("/login");
      return;
    }

    const originalComments = [...comments];
    const commentIndex = comments.findIndex((c) => c.id === commentId);
    if (commentIndex === -1) return;

    const comment = comments[commentIndex];
    const isLiked = !comment.isLiked;
    const newLikes = isLiked
      ? (comment.likes || 0) + 1
      : Math.max(0, (comment.likes || 0) - 1);

    // 낙관적 업데이트
    const updatedComments = [...comments];
    updatedComments[commentIndex] = { ...comment, isLiked, likes: newLikes };
    setComments(updatedComments);

    try {
      const result = await likeComment(commentId, user.uid);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
      toast.error("좋아요 처리에 실패했습니다.");
      // 원래 상태로 복구
      setComments(originalComments);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    const originalComments = [...comments];

    // 낙관적 업데이트: 댓글 즉시 제거
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));

    try {
      const result = await deleteComment(commentId, user.uid);
      if (result.success) {
        toast.success("댓글이 삭제되었습니다.");
        if (onBattleUpdate) {
          onBattleUpdate({
            ...battle,
            commentCount: Math.max(0, (battle.commentCount || 1) - 1),
            commentsCount: Math.max(0, (battle.commentsCount || 1) - 1),
          });
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      toast.error(error.message || "댓글 삭제에 실패했습니다.");
      // 실패 시 원래 상태로 복구
      setComments(originalComments);
    }
    setShowDropdown(null);
  };

  const handleReportComment = async (commentId) => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    try {
      const result = await reportComment(commentId, user.uid);
      if (result.success) {
        toast.success("신고가 접수되었습니다.");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("신고 처리 오류:", error);
      toast.error(error.message || "신고 처리에 실패했습니다.");
    }
    setShowDropdown(null);
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const commentDate = date instanceof Date ? date : new Date(date);
    const diffInMinutes = Math.floor((now - commentDate) / (1000 * 60));

    if (diffInMinutes < 1) return "방금 전";
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}일 전`;
    return commentDate.toLocaleDateString("ko-KR");
  };

  const getBadgeForUser = (comment) => {
    if (comment.userId === battle.creatorId) {
      return { text: "작성자", color: "bg-purple-500" };
    }
    return null;
  };

  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold">
            댓글 <span className="text-blue-400">({comments.length})</span>
          </h2>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
          <option value="oldest">오래된순</option>
        </select>
      </div>

      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmitComment} className="mb-8">
        {replyTo && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Reply className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400">
                  {replyTo.userName}님에게 답글 작성 중
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-1 truncate">
              {replyTo.content}
            </p>
          </div>
        )}
        <div className="flex gap-3">
          <img
            src={user?.photoURL || "/images/default.jpg"}
            alt="내 프로필"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                replyTo ? "답글을 작성해주세요..." : "댓글을 작성해주세요..."
              }
              className="w-full bg-gray-700 text-white p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">
                {newComment.length}/500
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors w-32"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {replyTo ? "답글 작성" : "댓글 작성"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
            <p className="text-gray-400 mt-2">댓글을 불러오는 중...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">첫 댓글을 작성해보세요!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-700/30 rounded-xl p-4">
              <div className="flex gap-3">
                <img
                  src={comment.userAvatar || "/images/default.jpg"}
                  alt={comment.userName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-white">
                      {comment.userName}
                    </span>
                    {getBadgeForUser(comment) && (
                      <span
                        className={`${
                          getBadgeForUser(comment).color
                        } text-white text-xs px-2 py-1 rounded-full`}
                      >
                        {getBadgeForUser(comment).text}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(comment.createdAt)}
                    </div>
                    {/* 더보기 메뉴 */}
                    <div className="ml-auto relative">
                      <button
                        onClick={() =>
                          setShowDropdown(
                            showDropdown === comment.id ? null : comment.id
                          )
                        }
                        className="text-gray-400 hover:text-white p-1"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {showDropdown === comment.id && (
                        <div className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-10 min-w-32">
                          {user && comment.userId === user.uid ? (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-gray-700 rounded-t-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                              삭제
                            </button>
                          ) : (
                            user && (
                              <button
                                onClick={() => handleReportComment(comment.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-yellow-400 hover:bg-gray-700 rounded-lg"
                              >
                                <Flag className="w-4 h-4" />
                                신고
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 댓글 내용 */}
                  <p className="text-gray-300 mb-3 leading-relaxed">
                    {comment.content}
                  </p>

                  {/* 액션 버튼들 */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      disabled={!user}
                      className={`flex items-center gap-1 text-sm transition-colors ${
                        comment.isLiked
                          ? "text-red-400"
                          : "text-gray-400 hover:text-red-400"
                      } ${!user ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          comment.isLiked ? "fill-current" : ""
                        }`}
                      />
                      {comment.likes || 0}
                    </button>
                    <button
                      onClick={() =>
                        setReplyTo({
                          id: comment.id,
                          userName: comment.userName,
                          content: comment.content,
                        })
                      }
                      disabled={!user}
                      className={`flex items-center gap-1 text-sm transition-colors ${
                        user
                          ? "text-gray-400 hover:text-blue-400"
                          : "text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <Reply className="w-4 h-4" />
                      답글
                    </button>
                  </div>

                  {/* 답글 목록 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-600">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <img
                            src={reply.userAvatar || "/images/default.jpg"}
                            alt={reply.userName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white text-sm">
                                {reply.userName}
                              </span>
                              <div className="flex items-center gap-1 text-gray-400 text-xs">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(reply.createdAt)}
                              </div>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BattleComments;
