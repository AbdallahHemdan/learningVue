Vue.component("Greeting", {
  template: `
    <div>
      <p>Hello, I am a reusable component {{name}}</p>
      <button @click="changeMyFirstName">Click me please</button>
    </div>
  `,
  data: function () {
    return {
      name: "Abdallah",
    };
  },
  methods: {
    changeMyFirstName: function () {
      this.name = "Hemdan";
    },
  },
});
let vm = new Vue({
  el: "#root",
  data: {},
  methods: {},
  computed: {},
});

let vm2 = new Vue({
  el: "#root2",
  data: {},
  methods: {},
  computed: {},
});
