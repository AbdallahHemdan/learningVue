<template>
  <div id="app">
    <app-counter
      :counter="counter"
      @increment="increment"
      @decrement="decrement"
    ></app-counter>
    <app-info :counter="counter"></app-info>
  </div>
</template>

<script>
import Counter from "./components/Counter";
import Info from "./components/Info";

export default {
  name: "App",
  data: function() {
    return {
      counter: 0
    };
  },
  methods: {
    increment: function() {
      this.counter++;
    },
    decrement: function() {
      this.counter--;
    }
  },
  computed: {},
  components: {
    "app-counter": Counter,
    "app-info": Info
  }
};
</script>

<style lang="scss" scoped>
#app {
  font-family: monospace;
}
</style>
