<template>
  <div class="display-blogs-container">
    <h1>List of all blogs</h1>
    <div class="single-blog" v-for="(blog, index) in blogs" :key="index">
      <h1>{{ blog.title }}</h1>
      <article>{{ blog.body }}</article>
    </div>
  </div>
</template>

<script>
export default {
  name: "DisplayBlogs",
  data: function() {
    return { blogs: [] };
  },
  methods: {},
  computed: {},
  components: {},
  created: function() {
    this.$http
      .get("https://jsonplaceholder.typicode.com/posts")
      .then(result => {
        this.blogs = result.data.slice(0, 10);
      })
      .catch(err => {
        console.log(err);
      });
  }
};
</script>

<style scoped>
.display-blogs-container {
  max-width: 800px;
  margin: 0px auto;
}
.single-blog {
  padding: 20px;
  margin: 20px 0;
  box-sizing: border-box;
  background: #eee;
}
</style>