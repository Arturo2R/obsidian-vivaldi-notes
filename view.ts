import { ItemView, Notice, TFile, WorkspaceLeaf, debounce, normalizePath, parseYaml, setIcon  } from "obsidian";
import { getFirstLineWithoutHash } from "./utils";
import * as fs from "fs";
import VivaldiNotesPlugin from "./main";
import Fuse from "fuse.js";

export const VIEW_TYPE = "vivaldi-notes-view";

interface Note {
  date_added: number
  content: string;
  guid: string;
  id: number;
  type: "note" | "folder" | "attachment";
  url: string;
  children: Note[];
  subject?: string;
}

interface Notes {
  checksum: string;
  children: Note[];
}

interface AppNote extends Note {
  title: string;
  isAlreadyCreated?: boolean;
}

const VIVALDI_NOTES_PATH_WIN = "C:\\Users\\USUARIO\\AppData\\Local\\Vivaldi\\User Data\\Default\\";
const VIVALDI_NOTES_PATH_LIN = "/mnt/c/Users/USUARIO/AppData/Local/Vivaldi/User\ Data/Default/";


export class VivaldiNotesView extends ItemView {
  plugin: VivaldiNotesPlugin;
  // root: Root | null = null;
  // settings:
  previousChecksum: string = "";
  fuse: Fuse<AppNote> | null = null;
  filteredNotesList: AppNote[]; // THe filtered lists of notes to be displayed
  appNotes:  AppNote[]; // All the notes
  options = {
    includeScore: true,
    keys: [{name:'title', weight: 0.6},{name:'content', weight: 0.1}, {name:'id', weight: 0.3}]
  }
  renderedList:HTMLUListElement | null = null;
  intervalId: number | null = null;

  
  constructor(leaf: WorkspaceLeaf, plugin: VivaldiNotesPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  // notes = getNotesJSON()

  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "Vivaldi Notes Viewer";
  }
  getIcon(): string {
    return "file-check-2";
  }
  
  
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h4", { text: "Vivaldi Notes" });
    const {notes, checksum: prChecksum} = await this.getNotesJSON(VIVALDI_NOTES_PATH_WIN)
    this.previousChecksum = prChecksum;


    this.appNotes = notes.map((note) => {
      let title = getFirstLineWithoutHash(note.content);
      return { ...note, title }; // This creates a new object with all properties of note and the new title property
    });

    this.fuse = new Fuse(this.appNotes, this.options)

    this.filteredNotesList = this.appNotes

    const searchBar = container.createEl("input", { cls:"search-bar", attr: { type: "search", placeholder: "Search...", enterKeyhint:"search" } });
    this.renderedList = container.createEl("ul", { cls: "vivaldi-notes-list" });

    searchBar.addEventListener("input", debounce((e:InputEvent) => {
      let value = (e.target as HTMLInputElement).value
      if(value!= null && value != undefined && value != "" && this.fuse) {
        let resultado = this.fuse.search(value)
        this.filteredNotesList = resultado.map((note) => note.item)

        while (this.renderedList?.firstChild) {
          this.renderedList?.removeChild(this.renderedList.firstChild);
        }
        
        if(this.filteredNotesList != null) {this.renderNotes(this.filteredNotesList)}

      } else if (value == "") {
        // while (ul.firstChild) {
        //   ul.removeChild(ul.firstChild);
        // }
        this.renderNotes(this.appNotes)
      }
    }, 120))

    this.renderNotes(this.appNotes)

