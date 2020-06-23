<template>
  <div id="app">
    <product-list-one></product-list-one>
    <product-list-two></product-list-two>
  </div>
</template>

<script>
import ProductListOne from "./components/ProductListOne";
import ProductListTwo from "./components/ProductListTwo";

export default {
  name: "App",
  data: function() {
    return {};
  },
  components: {
    "product-list-one": ProductListOne,
    "product-list-two": ProductListTwo
  },
  computed: {},
  methods: {}
};
</script>


<style scoped>
#app {
  font-family: monospace;
  color: #555;
}
</style>