"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Braces,
  Heading1,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import type { Note } from "@/lib/database.types";
import { updateNote } from "@/lib/notes";

export type SaveState = "idle" | "saving" | "saved" | "error";

export type NoteEditorHandle = {
  saveNow: () => Promise<boolean>;
  focusTitle: () => void;
};

type RichTextEditorProps = {
  note: Note;
  onSaved: (note: Note) => void;
};

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={active ? "toolbar-button active" : "toolbar-button"}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

export const RichTextEditor = forwardRef<
  NoteEditorHandle,
  RichTextEditorProps
>(function RichTextEditor({ note, onSaved }, ref) {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef(note.title);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeNoteIdRef = useRef(note.id);
  const savePromiseRef = useRef<Promise<boolean> | null>(null);
  const [title, setTitle] = useState(note.title);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
        },
      }),
    ],
    content: note.content,
    editorProps: {
      attributes: {
        class: "note-prose",
        "aria-label": "Note content",
      },
    },
    onUpdate: () => {
      markDirty();
    },
  });

  function scheduleSave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void saveNow();
    }, 750);
  }

  function markDirty() {
    dirtyRef.current = true;
    setSaveState("idle");
    scheduleSave();
  }

  async function saveNow(): Promise<boolean> {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (savePromiseRef.current) {
      const previousSaveWorked = await savePromiseRef.current;
      if (!previousSaveWorked || !dirtyRef.current) return previousSaveWorked;
    }

    if (!dirtyRef.current || !editor) return true;

    const noteId = activeNoteIdRef.current;
    const values = {
      title: titleRef.current,
      content: editor.getJSON(),
    };

    dirtyRef.current = false;
    setSaveState("saving");

    const savePromise = updateNote(noteId, values)
      .then((savedNote) => {
        if (activeNoteIdRef.current === noteId) {
          onSaved(savedNote);
          setSaveState("saved");
          if (dirtyRef.current) scheduleSave();
        }
        return true;
      })
      .catch(() => {
        if (activeNoteIdRef.current === noteId) {
          dirtyRef.current = true;
          setSaveState("error");
        }
        return false;
      })
      .finally(() => {
        savePromiseRef.current = null;
      });

    savePromiseRef.current = savePromise;
    return savePromise;
  }

  useImperativeHandle(ref, () => ({
    saveNow,
    focusTitle: () => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    },
  }));

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function setLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link address", previousUrl ?? "https://");

    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  }

  const formattedCreated = formatDate(note.created_at);
  const formattedUpdated = formatDate(note.updated_at);

  return (
    <article className="editor-shell">
      <div className="editor-heading">
        <div className="editor-title-block">
          <input
            ref={titleInputRef}
            className="title-input"
            value={title}
            onChange={(event) => {
              const nextTitle = event.target.value;
              setTitle(nextTitle);
              titleRef.current = nextTitle;
              markDirty();
            }}
            placeholder="Untitled note"
            aria-label="Note title"
          />
          <div className="note-metadata">
            <span>Created {formattedCreated}</span>
            <span className="metadata-dot" />
            <span>Updated {formattedUpdated}</span>
          </div>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
        <div className="toolbar-group">
          <ToolbarButton
            label="Heading 1"
            active={editor?.isActive("heading", { level: 1 })}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 size={17} />
          </ToolbarButton>
          <ToolbarButton
            label="Heading 2"
            active={editor?.isActive("heading", { level: 2 })}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 size={17} />
          </ToolbarButton>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <ToolbarButton
            label="Bold"
            active={editor?.isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold size={17} />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor?.isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic size={17} />
          </ToolbarButton>
          <ToolbarButton
            label="Link"
            active={editor?.isActive("link")}
            onClick={setLink}
          >
            <LinkIcon size={17} />
          </ToolbarButton>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <ToolbarButton
            label="Bullet list"
            active={editor?.isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List size={17} />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            active={editor?.isActive("orderedList")}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={17} />
          </ToolbarButton>
          <ToolbarButton
            label="Blockquote"
            active={editor?.isActive("blockquote")}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <Quote size={17} />
          </ToolbarButton>
          <ToolbarButton
            label="Code block"
            active={editor?.isActive("codeBlock")}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          >
            <Braces size={17} />
          </ToolbarButton>
          <ToolbarButton
            label="Horizontal rule"
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          >
            <Minus size={17} />
          </ToolbarButton>
        </div>
        <div className="toolbar-spacer" />
        <div className="toolbar-group">
          <ToolbarButton
            label="Undo"
            disabled={!editor?.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2 size={17} />
          </ToolbarButton>
          <ToolbarButton
            label="Redo"
            disabled={!editor?.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2 size={17} />
          </ToolbarButton>
        </div>
      </div>

      <EditorContent editor={editor} className="editor-content" />
    </article>
  );
});

function SaveIndicator({ state }: { state: SaveState }) {
  const label = {
    idle: "Changes autosave",
    saving: "Saving...",
    saved: "Saved",
    error: "Could not save",
  }[state];

  return (
    <div className={`save-indicator save-${state}`} aria-live="polite">
      <span className="save-dot" />
      {label}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
