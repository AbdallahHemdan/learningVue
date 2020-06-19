<template>
  <footer>
    <!-- <p>
      made with ❤ by
      <a href="https://github.com/AbdallahHemdan">Abdallah Hemdan</a> &copy;
      2020
    </p> -->
    {{ myBrandName }}
  </footer>
</template>

<script>
import { bus } from "./../main";

export default {
  name: "Footer",
  props: {
    brandName: {
      type: String,
      required: true
    }
  },
  data: function() {
    return {
      myBrandName: this.brandName
    };
  },
  created: function() {
    bus.$on("brandChanged", data => {
      this.myBrandName = data;
    });
  }
};
</script>

<style scoped>
footer {
  background: #4caf50;
  padding: 10px;
  text-align: center;
  color: #fff;
}
a {
  text-decoration: none;
  color: #fff;
}
a:hover {
  color: #f00;
}
</style>