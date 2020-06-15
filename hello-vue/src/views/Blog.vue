<template>
  <div class="blog-container">
    <h1>{{ pageName }}</h1>
    <p>{{ pageDescription }}</p>
    <div class="container">
      <div class="row">
        <div class="col-md-8">
          <div class="posts">
            <BlogPosts
              v-for="post in posts"
              :key="post.id"
              :views="post.views"
              :title="post.title"
              :date="post.date"
              :content="post.content"
              :author="post.author"
              :category="post.category"
            />
          </div>
        </div>
        <div class="col-md-4">
          <div class="sidebar">
            <BlogSidebar />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BlogPosts from "./../components/Blog/BlogPosts";
import BlogSidebar from "./../components/Blog/BlogSidebar";
import JsonPosts from "./../api/posts.json";

export default {
  name: "About",
  data: function() {
    return {
      pageName: "Blog",
      pageDescription: "Welcome to Blog page",
      posts: JsonPosts
    };
  },
  components: {
    BlogPosts,
    BlogSidebar
  }
};
</script>
