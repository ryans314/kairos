import { defineAsyncComponent } from "vue";

export const UserImage = defineAsyncComponent(async () => ({
  props: {
    content: Number,
  },
  methods: {},
  template: await fetch("./components/UserImage.html").then((res) => res.text()),
}));
