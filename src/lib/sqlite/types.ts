export enum MessageType {
	INITIALIZE,
	EXECUTE,
	EXECUTE_RESPONSE_SUCCESS,
	EXECUTE_RESPONSE_ERROR,
}

export type Request = { id: number; type: MessageType.EXECUTE; sql: string; bind?: any[] };

export type InitializeRequest = { type: MessageType.INITIALIZE; path: string };

export type Response =
	| { id: number; type: MessageType.EXECUTE_RESPONSE_SUCCESS; rows?: unknown[] }
	| { id: number; type: MessageType.EXECUTE_RESPONSE_ERROR; error: any };
