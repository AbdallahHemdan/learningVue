let vm = new Vue({
  el: "#root",
  data: {
    age: 25,
    a: 0,
    b: 0,
  },
  methods: {
    incrementA: function () {
      this.a++;
    },
    incrementB: function () {
      this.b++;
    },
  },
  computed: {
    addAgeToA: function () {
      console.log("addAgeToA");
      return this.age + this.a;
    },
    addAgeToB: function () {
      console.log("addAgeToB");
      return this.age + this.b;
    },
  },
});
