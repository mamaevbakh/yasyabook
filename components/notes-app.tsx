"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { AccessGate } from "@/components/access-gate";
import {
  NoteEditorHandle,
  RichTextEditor,
} from "@/components/rich-text-editor";
import type { Note } from "@/lib/database.types";
import {
  createNote,
  deleteNote as removeNote,
  listNotes,
} from "@/lib/notes";

type MobileView = "list" | "editor";

export function NotesApp() {
  return (
    <AccessGate>
      <NotesWorkspace />
    </AccessGate>
  );
}

function NotesWorkspace() {
  const editorRef = useRef<NoteEditorHandle>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("list");

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const loadedNotes = await listNotes();
      setNotes(loadedNotes);
      setSelectedId((current) => {
        if (current && loadedNotes.some((note) => note.id === current)) {
          return current;
        }
        return loadedNotes[0]?.id ?? null;
      });
    } catch {
      setLoadError(
        "We could not reach your notebook. Check the database setup and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNotes();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadNotes]);

  const selectedNote =
    notes.find((note) => note.id === selectedId) ?? null;

  async function selectNote(id: string) {
    if (id === selectedId) {
      setMobileView("editor");
      return;
    }

    setActionError("");
    const saved = await editorRef.current?.saveNow();
    if (saved === false) {
      setActionError("Save this note before opening another one.");
      return;
    }

    setSelectedId(id);
    setMobileView("editor");
  }

  async function handleCreate() {
    setActionError("");
    const saved = await editorRef.current?.saveNow();
    if (saved === false) {
      setActionError("Save the current note before creating a new one.");
      return;
    }

    setCreating(true);
    try {
      const note = await createNote();
      setNotes((current) => [note, ...current]);
      setSelectedId(note.id);
      setMobileView("editor");
      requestAnimationFrame(() => editorRef.current?.focusTitle());
    } catch {
      setActionError("The new note could not be created. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!selectedNote) return;
    const displayTitle = selectedNote.title.trim() || "Untitled";
    const confirmed = window.confirm(
      `Delete “${displayTitle}”? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setActionError("");
    try {
      await removeNote(selectedNote.id);
      const deletedIndex = notes.findIndex(
        (note) => note.id === selectedNote.id,
      );
      const remaining = notes.filter((note) => note.id !== selectedNote.id);
      const nextNote =
        remaining[Math.min(deletedIndex, remaining.length - 1)] ?? null;

      setNotes(remaining);
      setSelectedId(nextNote?.id ?? null);
      if (!nextNote) setMobileView("list");
    } catch {
      setActionError("The note could not be deleted. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  function handleSaved(savedNote: Note) {
    setNotes((current) =>
      current
        .map((note) => (note.id === savedNote.id ? savedNote : note))
        .sort(
          (first, second) =>
            new Date(second.updated_at).getTime() -
            new Date(first.updated_at).getTime(),
        ),
    );
    setActionError("");
  }

  return (
    <main className="notebook-shell">
      <aside
        className={`notes-sidebar ${
          mobileView === "editor" ? "mobile-hidden" : ""
        }`}
      >
        <div className="brand-row">
          <div className="brand-mark">
            <BookOpen size={19} strokeWidth={1.8} />
          </div>
          <div>
            <strong>YasyaBook</strong>
            <span>Education notes</span>
          </div>
        </div>

        <div className="sidebar-heading">
          <div>
            <p className="eyebrow">Library</p>
            <h2>My notes</h2>
          </div>
          <button
            type="button"
            className="new-note-button compact"
            onClick={handleCreate}
            disabled={creating}
            aria-label="New note"
            title="New note"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="notes-list">
          {loading ? (
            <SidebarSkeleton />
          ) : loadError ? (
            <div className="sidebar-message">
              <p>{loadError}</p>
              <button type="button" onClick={() => void loadNotes()}>
                <RefreshCw size={14} />
                Try again
              </button>
            </div>
          ) : notes.length === 0 ? (
            <div className="sidebar-message empty">
              <FileText size={22} strokeWidth={1.5} />
              <p>Your first note will appear here.</p>
            </div>
          ) : (
            notes.map((note) => (
              <button
                type="button"
                key={note.id}
                className={
                  note.id === selectedId ? "note-row selected" : "note-row"
                }
                onClick={() => void selectNote(note.id)}
              >
                <span className="note-row-title">
                  {note.title.trim() || "Untitled"}
                </span>
                <span className="note-row-date">
                  {formatSidebarDate(note.updated_at)}
                </span>
              </button>
            ))
          )}
        </div>

        <button
          type="button"
          className="new-note-button"
          onClick={handleCreate}
          disabled={creating}
        >
          <Plus size={17} />
          {creating ? "Creating..." : "New note"}
        </button>
      </aside>

      <section
        className={`workspace ${
          mobileView === "list" ? "mobile-hidden" : ""
        }`}
      >
        <header className="workspace-topbar">
          <button
            type="button"
            className="mobile-back"
            onClick={() => setMobileView("list")}
            aria-label="Back to notes"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="eyebrow">Workspace</p>
            <span className="workspace-label">Study note</span>
          </div>
          {selectedNote && (
            <button
              type="button"
              className="delete-button"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 size={16} />
              <span>{deleting ? "Deleting..." : "Delete"}</span>
            </button>
          )}
        </header>

        {actionError && (
          <div className="action-error" role="alert">
            {actionError}
          </div>
        )}

        <div className="workspace-body">
          {loading ? (
            <EditorSkeleton />
          ) : selectedNote ? (
            <RichTextEditor
              key={selectedNote.id}
              ref={editorRef}
              note={selectedNote}
              onSaved={handleSaved}
            />
          ) : loadError ? (
            <WorkspaceMessage
              title="Notebook unavailable"
              copy={loadError}
              action="Try again"
              onAction={() => void loadNotes()}
            />
          ) : (
            <WorkspaceMessage
              title="Start your education archive"
              copy="Create a note for a lesson, course, book, or idea you want to return to."
              action="Create your first note"
              onAction={() => void handleCreate()}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function WorkspaceMessage({
  title,
  copy,
  action,
  onAction,
}: {
  title: string;
  copy: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="workspace-message">
      <div className="empty-illustration">
        <FileText size={28} strokeWidth={1.4} />
      </div>
      <h2>{title}</h2>
      <p>{copy}</p>
      <button type="button" onClick={onAction}>
        <Plus size={17} />
        {action}
      </button>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="skeleton-stack" aria-label="Loading notes">
      <div className="skeleton-line wide" />
      <div className="skeleton-line" />
      <div className="skeleton-line medium" />
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="editor-skeleton" aria-label="Loading editor">
      <div className="skeleton-line title" />
      <div className="skeleton-line short" />
      <div className="skeleton-toolbar" />
      <div className="skeleton-line wide" />
      <div className="skeleton-line wide" />
      <div className="skeleton-line medium" />
    </div>
  );
}

function formatSidebarDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  const sameYear = date.getFullYear() === today.getFullYear();

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}
