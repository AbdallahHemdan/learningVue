<template>
  <div id="app">
    <app-counter></app-counter>
    <app-info></app-info>
    <app-like></app-like>
  </div>
</template>

<script>
import Counter from "./components/Counter";
import Info from "./components/Info";
import Like from "./components/Like";

export default {
  name: "App",
  data: function() {
    return {};
  },
  methods: {},
  computed: {},
  components: {
    "app-counter": Counter,
    "app-info": Info,
    "app-like": Like
  }
};
</script>

<style lang="scss" scoped>
#app {
  font-family: monospace;
}
</style>
