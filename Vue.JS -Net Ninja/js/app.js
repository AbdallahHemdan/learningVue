let vm = new Vue({
  el: "#root",
  data: {
    name: "Abdallah Hemdan",
    job: "Ninja",
    githubLink: "https://github.com/AbdallahHemdan",
    websiteTag: `<a href="https://github.com/AbdallahHemdan">Hemdan</a>`,
  },
  methods: {
    addSir: function (age) {
      return `Sir, ${this.name}. You're ${age} years old`;
    },
  },
});
