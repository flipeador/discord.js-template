import { DatabaseSync } from 'node:sqlite';

const ROOT = import.meta.dirname;

class DataBase extends DatabaseSync { }

export const database = new DataBase(`${ROOT}/db.sqlite`);
