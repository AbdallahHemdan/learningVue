<template>
  <div id="app">
    <product-list-one :products="products"></product-list-one>
    <product-list-two :products="products"></product-list-two>
  </div>
</template>

<script>
import ProductListOne from "./components/ProductListOne";
import ProductListTwo from "./components/ProductListTwo";

export default {
  name: "App",
  data: function() {
    return {
      products: [
        { name: "Banana Skin", price: 20 },
        { name: "Shiny Star", price: 40 },
        { name: "Green Shells", price: 60 },
        { name: "Red Shells", price: 80 }
      ]
    };
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
}
</style>