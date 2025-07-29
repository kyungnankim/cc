// src/services/commentService.js - 댓글 관련 서비스 (수정완료)

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase/config"; // auth 추가

// 댓글 컬렉션 이름
const COMMENTS_COLLECTION = "comments";
const COMMENT_LIKES_COLLECTION = "commentLikes";
const COMMENT_REPORTS_COLLECTION = "commentReports";

/**
 * 배틀의 댓글 목록 가져오기
 */
// commentService.js - getComments 함수에서 답글 부분만 수정

export const getComments = async (battleId, sortBy = "latest") => {
  try {
    let q;
    const commentsRef = collection(db, COMMENTS_COLLECTION);

    // 기본 댓글 조회 (변경 없음)
    switch (sortBy) {
      case "popular":
        q = query(
          commentsRef,
          where("battleId", "==", battleId),
          where("parentId", "==", null),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        break;
      case "oldest":
        q = query(
          commentsRef,
          where("battleId", "==", battleId),
          where("parentId", "==", null),
          orderBy("createdAt", "asc"),
          limit(50)
        );
        break;
      default: // latest
        q = query(
          commentsRef,
          where("battleId", "==", battleId),
          where("parentId", "==", null),
          orderBy("createdAt", "desc"),
          limit(50)
        );
    }

    const querySnapshot = await getDocs(q);
    const comments = [];

    for (const docSnapshot of querySnapshot.docs) {
      const comment = {
        id: docSnapshot.id,
        ...docSnapshot.data(),
        createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnapshot.data().updatedAt?.toDate() || new Date(),
      };

      // 🔧 답글 조회 부분 수정 - 인덱스 에러 방지
      try {
        // 단순한 쿼리 사용 (정렬 제거)
        const repliesQuery = query(
          commentsRef,
          where("parentId", "==", comment.id),
          limit(20)
        );

        const repliesSnapshot = await getDocs(repliesQuery);
        let replies = repliesSnapshot.docs.map((replyDoc) => ({
          id: replyDoc.id,
          ...replyDoc.data(),
          createdAt: replyDoc.data().createdAt?.toDate() || new Date(),
        }));

        // 🔧 클라이언트에서 정렬 (인덱스 불필요)
        replies.sort((a, b) => a.createdAt - b.createdAt);

        comment.replies = replies;
      } catch (replyError) {
        console.warn(`답글 조회 실패 (commentId: ${comment.id}):`, replyError);
        comment.replies = []; // 답글 조회 실패 시 빈 배열
      }

      comments.push(comment);
    }

    console.log(`댓글 조회 성공: ${comments.length}개`);

    return {
      success: true,
      comments,
    };
  } catch (error) {
    console.error("댓글 조회 오류:", error);

    // 🔧 완전 실패 시에도 빈 배열 반환 (UI 에러 방지)
    return {
      success: true, // 에러로 인한 UI 깨짐 방지
      comments: [],
      warning: "댓글을 불러오는 중 문제가 발생했습니다.",
    };
  }
};

/**
 * 댓글 추가 - 수정된 버전
 */
export const addComment = async (battleId, commentData) => {
  try {
    // 🔧 현재 사용자 확인
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("로그인이 필요합니다.");
    }

    // 🔧 사용자 정보를 직접 가져오기 (undefined 방지)
    let userData = null;
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        userData = userDoc.data();
      }
    } catch (error) {
      console.warn("사용자 문서 조회 실패, 기본 정보 사용:", error);
    }

    // 🔧 댓글 데이터 구성 (모든 필드 확실히 정의)
    const commentDoc = {
      battleId: battleId,
      content: commentData.content?.trim(),
      userId: currentUser.uid, // ✅ auth에서 직접 가져오기
      userName:
        userData?.displayName ||
        currentUser.displayName ||
        commentData.userName ||
        currentUser.email?.split("@")[0] ||
        "Anonymous",
      userAvatar:
        userData?.photoURL ||
        currentUser.photoURL ||
        commentData.userAvatar ||
        null,
      parentId: commentData.parentId || null,
      likes: 0,
      likedBy: [],
      replies: [],
      isDeleted: false,
      isReported: false,
      reportCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 🔧 데이터 검증
    if (!commentDoc.content || commentDoc.content.length === 0) {
      throw new Error("댓글 내용을 입력해주세요.");
    }

    if (commentDoc.content.length > 500) {
      throw new Error("댓글은 500자를 초과할 수 없습니다.");
    }

    console.log("댓글 데이터 확인:", commentDoc); // 디버깅용

    const docRef = await addDoc(
      collection(db, COMMENTS_COLLECTION),
      commentDoc
    );

    console.log("댓글 저장 성공:", docRef.id);

    // 배틀의 댓글 수 증가
    try {
      const battleRef = doc(db, "battles", battleId);
      await updateDoc(battleRef, {
        commentsCount: increment(1),
        lastCommentAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn("배틀 댓글 수 업데이트 실패:", error);
      // 배틀 업데이트 실패해도 댓글 작성은 성공으로 처리
    }

    // 답글인 경우 부모 댓글의 답글 수 증가
    if (commentData.parentId) {
      try {
        const parentCommentRef = doc(
          db,
          COMMENTS_COLLECTION,
          commentData.parentId
        );
        await updateDoc(parentCommentRef, {
          repliesCount: increment(1),
        });
      } catch (error) {
        console.warn("부모 댓글 답글 수 업데이트 실패:", error);
      }
    }

    // 🔧 생성된 댓글 데이터 반환 (UI 업데이트용)
    const createdComment = {
      id: docRef.id,
      ...commentDoc,
      createdAt: new Date(), // serverTimestamp 대신 현재 시간
      updatedAt: new Date(),
    };

    return {
      success: true,
      commentId: docRef.id,
      comment: createdComment, // UI에서 사용할 수 있도록 추가
    };
  } catch (error) {
    console.error("댓글 추가 오류:", error);
    throw error; // 에러를 다시 던져서 UI에서 처리하도록
  }
};

/**
 * 댓글 좋아요/좋아요 취소
 */
export const likeComment = async (commentId, userId) => {
  try {
    // 🔧 사용자 확인
    if (!userId) {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("로그인이 필요합니다.");
      }
      userId = currentUser.uid;
    }

    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentDoc = await getDoc(commentRef);

    if (!commentDoc.exists()) {
      throw new Error("댓글을 찾을 수 없습니다.");
    }

    const commentData = commentDoc.data();
    const likedBy = commentData.likedBy || [];
    const isCurrentlyLiked = likedBy.includes(userId);

    if (isCurrentlyLiked) {
      // 좋아요 취소
      await updateDoc(commentRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        isLiked: false,
      };
    } else {
      // 좋아요 추가
      await updateDoc(commentRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId),
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        isLiked: true,
      };
    }
  } catch (error) {
    console.error("댓글 좋아요 처리 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 댓글 수정
 */
export const updateComment = async (commentId, userId, newContent) => {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentDoc = await getDoc(commentRef);

    if (!commentDoc.exists()) {
      throw new Error("댓글을 찾을 수 없습니다.");
    }

    const commentData = commentDoc.data();

    // 작성자 확인
    if (commentData.userId !== userId) {
      throw new Error("댓글을 수정할 권한이 없습니다.");
    }

    await updateDoc(commentRef, {
      content: newContent,
      isEdited: true,
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("댓글 수정 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 댓글 삭제
 */
export const deleteComment = async (commentId, userId) => {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentDoc = await getDoc(commentRef);

    if (!commentDoc.exists()) {
      throw new Error("댓글을 찾을 수 없습니다.");
    }

    const commentData = commentDoc.data();

    // 작성자 확인 (관리자 권한도 나중에 추가 가능)
    if (commentData.userId !== userId) {
      throw new Error("댓글을 삭제할 권한이 없습니다.");
    }

    // 실제 삭제 대신 삭제 표시 (답글이 있는 경우를 위해)
    await updateDoc(commentRef, {
      isDeleted: true,
      content: "[삭제된 댓글입니다]",
      deletedAt: serverTimestamp(),
    });

    // 배틀의 댓글 수 감소
    try {
      const battleRef = doc(db, "battles", commentData.battleId);
      await updateDoc(battleRef, {
        commentsCount: increment(-1),
      });
    } catch (error) {
      console.warn("배틀 댓글 수 업데이트 실패:", error);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("댓글 삭제 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 댓글 신고
 */
export const reportComment = async (
  commentId,
  userId,
  reason = "inappropriate"
) => {
  try {
    // 🔧 사용자 확인
    if (!userId) {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("로그인이 필요합니다.");
      }
      userId = currentUser.uid;
    }

    // 이미 신고했는지 확인
    const reportsQuery = query(
      collection(db, COMMENT_REPORTS_COLLECTION),
      where("commentId", "==", commentId),
      where("reporterId", "==", userId)
    );

    const existingReports = await getDocs(reportsQuery);

    if (!existingReports.empty) {
      throw new Error("이미 신고한 댓글입니다.");
    }

    // 신고 기록 추가
    await addDoc(collection(db, COMMENT_REPORTS_COLLECTION), {
      commentId,
      reporterId: userId,
      reason,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    // 댓글의 신고 수 증가
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    await updateDoc(commentRef, {
      reportCount: increment(1),
      isReported: true,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("댓글 신고 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 사용자의 댓글 목록 가져오기
 */
export const getUserComments = async (userId, limitCount = 20) => {
  try {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where("userId", "==", userId),
      where("isDeleted", "==", false),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const comments = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));

    return {
      success: true,
      comments,
    };
  } catch (error) {
    console.error("사용자 댓글 조회 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 댓글 통계 가져오기
 */
export const getCommentStats = async (battleId) => {
  try {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where("battleId", "==", battleId),
      where("isDeleted", "==", false)
    );

    const querySnapshot = await getDocs(q);
    const totalComments = querySnapshot.size;

    let totalLikes = 0;
    let uniqueCommenters = new Set();

    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalLikes += data.likes || 0;
      uniqueCommenters.add(data.userId);
    });

    return {
      success: true,
      stats: {
        totalComments,
        totalLikes,
        uniqueCommenters: uniqueCommenters.size,
      },
    };
  } catch (error) {
    console.error("댓글 통계 조회 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
