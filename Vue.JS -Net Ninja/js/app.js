let vm = new Vue({
  el: "#root",
  data: {
    state: false,
  },
  methods: {
    toggleState: function () {
      this.state ^= 1;
    },
  },
  computed: {},
});
