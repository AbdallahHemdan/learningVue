let vm = new Vue({
  el: "#root",
  data: {
    name: "Hemdan",
  },
  methods: {},
  computed: {
    greet: function () {
      return "Welcome for app one";
    },
  },
});

let vm2 = new Vue({
  el: "#root2",
  data: {
    name2: "Hemdan2",
  },
  methods: {
    hackFirstApp: function () {
      vm.name = "Hacker named hemdan was here";
    },
  },
  computed: {
    greet: function () {
      return "Welcome for app two";
    },
  },
});
