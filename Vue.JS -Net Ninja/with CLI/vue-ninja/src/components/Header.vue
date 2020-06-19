<template>
  <header>
    <h1 @click="changeBrandName">{{ myBrandName }}</h1>
  </header>
</template>

<script>
import { bus } from "./../main";

export default {
  name: "Header",
  data: function() {
    return {
      myBrandName: this.brandName
    };
  },
  props: {
    brandName: {
      type: String,
      required: true
    }
  },
  methods: {
    changeBrandName: function() {
      // this.$emit("changeBrand", "Hemdan");
      this.myBrandName = "Hemdan";
      bus.$emit("brandChanged", this.myBrandName);
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