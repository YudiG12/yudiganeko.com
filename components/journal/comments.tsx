"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COMMENT_REACTIONS, type CommentReactionEmoji, type JournalComment } from "@/lib/journal/types";

/**
 * Comentários do artigo: o leitor só informa o nome (fica salvo no navegador), respostas de um nível,
 * reações por comentário. Quem está logado no admin comenta como o autor e pode apagar comentários.
 */

const NAME_KEY = "gj-commenter-name";
const REACTED_KEY = "gj-comment-reacted";
const PAGE = 10;
const AVATAR_BG = ["#E3DCCD", "#D8E3EE", "#E8E0F0", "#DCE8DF", "#F0E1D8"];

type Viewer = { isAdmin: boolean; authorName: string };

function readJSON<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  } catch {}
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

function avatarBg(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return AVATAR_BG[h % AVATAR_BG.length];
}

function timeAgo(iso: string, now: number) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d} d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

function Avatar({ name, isAuthor, size }: { name: string; isAuthor: boolean; size: 28 | 36 }) {
  const dim = size === 36 ? "h-9 w-9 text-xs" : "h-7 w-7 text-[10px]";
  if (isAuthor) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/profile.png" alt="" className={`${dim} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span
      aria-hidden
      className={`${dim} flex shrink-0 items-center justify-center rounded-full font-mono font-semibold text-blue-fantastic`}
      style={{ background: avatarBg(name) }}
    >
      {initials(name)}
    </span>
  );
}

/** Textarea que cresce com o texto (sem barra de rolagem e sem pular o layout). */
function AutoTextarea({
  value,
  onChange,
  onSubmit,
  className,
  ...rest
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "onSubmit"> & {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onSubmit();
        }
      }}
      className={`block w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-blue-fantastic/45 ${className ?? ""}`}
      {...rest}
    />
  );
}

function NameField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={60}
      placeholder="Seu nome"
      aria-label="Seu nome"
      autoComplete="name"
      className="h-[30px] w-40 rounded-lg bg-white px-2.5 font-mono text-xs text-blue-fantastic shadow-[inset_0_0_0_1px_rgba(201,193,177,0.9)] outline-none placeholder:text-blue-fantastic/45 focus:shadow-[inset_0_0_0_1.5px_#2C3B4D]"
    />
  );
}

