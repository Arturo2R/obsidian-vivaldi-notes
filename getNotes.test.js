import { expect, test } from "bun:test";
import { getFirstLineWithoutHash } from "./utils";

test('should return "" for empty string', () => {
  const input = '';
  const output = getFirstLineWithoutHash(input);
  expect(output).toEqual('');
});

test('should return null if first line starts with a hash', () => {
  const input = '# Peliculas Que Ver\n\n- Ten Little Mistress\n- his Only Son\n- Jhon Week 4\n- Citadel \n- Oh belinda\n- Cuantum manía\n- Seneca\n- Ghosted \n- Other people\n- The pope Exorcist\n- Batman Doom\n- Dungeons And Dragons';
  const output = getFirstLineWithoutHash(input);
  expect(output).toEqual("Peliculas Que Ver");
});

test('should return the first line without hash', () => {
  const input = 'Peliculas Que Ver\n\n- Ten Little Mistress\n- his Only Son\n- Jhon Week 4\n- Citadel \n- Oh belinda\n- Cuantum manía\n- Seneca\n- Ghosted \n- Other people\n- The pope Exorcist\n- Batman Doom\n- Dungeons And Dragons';
  const output = getFirstLineWithoutHash(input);
  expect(output).toEqual('Peliculas Que Ver');
});

test('should return the first line without hash even if there are multiple hashes', () => {
  const input = '### Peliculas Que Ver\n\n- Ten Little Mistress\n- his Only Son\n- Jhon Week 4\n- Citadel \n- Oh belinda\n- Cuantum manía\n- Seneca\n- Ghosted \n- Other people\n- The pope Exorcist\n- Batman Doom\n- Dungeons And Dragons';
  const output = getFirstLineWithoutHash(input);
  expect(output).toEqual('Peliculas Que Ver');
});

test('should return the first line without hash even if there are multiple hashes', () => {
  const input = 'Job as a DEV\n\n\n1. Join online communities, engage with people there.\n2. Attend online conferences/tech events.\n3. Contribute to Open Source.\n4';
  const output = getFirstLineWithoutHash(input);
  expect(output).toEqual('Job as a DEV');
});

test('should return the first line without hash even if there are multiple hashes', () => {
  const input = "# Quelque Part\n\nquelque part avant l'aube \nquand la **lumière** veur nous voir \nquel";
  const output = getFirstLineWithoutHash(input);
  expect(output).toEqual('Quelque Part');
});

test('should return the first line without hash even if there are multiple hashes', () => {
  const input = "Quele\n\nque el que se le aurora es la mejor del mundo jajarajaja jajaj ajaja jaja";
  const output = getFirstLineWithoutHash(input);
  expect(output).toEqual('Quele');
});

test('should return the second line line without hash even if there are multiple hashes or is \\r or \\n', () => {
  const input = "\r\nla familia rebolledo procedente de Inglaterra reboyed era los jerarcas mas influyentes en la época de 1850, el rey francisco reboyed I, fue el dirigente con mas restigio dentro del pais, y de alli emigraron a colombia creando un asentamiento en la poblacion de Tubará (Atlantico) convirtiendose en los dirigentes del pueblo.\r\n\r\n";
  const output = getFirstLineWithoutHash(input);
  expect(output).toEqual('la familia rebolledo procedente de Ingla');
});