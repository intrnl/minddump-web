import init, { type Database } from '@sqlite.org/sqlite-wasm';

import migrations from './migrations.ts';
import { DbMigrator } from './migrator.ts';
import { type InitializeRequest, MessageType, type Request, type Response } from './types.ts';

const log = (...args: any[]) => console.log(...args);
const err = (...args: any[]) => console.error(...args);

let promise: Promise<Database> | undefined;

self.onmessage = async (ev: MessageEvent<Request | InitializeRequest>) => {
	const data = ev.data;

	switch (data.type) {
		case MessageType.INITIALIZE: {
			promise = init({ print: log, printErr: err }).then((sqlite3) => {
				let db: Database;
				if (sqlite3.opfs) {
					console.debug('[db] created persistent sqlite3 database');
					db = new sqlite3.oo1.OpfsDb(data.path);
				}
				else {
					console.debug('[db] created transient sqlite3 database');
					db = new sqlite3.oo1.DB(data.path, 'ct');
				}

				const migrator = new DbMigrator(db);
				migrator.perform(migrations);

				return db;
			});

			break;
		}
		case MessageType.EXECUTE: {
			const db = await promise!;

			try {
				const result = db.exec(data.sql, { bind: data.bind, returnValue: 'resultRows' });
				const resp: Response = { id: data.id, type: MessageType.EXECUTE_RESPONSE_SUCCESS, rows: result };

				postMessage(resp);
			}
			catch (err) {
				const resp: Response = { id: data.id, type: MessageType.EXECUTE_RESPONSE_ERROR, error: err };
				postMessage(resp);
			}

			break;
		}
	}
};
