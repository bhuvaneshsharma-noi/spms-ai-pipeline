"use client";

import { useEffect, useState } from "react";

interface Ticket {
  id: string;
  summary: string;
  description: string;
  assignee_name: string;
  priority: string;
  status: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  High:   "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Low:    "bg-green-100 text-green-700 border-green-200",
};

const STATUS_COLORS: Record<string, string> = {
  "To Do":       "bg-slate-100 text-slate-600",
  "In Progress": "bg-blue-100 text-blue-700",
  "In Review":   "bg-purple-100 text-purple-700",
  "Done":        "bg-green-100 text-green-700",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState("");

  async function fetchTickets() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8000/tickets");
      if (!res.ok) throw new Error("FastAPI not reachable");
      const data = await res.json();
      setTickets(data.tickets);
      setLastRefresh(new Date().toLocaleTimeString("en-IN"));
    } catch (e: any) {
      setError("Could not load tickets. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Jira Tickets</h1>
          <p className="text-slate-500 mt-1">
            Live from SPMS project &bull; {tickets.length} To Do tickets
            {lastRefresh && ` · Last refreshed ${lastRefresh}`}
          </p>
        </div>
        <button
          onClick={fetchTickets}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <p className="text-slate-500 animate-pulse text-lg">Fetching from Jira...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && tickets.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg">No To Do tickets in Jira.</p>
          <p className="text-sm mt-1">Create tickets in SPMS project and they'll appear here.</p>
        </div>
      )}

      {/* Ticket cards */}
      {!loading && !error && tickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow"
            >
              {/* Ticket ID + badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs font-mono font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                  {ticket.id}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[ticket.priority] || "bg-slate-100 text-slate-600"}`}>
                  {ticket.priority}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status] || "bg-slate-100 text-slate-600"}`}>
                  {ticket.status}
                </span>
              </div>

              {/* Summary */}
              <h2 className="font-semibold text-slate-800 mb-2">{ticket.summary}</h2>

              {/* Description preview */}
              <p className="text-sm text-slate-500 line-clamp-3 mb-3">
                {ticket.description || "No description provided."}
              </p>

              {/* Assignee */}
              <div className="flex items-center gap-2 mt-auto">
                <div className="h-6 w-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                  {ticket.assignee_name?.charAt(0) || "?"}
                </div>
                <span className="text-xs text-slate-500">{ticket.assignee_name || "Unassigned"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
