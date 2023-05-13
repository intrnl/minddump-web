import { Locker } from './lock.ts';
import { Database } from './sqlite/database.ts';

let _db: Database;
let _locker: Locker<Database> | undefined;

export const initialize = () => {
	if (_locker) {
		return;
	}

	_db = new Database('/db.sqlite3');
	_locker = new Locker(_db);
};

export const acquire = () => {
	if (!_locker) {
		initialize();
	}

	return _locker!.acquire();
};
