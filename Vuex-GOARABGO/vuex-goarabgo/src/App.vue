<template>
  <div id="app">
    <app-counter></app-counter>
    <app-info></app-info>
  </div>
</template>

<script>
import Counter from "./components/Counter";
import Info from "./components/Info";

export default {
  name: "App",
  data: function() {
    return {};
  },
  methods: {},
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
