<template>
  <div class="product-list-one">
    <h1>Product list one</h1>
    <ul>
      <li v-for="(product, index) in saleProducts" :key="index" class="product">
        <h2 class="name">Product name : {{ product.name }}</h2>
        <h4 class="price">Product price : ${{ product.price }}</h4>
      </li>
    </ul>
    <button @click="reducePrices(4)">Reduce prices</button>
  </div>
</template>

<script>

export default {
  name: "ProductListOne",
  data: function() {
    return {};
  },
  methods: {
    reducePrices: function(amount) {
      this.$store.dispatch("reducePrice", amount);
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
.product-list-one {
  background: #fff8b1;
  box-shadow: 1px 2px 3px rgba(0, 0, 0, 0.2);
  margin-bottom: 50px;
  padding: 10px 20px;
}
.product-list-one ul {
  padding: 0;
}
.product-list-one li {
  display: inline-block;
  margin-right: 10px;
  margin-top: 10px;
  padding: 20px;
  width: 200px;
  background: rgba(255, 255, 255, 0.7);
}
.price {
  font-weight: bold;
  color: #e8800c;
}
</style>