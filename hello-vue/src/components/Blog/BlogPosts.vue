<template>
  <div class="post-container">
    <span class="post-views">{{ views }}</span>
    <h3 class="post-title">{{ title }}</h3>
    <span class="post-date">{{ date }}</span>
    <p class="post-content">
      {{ content }}
    </p>
    <div class="row">
      <div class="col-md-6">
        <span class="post-author">{{ author }}</span>
      </div>
      <div class="col-md-6 text-right">
        <span class="post-cateogry">{{ category.slice(0, 10) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "BlogPosts",
  props: ["views", "title", "date", "content", "author", "category"]
};
</script>

<style lang="scss" scoped>
.post-container {
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 0 10px #ddd;
  position: relative;
  text-align: left;
  margin-bottom: 40px;
  .post-views {
    position: absolute;
    top: 5px;
    right: 5px;
    background-color: #007bff;
    border-radius: 4px;
    padding: 1px 5px;
    color: #fff;
    text-align: center;
    font-weight: bold;
  }
  .post-title {
    font-weight: bold;
    color: #4d6680;
  }
  .post-date {
    display: block;
    margin: 0 0 9px;
    color: #888;
    font-size: 15px;
  }
  .post-content {
    display: block;
    margin: 0 0 9px;
    color: #282828;
    font-size: 15px;
  }
  .post-author {
    background-color: #ddd;
    padding: 6px 8px;
    border-radius: 4px;
    margin-top: 10px;
  }
  .post-cateogry {
    background-color: #007bff;
    padding: 6px 8px;
    border-radius: 4px;
    margin-top: 10px;
    color: #fff;
  }
}
</style>
