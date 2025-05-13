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
      };
    },
    async mounted() {
      window.addEventListener("scroll", (evt) => {
        this.updateScroll();
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
      await new Promise((r) => setTimeout(r, 1000));
      // console.log("scrolling to: " + document.body.scrollHeight);
      window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" });
      // // }
    },
    methods: {
      async rsvp(rsvpType, eventURL) {
        rsvpToEvent(rsvpType, eventURL, this.$graffiti, this.$graffitiSession);
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
