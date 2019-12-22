import React, {
  forwardRef,
  useCallback,
  useRef,
  useEffect,
} from 'react'
import {
  Editor,
  EditorState,
} from 'draft-js';
import StyleControls from './components/style-controls'
import Title from './components/title'

import './style.css'
// https://draftjs.org/docs/advanced-topics-issues-and-pitfalls.html#missing-draftcss
import 'draft-js/dist/Draft.css'
import { withEditor } from './index';

const NewEditor = props => {
  const {
    getEditor,
    forwardRef,
  } = props
  const { hooks, editorState } = getEditor()
  const didUpdate = useRef(false)

  useEffect(() => {
    if (didUpdate.current) {
      hooks.didUpdate.call()
    }
  })

  const onChange = useCallback(editorState => {
    hooks.onChange.call(editorState)
  }, [])

  const handleKeyCommand = useCallback((command, editorState) => {
    hooks.handleKeyCommand.call(command, editorState)
  }, [])

  let className = 'miuffy-editor';
  var contentState = editorState.getCurrentContent();
  if (!contentState.hasText()) {
    if (contentState.getBlockMap().first().getType() !== 'unstyled') {
      className += ' RichEditor-hidePlaceholder';
    }
  }

  return (
    <div className="miuffy-editor-root">
      <StyleControls />

      <div className={className}>
        {/* <Title /> */}
        <Editor
          editorState={editorState}
          onChange={onChange}
          handleKeyCommand={handleKeyCommand}
          ref={forwardRef}
          placeholder='Tell a story...'
        />
      </div>
    </div>
  )
}

const WrappedEditor = withEditor(NewEditor)

export default forwardRef((props, ref) => (
  <WrappedEditor {...props} forwardRef={ref} />
))