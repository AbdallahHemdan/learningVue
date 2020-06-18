let vm = new Vue({
  el: "#root",
  data: {
    firstName: "",
    emailAddress: "",
  },
  methods: {
    getRefs: function () {
      this.firstName = this.$refs.firstName.value;
      this.emailAddress = this.$refs.email.value;
      console.log(this.$refs);
    },
  },
  computed: {},
});
