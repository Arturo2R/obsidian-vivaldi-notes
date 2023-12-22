const fs = require('fs');

async function  getNotesChecksum(path) {
    let stringpath = path;
    const fileContents = await fs.readFileSync(stringpath);
    const checksum = fileContents.slice(19,51).toString();
    console.log(checksum);
    return checksum;
}
getNotesChecksum("notes.json");