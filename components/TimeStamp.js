import { defineAsyncComponent } from "vue";
import { toRaw } from "vue";

export const TimeStamp = defineAsyncComponent(async () => ({
  data() {
    return {
      message: undefined,
      timeToDisplay: undefined,
    };
  },
  props: {
    type: String,
    object: Object,
  },
  methods: {
    /**
     * Update this.message with the message to display the time for
     *
     * @param {*} object message or group object that's passed in
     * @param {*} type "message" or "group", indicating the type of object the time is for
     */
    async updateMessage(object, type) {
      //console.log("starting updateMessage");
      if (object === undefined) {
        throw new Error("Object should not be undefined");
      }
      if (type === "message") {
        this.message = object;
      } else if (type === "group") {
        const channel = object.value.object.channel;
        const schema = {
          properties: {
            value: {
              //Value property:
              required: ["content", "published", "activity", "type"], //has these required properties
              properties: {
                //the properties of value are:
                activity: { type: "string" }, //activity, which is type string
                type: {
                  type: "string",
                  const: "Message",
                },
                published: { type: "number" },
                content: { type: "string" },
              },
            },
            channels: {
              type: "array",
            },
          },
        };

        const messageStream = await this.$graffiti.discover([channel], schema);
        const messages = await Array.fromAsync(messageStream);
        messages.sort((a, b) => b.object.value.published - a.object.value.published);
        this.message = messages[0];
      } else {
        throw new Error("type ", this.type, " is not supported");
      }
      //console.log("ending updateMessage()");
    },
    /**
     * Calculate the time since this.message was sent, and update this.timeToDisplay
     * to show  a formatted string based on the message sent time
     *
     * If the message was sent less than a minute ago, return "now"
     * If the message was sent less than an hour ago, return number of minutes
     * If the message was sent less than a day ago, return number of hours
     * Otherwise return the date
     */
    displayTime() {
      if (this.message === undefined) throw new Error("Error in displayTime - message is undefined");
      if (this.message === 0) {
        return "no messages yet";
      }
      const message = this.message;
      let sendDate;
      if (this.type === "message") {
        sendDate = new Date(message.value.published);
      } else {
        sendDate = new Date(message.object.value.published);
      }
      const now = new Date();
      const diff = (now - sendDate) / 1000; //difference in seconds
      if (diff < 60) {
        this.timeToDisplay = "Now";
      } else if (diff < 60 * 60) {
        this.timeToDisplay = Math.floor(diff / 60).toString() + "m";
      } else {
        this.timeToDisplay = sendDate.toLocaleString(undefined, {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }
    },
  },
  async created() {
    this.updateMessage(this.object, this.type).then(() => {
      this.displayTime();
    });

    //update once every second
    setInterval(() => {
      this.updateMessage(this.object, this.type).then(() => {
        this.displayTime();
      });
    }, 1000);
  },
  template: await fetch("./components/TimeStamp.html").then((res) => res.text()),
}));
