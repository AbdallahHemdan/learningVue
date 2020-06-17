let vm = new Vue({
  el: "#root",
  data: {
    health: 100,
    isEndGame: false,
  },
  methods: {
    punchBag: function () {
      this.health -= 10;
      if (this.health <= 0) {
        // you dead
        this.isEndGame = true;
        this.health;
      }
    },
    resetHealth: function () {
      this.health = 100;
      this.isEndGame = false;
    },
  },
  computed: {
    scoreStyle: function () {
      return { width: `${this.health}%` };
    },
  },
});
