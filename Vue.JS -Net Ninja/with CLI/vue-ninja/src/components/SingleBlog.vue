<template>
  <div class="single-blog">
    <h1 class="title">{{ blog.title }}</h1>
    <article>{{ blog.body }}</article>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "SingleBlog",
  data: function() {
    return {
      id: this.$route.params.id,
      blog: {}
    };
  },
  created: function() {
    axios
      .get(`https://jsonplaceholder.typicode.com/posts/${this.id}`)
      .then(({ data }) => {
        this.blog = data;
      })
      .catch(err => {
        console.log(err);
      });
  }
};
</script>

<style scoped>
.single-blog {
  max-width: 960px;
  margin: 50px auto 0;
  font-family: monospace;
}
.title {
  color: brown;
}

article {
  text-align: left;
  font-size: 25px;
}
</style>