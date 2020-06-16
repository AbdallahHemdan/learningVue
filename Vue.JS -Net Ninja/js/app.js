let vm = new Vue({
  el: "#root",
  data: {
    name: "",
    age: "",
  },
  methods: {
    logName: function (e) {
      console.log(e.target.value);
    },
    logAge: function (e) {
      console.log(e.target.value);
    },
  },
});
