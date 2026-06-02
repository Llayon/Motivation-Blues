import { EditorConflict } from './editor/EditorConflict';
import { EditorDraftRail } from './editor/EditorDraftRail';
import { EditorFooter } from './editor/EditorFooter';
import { EditorFormattingMenu } from './editor/EditorFormattingMenu';
import { useZenEditorController } from './editor/useZenEditorController';

export function ZenEditor() {
  const {
    bufferStatus,
    canSave,
    charCount,
    conflictPost,
    content,
    drafts,
    editConflictPost,
    editingId,
    handleApplyFormat,
    handleBankPost,
    handleContentChange,
    handleSaveDraft,
    handleTagsChange,
    handleTitleChange,
    handleUpdateBankedPost,
    hasTextareaSelection,
    isEditingBankedPost,
    isSaving,
    keepBufferFromConflict,
    manuscriptStatus,
    openBank,
    openPostWithBufferGuard,
    resetEditor,
    status,
    syncTextareaSelection,
    tags,
    textareaRef,
    title,
    wordCount
  } = useZenEditorController();

  return (
    <section className="editor-layout">
      <EditorDraftRail
        drafts={drafts}
        editingId={editingId}
        onNew={() => void resetEditor()}
        onOpenDraft={(draft) => void openPostWithBufferGuard(draft)}
      />

      <article className="zen-editor glass-panel">
        {conflictPost ? (
          <EditorConflict
            conflictPost={conflictPost}
            onKeepCurrent={() => void keepBufferFromConflict()}
            onOpenSelected={() => void editConflictPost()}
          />
        ) : null}
        <input
          className="title-input"
          data-testid="editor-title"
          placeholder="Как назовем?"
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
        />
        <div className="editor-textarea-shell">
          {hasTextareaSelection ? <EditorFormattingMenu onApplyFormat={handleApplyFormat} /> : null}
          <textarea
            ref={textareaRef}
            className="post-textarea"
            data-testid="editor-content"
            placeholder="Рукописи не горят. Начинай..."
            value={content}
            onChange={(event) => {
              handleContentChange(event.target.value);
              syncTextareaSelection();
            }}
            onKeyUp={syncTextareaSelection}
            onMouseUp={syncTextareaSelection}
            onSelect={syncTextareaSelection}
          />
        </div>
        <input
          className="tag-input"
          data-testid="editor-tags"
          placeholder="Теги: идеи, личное, продукт"
          value={tags}
          onChange={(event) => handleTagsChange(event.target.value)}
        />
        <EditorFooter
          charCount={charCount}
          wordCount={wordCount}
          manuscriptStatus={manuscriptStatus}
          bufferStatus={bufferStatus}
          status={status}
          isEditingBankedPost={isEditingBankedPost}
          isSaving={isSaving}
          canSave={canSave}
          onCancel={() => void resetEditor()}
          onUpdateBankedPost={() => void handleUpdateBankedPost()}
          onSaveDraft={() => void handleSaveDraft()}
          onBankPost={() => void handleBankPost()}
          onOpenBank={openBank}
        />
      </article>
    </section>
  );
}
