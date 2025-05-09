import { defineAsyncComponent } from "vue";

export const CreateEvent = defineAsyncComponent(async () => ({
  props: ["chatId"],
  data() {
    return {
      newEventName: "",
      eventGroup: undefined,
      startTime: undefined,
      endTime: undefined,
    };
  },
  methods: {
    openCreateEvent() {
      const app = document.getElementById("app");
      app.classList.add("creating");
      document.getElementById("groupName").focus();
    },
    closeCreateEvent() {
      const app = document.getElementById("app");
      app.classList.remove("creating");
    },
    createEvent() {
      this.closeCreateEvent();
      this.$graffiti.put(
        {
          value: {
            activity: "Create",
            object: {
              type: "Event",
              name: this.newEventName,
              start: this.startTime,
              end: this.endTime,
              channel: this.chatId,
              rsvp: {
                yes: [],
                maybe: [],
                no: [],
              },
            },
          },
          channels: [this.chatId],
          allowed: undefined,
        },
        this.$graffitiSession.value
      );
      this.newEventName = "";
    },
  },
  template: await fetch("./components/create-event.html").then((r) => {
    console.log("create event success");
    return r.text();
  }),
}));
