import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import FishingView from "../views/FishingView.vue";
import InventoryView from "../views/InventoryView.vue";
import StoreView from "../views/StoreView.vue";
import FisherView from "../views/FisherView.vue";

export const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView
  },
  {
    path: "/login",
    name: "login",
    component: LoginView
  },
  {
    path: "/register",
    name: "register",
    component: RegisterView
  },
  {
    path: "/fishing",
    name: "fishing",
    component: FishingView
  },
  {
    path: "/inventory",
    name: "inventory",
    component: InventoryView
  },
  {
    path: "/fisher",
    name: "fisher",
    component: FisherView
  },
  {
    path: "/store",
    name: "store",
    component: StoreView
  }
];
