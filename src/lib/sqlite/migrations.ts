import { type MigrationPlan } from './migrator.ts';

const migrations: MigrationPlan[] = [
	// 0001. initial database setup
	{
		order: 1683951759988,
		migrate (db) {
			db.exec(`
				CREATE TABLE giphy (
					id TEXT PRIMARY KEY,
					json TEXT
				)
			`);

			db.exec(`
				CREATE TABLE notes (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
					title TEXT NOT NULL,
					content TEXT NOT NULL,
					giphy_id TEXT NOT NULL,
					FOREIGN KEY(giphy_id) REFERENCES giphy(id)
				)
			`);
		},
	},
];

export default migrations;
