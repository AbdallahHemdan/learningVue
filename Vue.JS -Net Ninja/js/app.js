let vm = new Vue({
  el: "#root",
  data: {
    name: "Abdallah Hemdan",
    age: 21,
    xPosition: 0,
    yPosition: 0,
  },
  methods: {
    incrementAge: function (yearsToAdd) {
      this.age += yearsToAdd;
    },
    decrementAge: function (yearsToSubtract) {
      this.age -= yearsToSubtract;
    },
    trackMouse: function (e) {
      this.xPosition = e.x;
      this.yPosition = e.y;
    },
    fireAlarm: function (e) {
      alert("You clicked hemdan github account link");
    },
  },
});
