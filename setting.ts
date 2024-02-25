import VivaldiNotesPlugin from 'main';
import { PluginSettingTab, Setting, App } from 'obsidian';

export interface VivaldiNotesSetting {
  notesPath: string;
  vaultLocation: string;
  notesTemplate: string;
  interval: number;
}

export const DEFAULT_SETTINGS: Partial<VivaldiNotesSetting> = {
  // notesPath: 'C:\\Users\\USUARIO\\AppData\\Local\\Vivaldi\\User Data\\Default\\',
  vaultLocation: '/',
  interval: 45000,
  notesTemplate: "---\nguid: {{VIVALDI_GUID}}\nurl: {{URL}}\ndate_created: {{DATE_CREATED}}\n---\n{{CONTENT}}\n---\n{{IMAGES}}\n\n"
};

export class VivaldiNotesSettingtTab extends PluginSettingTab {
  plugin: VivaldiNotesPlugin;

  constructor(app: App, plugin: VivaldiNotesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    
  }
  
  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    
    containerEl.createEl('h2', { text: 'Vivaldi Notes Plugin' })
    
    new Setting(containerEl)
      .setName('Vivaldi notes path notes path')
      .setDesc('The path where vivaldi store your notes. You can find it entering vivaldi://about/ on your vivaldi browser under the User Profile section.')
      .addText((text) =>
        text
          .setPlaceholder('C:\\Users\\User\\AppData\\Local\\Vivaldi\\User Data\\Default\\')
          .setValue(this.plugin.settings.notesPath)
          .onChange((value) => {
            this.plugin.settings.notesPath = value;
            this.plugin.saveData(this.plugin.settings);
          })
          );

    new Setting(containerEl)
      .setName('New note path')
      .setDesc('The path where the new notes will be created.')
      .addText((text) =>
      text
      .setPlaceholder('/')
          .setValue(this.plugin.settings.vaultLocation)
          .onChange((value) => {
            this.plugin.settings.vaultLocation = value;
            this.plugin.saveData(this.plugin.settings);
          })
          // .addSearch((search) => {
            //   search.setPlaceholder('Search for vault location').setDisabled(true);
            // })
            );
            
      new Setting(containerEl)
        .setName('Template for new notes')
        .setDesc('The templates of the note that will be created. \n You can use the following variables: {{VIVALDI_GUID}}, {{URL}}, {{DATE_CREATED}}, {{CONTENT}}, {{IMAGES}}. Content is required')
        .addTextArea((text) =>{      
          text.inputEl.rows = 20;
          text.inputEl.cols = 50;
          return text
            .setPlaceholder('---\nguid: {{VIVALDI_GUID}}\nurl: {{URL}}\ndate_created:{{DATE_CREATED}}\n---\n{{CONTENT}}\n---\n{{IMAGES}}\n\n')
            .setValue(this.plugin.settings.notesTemplate)
            .onChange((value) => {
              this.plugin.settings.notesTemplate = value;
              this.plugin.saveData(this.plugin.settings);
            })
          }
        );

      new Setting(containerEl)
        .setName('Interval for checking new notes')
        .setDesc('The interval in milliseconds for checking new notes')
        .addSlider((number) =>
          number
              .setDynamicTooltip()
              .setLimits(100, 600000, 5000)
              .setValue(this.plugin.settings.interval)
              .onChange((value) => {
                this.plugin.settings.interval= value;
                this.plugin.saveData(this.plugin.settings);
              })
            );
          
      containerEl.createEl('p', { text: 'by Arturo David Rebolledo Rosenstiehl from Barranquilla, Colombia', attr: { style: 'text-align: center; font-size: 0.8em; color: #888; margin-top: 20px' }});

      }
    }