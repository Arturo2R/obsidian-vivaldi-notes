import { ItemView, TFile, WorkspaceLeaf, parseYaml, setIcon,  } from "obsidian";
import { getFirstLineWithoutHash } from "./utils";
import * as fs from "fs";
import VivaldiNotesPlugin from "./main";
// import {Root} from "react-dom/client";
import Fuse from "fuse.js";
import debounce from 'lodash.debounce';

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

const checkCircle = `<svg xmlns="http://www.w3.org/2000/svg" class="check-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`

let intervalId: NodeJS.Timeout | null;
export class VivaldiNotesView extends ItemView {
  plugin: VivaldiNotesPlugin;
  // root: Root | null = null;
  // settings:
  previousChecksum: string = "";
  fuse: Fuse<Note, Fuse.FuseOptions<Note>> | null = null;
  notesList: Note[] = [];
  appNotes:  AppNote[];
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
    return "calendar-clock";
  }
  
  
  async onOpen() {
    console.log("Opened Vivaldi Notes Viewer")
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

    this.notesList = this.appNotes

    const searchBar = container.createEl("input", { cls:"search-bar", attr: { type: "search", placeholder: "Search...", enterKeyhint:"search" } });
    this.renderedList = container.createEl("ul", { cls: "vivaldi-notes-list" });

    searchBar.addEventListener("input", debounce((e) => {
      let value = e.target?.value 
      if(e.target?.value != null && e.target?.value != undefined && e.target?.value != "") {
        let resultado = this.fuse.search(e.target.value)
        this.notesList = resultado.map((note) => note.item)

        while (this.renderedList?.firstChild) {
          this.renderedList?.removeChild(this.renderedList.firstChild);
        }
        
        if(this.notesList != null) {this.renderNotes(this.notesList)}

      } else if (e.target?.value == "") {
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
      const currentChecksum = await this.getNotesChecksum(VIVALDI_NOTES_PATH_WIN);
      console.log(currentChecksum)
      // If the checksum has changed, re-render the list
      if (currentChecksum !== this.previousChecksum) {
        const {notes:newNotesList} = await this.getNotesJSON(VIVALDI_NOTES_PATH_WIN);

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
            (event.target as HTMLElement).innerHTML += checkCircle;
            this.createNewNote(note.title, note);
          } else {
            // await this.app.vault.open(note.title);
            this.app.workspace.openLinkText(note.title, '', true);
          //   (event.target as HTMLElement).innerHTML += `<p>Reescribir?</p>`;
          }
        });
        if (this.verifyCreatedNotes(note.title)) {
          (this.renderedList?.lastElementChild as HTMLLIElement).innerHTML += checkCircle;
        }
    });
  }

  async getNotesJSON(path:string):Promise<{notes:Note[], checksum: string}> {
    let stringpath = path+"Notes";
    const fileContents = await fs.readFileSync(stringpath, 'utf8');
    let dato:Notes = JSON.parse(fileContents);
    return {notes : dato.children, checksum: dato.checksum};
  }

  async getNotesChecksum(path:string):Promise<string> {
    let stringpath = path+"Notes";
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
      let imageArray = note.children.filter(child=>child.type === "attachment").map((child) => `\n<img src="${this.plugin.settings.notesPath}\\SyncedFiles\\${child.content}" width="100%" height="auto"/>\n`)
      content = content.replace("{{IMAGES}}", imageArray.toString())
    } else {
      content = content.replace("{{IMAGES}}", "")
    }


    let carpeta = this.plugin.settings.vaultLocation
    carpeta += this.plugin.settings.vaultLocation == "/" ? "" : "/"
    const stringpath = carpeta + title + ".md"
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

  async getNotesMetadata(notePathORContentString:TFile | string, type:"file"|"string"):Promise<boolean> {
    if (type == "file" && notePathORContentString instanceof TFile) {
      const file = notePathORContentString;
    } else if (type == "string" && typeof notePathORContentString == "string") {
      const file = this.app.vault.read();
    }
    const file = await typeof notePath == "string" ? notePath : this.app.vault.read(await this.getNoteFile(notePath)) ;
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
    let carpeta = this.plugin.settings.vaultLocation
    carpeta += this.plugin.settings.vaultLocation == "/" ? "" : "/"
    const stringpath =  title + ".md"
    const noteExists = this.app.vault.getAbstractFileByPath(stringpath) !== null;
    return noteExists;
  }

  async onClose() {
    console.log("Closed Vivaldi Notes Viewer, stopped interval")
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

}
