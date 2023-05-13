import { type InitializeRequest, MessageType, type Request, type Response } from './types.ts';

interface Deferred<T> {
	resolve(value: T | PromiseLike<T>): void;
	reject(reason?: any): void;
}

export class Database {
	private uid = 0;
	private pending: Record<number, Deferred<Response>> = {};

	private worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

	constructor (path: string) {
		const initReq: InitializeRequest = { type: MessageType.INITIALIZE, path };

		this.worker.onmessage = this.handleMessage;
		this.worker.postMessage(initReq);
	}

	private handleMessage = (ev: MessageEvent<Response>) => {
		const data = ev.data;
		const id = data.id;

		const deferred = this.pending[id];

		if (!deferred) {
			throw new Error(`Unexpected response for ID ${id}`);
		}

		delete this.pending[id];
		deferred.resolve(data);
	};

	perform (request: Omit<Request, 'id'>): Promise<Response> {
		const id = this.uid++;
		const req: Request = { id, ...request };

		return new Promise((resolve, reject) => {
			const deferred: Deferred<Response> = { resolve, reject };

			this.pending[id] = deferred;
			this.worker.postMessage(req);
		});
	}

	async execute (sql: string, bind?: any[]) {
		const data = await this.perform({ type: MessageType.EXECUTE, sql, bind });

		if (data.type === MessageType.EXECUTE_RESPONSE_SUCCESS) {
			return data.rows;
		}
		else {
			return Promise.reject(data.error);
		}
	}
}
