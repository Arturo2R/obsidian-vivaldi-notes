

const VIVALDI_NOTES_PATH_WIN = "C:\Users\USUARIO\AppData\Local\Vivaldi\User Data\Default\\";
const VIVALDI_NOTES_PATH_LIN = "/mnt/c/Users/USUARIO/AppData/Local/Vivaldi/User\ Data/Default/";
export const MAX_WIDTH_TITLE = 60;


interface Note {
  date_added: number;
  content: string;
  guid: string;
  id: number;
  type: string;
  url: string;
  children: Note[];
}

interface Notes {
  checksum: string;
  children: Note[];
}


export function getFirstLineWithoutHash(str:string):string {
  const regex = /^(?:#|\r|\n)*[ ]*.*?([^\n]{0,40})/gms;
  if (str == "" || str == null) {
    return "";
  }
  const match = regex.exec(str);
  if (match) {
    let firstLine= match[1].replace(/[\\\/<>:|?"-]/g, '');
    return firstLine.replace(/[.\s]+$/, '');
  }

  return "";
}



// getFirstLineWithoutHash("# Peliculas Que Ver\n\n- Ten Little Mistress\n- his Only Son\n- Jhon Week 4\n- Citadel \n- Oh belinda\n- Cuantum manía\n- Seneca\n- Ghosted \n- Other people\n- The pope Exorcist\n- Batman Doom\n- Dungeons And Dragons")



// getNotesJSON()