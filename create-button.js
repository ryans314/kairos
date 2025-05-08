import { defineAsyncComponent } from "vue";

export const CreateButton = defineAsyncComponent(async () => ({
  props: [],
  data() {
    return {
      newGroupName: "",
      selectedGroupChat: undefined, //current group chat object (.value.object)
      memberToAdd: "",
      selectedUsers: [],
    };
  },
  methods: {
    selectMember() {
      if (this.memberToAdd === "" || this.selectedUsers.includes(this.memberToAdd)) {
        this.memberToAdd = "";
        return;
      }
      this.selectedUsers.push(this.memberToAdd);
      this.memberToAdd = "";
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
          channels: ["designftw", this.$graffitiSession.value.actor],
          allowed: undefined,
        },
        this.$graffitiSession.value
      );
      this.newGroupName = "";
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
  },
  template: await fetch("./create-button.html").then((r) => {
    console.log("create success");
    return r.text();
  }),
}));
