let vm = new Vue({
  el: "#root",
  data: {
    name: "Abdallah Hemdan",
    age: 21,
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
