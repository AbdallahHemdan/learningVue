<template>
  <div class="app-header">
    <div class="container">
      <div class="logo">
        <router-link to="/" exact><a>Hemdan</a></router-link>
      </div>
      <ul class="text-right">
        <router-link to="/" tag="li" exact><a>Home</a></router-link>
        <router-link to="/blog" tag="li"><a>Blog</a></router-link>
        <router-link to="/about" tag="li"><a>About</a></router-link>
        <router-link to="/help" tag="li"><a>Help</a></router-link>
        <router-link to="/contactus" tag="li"><a>Contact us</a></router-link>
      </ul>
    </div>
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
    a {
      text-decoration: none;
      color: #fff;
    }
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
