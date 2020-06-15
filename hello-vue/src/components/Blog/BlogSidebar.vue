<template>
  <div class="blog-sidebar-container">
    {{ title | convertUpper }}
  </div>
</template>

<script>
export default {
  name: "BlogSidebar",
  data: function() {
    return { title: "Hello, Sidebar" };
  },
  filters: {
    convertUpper: function(value) {
      return value.toUpperCase();
    }
  }
};
</script>

<style></style>
