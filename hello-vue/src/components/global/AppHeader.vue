<template>
  <div class="app-header">
    <h1 class="logo">Hemdan</h1>
    <ul>
      <router-link to="/" tag="li" exact><a>Home</a></router-link>
      <router-link to="/about" tag="li"><a>About</a></router-link>
      <router-link to="/help" tag="li" replace><a>Help</a></router-link>
      <router-link to="/contactus" tag="li" replace
        ><a>contact us</a></router-link
      >
    </ul>
  </div>
</template>

<script>
export default {
  name: "AppHeader"
};
</script>

<style scoped lang="scss">
.app-header {
  background-color: #333;
  color: #fff;
  overflow: hidden;
  .logo {
    font-size: 20px;
    padding: 20px;
    float: left;
    width: 200px;
  }
  ul {
    float: right;
    width: calc(100% - 200px);
    padding-right: 20px;
    li {
      padding: 20px;
      display: inline-block;
      font-size: 18px;
      a {
        color: #fff;
        text-decoration: none;
      }
    }
  }
}
</style>
