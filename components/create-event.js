import { defineAsyncComponent } from "vue";

export const CreateEvent = defineAsyncComponent(async () => ({
  props: {
    chatid: String,
  },
  data() {
    return {
      newEventName: "",
      eventGroup: undefined,
      startTime: undefined,
      endTime: undefined,
      description: "",
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
    getTime(date) {
      // const date = new Date(timestamp);
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    },
    createEvent() {
      this.closeCreateEvent();
      const startDatetime = this.getTime(new Date(this.startTime));
      const endDatetime = this.getTime(new Date(this.endTime));
      const eventObject = {
        value: {
          activity: "Create",
          published: Date.now(),
          content: "NEW EVENT: " + this.newEventName + "- Starts " + startDatetime + "- Ends " + endDatetime,
          object: {
            type: "Event",
            name: this.newEventName,
            start: this.startTime,
            end: this.endTime,
            description: this.description,
            channel: this.chatid,
            rsvp: {
              yes: [],
              maybe: [],
              no: [],
            },
          },
        },
        channels: [this.chatid, this.$graffitiSession.value.actor],
        allowed: undefined,
      };
      this.$graffiti.put(eventObject, this.$graffitiSession.value);
      this.newEventName = "";
    },
  },
  template: await fetch("./components/create-event.html").then((r) => {
    console.log("create event success");
    return r.text();
  }),
}));
