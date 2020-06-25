<template>
  <div class="info-container">
    <h2>Info</h2>
    <counter-info :counter="counter"></counter-info>
  </div>
</template>

<script>
import CounterInfo from "./CounterInfo";

export default {
  name: "Info",
  data: function() {
    return {};
  },
  props: ["counter"],
  components: {
    "counter-info": CounterInfo
  }
};
</script>

<style lang="scss" scoped>
.info-container {
  background-color: #f1f1f1;
  padding: 20px 0;
  text-align: center;
  border: 1px solid #000;
  h2 {
    color: #00f;
    font-size: 30px;
  }
}
</style>
