<template>
  <div class="blog-container">
    <h1>{{ pageName }}</h1>
    <p>{{ pageDescription }}</p>
  </div>
</template>

<script>
export default {
  name: "About",
  data: function() {
    return {
      pageName: "Blog",
      pageDescription: "Welcome to Blog page "
    };
  }
};
</script>
