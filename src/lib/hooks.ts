import React from 'react';

type AnyFunction = (...args: any[]) => any;

export const useEvent = <F extends AnyFunction>(fn: F): F => {
	// Keep track of the latest callback:
	const fnRef = React.useRef<F>(fn);

	// Create a stable callback that always calls the latest callback:
	// using useRef instead of useCallback avoids creating and empty array on every render
	const stableRef = React.useRef<F>(null as any);

	if (!stableRef.current) {
		stableRef.current = function (this: any) {
			return fnRef.current.apply(this, arguments as any);
		} as F;
	}

	React.useEffect(() => {
		fnRef.current = fn;
	}, [fn]);

	return stableRef.current;
};
