<template>
  <nav>
    <ul>
      <li>
        <router-link to="/" exact>Blogs</router-link>
      </li>
      <li>
        <router-link to="/add-blog">Write Blog</router-link>
      </li>
    </ul>
  </nav>
</template>

<script>
export default {};
</script>

<style scoped lang="scss">
body * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  list-style-type: none;
  display: inline-block;
}

nav {
  background-color: #444;
  width: 100%;
  li {
    padding: 20px;
  }
  a {
    color: #fff;
    font-weight: bold;
    text-decoration: none;
    font-size: 20px;
    font-family: monospace;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>