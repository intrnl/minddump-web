import React from 'react';
import { type RouteObject } from 'react-router-dom';

const IndexPage = React.lazy(() => import('./routes/_index.tsx'));
const PostCreatePage = React.lazy(() => import('./routes/post.create.tsx'));
const PostDetailsPage = React.lazy(() => import('./routes/post.$postId.tsx'));

const routes: RouteObject[] = [
	{
		path: '/',
		element: <IndexPage />,
	},
	{
		path: '/post/create',
		element: <PostCreatePage />,
	},
	{
		path: '/post/:postId',
		element: <PostDetailsPage />,
	},
];

export default routes;
