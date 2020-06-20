export default {
  computed: {
    filteredBlogs: function() {
      return this.blogs.filter(({ blogTitle }) => {
        return blogTitle.match(this.search);
      });
    },
  },
};
