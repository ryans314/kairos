import { defineAsyncComponent } from "vue";

export const EventPopup = defineAsyncComponent(async () => ({
  props: {
    eventId: String,
  },
  data() {
    return {};
  },
  methods: {
    openEventFrame() {
      const app = document.getElementById("app");
      app.classList.add("popupContainer");
    },
    closeEventFrame() {
      const app = document.getElementById("app");
      // this.eventId = "";
      app.classList.remove("popupContainer");
    },
  },
  mounted() {
    this.openEventFrame();
  },
  template: await fetch("./components/event-popup.html").then((r) => {
    console.log("event popup success");
    return r.text();
  }),
}));
