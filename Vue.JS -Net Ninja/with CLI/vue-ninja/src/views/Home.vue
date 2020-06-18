<template>
  <div class="home">
    <app-header />
    <app-content />
    <app-footer />
  </div>
</template>

<script>
import Header from "./../components/Header";
import Footer from "./../components/Footer";
import Ninja from "./../components/Ninja";

export default {
  name: "Home",
  components: {
    "app-header": Header,
    "app-content": Ninja,
    "app-footer": Footer
  }
};
</script>
