let vm = new Vue({
  el: "#root",
  data: {
    isBrand: true,
    isTitle: true,
    isAvailable: false,
  },
  methods: {
    toggleAvailability: function () {
      this.isAvailable ^= 1;
    },
  },
  computed: {
    productClasses: function () {
      return {
        available: this.isAvailable,
        outOfStore: !this.isAvailable,
      };
    },
  },
});
