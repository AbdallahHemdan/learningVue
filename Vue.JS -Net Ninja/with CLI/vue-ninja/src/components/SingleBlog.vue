<template>
  <div class="single-blog">
    <h1 class="title">{{ blog.blogTitle }}</h1>
    <article>{{ blog.blogContent }}</article>
    <p>Author : {{ blog.author }}</p>
    <ul>
      <li v-for="(category, index) in blog.categories" :key="index">
        {{ category }}
      </li>
    </ul>
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
      .get(`https://learningvue-cbe9e.firebaseio.com/posts/${this.id}.json`)
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