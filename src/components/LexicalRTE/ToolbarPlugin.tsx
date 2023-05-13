import React from 'react';

import { mergeRegister } from '@lexical/utils';
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import clsx from 'clsx';

export interface ToolbarPluginProps {}

const enum Formatting {
	BOLD = 1 << 0,
	ITALIC = 1 << 1,
	UNDERLINE = 1 << 2,
}

interface ToggleButtonProps {
	active?: boolean;
	title?: string;
	children?: React.ReactNode;
	onClick?: () => void;
}

const ToggleButton = (props: ToggleButtonProps) => {
	const { active, title, children, onClick } = props;

	return (
		<button
			title={title}
			onClick={onClick}
			className={clsx('hover:bg-gray-300 p-1 rounded-md', active && 'bg-blue-200 hover:bg-blue-300')}
		>
			{children}
		</button>
	);
};

export const ToolbarPlugin = () => {
	const [editor] = useLexicalComposerContext();

	const [formatting, setFormatting] = React.useState(0);

	React.useEffect(() => {
		const update = () => {
			const selection = $getSelection();

			if ($isRangeSelection(selection)) {
				let bit = 0;

				if (selection.hasFormat('bold')) {
					bit |= Formatting.BOLD;
				}
				if (selection.hasFormat('italic')) {
					bit |= Formatting.ITALIC;
				}
				if (selection.hasFormat('underline')) {
					bit |= Formatting.UNDERLINE;
				}
				setFormatting(bit);
			}
		};

		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					update();
				});
			}),
		);
	}, [editor]);

	return (
		<div className='flex gap-2 p-2 bg-gray-100 rounded-md'>
			<ToggleButton
				title='Bold'
				active={!!(formatting & Formatting.BOLD)}
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
			>
				<svg viewBox='0 0 24 24' className='h-5 w-5'>
					<path d='M13.5,15.5H10V12.5H13.5A1.5,1.5 0 0,1 15,14A1.5,1.5 0 0,1 13.5,15.5M10,6.5H13A1.5,1.5 0 0,1 14.5,8A1.5,1.5 0 0,1 13,9.5H10M15.6,10.79C16.57,10.11 17.25,9 17.25,8C17.25,5.74 15.5,4 13.25,4H7V18H14.04C16.14,18 17.75,16.3 17.75,14.21C17.75,12.69 16.89,11.39 15.6,10.79Z' />
				</svg>
			</ToggleButton>

			<ToggleButton
				title='Italic'
				active={!!(formatting & Formatting.ITALIC)}
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
			>
				<svg viewBox='0 0 24 24' className='h-5 w-5'>
					<path d='M10,4V7H12.21L8.79,15H6V18H14V15H11.79L15.21,7H18V4H10Z' />
				</svg>
			</ToggleButton>

			<ToggleButton
				title='Underline'
				active={!!(formatting & Formatting.UNDERLINE)}
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
			>
				<svg viewBox='0 0 24 24' className='h-5 w-5'>
					<path d='M5,21H19V19H5V21M12,17A6,6 0 0,0 18,11V3H15.5V11A3.5,3.5 0 0,1 12,14.5A3.5,3.5 0 0,1 8.5,11V3H6V11A6,6 0 0,0 12,17Z' />
				</svg>
			</ToggleButton>
		</div>
	);
};
