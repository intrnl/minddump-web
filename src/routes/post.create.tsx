import React from 'react';
import { useNavigate } from 'react-router-dom';

import { type SerializedEditorState } from 'lexical/LexicalEditorState';

import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { Masonry, type RenderComponentProps } from 'masonic';

import useSWRInfinite from 'swr/infinite';
import useMutation from 'use-mutation';
import { useDebounce } from 'usehooks-ts';

import clsx from 'clsx';
import * as qss from 'qss';

import { LexicalRTE } from '../components/LexicalRTE/LexicalRTE.tsx';
import { ToolbarPlugin } from '../components/LexicalRTE/ToolbarPlugin.tsx';

import { acquire } from '../lib/database.ts';
import { type Gif, type GiphyResponse } from '../lib/giphy-types.ts';
import { useEvent } from '../lib/hooks.ts';

const GIPHY_ENDPOINT = import.meta.env.VITE_GIPHY_ENDPOINT;
const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

const GifPicker = ({ search, onPick }: { search: string; onPick: (gif: Gif) => void }) => {
	const LIMIT = 25;

	const getKey = React.useCallback((index: number, previous: GiphyResponse) => {
		if (previous) {
			const pagination = previous.pagination;

			if ((pagination.count + pagination.offset + LIMIT) > pagination.total_count) {
				return null;
			}
		}

		const qs = qss.encode({
			api_key: GIPHY_API_KEY,
			offset: index * LIMIT,
			limit: LIMIT,
			q: search || undefined,
		});

		if (search) {
			return `${GIPHY_ENDPOINT}/gifs/search?${qs}`;
		}
		else {
			return `${GIPHY_ENDPOINT}/gifs/trending?${qs}`;
		}
	}, [search]);

	const { data, isLoading, isValidating, setSize } = useSWRInfinite(
		getKey,
		async (url) => {
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Response error ${response.status}`);
			}

			const json = await response.json() as GiphyResponse;
			return json;
		},
	);

	const flattenedGifs = React.useMemo(() => {
		if (data) {
			const flattened: Gif[] = [];
			const seen = new Set<string>();

			for (let i = 0, il = data.length; i < il; i++) {
				const arr = data[i].data;

				for (let j = 0, jl = arr.length; j < jl; j++) {
					const item = arr[j];

					if (seen.has(item.id)) {
						continue;
					}

					seen.add(item.id);
					flattened.push(item);
				}
			}

			return flattened;
		}

		return [];
	}, [data]);

	const canLoadMore = React.useMemo(() => {
		if (data && data.length > 0) {
			const last = data[data.length - 1];
			const pagination = last.pagination;

			return (pagination.count + pagination.offset + LIMIT) < pagination.total_count;
		}

		return false;
	}, [data]);

	// Ideally we shouldn't be creating a component inside another component,
	// but we have to in order to access `onPick` at all, we wrap it in `useEvent`
	// to keep the references stable
	const handlePick = useEvent(onPick);

	const MasonryItem = React.useCallback(({ data, width }: RenderComponentProps<Gif>) => {
		const fixedheight = data.images.fixed_height;
		const aspectRatio = `${fixedheight.width} / ${fixedheight.height}`;

		return (
			<button
				onClick={() => handlePick(data)}
				title={data.title}
				style={{ aspectRatio, width }}
				className='overflow-hidden rounded-md'
			>
				<img src={fixedheight.url} style={{ aspectRatio }} className='bg-gray-300 w-full h-full' />
			</button>
		);
	}, [handlePick]);

	// Create an intersection observer to detect the end of page
	const targetRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (!canLoadMore || isValidating) {
			return;
		}

		const target = targetRef.current!;
		const observer = new IntersectionObserver((entries) => {
			const entry = entries[0];

			if (entry.isIntersecting) {
				setSize((size) => size + 1);
			}
		}, { threshold: 1.0 });

		observer.observe(target);
		return () => observer.disconnect();
	}, [search, canLoadMore, isValidating]);

	return (
		<div>
			{isLoading && <div>Loading...</div>}

			<div className='p-6'>
				<Masonry
					key={search}
					items={flattenedGifs}
					render={MasonryItem}
					columnWidth={112}
					columnGutter={8}
					itemKey={(data) => data?.id}
				/>
			</div>

			<div ref={targetRef} className='h-px' />
		</div>
	);
};

const MemoizedGifPicker = React.memo(GifPicker);

const GifSearchSection = ({ onPick }: { onPick: (gif: Gif) => void }) => {
	const [sticking, setSticking] = React.useState(false);

	const [search, setSearch] = React.useState('');
	const debouncedSearch = useDebounce(search, 500);

	// so long as only <GifSearchSection /> is rerendered thanks to update from
	// the `search` or `sticking` state then the `onPick` prop will be
	// relatively stable.

	React.useEffect(() => {
		setSticking(window.scrollY > 0);

		const callback = () => {
			setSticking(window.scrollY > 0);
		};

		document.addEventListener('scroll', callback, { passive: true });
		return () => document.removeEventListener('scroll', callback);
	}, []);

	return (
		<>
			<div className='px-6 mt-1 sticky top-6 z-10'>
				<input
					type='search'
					value={search}
					onChange={(ev) => setSearch(ev.currentTarget.value)}
					placeholder='Find a GIF'
					className={clsx('bg-[#f6f6f6] p-3 rounded-md text-sm w-full', sticking && 'shadow-3')}
				/>
			</div>

			<MemoizedGifPicker search={debouncedSearch} onPick={onPick} />
		</>
	);
};

const createPost = async ({ gif, content }: { gif: Gif; content: SerializedEditorState }) => {
	const { value: db, release } = await acquire();

	try {
		const title = gif.title.replace(/\s+GIF(\s+by.*)?$/, '');

		await db.execute(`INSERT OR REPLACE INTO giphy(id, json) VALUES(?, ?)`, [gif.id, JSON.stringify(gif)]);
		await db.execute(`INSERT INTO notes(title, content, giphy_id) VALUES(?, ?, ?)`, [title, JSON.stringify(content), gif.id]);
	}
	finally {
		release();
	}
};

const PostDetailsSection = ({ gif, onCancel }: { gif: Gif; onCancel?: () => void }) => {
	const navigate = useNavigate();

	const [dispatch, { status }] = useMutation(createPost, {
		onSuccess () {
			if (!history.state || history.state.idx === 0) {
				navigate('/', { replace: true });
			}
			else {
				navigate(-1);
			}
		},
	});

	const stateRef = React.useRef<SerializedEditorState>();

	const fixedheight = gif.images.fixed_height;
	const aspectRatio = `${fixedheight.width} / ${fixedheight.height}`;

	return (
		<div className='flex grow flex-col gap-3 p-6 pt-1'>
			<button onClick={onCancel} className='max-w-[128px] rounded-md overflow-hidden'>
				<img src={fixedheight.url} style={{ aspectRatio }} className='bg-gray-300 w-full h-full' />
			</button>

			<LexicalRTE
				head={<ToolbarPlugin />}
				placeholder='Write your mind'
				className='relative grow flex flex-col'
				contentClassName='p-3 pb-1 bg-gray-100 rounded-md overflow-y-auto grow'
				placeholderClassName='absolute top-0 left-0 p-3 text-gray-600 pointer-events-none'
			>
				<OnChangePlugin
					ignoreSelectionChange
					onChange={(state) => {
						stateRef.current = state.toJSON();
					}}
				/>
			</LexicalRTE>

			<button
				disabled={status === 'running'}
				onClick={() => {
					dispatch({ gif, content: stateRef.current! });
				}}
				className='flex gap-2 items-center justify-center bg-accent rounded-full shadow-3 h-10 disabled:bg-gray-200'
			>
				<span className='text-sm font-medium'>Save</span>
			</button>
		</div>
	);
};

const PostCreatePage = () => {
	const navigate = useNavigate();

	const [gif, setGif] = React.useState<Gif>();

	return (
		<>
			<div className='flex gap-4 px-6 pt-6 mb-4'>
				<div className='grow text-xl' aria-label='Create MindDump'>
					<span>Create{' '}</span>

					<span>Mind</span>
					<span className='font-semibold'>Dump</span>
				</div>

				<button
					onClick={() => navigate(-1)}
					className='grid place-content-center rounded-full hover:bg-gray-200 shrink-0 w-10 h-10 -my-2 -mr-2'
					title='Close'
				>
					<svg className='h-6 w-6'>
						<path d='M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z' />
					</svg>
				</button>
			</div>

			{!gif && <GifSearchSection onPick={setGif} />}
			{gif && <PostDetailsSection gif={gif} onCancel={() => setGif(undefined)} />}
		</>
	);
};

export default PostCreatePage;
