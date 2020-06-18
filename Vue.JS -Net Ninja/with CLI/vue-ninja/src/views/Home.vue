<template>
  <div class="home">
    <h1>Hello, Home</h1>
    <Ninjas />
  </div>
</template>

<script>
import Ninjas from "./../components/Ninjas.vue";
export default {
  name: "Home",
  components: {
    Ninjas
  }
};
</script>
