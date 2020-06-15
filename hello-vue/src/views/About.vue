<template>
  <div class="about">
    <h1>{{ pageName }}</h1>
    <p>{{ pageDescription }}</p>
  </div>
</template>

<script>
export default {
  name: "About",
  data: function() {
    return {
      pageName: "About us",
      pageDescription: "Welcome to About us page "
    };
  }
};
</script>
