import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  /**
   * Root of the Simple Notes App.
   * - Provides header, add note button, modal form, and list of note cards.
   * - All CRUD operations are client-side and persisted to localStorage.
   */
  const STORAGE_KEY = 'simple_notes_v1';

  const [notes, setNotes] = useState([]);
  const [theme, setTheme] = useState('light');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [query, setQuery] = useState('');

  // Load notes from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setNotes(parsed);
        }
      }
    } catch {
      // ignore parse errors; start fresh
    }
  }, []);

  // Persist notes to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // ignore quota errors
    }
  }, [notes]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    /** Toggle between light and dark theme. */
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // PUBLIC_INTERFACE
  const handleCreate = (data) => {
    /**
     * Create a new note.
     * @param {{title: string, content: string}} data
     */
    const now = new Date().toISOString();
    const newNote = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      title: data.title.trim(),
      content: data.content.trim(),
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [newNote, ...prev]);
    setModalOpen(false);
  };

  // PUBLIC_INTERFACE
  const handleUpdate = (id, data) => {
    /**
     * Update an existing note by id.
     * @param {string} id
     * @param {{title: string, content: string}} data
     */
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, title: data.title.trim(), content: data.content.trim(), updatedAt: new Date().toISOString() }
          : n
      )
    );
    setEditingNote(null);
    setModalOpen(false);
  };

  // PUBLIC_INTERFACE
  const handleDelete = (id) => {
    /**
     * Delete a note by id.
     * @param {string} id
     */
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotes = useMemo(() => {
    if (!query.trim()) return notes;
    const q = query.toLowerCase();
    return notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }, [notes, query]);

  return (
    <div className="app-shell">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        query={query}
        onQueryChange={setQuery}
      />

      <main className="container">
        <div className="toolbar">
          <button
            className="btn primary"
            onClick={() => {
              setEditingNote(null);
              setModalOpen(true);
            }}
            aria-label="Add new note"
          >
            ＋ New Note
          </button>
          <div className="count">{filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}</div>
        </div>

        {filteredNotes.length === 0 ? (
          <EmptyState onCreate={() => setModalOpen(true)} />
        ) : (
          <NoteList
            notes={filteredNotes}
            onEdit={(note) => {
              setEditingNote(note);
              setModalOpen(true);
            }}
            onDelete={handleDelete}
          />
        )}
      </main>

      {isModalOpen && (
        <NoteModal
          onClose={() => {
            setModalOpen(false);
            setEditingNote(null);
          }}
          onSave={(data) => {
            if (editingNote) {
              handleUpdate(editingNote.id, data);
            } else {
              handleCreate(data);
            }
          }}
          initialData={editingNote ? { title: editingNote.title, content: editingNote.content } : undefined}
          mode={editingNote ? 'edit' : 'create'}
        />
      )}
    </div>
  );
}

function Header({ theme, onToggleTheme, query, onQueryChange }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="logo" aria-hidden>📝</div>
          <div>
            <h1 className="title">Simple Notes</h1>
            <p className="subtitle">Fast, modern, and local — no account required</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="search">
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search notes..."
              aria-label="Search notes"
            />
          </div>
          <button
            className="btn ghost"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </header>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="empty">
      <div className="empty-card">
        <div className="empty-icon">💡</div>
        <h2>No notes yet</h2>
        <p>Create your first note to get started.</p>
        <button className="btn success" onClick={onCreate}>Create a Note</button>
      </div>
    </div>
  );
}

function NoteList({ notes, onEdit, onDelete }) {
  return (
    <section className="grid">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={() => onEdit(note)}
          onDelete={() => onDelete(note.id)}
        />
      ))}
    </section>
  );
}

function NoteCard({ note, onEdit, onDelete }) {
  const updated = new Date(note.updatedAt || note.createdAt);
  const formatted = updated.toLocaleString();

  return (
    <article className="card" role="article" aria-label={`Note: ${note.title || 'Untitled'}`}>
      <div className="card-header">
        <h3 className="card-title">{note.title || 'Untitled'}</h3>
        <div className="card-actions">
          <button className="icon-btn" onClick={onEdit} aria-label="Edit note" title="Edit">
            ✏️
          </button>
          <button className="icon-btn danger" onClick={onDelete} aria-label="Delete note" title="Delete">
            🗑️
          </button>
        </div>
      </div>
      <p className="card-content">{note.content || 'No content'}</p>
      <div className="card-footer">
        <span className="meta">Updated {formatted}</span>
      </div>
    </article>
  );
}

function NoteModal({ onClose, onSave, initialData, mode = 'create' }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');

  const isValid = title.trim().length > 0 || content.trim().length > 0;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={mode === 'edit' ? 'Edit note' : 'Create note'}>
      <div className="modal">
        <div className="modal-header">
          <h2>{mode === 'edit' ? 'Edit Note' : 'New Note'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✖</button>
        </div>
        <div className="modal-body">
          <div className="form-field">
            <label htmlFor="note-title">Title</label>
            <input
              id="note-title"
              type="text"
              placeholder="Note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="note-content">Content</label>
            <textarea
              id="note-content"
              placeholder="Write your note..."
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn primary"
            onClick={() => onSave({ title, content })}
            disabled={!isValid}
          >
            {mode === 'edit' ? 'Save Changes' : 'Add Note'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
