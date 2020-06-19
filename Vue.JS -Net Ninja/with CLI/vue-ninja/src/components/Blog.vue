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
        <section class="checkboxes">
          <label for="ninjas">Nanjas</label>
          <input
            type="checkbox"
            name="ninjas"
            id="ninjas"
            value="ninjas"
            v-model="blog.categories"
          />
          <label for="wizards">Wizards</label>
          <input
            type="checkbox"
            name="wizards"
            id="wizards"
            value="wizards"
            v-model="blog.categories"
          />
          <label for="mario">Mario</label>
          <input
            type="checkbox"
            name="mario"
            id="mario"
            value="mario"
            v-model="blog.categories"
          />
          <label for="cheese">Cheese</label>
          <input
            type="checkbox"
            name="cheese"
            id="cheese"
            value="cheese"
            v-model="blog.categories"
          />
        </section>
        <section class="select-author">
          <select name="" id="" v-model="blog.author">
            <option value="" disabled>Please select an Author</option>
            <option
              :value="author"
              v-for="(author, index) in authors"
              :key="index"
              >{{ author }}</option
            >
          </select>
        </section>
        <button @click.prevent="storeBlog">Submit</button>
      </form>
    </div>
    <div class="preview">
      <h2>Preview Blog</h2>
      <h3>Blog title</h3>
      <p>{{ blog.blogTitle }}</p>
      <h3>Blog content</h3>
      <p class="content-area">{{ blog.blogContent }}</p>
      <h4>Categories choosen</h4>
      <p v-for="(category, index) in blog.categories" :key="index">
        {{ category }}
      </p>
      <h4>Selected Value:</h4>
      <p>{{ blog.author }}</p>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "Blog",
  components: {},
  methods: {
    storeBlog: function() {
      axios
        .post("https://jsonplaceholder.typicode.com/posts", {
          userId: 5,
          id: 101,
          title: this.blog.blogTitle,
          body: this.blog.blogContent
        })
        .then(result => {
          console.log(result);
        })
        .catch(err => {
          console.log(err);
        });
      // this.$http
      // .post("https://jsonplaceholder.typicode.com/posts", {
      //   userId: 5,
      //   id: 101,
      //   title: this.blog.blogTitle,
      //   body: this.blog.blogContent
      // })
      // .then(result => {
      //   console.log(result);
      // })
      // .catch(err => {
      //   console.log(err);
      // });
    }
  },
  data: function() {
    return {
      blog: {
        blogTitle: "",
        blogContent: "",
        categories: [],
        author: ""
      },
      authors: [
        "Abdallah Hemdan",
        "Omar Hemdan",
        "Mohamed  Hemdan",
        "Rokia Hemdan",
        "Ahmed Hemdan",
        "Mamdouh Hemdan"
      ]
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

.checkboxes input,
label {
  display: inline-block;
  margin-right: 10px;
}

.checkboxes input {
  margin-right: 30px;
}
</style>