export default function Comments({ articleId }: { articleId: string }) {
  const [comments, setComments] = useState<JournalComment[] | null>(null);
  const [viewer, setViewer] = useState<Viewer>({ isAdmin: false, authorName: "Yudi Ganeko" });
  const [failed, setFailed] = useState(false);
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [mine, setMine] = useState<Record<string, CommentReactionEmoji[]>>({});
  const [visible, setVisible] = useState(PAGE);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<{ thread: string; name: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const n = readJSON<string>(NAME_KEY, "");
    setName(typeof n === "string" ? n : "");
    setSavedName(typeof n === "string" ? n : "");
    setMine(readJSON(REACTED_KEY, {}));
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch(`/api/journal/comments?articleId=${articleId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { comments: JournalComment[]; viewer: Viewer }) => {
        if (!alive) return;
        setComments(d.comments);
        setViewer(d.viewer);
        setNow(Date.now());
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [articleId]);

  const { tops, replies } = useMemo(() => {
    const tops: JournalComment[] = [];
    const replies = new Map<string, JournalComment[]>();
    for (const c of comments ?? []) {
      if (!c.parent_id) tops.push(c);
      else replies.set(c.parent_id, [...(replies.get(c.parent_id) ?? []), c]);
    }
    tops.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { tops, replies };
  }, [comments]);

  const post = useCallback(
    async (body: string, parentId: string | null): Promise<string | null> => {
      const trimmed = name.replace(/\s+/g, " ").trim();
      if (!viewer.isAdmin && !trimmed) return "Escreva seu nome antes de comentar.";
      try {
        const res = await fetch("/api/journal/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId, parentId, name: trimmed, body }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) return d.error ?? "Não foi possível comentar agora.";
        if (!viewer.isAdmin) {
          writeJSON(NAME_KEY, JSON.stringify(trimmed));
          setSavedName(trimmed);
        }
        setComments((cs) => [...(cs ?? []), d.comment as JournalComment]);
        setNow(Date.now());
        if (parentId) setExpanded((s) => new Set(s).add(parentId));
        return null;
      } catch {
        return "Sem conexão. Tente de novo.";
      }
    },
    [articleId, name, viewer.isAdmin],
  );

  async function react(c: JournalComment, emoji: CommentReactionEmoji) {
    const list = mine[c.id] ?? [];
    const has = list.includes(emoji);
    const delta = has ? -1 : 1;
    const next = { ...mine, [c.id]: has ? list.filter((e) => e !== emoji) : [...list, emoji] };
    if (!next[c.id].length) delete next[c.id];
    setMine(next);
    writeJSON(REACTED_KEY, next);
    const bump = (count: number) =>
      setComments((cs) =>
        (cs ?? []).map((x) => (x.id === c.id ? { ...x, reactions: { ...x.reactions, [emoji]: count } } : x)),
      );
    bump(Math.max(0, (c.reactions[emoji] ?? 0) + delta));
    try {
      const res = await fetch("/api/journal/comments/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: c.id, emoji, delta }),
      });
      if (res.ok) {
        const { count } = await res.json();
        if (typeof count === "number") bump(count);
      }
    } catch {}
  }

  async function remove(c: JournalComment) {
    if (!confirm(c.parent_id ? "Apagar esta resposta?" : "Apagar este comentário e as respostas dele?")) return;
    const res = await fetch(`/api/journal/comments?id=${c.id}`, { method: "DELETE" });
    if (res.ok) setComments((cs) => (cs ?? []).filter((x) => x.id !== c.id && x.parent_id !== c.id));
  }

  function startReply(thread: string, to: string) {
    setExpanded((s) => new Set(s).add(thread));
    setReplyTo({ thread, name: to });
  }

  const total = comments?.length ?? 0;
  const myName = viewer.isAdmin ? viewer.authorName : savedName || name;
  const needsName = !viewer.isAdmin && !savedName;

  const actions = (c: JournalComment, thread: string) => (
    <CommentActions
      comment={c}
      mine={mine[c.id] ?? []}
      onReact={(e) => react(c, e)}
      onReply={() => startReply(thread, c.author_name)}
      onDelete={viewer.isAdmin ? () => remove(c) : undefined}
    />
  );

  return (
    <section aria-label="Comentários" className="flex flex-col gap-7 pt-14">
      <h2 className="flex items-baseline gap-2.5 font-mono">
        <span className="text-xl font-bold leading-6 text-blue-fantastic">Comentários</span>
        {total > 0 && <span className="text-sm text-blue-fantastic/50">{total}</span>}
      </h2>

      <Composer
        myName={myName}
        isAdmin={viewer.isAdmin}
        needsName={needsName}
        name={name}
        onName={setName}
        onChangeName={() => setSavedName("")}
        onSubmit={(body) => post(body, null)}
      />

      {failed && <p className="font-mono text-xs text-blue-fantastic/60">Não foi possível carregar os comentários.</p>}
      {comments && tops.length === 0 && (
        <p className="font-mono text-[13px] text-blue-fantastic/55">Seja o primeiro a comentar.</p>
      )}

      {tops.slice(0, visible).map((c) => {
        const rs = replies.get(c.id) ?? [];
        const open = expanded.has(c.id);
        const replying = replyTo?.thread === c.id;
        const showThread = (open && rs.length > 0) || replying;
        return (
          <article key={c.id} className="flex gap-3.5 pt-2">
            <div className="flex shrink-0 flex-col items-center gap-2">
              <Avatar name={c.author_name} isAuthor={c.is_author} size={36} />
              {showThread && <span aria-hidden className="w-[1.5px] grow rounded-sm bg-oatmeal/70" />}
            </div>
            <div className="flex min-w-0 grow flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Meta comment={c} now={now} />
                <Body text={c.body} />
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 pt-0.5">
                  {actions(c, c.id)}
                  {rs.length > 0 && !open && (
                    <button
                      type="button"
                      onClick={() => setExpanded((s) => new Set(s).add(c.id))}
                      className="pl-3 font-mono text-xs text-truffle-trouble transition-opacity hover:opacity-75"
                    >
                      ver {rs.length} {rs.length === 1 ? "resposta" : "respostas"}
                    </button>
                  )}
                </div>
              </div>
              {open &&
                rs.map((r) => (
                  <div key={r.id} className="flex gap-3">
                    <Avatar name={r.author_name} isAuthor={r.is_author} size={28} />
                    <div className="flex min-w-0 grow flex-col gap-1.5">
                      <Meta comment={r} now={now} />
                      <Body text={r.body} />
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">{actions(r, c.id)}</div>
                    </div>
                  </div>
                ))}
              {replying && (
                <ReplyBox
                  key={`${replyTo.thread}-${replyTo.name}`}
                  to={replyTo.name}
                  myName={myName}
                  isAdmin={viewer.isAdmin}
                  needsName={needsName}
                  name={name}
                  onName={setName}
                  onCancel={() => setReplyTo(null)}
                  onSubmit={async (body) => {
                    const err = await post(body, c.id);
                    if (!err) setReplyTo(null);
                    return err;
                  }}
                />
              )}
            </div>
          </article>
        );
      })}

      {tops.length > visible && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE)}
            className="rounded-full px-[18px] py-2.5 font-mono text-[13px] text-blue-fantastic shadow-[inset_0_0_0_1px_rgba(201,193,177,0.9)] transition hover:bg-palladian"
          >
            ver mais {tops.length - visible} {tops.length - visible === 1 ? "comentário" : "comentários"}
          </button>
        </div>
      )}
    </section>
  );
}

function Meta({ comment, now }: { comment: JournalComment; now: number }) {
  return (
    <div className="flex items-center gap-2 font-mono">
      <span className="truncate text-[13px] font-semibold leading-4 text-blue-fantastic">{comment.author_name}</span>
      {comment.is_author && (
        <span className="rounded-full bg-blue-fantastic px-[7px] py-[3px] text-[10px] leading-3 tracking-[0.05em] text-white">
          autor
        </span>
      )}
      <time dateTime={comment.created_at} className="shrink-0 text-xs leading-4 text-blue-fantastic/50">
        {timeAgo(comment.created_at, now)}
      </time>
    </div>
  );
}

function Body({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-wrap font-sans text-base leading-[26px] text-blue-fantastic [overflow-wrap:anywhere]">
      {text}
    </p>
  );
}

function CommentActions({
  comment,
  mine,
  onReact,
  onReply,
  onDelete,
}: {
  comment: JournalComment;
  mine: CommentReactionEmoji[];
  onReact: (e: CommentReactionEmoji) => void;
  onReply: () => void;
  onDelete?: () => void;
}) {
  const [picker, setPicker] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!picker) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !wrap.current?.contains(e.target as Node)) setPicker(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [picker]);

  return (
    <>
      {COMMENT_REACTIONS.filter((e) => (comment.reactions[e] ?? 0) > 0)
        .sort((a, b) => (comment.reactions[b] ?? 0) - (comment.reactions[a] ?? 0))
        .map((e) => {
        const active = mine.includes(e);
        return (
          <button
            key={e}
            type="button"
            onClick={() => onReact(e)}
            aria-pressed={active}
            className={`flex items-center gap-1.5 rounded-full px-[9px] py-1 transition active:scale-95 ${
              active
                ? "bg-truffle-trouble/[0.08] shadow-[inset_0_0_0_1px_#A35139]"
                : "shadow-[inset_0_0_0_1px_rgba(201,193,177,0.9)] hover:bg-palladian"
            }`}
          >
            <span className="text-[13px] leading-4">{e}</span>
            <span
              className={`font-mono text-xs leading-4 tabular-nums ${
                active ? "font-semibold text-truffle-trouble" : "text-blue-fantastic"
              }`}
            >
              {comment.reactions[e]}
            </span>
          </button>
        );
      })}
      <div ref={wrap} className="relative">
        <button
          type="button"
          onClick={() => setPicker((p) => !p)}
          aria-label="Reagir"
          aria-expanded={picker}
          className={`flex h-[26px] w-7 items-center justify-center rounded-full transition ${
            picker ? "bg-blue-fantastic" : "shadow-[inset_0_0_0_1px_rgba(201,193,177,0.9)] hover:bg-palladian"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={picker ? "#fff" : "#2C3B4D"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="13" r="8" />
            <path d="M8 15s1 1.5 3 1.5 3-1.5 3-1.5M8.5 10.5h.01M13.5 10.5h.01M19 2v5M16.5 4.5h5" />
          </svg>
        </button>
        {picker && (
          <div className="absolute bottom-[calc(100%+10px)] left-1/2 z-20 flex -translate-x-1/2 gap-0.5 rounded-full bg-white p-[5px] shadow-[0_0_0_1px_rgba(201,193,177,0.7),0_12px_24px_-8px_rgba(44,59,77,0.3)] sm:left-0 sm:translate-x-0">
            {COMMENT_REACTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onReact(e);
                  setPicker(false);
                }}
                aria-label={`Reagir com ${e}`}
                className={`flex h-[34px] w-[34px] items-center justify-center rounded-full text-xl leading-[22px] transition hover:scale-110 hover:bg-palladian ${
                  mine.includes(e) ? "bg-palladian" : ""
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onReply}
        className="pl-2 font-mono text-xs text-blue-fantastic/70 transition-colors hover:text-blue-fantastic"
      >
        Responder
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="pl-2 font-mono text-xs text-[#CF4238]/70 transition-colors hover:text-[#CF4238]"
        >
          apagar
        </button>
      )}
    </>
  );
}

function Composer({
  myName,
  isAdmin,
  needsName,
  name,
  onName,
  onChangeName,
  onSubmit,
}: {
  myName: string;
  isAdmin: boolean;
  needsName: boolean;
  name: string;
  onName: (v: string) => void;
  onChangeName: () => void;
  onSubmit: (body: string) => Promise<string | null>;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    const err = await onSubmit(body);
    setBusy(false);
    if (err) setError(err);
    else setText("");
  }

  return (
    <div className="flex gap-3.5">
      <Avatar name={myName || "?"} isAuthor={isAdmin} size={36} />
      <div className="flex min-w-0 grow flex-col gap-1.5">
        <div className="flex flex-col rounded-2xl shadow-[inset_0_0_0_1px_rgba(201,193,177,0.9)] transition-shadow focus-within:shadow-[inset_0_0_0_1.5px_#2C3B4D,0_0_0_4px_rgba(44,59,77,0.06)]">
          <div className="px-4 pb-1 pt-3.5">
            <AutoTextarea
              value={text}
              onChange={setText}
              onSubmit={submit}
              maxLength={2000}
              placeholder="Escreva um comentário…"
              aria-label="Escreva um comentário"
              className="max-h-[50vh] font-sans text-base leading-6 text-blue-fantastic"
            />
          </div>
          <div className="flex items-center justify-between gap-3 px-2.5 pb-2.5 pt-1">
            <div className="flex min-w-0 items-center gap-2 font-mono text-xs text-blue-fantastic/55">
              {isAdmin ? (
                <span className="truncate">comentando como autor</span>
              ) : needsName ? (
                <NameField value={name} onChange={onName} />
              ) : (
                <>
                  <span className="truncate">como {myName}</span>
                  <button
                    type="button"
                    onClick={onChangeName}
                    className="shrink-0 underline decoration-blue-fantastic/25 underline-offset-2 hover:text-blue-fantastic"
                  >
                    trocar
                  </button>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={!text.trim() || busy}
              className="shrink-0 rounded-[10px] bg-blue-fantastic px-3.5 py-2 font-mono text-[13px] font-semibold leading-4 text-white transition hover:bg-[#1B2632] active:scale-95 disabled:opacity-40 disabled:active:scale-100"
            >
              {busy ? "Enviando…" : "Comentar"}
            </button>
          </div>
        </div>
        {error && <p className="px-1 font-mono text-xs text-[#CF4238]">{error}</p>}
      </div>
    </div>
  );
}

function ReplyBox({
  to,
  myName,
  isAdmin,
  needsName,
  name,
  onName,
  onCancel,
  onSubmit,
}: {
  to: string;
  myName: string;
  isAdmin: boolean;
  needsName: boolean;
  name: string;
  onName: (v: string) => void;
  onCancel: () => void;
  onSubmit: (body: string) => Promise<string | null>;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    const err = await onSubmit(body);
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-3">
        <Avatar name={myName || "?"} isAuthor={isAdmin} size={28} />
        <div className="flex min-w-0 grow flex-col gap-2">
          {needsName && <NameField value={name} onChange={onName} />}
          <div className="flex min-h-10 items-end gap-2 rounded-xl py-[5px] pl-3.5 pr-1.5 shadow-[inset_0_0_0_1px_rgba(201,193,177,0.9)] transition-shadow focus-within:shadow-[inset_0_0_0_1.5px_#2C3B4D]">
            <AutoTextarea
              value={text}
              onChange={setText}
              onSubmit={submit}
              onKeyUp={(e) => e.key === "Escape" && !text && onCancel()}
              autoFocus={!needsName}
              maxLength={2000}
              placeholder={`Responder a ${to.split(" ")[0]}…`}
              aria-label={`Responder a ${to}`}
              className="max-h-[40vh] py-[5px] font-sans text-sm leading-5 text-blue-fantastic"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!text.trim() || busy}
              className="shrink-0 rounded-[7px] bg-blue-fantastic px-2.5 py-[7px] font-mono text-[11px] font-semibold leading-3 text-white transition active:scale-95 disabled:opacity-30"
            >
              {busy ? "…" : "Enviar"}
            </button>
          </div>
        </div>
      </div>
      {error && <p className="pl-10 font-mono text-xs text-[#CF4238]">{error}</p>}
    </div>
  );
}
