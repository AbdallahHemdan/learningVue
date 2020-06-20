export default {
  computed: {
    filteredBlogs: function() {
      return this.blogs.filter(({ title }) => {
        return title.match(this.search);
      });
    },
  },
};
