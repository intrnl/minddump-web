import React from 'react';
import { Link } from 'react-router-dom';

import { Masonry, type RenderComponentProps } from 'masonic';

import useSWR from 'swr';
import { useDebounce } from 'usehooks-ts';

import { acquire } from '../lib/database.ts';
import type { Gif } from '../lib/giphy-types.ts';

interface Post {
	id: number;
	created_at: string;
	title: string;
	giphy_id: string;
}

const GifThumb = ({ giphyId }: { giphyId: string }) => {
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
		return <div className='bg-gray-300 h-24' />;
	}

	const fixedheight = data.images.fixed_height;
	const aspectRatio = `${fixedheight.width} / ${fixedheight.height}`;

	return <img src={fixedheight.url} style={{ aspectRatio }} className='w-full' />;
};

const PostGridItem = ({ data, width }: RenderComponentProps<Post>) => {
	return (
		<Link
			to={`/post/${data.id}`}
			style={{ width }}
			className='block overflow-hidden rounded-md border border-gray-200 hover:bg-gray-100'
		>
			<GifThumb giphyId={data.giphy_id} />

			<div className='p-3'>
				<p className='font-medium'>{data.title}</p>
				<p className='text-gray-700 text-xs'>{data.created_at}</p>
			</div>
		</Link>
	);
};

const IndexPage = () => {
	const [isSearching, setIsSearching] = React.useState(false);
	const [search, setSearch] = React.useState('');

	const debouncedSearch = useDebounce(search, 500);

	const { data } = useSWR(`posts?q=${debouncedSearch}`, async () => {
		const { value: db, release } = await acquire();

		try {
			type Row = [id: number, created_at: string, title: string, giphy_id: string];

			const res = await db.execute(
				`SELECT id, datetime(created_at, 'localtime') AS created_at, title, giphy_id FROM notes WHERE title LIKE ? ORDER BY id DESC`,
				[`%${debouncedSearch}%`],
			);

			const rows: Post[] = (res as Row[]).map(([id, created_at, title, giphy_id]) => ({ id, created_at, title, giphy_id }));
			return rows;
		}
		finally {
			release();
		}
	});

	return (
		<>
			<div className='flex gap-4 h-17 px-6 pt-6 pb-4 z-10 sticky top-0 bg-white'>
				{isSearching
					? (
						<>
							<input
								type='text'
								value={search}
								onChange={(ev) => setSearch(ev.currentTarget.value)}
								placeholder='Search'
								className='text-xl grow'
								autoFocus
							/>

							<button
								className='grid place-content-center rounded-full hover:bg-gray-200 shrink-0 w-10 h-10 -my-2 -mr-2'
								title='Cancel search'
								onClick={() => {
									setIsSearching(false);
									setSearch('');
								}}
							>
								<svg className='h-6 w-6'>
									<path d='M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z' />
								</svg>
							</button>
						</>
					)
					: (
						<>
							<div className='grow text-xl' aria-label='MindDump'>
								<span>Mind</span>
								<span className='font-semibold'>Dump</span>
							</div>

							<button
								className='grid place-content-center rounded-full hover:bg-gray-200 shrink-0 w-10 h-10 -my-2 -mr-2'
								title='Search'
								onClick={() => {
									setIsSearching(true);
								}}
							>
								<svg className='h-6 w-6'>
									<path d='M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z' />
								</svg>
							</button>
						</>
					)}
			</div>

			<div className='grow p-6 pb-0'>
				{data && data.length < 1 && <div>It's empty here</div>}

				<Masonry
					key={debouncedSearch}
					items={data || []}
					render={PostGridItem}
					columnWidth={190}
					columnGutter={8}
				/>
			</div>

			<div className='flex justify-end sticky bottom-0'>
				<Link
					to='post/create'
					className='flex gap-2 items-center justify-center bg-accent rounded-full shadow-3 w-44 h-14 m-4'
				>
					<svg viewBox='0 0 24 24' className='w-6 h-6'>
						<path d='M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z' />
					</svg>
					<span className='text-sm font-medium'>MindDump</span>
				</Link>
			</div>
		</>
	);
};

export default IndexPage;
