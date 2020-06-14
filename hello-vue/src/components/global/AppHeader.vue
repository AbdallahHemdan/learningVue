<template>
  <div class="app-header">
    <div class="logo">
      <h1 class="hemdan">Abdallah Hemdan</h1>
    </div>
    <ul id="nav">
      <router-link to="/" tag="li" exact><a>Home</a></router-link>
      |
      <router-link to="/about" tag="li"><a>About</a></router-link>
      |
      <router-link to="/help" tag="li" replace><a>Help</a></router-link>
    </ul>
  </div>
</template>

<script>
export default {
  name: "AppHeader"
};
</script>

<style scoped>
.hemdan {
  font-family: "Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif;
  font-size: 70px;
  margin-bottom: 0px;
  color: #41b883;
}
</style>
