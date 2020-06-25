<template>
  <div class="info-container">
    <h2>Info</h2>
    <counter-info></counter-info>
    <h3>Double of counter</h3>
    <h4>{{ doubleCounter }}</h4>
    <h3>Counter with added value</h3>
    <h4>{{ addedCounter }}</h4>
  </div>
</template>

<script>
import CounterInfo from "./CounterInfo";
import { mapGetters } from "vuex";

export default {
  name: "Info",
  data: function() {
    return {};
  },
  props: [],
  components: {
    "counter-info": CounterInfo
  },
  computed: {
    ...mapGetters(["doubleCounter"]),
    addedCounter: function() {
      return this.$store.getters.addedCounter(5, 1);
    }
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
