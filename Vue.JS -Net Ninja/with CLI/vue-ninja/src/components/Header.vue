<template>
  <header>
    <h1>{{ brandName }}</h1>
    <button @click="changeBrandName">Change brandName</button>
  </header>
</template>

<script>
export default {
  name: "Header",
  data: function() {
    return {};
  },
  props: {
    brandName: {
      type: String,
      required: true
    }
  },
  methods: {
    changeBrandName: function() {
      this.brandName = "Hemdan";
    }
  }
};
</script>

<style scoped>
header {
  background: #11072a;
  padding: 10px;
}
h1 {
  color: #fff;
  text-align: center;
  letter-spacing: 5px;
  font-family: "Courier New", Courier, monospace;
}
</style>