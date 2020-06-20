<template>
  <div v-theme:column="`narrow`" class="display-blogs-container">
    <h1>List of all blogs</h1>
    <input
      type="text"
      v-model="search"
      placeholder="search for a certain blog"
    />
    <div
      class="single-blog"
      v-for="(blog, index) in filteredBlogs"
      :key="index"
    >
      <h1 v-randColor>{{ blog.title | toUppercase }}</h1>
      <article>{{ blog.body | shorten("...etc") }}</article>
    </div>
  </div>
</template>

<script>
export default {
  name: "DisplayBlogs",
  data: function() {
    return {
      blogs: [],
      search: ""
    };
  },
  methods: {},
  computed: {
    filteredBlogs: function() {
      return this.blogs.filter(({ title }) => {
        return title.match(this.search);
      });
    }
  },
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
  },
  filters: {
    toUppercase: function(value) {
      return value.toUpperCase();
    },
    shorten: function(value, suffix) {
      return `${value.slice(0, 100)} ${suffix}`;
    }
  },
  directives: {
    randColor: function(element, binding, vnode) {
      element.style.color = `#${Math.random()
        .toString()
        .slice(2, 8)}`;
    },
    theme: function(element, binding, vnode) {
      if (binding.value === "wide") {
        element.style.maxWidth = `1500px`;
      } else if (binding.value === "narrow") {
        element.style.maxWidth = `560px`;
      }

      if (binding.arg === "column") {
        element.style.backgroundColor = `#ddd`;
        element.style.padding = `20px`;
      }
    }
  }
};
</script>

<style scoped>
.display-blogs-container {
  max-width: 800px;
  margin: 0px auto;
}

.display-blogs-container input {
  width: 100%;
  padding: 15px;
  font-size: 20px;
  border: 1px solid #eee;
  border-radius: 10px;
  margin-top: 20px;
}

input:focus {
  outline: none;
}

.single-blog {
  padding: 20px;
  margin: 20px 0;
  box-sizing: border-box;
  background: #eee;
}
</style>