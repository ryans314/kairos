import { createApp } from "vue";
import { GraffitiLocal } from "@graffiti-garden/implementation-local";
import { GraffitiRemote } from "@graffiti-garden/implementation-remote";
import { GraffitiPlugin } from "@graffiti-garden/wrapper-vue";

createApp({
  data() {
    return {
      myMessage: "",
      sending: false,
      channels: ["designftw"],
      newGroupName: "",
      selectedGroupChat: undefined, //current group chat object (.value.object)
      messageToEdit: undefined,
      editContent: "",
      memberToAdd: "",
      selectedUsers: [],
      manualUsers: [""],
    };
  },
  async mounted() {
    console.log(localStorage);
    this.selectedGroupChat = JSON.parse(localStorage.getItem("selectedGroupChat"));
    console.log(this.selectedGroupChat);
    if (window.location.href.includes("chat.html")) {
      console.log("hhh");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Done");
      document.getElementById("main").scrollTo({ left: 0, top: 1000 });
    }
  },
  watch: {
    "$graffitiSession.value"(newSession) {
      if (newSession && window.location.href.includes("landing.html")) {
        window.location.href = "index.html";
      } else if (!newSession && !window.location.href.includes("landing.html")) {
        window.location.href = "landing.html";
      }
    },
  },
  methods: {
    async sendMessage(session) {
      if (!this.myMessage) return;
      // if (this.selectedGroupChat === undefined) return;
      this.sending = true;

      await this.$graffiti.put(
        {
          value: {
            content: this.myMessage,
            published: Date.now(),
          },
          channels: [this.selectedGroupChat.channel],
        },
        session
      );

      this.sending = false;
      this.myMessage = "";

      // Refocus the input field after sending the message
      await this.$nextTick();
      this.$refs.messageInput.focus();
    },
    openCreateGroup() {
      const app = document.getElementById("app");
      app.classList.add("creating");
      document.getElementById("groupName").focus();
    },
    closeCreateGroup() {
      const app = document.getElementById("app");
      app.classList.remove("creating");
    },
    createGroup() {
      this.closeCreateGroup();
      this.$graffiti.put(
        {
          value: {
            activity: "Create",
            object: {
              type: "Group Chat",
              name: this.newGroupName,
              channel: crypto.randomUUID(),
              members: [this.$graffitiSession.value.actor].concat(this.selectedUsers),
            },
          },
          channels: ["designftw"],
          allowed: undefined,
        },
        this.$graffitiSession.value
      );
      this.newGroupName = "";
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
    openGroup(group) {
      localStorage.setItem("selectedGroupChat", JSON.stringify(group.value.object));
      window.location.href = "chat.html";
    },

    /**
     * Get a list of shared members
     * @param groups all groups the user is a part of
     * @returns alphabetically sorted list of users that share a group, excluding the current user
     */
    getMembers(groups) {
      const members = new Set();
      for (const group of groups) {
        const groupMembers = group.value.object.members;
        if (groupMembers) {
          groupMembers.forEach((member) => members.add(member));
        }
      }
      members.delete(this.$graffitiSession.value.actor);
      const sortedMembers = Array.from(members).sort();
      this.selectedUsers.forEach((member) => {
        if (!sortedMembers.includes(member)) sortedMembers.push(member);
      });
      return sortedMembers;
    },
    selectMember() {
      if (this.memberToAdd === "" || this.selectedUsers.includes(this.memberToAdd)) {
        this.memberToAdd = "";
        return;
      }
      this.selectedUsers.push(this.memberToAdd);
      this.memberToAdd = "";
    },
    getTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    },
  },
})
  .use(GraffitiPlugin, {
    graffiti: new GraffitiLocal(),
    // graffiti: new GraffitiRemote(),
  })
  .mount("#app");
