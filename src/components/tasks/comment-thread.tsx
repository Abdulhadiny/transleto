"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; role: string };
}

const roleBadgeVariant: Record<string, "info" | "success" | "warning"> = {
  ADMIN: "info",
  TRANSLATOR: "success",
  REVIEWER: "warning",
};

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CommentThread({ taskId }: { taskId: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  function fetchComments() {
    fetch(`/api/tasks/${taskId}/comments`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setComments(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setPosting(true);
    setError("");

    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to post comment");
      setPosting(false);
      return;
    }

    setNewComment("");
    setPosting(false);
    fetchComments();
  }

  return (
    <div className="space-y-4">
      <div className="max-h-80 overflow-y-auto space-y-3">
        {loading ? (
          <p className="text-sm text-stone-400">Loading comments...</p>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 mb-2">
              <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="text-sm text-stone-500">No comments yet. Start the conversation.</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isOwn = comment.user.id === session?.user?.id;
            return (
              <div
                key={comment.id}
                className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                    isOwn
                      ? "bg-amber-50 border border-amber-200/60"
                      : "bg-stone-50 border border-stone-200/60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-medium text-stone-800 text-xs">
                      {comment.user.name}
                    </span>
                    <Badge
                      variant={roleBadgeVariant[comment.user.role] || "default"}
                      className="text-[9px] px-1.5 py-0"
                    >
                      {comment.user.role}
                    </Badge>
                    <span className="text-[11px] text-stone-400">
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg bg-rose-50 border border-rose-200/60 px-3 py-2 text-sm text-rose-700">
          {error}
          <button onClick={() => setError("")} className="ml-2 shrink-0 text-rose-400 hover:text-rose-600">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows={2}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={posting || !newComment.trim()}
          className="self-end"
          size="sm"
        >
          {posting ? "..." : "Send"}
        </Button>
      </form>
    </div>
  );
}
