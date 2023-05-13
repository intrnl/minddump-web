import React from 'react';
import { type RouteObject } from 'react-router-dom';

const IndexPage = React.lazy(() => import('./routes/_index.tsx'));
const PostCreatePage = React.lazy(() => import('./routes/post.create.tsx'));

const routes: RouteObject[] = [
	{
		path: '/',
		element: <IndexPage />,
	},
	{
		path: '/post/create',
		element: <PostCreatePage />,
	},
];

export default routes;
