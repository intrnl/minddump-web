import React from 'react';

import { type InitialEditorStateType, LexicalComposer } from '@lexical/react/LexicalComposer';

import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';

import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

export interface LexicalRTEProps {
	initialState?: InitialEditorStateType;
	readonly?: boolean;
	placeholder?: string;
	children?: React.ReactNode;
	head?: React.ReactNode;
	className?: string;
	contentClassName?: string;
	placeholderClassName?: string;
}

export const LexicalRTE = (props: LexicalRTEProps) => {
	const {
		initialState,
		readonly,
		placeholder,
		children,
		head,
		className,
		contentClassName,
		placeholderClassName,
	} = props;

	return (
		<LexicalComposer
			initialConfig={{
				namespace: 'LexicalRTE',
				editorState: initialState,
				editable: !readonly,
				theme: {
					paragraph: 'mb-2',
					ltr: 'ltr',
					rtl: 'rtl',
					text: {
						bold: 'bold',
						italic: 'italic',
						underline: 'underline',
					},
					list: {
						ul: 'unordered-list',
						ol: 'ordered-list',
						nested: {
							listitem: 'nested-list',
						},
					},
				},
				onError: (error) => {
					throw error;
				},
			}}
		>
			{head as any}

			<div className={className}>
				<RichTextPlugin
					ErrorBoundary={LexicalErrorBoundary}
					contentEditable={<ContentEditable className={contentClassName} />}
					placeholder={placeholder ? <div className={placeholderClassName}>{placeholder}</div> : null}
				/>
			</div>

			<HistoryPlugin />

			{children as any}
		</LexicalComposer>
	);
};
