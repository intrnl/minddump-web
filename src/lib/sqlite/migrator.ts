import { type Database } from '@sqlite.org/sqlite-wasm';

export interface MigrationPlan {
	order: number;
	migrate(db: Database): void;
}

export class DbMigrator {
	constructor (private db: Database, private table = '_migrations') {}

	perform (migrations: MigrationPlan[]) {
		const db = this.db;

		// create a migration table if it hasn't already existed,
		// check for already applied migrations
		db.exec(
			`CREATE TABLE IF NOT EXISTS \`${this.table}\` (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, created_at INTEGER DEFAULT CURRENT_TIMESTAMP)`,
		);

		const res = db.exec(`SELECT name FROM \`${this.table}\` ORDER BY id ASC`, { returnValue: 'resultRows' });

		const rows = res as string[][];
		const names = rows.map((row) => row[0]);

		// perform the migrations
		let count = 0;

		migrations.sort((a, b) => a.order - b.order);

		for (const migration of migrations) {
			const name = '' + migration.order;

			if (names.includes(name)) {
				continue;
			}

			count++;
			console.debug(`[migrator] performing migration ${name}`);

			db.transaction(() => {
				db.exec(`INSERT INTO \`${this.table}\` (name) VALUES (?)`, { bind: [name] });
				migration.migrate(db);
			});
		}

		console.debug(`[migrator] performed ${count} migrations`);
	}
}
