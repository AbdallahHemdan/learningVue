<template>
  <div class="home-container">
    <app-blog></app-blog>
  </div>
</template>

<script>
import Blog from "./../components/Blog";

export default {
  name: "Home",
  components: {
    "app-blog": Blog
  }
};
</script>

<style scoped>
</style>