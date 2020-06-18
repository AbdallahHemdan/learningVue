<template>
  <header>
    <h1>{{ brandName }}</h1>
  </header>
</template>

<script>
export default {
  name: "Header",
  data: function() {
    return {
      brandName: "Vue ninja"
    };
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