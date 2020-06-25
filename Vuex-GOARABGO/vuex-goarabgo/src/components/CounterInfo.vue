<template>
  <div class="counter-info">Counter : {{ counter }}</div>
</template>

<script>
export default {
  name: "CounterInfo",
  data: function() {
    return {};
  },
  methods: {},
  computed: {
    counter: function() {
      return this.$store.state.counter;
    }
  },
  props: []
};
</script>

<style lang="scss" scoped>
.counter-info {
  font-size: 25px;
  color: #f00;
}
</style>
