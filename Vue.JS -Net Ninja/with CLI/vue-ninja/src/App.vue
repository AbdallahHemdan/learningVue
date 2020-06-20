<template>
  <div id="app">
    <app-header />
    <router-view />
  </div>
</template>


<script>
import Header from "./components/Header";

export default {
  name: "App",
  components: {
    "app-header": Header
  }
};
</script>

<style lang="scss" scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>




