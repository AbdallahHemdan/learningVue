<template>
  <div class="help-container">
    <h1 class="header">{{ pageName }}</h1>
    <p>{{ pageDescription }}</p>
  </div>
</template>

<script>
export default {
  name: "Help",
  data: function() {
    return {
      pageName: "Help",
      pageDescription: "Welcome to Help page"
    };
  }
};
</script>

<style scoped lang="scss"></style>
