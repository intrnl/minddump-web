import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import useSWR from 'swr';

import clsx from 'clsx';
import { LexicalRTE } from '../components/LexicalRTE/LexicalRTE.tsx';
import { acquire } from '../lib/database.ts';
import { type Gif } from '../lib/giphy-types.ts';

const GiphyHeader = ({ giphyId }: { giphyId: string }) => {
	const { data } = useSWR(`giphy/${giphyId}`, async () => {
		const { value: db, release } = await acquire();

		try {
			type Row = [json: string];

			const res = await db.execute(`SELECT json FROM giphy WHERE id = ?`, [giphyId]);
			const rows = res! as Row[];

			if (rows.length > 0) {
				return JSON.parse(rows[0][0]) as Gif;
			}
			else {
				return null;
			}
		}
		finally {
			release();
		}
	});

	if (!data) {
		return <div style={{ aspectRatio: '1 / 0.75' }} className='bg-gray-300' />;
	}

	const fixedheight = data.images.fixed_height;

	return (
		<div className='relative'>
			<img src={fixedheight.url} style={{ aspectRatio: '1 / 0.75' }} className='bg-gray-300 object-cover w-full' />
			<div className='absolute inset-0 bg-gradient-to-t from-transparent to-black opacity-50' />
		</div>
	);
};

const PostDetailsPage = () => {
	const navigate = useNavigate();
	const { postId } = useParams() as { postId: string };

	const [sticking, setSticking] = React.useState(false);

	const { data, isLoading } = useSWR(`posts/${postId}`, async () => {
		const { value: db, release } = await acquire();

		try {
			type Row = [title: string, created_at: string, content: string, giphy_id: string];

			const res = await db.execute(`SELECT title, created_at, content, giphy_id FROM notes WHERE id = ?`, [postId]);
			const rows = res as Row[];

			if (rows.length > 0) {
				const [title, created_at, content, giphy_id] = rows[0];

				return { title, created_at, content, giphy_id };
			}
			else {
				return null;
			}
		}
		finally {
			release();
		}
	});

	React.useEffect(() => {
		setSticking(window.scrollY > 0);

		const callback = () => {
			setSticking(window.scrollY > 0);
		};

		document.addEventListener('scroll', callback, { passive: true });
		return () => document.removeEventListener('scroll', callback);
	}, []);

	if (isLoading) {
		return <div>Loading</div>;
	}

	if (!data) {
		return <div>Post not found</div>;
	}

	return (
		<>
			<div
				className={clsx(
					'flex gap-4 h-17 -mt-17 px-6 pt-6 pb-4 z-10 sticky top-0 transition-colors',
					sticking ? 'bg-white' : 'bg-transparent',
				)}
			>
				<div className='grow'></div>

				<button
					onClick={() => navigate(-1)}
					className={clsx(
						'grid place-content-center rounded-full shrink-0 w-10 h-10 -my-2 -mr-2',
						sticking ? 'hover:bg-gray-200' : 'hover:bg-gray-500',
					)}
					title='Close'
				>
					<svg
						className={clsx(
							'h-6 w-6 transition-colors',
							sticking ? 'fill-black' : 'fill-white',
						)}
					>
						<path d='M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z' />
					</svg>
				</button>
			</div>

			<GiphyHeader giphyId={data.giphy_id} />

			<div className='p-6 pb-4'>
				<h1 className='text-2xl font-semibold'>{data.title}</h1>
				<p className='text-xs mt-1 mb-6'>{data.created_at}</p>

				<LexicalRTE
					initialState={data.content}
					readonly
				>
				</LexicalRTE>
			</div>
		</>
	);
};

export default PostDetailsPage;
