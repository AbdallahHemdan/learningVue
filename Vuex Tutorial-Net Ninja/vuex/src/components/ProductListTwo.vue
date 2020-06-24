<template>
  <div class="product-list-two">
    <h1>Product list two</h1>
    <ul>
      <li v-for="(product, index) in saleProducts" :key="index" class="product">
        <h2 class="name">Product name : {{ product.name }}</h2>
        <h4 class="price">Product price : {{ product.price }}</h4>
      </li>
    </ul>
    <button @click="reducePrices">Reduce prices</button>
  </div>
</template>

<script>
export default {
  name: "ProductListTwo",
  data: function() {
    return {};
  },
  methods: {
    reducePrices: function() {
      this.$store.dispatch("reducePrice", 4);
    }
  },
  computed: {
    products: function() {
      return this.$store.state.products;
    },
    saleProducts: function() {
      return this.$store.getters.saleProducts;
    }
  }
};
</script>

<style scoped>
.product-list-two {
  background: #d1e4ff;
  box-shadow: 1px 2px 3px rgba(0, 0, 0, 0.2);
  margin-bottom: 30px;
  padding: 10px 20px;
}
.product-list-two ul {
  padding: 0;
  list-style-type: none;
}
.product-list-two li {
  margin-right: 10px;
  margin-top: 10px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.7);
}
.price {
  font-weight: bold;
  color: #860ce8;
  display: block;
}
</style>
