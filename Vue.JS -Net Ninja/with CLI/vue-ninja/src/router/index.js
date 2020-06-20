import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import DisplayBlogs from "./../components/DisplayBlogs";
import Blog from "./../components/Blog";
import Error404 from "./../views/Error404";
Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/blogs",
    name: "Blogs",
    component: DisplayBlogs,
  },
  {
    path: "/add-blog",
    name: "AddBlogs",
    component: Blog,
  },
  {
    path: "*",
    name: "Error404",
    component: Error404,
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
