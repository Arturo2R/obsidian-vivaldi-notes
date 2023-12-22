import {
  Plugin,
} from "obsidian";
import { DEFAULT_SETTINGS, VivaldiNotesSetting, VivaldiNotesSettingtTab } from "setting";
import { VIEW_TYPE, VivaldiNotesView } from "./view";

// Remember to rename these classes and interfaces!

// interface MyPluginSettings {
//   mySetting: string;
// }

// const DEFAULT_SETTINGS: MyPluginSettings = {
//   mySetting: "default",
// };

export default class VivaldiNotesPlugin extends Plugin {
  settings: VivaldiNotesSetting;

  async onload() {
    await this.loadSettings();
    
    this.addSettingTab(new VivaldiNotesSettingtTab(this.app, this));

    this.registerView(VIEW_TYPE, leaf => new VivaldiNotesView(leaf, this));

    this.addCommand({
      id: "show-vivaldi-notes",
      name: "Show Vivaldi Notes",
      callback: () => {
        this.app.workspace.getRightLeaf(false).setViewState({
          type: VIEW_TYPE,
          state: "sa",
          pinned: true,
        });
      },
    });

    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    this.registerInterval(
      window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
    );
  }

  onunload() {
    
    // When unloading, we need to manually remove the view from the workspace.
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
  async activateView() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);

    await this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE,
      active: true,
    })
    
    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]
    );
  }

  // async createNewNote(title: string, content: string, url?: string)  {
  //   const newNote = await this.app.vault.create(this.settings.vaultLocation+title, content);
  //   // await this.app.vault.modify(newNote, content);
  //   return newNote;
  // }
}

// class SampleModal extends Modal {
//   constructor(app: App) {
//     super(app);
//   }

//   onOpen() {
//     const { contentEl } = this;
//     contentEl.setText("Woah!");
//   }

//   onClose() {
//     const { contentEl } = this;
//     contentEl.empty();
//   }
// }

// class MyView extends MarkdownView {
//   getViewType(): string {
//     return "my-plugin";
//   }
// }

// class SampleSettingTab extends PluginSettingTab {
//   plugin: MyPlugin;

//   constructor(app: App, plugin: MyPlugin) {
//     super(app, plugin);
//     this.plugin = plugin;
//   }

//   display(): void {
//     const { containerEl } = this;

//     containerEl.empty();

//     new Setting(containerEl)
//       .setName("Setting #1")
//       .setDesc("It's a secret")
//       .addText(text =>
//         text
//           .setPlaceholder("Enter your secret")
//           .setValue(this.plugin.settings.mySetting)
//           .onChange(async value => {
//             this.plugin.settings.mySetting = value;
//             await this.plugin.saveSettings();
//           })
//       );
//   }
// }
