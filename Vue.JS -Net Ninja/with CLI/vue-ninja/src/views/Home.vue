<template>
  <div class="home-container">
    <display-blog></display-blog>
    <list-blogs></list-blogs>
  </div>
</template>

<script>
import Blog from "./../components/Blog";
import DisplayBlogs from "./../components/DisplayBlogs";
import ListBlogs from "./../components/ListBlogs";

export default {
  name: "Home",
  components: {
    "app-blog": Blog,
    "display-blog": DisplayBlogs,
    "list-blogs": ListBlogs
  }
};
</script>

<style scoped>
</style>