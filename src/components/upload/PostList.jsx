// upload/PostList.jsx
import React from "react";
import PostItem from "./PostItem";

const PostList = ({ posts, updatePost, removePost }) => {
  const togglePostExpansion = (postId) => {
    const post = posts.find((p) => p.id === postId);
    updatePost(postId, { isExpanded: !post.isExpanded });
  };

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <PostItem
          key={post.id}
          post={post}
          index={index}
          updatePost={updatePost}
          removePost={removePost}
          toggleExpansion={() => togglePostExpansion(post.id)}
        />
      ))}
    </div>
  );
};

export default PostList;
