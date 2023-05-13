import React from 'react';
import { useRoutes } from 'react-router-dom';

import routes from './routes.tsx';

const AppRouter = () => {
	const rendered = useRoutes(routes);

	return (
		<React.Suspense fallback={<div>loading</div>}>
			{rendered}
		</React.Suspense>
	);
};

const App = () => {
	return (
		<div className='flex flex-col w-full max-w-md mx-auto min-h-screen relative border-x border-gray-300'>
			<AppRouter />
		</div>
	);
};

export default App;
