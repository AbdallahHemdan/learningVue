<template>
  <div class="home-container">
    <display-blog></display-blog>
  </div>
</template>

<script>
import Blog from "./../components/Blog";
import DisplayBlogs from "./../components/DisplayBlogs";

export default {
  name: "Home",
  components: {
    "app-blog": Blog,
    "display-blog": DisplayBlogs
  }
};
</script>

<style scoped>
</style>