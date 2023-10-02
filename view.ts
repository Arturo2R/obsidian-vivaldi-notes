import { ItemView, WorkspaceLeaf, MarkdownView } from "obsidian";

export const VIEW_TYPE = "vivaldi-notes-view";

export class VivaldiNotesView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return "Vivaldi Notes View";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h4", { text: "Vivaldi Notes" });
  }
  onviewwillunload() {
    console.log("My view is being unloaded");
  }

  async onClose() {
    // Nothing to clean up.
  }
}
