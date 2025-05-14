import { defineAsyncComponent } from "vue";
import { rsvpToEvent } from "./index.js";

export async function MessageList() {
  return {
    watch: {
      // async $route(to, from) {
      //   console.log(to);
      //   console.log("THIS HAPPENS");
      //   if (to.includes("/chat/")) {
      //     await new Promise((r) => setTimeout(r, 2000));
      //     console.log("scrolling to: " + document.body.scrollHeight);
      //     window.scrollTo(0, document.body.scrollHeight);
      //   }
      // },
    },
    props: ["chatId"],
    data() {
      return {
        messageObjects: [],
        messageToEdit: undefined,
        editContent: "",
        actorToProfile: {},
        eventId: "",
        eventObject: undefined,
        eventToRSVP: {},
      };
    },
    async mounted() {
      window.addEventListener("scroll", (evt) => {
        this.updateScroll();
      });

      document.addEventListener("click", (evt) => {
        console.log("documentClick");
        const rsvps = Array.from(document.getElementsByClassName("rsvpSection"));
        rsvps.forEach((rsvp) => {
          if (rsvp.classList.contains("rsvping")) {
            rsvp.classList.remove("rsvping");
          }
        });
      });

      //TODO: MOVE THIS INTO INDEX.JS FOR BETTER CACHING
      //store all profiles in this.actorToProfile
      const profileSchema = {
        required: ["value"],
        properties: {
          activity: { type: "string", const: "Create" },
          type: { type: "string", const: "Profile" },
          describes: { type: "string" },
          name: { type: "string" },
        },
      };

      const profileStream = this.$graffiti.discover(["designftw-2025-studio2"], profileSchema);
      const profileArray = await Array.fromAsync(profileStream);

      for (const profile of profileArray) {
        const name = profile.object.value.name;
        const id = profile.object.value.describes;
        this.actorToProfile[id] = name;
      }

      const rsvpSchema = {
        properties: {
          value: {
            required: ["activity", "type"],
            properties: {
              activity: { const: "Create" },
              type: { const: "RSVP" },
            },
          },
        },
      };
      console.log(this.$graffitiSession.value.actor);
      const rsvpStream = this.$graffiti.discover([this.$graffitiSession.value.actor], rsvpSchema);
      const rsvpArray = await Array.fromAsync(rsvpStream);
      console.log("RSVPs on load:", rsvpArray);
      for (const rsvp of rsvpArray) {
        this.eventToRSVP[rsvp.object.value.eventURL] = rsvp.object.value.rsvpType;
      }
      // if (profileArray.length > 1) console.warn("user has more than 1 profile! Profiles: ", profiles);
      // if (profileArray.length === 0) console.warn("user does not have a profile: ", profiles);

      // // <graffiti-discover
      // //   id="messageFrame"
      // //   v-slot="{ objects: messageObjects, isInitialPolling }"
      // //   :channels="[chatId]"
      // //   :schema="{
      // //                   properties: {
      // //                       value: {
      // //                           required: ['content', 'published'],
      // //                           properties: {
      // //                               content: { type: 'string' },
      // //                               published: { type: 'number' }
      // //                           }
      // //                       }
      // //                   }
      // //               }"
      // // >
      // this.isInitialPolling = true;
      // const messageStream = this.$graffiti.discover([this.chatId], {
      //   properties: {
      //     value: {
      //       required: ["content", "published"],
      //       properties: {
      //         content: { type: "string" },
      //         published: { type: "number" },
      //       },
      //     },
      //   },
      // });
      // const messages = Array.fromAsync(messageStream);
      // this.messageObjects = messages;
      // this.isInitialPolling = false;

      await new Promise((r) => setTimeout(r, 500));
      // console.log("scrolling to: " + document.body.scrollHeight);
      window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" });
      // // }
    },
    methods: {
      async getEventToDisplay() {
        const eventId = this.eventId;
        const eventStream = this.$graffiti.discover([this.chatId], {
          required: ["url"],
          properties: {
            url: { const: eventId },
          },
        });
        const eventArray = await Array.fromAsync(eventStream);
        console.log("event array is ", eventArray);
        this.eventObject = eventArray[0];
      },
      setEvent(eventId) {
        console.log("setting event to: ", eventId);
        this.eventId = eventId;
        this.getEventToDisplay();
      },
      unsetEvent() {
        this.eventId = "";
        this.eventObject = undefined;
      },
      openRsvpPanel(i) {
        const rsvpSection = document.getElementById("rsvp-" + i);
        rsvpSection.classList.toggle("rsvping");
      },
      getEventRSVP(eventURL) {
        if (eventURL in this.eventToRSVP) {
          return "RSVP: " + this.eventToRSVP[eventURL];
        }
        return "RSVP";
      },
      async rsvp(rsvpType, eventURL, i) {
        const rsvpButton = document.querySelector(`#rsvp-${i} .rsvpButton`);
        // rsvpButton.textContent = `RSVP: ${rsvpType}`;
        console.log(rsvpButton);
        rsvpToEvent(rsvpType, eventURL, this.$graffiti, this.$graffitiSession);
        this.eventToRSVP[eventURL] = rsvpType;
      },
      getTime(dateStr) {
        const date = new Date(dateStr);
        // const date = new Date(timestamp);
        return date.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      },
      getProfileFromId(id) {
        return this.actorToProfile[id] ?? id;
      },
      updateScroll() {
        console.log("updating scroll");
        const threshold = Math.min(document.body.scrollHeight * 0.6, document.body.scrollHeight - 1500);
        console.log("threshold", threshold);
        const scrollAmount = window.scrollY;
        console.log("scroll amount", scrollAmount);
        const scrollButton = document.getElementById("scrollButton");
        if (scrollAmount < threshold) {
          scrollButton.classList.add("scrolled");
        } else {
          scrollButton.classList.remove("scrolled");
        }
      },
      scroll() {
        // console.log("scrolling via scroll()");
        window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" });
      },
      async deleteMessage(msg) {
        await this.$graffiti.delete(msg.url, this.$graffitiSession.value);
      },
      startEdit(msg) {
        this.messageToEdit = msg.url;
        this.editContent = msg.value.content;
      },
      async finishEdit(msg) {
        await this.$graffiti.patch(
          {
            value: [
              {
                op: "replace",
                path: "/content",
                value: this.editContent,
              },
            ],
          },
          msg,
          this.$graffitiSession.value
        );
        this.cancelEdit();
      },
      cancelEdit() {
        this.messageToEdit = undefined;
        this.editContent = undefined;
      },
    },

    template: await fetch("./message-list.html").then((r) => {
      console.log("success message list");
      return r.text();
    }),
  };
}
