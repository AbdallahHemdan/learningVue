<template>
  <div class="blog-container">
    <div class="title">
      <h2>Add a new blog</h2>
    </div>
    <div class="form-container">
      <form action="">
        <label for="blog-title">Blog title</label>
        <input
          type="text"
          name="blog-title"
          id="blog-title"
          required
          v-model.lazy="blog.blogTitle"
        />
        <label for="blog-content">Blog content</label>
        <textarea
          name="blog-content"
          id="blog-content"
          cols="30"
          rows="10"
          v-model.lazy="blog.blogContent"
        ></textarea>
      </form>
    </div>
    <div class="preview">
      <h2>Preview Blog</h2>
      <h3>Blog title</h3>
      <p>{{ blog.blogTitle }}</p>
      <h3>Blog content</h3>
      <p class="content-area">{{ blog.blogContent }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "Blog",
  components: {},
  methods: {},
  data: function() {
    return {
      blog: {
        blogTitle: "",
        blogContent: ""
      }
    };
  }
};
</script>

<style scoped>
.blog-container {
  margin: 20px auto;
  max-width: 500px;
}
label {
  display: block;
  margin: 20px 0 10px;
}
input[type="text"],
textarea {
  display: block;
  width: 100%;
  padding: 8px;
}
.preview {
  padding: 10px 20px;
  border: 1px dotted #ccc;
  margin: 30px 0;
}
h3 {
  margin-top: 10px;
}

.content-area {
  white-space: pre-line;
}
</style>