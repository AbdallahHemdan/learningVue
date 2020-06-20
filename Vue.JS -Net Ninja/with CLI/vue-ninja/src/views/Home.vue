<template>
  <div class="home-container">
    <router-link to="/blogs">Show blogs</router-link>
    <router-link to="/add-blog">Write blog</router-link>
    <router-view></router-view>
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
.home-container {
  font-size: 40px;
  text-align: center;
}
.home-container a {
  text-decoration: none;
  display: inline-block;
  padding: 10px;
  font-family: monospace;
  background-color: #eee;
  margin: 50px 10px 10px 10px;
  color: #f00;
  border: 2px solid #000;
}

.home-container a:hover {
  text-decoration: underline;
}
</style>