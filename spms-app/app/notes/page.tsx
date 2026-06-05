"use client";

import { useEffect, useState } from "react";

interface Note {
  id: string;
  title: string;
  subject: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM: Omit<Note, "id" | "createdAt" | "updatedAt"> = {
  title: "",
  subject: "",
  content: "",
};

function generateId(): string {
  return `n-${Date.now()}`;
}

function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("spms-notes");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(data: Note[]): void {
  localStorage.setItem("spms-notes", JSON.stringify(data));
}

// Format ISO timestamp into readable short date
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Subject pill colours cycling through a fixed palette
const SUBJECT_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
];

function subjectColor(subject: string, subjects: string[]): string {
  const idx = subjects.indexOf(subject);
  return SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filterSubject, setFilterSubject] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNotes(loadNotes());
    setLoading(false);
  }, []);

  // All unique subjects in the notes list
  const subjects = Array.from(new Set(notes.map((n) => n.subject))).filter(Boolean);

  // Apply subject filter and search query together
  const filtered = notes
    .filter((n) => filterSubject === "All" || n.subject === filterSubject)
    .filter((n) =>
      searchQuery === "" ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Open the form for creating a new note
  function startNew() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(true);
  }

  // Open the form pre-populated with an existing note for editing
  function startEdit(note: Note) {
    setForm({ title: note.title, subject: note.subject, content: note.content });
    setEditingId(note.id);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    const now = new Date().toISOString();
    let updated: Note[];
    if (editingId) {
      updated = notes.map((n) =>
        n.id === editingId ? { ...n, ...form, updatedAt: now } : n
      );
    } else {
      const newNote: Note = { ...form, id: generateId(), createdAt: now, updatedAt: now };
      updated = [newNote, ...notes];
    }
    setNotes(updated);
    saveNotes(updated);
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
  }

  function deleteNote(id: string) {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
    if (editingId === id) {
      setShowForm(false);
      setEditingId(null);
    }
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 animate-pulse">Loading notes...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Notes</h1>
          <p className="text-slate-500 mt-1">{notes.length} notes across {subjects.length} subjects</p>
        </div>
        <button
          onClick={startNew}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Note
        </button>
      </div>

      {/* Note editor form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-700">
            {editingId ? "Edit Note" : "New Note"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="Note title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                list="subjects-list"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="e.g. Physics"
              />
              <datalist id="subjects-list">
                {subjects.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={10}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-400"
              placeholder="Write your notes here... (plain text or markdown)"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              {editingId ? "Save Changes" : "Save Note"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => deleteNote(editingId)}
                className="ml-auto text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
              >
                Delete Note
              </button>
            )}
          </div>
        </form>
      )}

      {/* Search and filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <div className="flex gap-2 flex-wrap">
          {["All", ...subjects].map((s) => (
            <button
              key={s}
              onClick={() => setFilterSubject(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterSubject === s
                  ? "bg-primary-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Notes grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg">No notes found.</p>
          <p className="text-sm mt-1">
            {searchQuery ? "Try a different search term." : "Click \"+ New Note\" to create your first note."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note) => (
            <div
              key={note.id}
              onClick={() => startEdit(note)}
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-primary-200 transition-all group"
            >
              {/* Subject badge */}
              {note.subject && (
                <span
                  className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${subjectColor(note.subject, subjects)}`}
                >
                  {note.subject}
                </span>
              )}
              {/* Note title */}
              <h3 className="font-semibold text-slate-800 mb-2 group-hover:text-primary-700 transition-colors line-clamp-2">
                {note.title}
              </h3>
              {/* Content preview — first 120 chars */}
              <p className="text-sm text-slate-500 line-clamp-3 mb-3">
                {note.content || <span className="italic text-slate-300">No content</span>}
              </p>
              {/* Timestamp footer */}
              <p className="text-xs text-slate-400">
                Updated {formatDate(note.updatedAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