    this.intervalId = this.registerInterval(1);
  }

  onviewwillunload() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  registerInterval(id: number): number {
    const intervalTime = this.plugin.settings.interval
    return window.setInterval(async() => {
      const currentChecksum = await this.getNotesChecksum(this.plugin.settings.notesPath);
      // If the checksum has changed, re-render the list
      if (currentChecksum !== this.previousChecksum) {
        const {notes:newNotesList} = await this.getNotesJSON(this.plugin.settings.notesPath);

        this.appNotes = newNotesList.map((note) => {
          let title = getFirstLineWithoutHash(note.content);
          return { ...note, title }; // This creates a new object with all properties of note and the new title property
        });
        
        this.fuse = new Fuse(this.appNotes, this.options)

        let notesList = this.appNotes

        while (this.renderedList?.firstChild) {
          this.renderedList?.removeChild(this.renderedList?.firstChild);
        }

        await this.renderNotes(notesList);
        this.previousChecksum = currentChecksum;
      }

    }, intervalTime);
  }

  async renderNotes(list:AppNote[]){
    await list.filter((note) => note.type === "note" && note.content).forEach((note) => {
      this.renderedList?.createEl("li", { text: note.title.length == 40 ? note.title+"..." : note.title, cls:"vivaldi-notes-list-item", attr:{id: note.id} })
        .onClickEvent(async (event) => {
          if (!this.verifyCreatedNotes(note.title)) {
            setIcon((event.target as HTMLLIElement).createDiv({cls:"check-icon"}), "file-check-2");
            new Notice("Note imported")
            this.createNewNote(note.title, note);
          } else {
            // await this.app.vault.open(note.title);
            
            new Notice("Note already imported")
            this.app.workspace.openLinkText(note.title, '', false);
          //   (event.target as HTMLElement).innerHTML += `<p>Reescribir?</p>`;
          }
        });
        if (this.verifyCreatedNotes(note.title)) {
          setIcon((this.renderedList?.lastElementChild as HTMLLIElement).createDiv({cls:"check-icon"}), "file-check-2")
        }
    });
  }

  async getNotesJSON(path:string):Promise<{notes:Note[], checksum: string}> {
    let stringpath = normalizePath(path+ "/" + "Notes");
    const fileContents = await fs.readFileSync(stringpath, 'utf8');
    let dato:Notes = JSON.parse(fileContents);
    return {notes : dato.children, checksum: dato.checksum};
  }

  async getNotesChecksum(path:string):Promise<string> {
    let stringpath = normalizePath(path+ "/" + "Notes");
    const fileContents = await fs.readFileSync(stringpath);
    const checksum = fileContents.slice(19,51).toString();
    
    return checksum;
  }

  async createNewNote(title:string, note: Note)  {
    let content = this.plugin.settings.notesTemplate
      .replace("{{VIVALDI_GUID}}", note.guid ? note.guid : "")  
      .replace("{{VIVALDI_ID}}", note.id ? note.id.toString() : "")  
      .replace("{{URL}}", note.url ? note.url : "")
      .replace("{{DATE_CREATED}}", note.date_added ? new Date((note.date_added-11644473600000000) /1000).toISOString() : "")
      .replace("{{CONTENT}}", note.content ? note.content : "")


    if(note.children.length > 0) {
      // let imagesString = ""
      // Fix this Shaitβe
      let imageArray = note.children.filter(child=>child.type === "attachment").map((child) => `\n<img src="${normalizePath(this.plugin.settings.notesPath + "/" + "SyncedFiles" + "/" + child.content )}" width="100%" height="auto"/>\n`)
      content = content.replace("{{IMAGES}}", imageArray.toString())
    } else {
      content = content.replace("{{IMAGES}}", "")
    }


    // let carpeta = this.plugin.settings.vaultLocation
    let carpeta = this.plugin.settings.vaultLocation +"/"
    const stringpath = normalizePath(carpeta + title + ".md")
    const newNote = await this.app.vault.create(stringpath, content);
    // open the file after creation
    await this.app.workspace.openLinkText(newNote.path, '', true);
    return newNote;
  }  

  async getNoteFile(notePath: string): Promise<TFile> {
    const file = this.app.vault.getAbstractFileByPath(notePath); // TODO run all the paths to normalizePath
    if (!file || !(file instanceof TFile)) {
      throw new Error(`File not found: ${notePath}`);
    }
    return file;
  }

  async getNotesMetadata(notePathORContentString:TFile | string):Promise<boolean> {
    let file:string
    if(typeof notePathORContentString == "string"){
      file = await this.app.vault.read(await this.getNoteFile(notePathORContentString))
    } else {
      file = await this.app.vault.read(notePathORContentString)
    }
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = file.match(frontmatterRegex);
    if (!match) {
      return false; 
    }
    const frontmatter = parseYaml(match[1]);
    return frontmatter;
  } 

  verifyCreatedNotes(title: string): boolean {
    // Check if the note exists in Obsidian
    let carpeta = this.plugin.settings.vaultLocation +"/"
    const stringpath = normalizePath(carpeta + title + ".md")
    const noteExists = this.app.vault.getAbstractFileByPath(stringpath) !== null;
    return noteExists;
  }

  async onClose() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

}
