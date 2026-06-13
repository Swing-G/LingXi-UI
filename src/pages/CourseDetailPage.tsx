import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import Tag from "@/components/common/Tag";
import SectionHeader from "@/components/common/SectionHeader";
import { ArrowRightIcon } from "@/components/icons/Icon";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./CourseDetailPage.module.css";
import { knowpostService } from "@/services/knowpostService";
import { useAuth } from "@/context/AuthContext";
import type { KnowpostDetailResponse } from "@/types/knowpost";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LikeFavBar from "@/components/common/LikeFavBar";
import { addHistory } from "@/services/readingHistory";
import FollowButton from "@/components/common/FollowButton";

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tokens, user } = useAuth();
  const [detail, setDetail] = useState<KnowpostDetailResponse | null>(null);
  const [contentText, setContentText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [contentError, setContentError] = useState<string | null>(null);
  const previewBoxRef = useRef<HTMLDivElement | null>(null);
  const [showNavLeft, setShowNavLeft] = useState(false);
  const [showNavRight, setShowNavRight] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  // 图片轮播
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselAnimating, setCarouselAnimating] = useState(false);
  // RAG 问答状态
  const [ragQuestion, setRagQuestion] = useState<string>("");
  const [ragAnswer, setRagAnswer] = useState<string>("");
  const [ragLoading, setRagLoading] = useState<boolean>(false);
  const [ragError, setRagError] = useState<string | null>(null);
  const ragESRef = useRef<EventSource | null>(null);
  const [ragTopK, setRagTopK] = useState<number>(5);
  const [ragMaxTokens, setRagMaxTokens] = useState<number>(1024);
  // 排队状态
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [queueTotal, setQueueTotal] = useState<number>(0);
  const [isQueuing, setIsQueuing] = useState<boolean>(false);
  // 从头像 URL 推断作者 ID（示例：.../avatars/3-xxxx.jpg → 3）
  const parseAvatarUserId = (url?: string): number | undefined => {
    if (!url) return undefined;
    const m = url.match(/\/avatars\/(\d+)-/);
    return m ? Number(m[1]) : undefined;
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!id) return;
      setError(null);
      try {
        const resp = await knowpostService.detail(id, tokens?.accessToken ?? undefined);
        if (cancelled) return;
        setDetail(resp);
        // 记录浏览历史
        addHistory({
          id: resp.id,
          title: resp.title,
          authorNickname: resp.authorNickname ?? "",
          coverImage: resp.images?.[0],
          tags: resp.tags ?? [],
        });
        // 异步加载正文内容
        if (resp.contentUrl) {
          const allowAnonymous = resp.visible === "public";
          if (allowAnonymous || !!tokens?.accessToken) {
            try {
              const text = await fetch(resp.contentUrl, { credentials: "omit" }).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.text();
              });
              if (!cancelled) {
                setContentText(text);
                setContentError(null);
              }
            } catch (e) {
              if (!cancelled) setContentError("正文暂不可读，可能为非公开或跨域受限");
            }
          } else {
            setContentError("该知文非公开，请登录后查看正文");
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "加载失败";
        if (!cancelled) setError(msg);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [id, tokens?.accessToken]);

  useEffect(() => {
    const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouch(touch);
    if (touch) {
      setShowNavLeft(true);
      setShowNavRight(true);
    }
  }, []);

  const handlePreviewMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouch) return;
    const el = previewBoxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const threshold = Math.max(60, Math.min(120, rect.width * 0.08));
    setShowNavLeft(x < threshold);
    setShowNavRight(x > rect.width - threshold);
  };

  const handlePreviewMouseLeave = () => {
    if (isTouch) return;
    setShowNavLeft(false);
    setShowNavRight(false);
  };

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  const prevImage = () => {
    if (!detail?.images?.length) return;
    setPreviewIndex((i) => (i - 1 + detail.images.length) % detail.images.length);
  };

  const nextImage = () => {
    if (!detail?.images?.length) return;
    setPreviewIndex((i) => (i + 1) % detail.images.length);
  };

  // 启动 RAG 流式问答
  const startRag = () => {
    if (!id) return;
    const q = ragQuestion.trim();
    if (!q) return;
    if (detail && detail.visible !== "public") {
      setRagError("仅公开知文支持问答");
      return;
    }
    setRagError(null);
    setRagAnswer("");
    setQueuePosition(0);
    setQueueTotal(0);
    setIsQueuing(false);
    // 关闭之前的连接
    if (ragESRef.current) {
      try { ragESRef.current.close(); } catch {}
      ragESRef.current = null;
    }
    const url = `/api/v1/knowposts/${id}/qa/stream?question=${encodeURIComponent(q)}&topK=${ragTopK}&maxTokens=${ragMaxTokens}`;
    const es = new EventSource(url);
    ragESRef.current = es;
    setRagLoading(true);

    // 默认消息处理：答案内容
    es.onmessage = (e) => {
      if (e.data) {
        setRagError(null);
        setRagAnswer((prev) => prev + e.data);
      }
    };

    // 排队事件
    es.addEventListener("queued", (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data);
        setQueuePosition(d.position ?? 0);
        setIsQueuing(true);
      } catch {}
    });
    es.addEventListener("position", (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data);
        setQueuePosition(d.position ?? 0);
        setQueueTotal(d.totalWaiting ?? 0);
      } catch {}
    });
    es.addEventListener("ready", () => {
      setIsQueuing(false);
    });
    es.addEventListener("timeout", (e: MessageEvent) => {
      setRagError("排队超时，请稍后重试");
      setRagLoading(false);
      setIsQueuing(false);
      try { es.close(); } catch {}
      ragESRef.current = null;
    });
    es.addEventListener("error", (e: Event) => {
      const msg = e as MessageEvent;
      if (msg.data && typeof msg.data === "string") {
        try {
          const d = JSON.parse(msg.data);
          setRagError(d.message ?? "请求失败");
        } catch {
          setRagError("请求失败，请稍后重试");
        }
      }
      setRagLoading(false);
      setIsQueuing(false);
      try { es.close(); } catch {}
      ragESRef.current = null;
    });

    es.onerror = () => {
      if (!isQueuing) {
        setRagLoading(false);
      }
      setIsQueuing(false);
      try { es.close(); } catch {}
      ragESRef.current = null;
    };
  };

  const stopRag = () => {
    if (ragESRef.current) {
      try { ragESRef.current.close(); } catch {}
      ragESRef.current = null;
    }
    setRagLoading(false);
    setIsQueuing(false);
  };

  useEffect(() => {
    return () => {
      // 页面卸载时关闭 SSE
      if (ragESRef.current) {
        try { ragESRef.current.close(); } catch {}
        ragESRef.current = null;
      }
    };
  }, []);

  return (
    <AppLayout
      header={
        <MainHeader
          headline={detail?.title ?? ""}
          subtitle=""
          rightSlot={<AuthStatus />}
        />
      }
      variant="cardless"
    >
      <article className={styles.detailCard}>
        {error ? <div style={{ color: "var(--color-danger)" }}>{error}</div> : null}
        {detail?.images?.length ? (
          <div className={styles.carousel}>
            <div className={styles.carouselTrack}>
              <div
                className={styles.carouselSlides}
                style={{
                  transform: `translateX(-${carouselIndex * 100}%)`,
                  transition: carouselAnimating ? "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
                }}
              >
                {detail.images.map((src, idx) => (
                  <div key={src + idx} className={styles.carouselSlide} onClick={() => openPreview(idx)}>
                    <img className={styles.carouselImage} src={src} alt={`${detail.title} ${idx + 1}`} />
                  </div>
                ))}
              </div>
            </div>

            {detail.images.length > 1 ? (
              <>
                <button
                  type="button"
                  className={`${styles.carouselBtn} ${styles.carouselBtnLeft}`}
                  aria-label="上一张"
                  onClick={() => {
                    if (carouselAnimating) return;
                    setCarouselAnimating(true);
                    setCarouselIndex(prev => (prev === 0 ? detail.images.length - 1 : prev - 1));
                    setTimeout(() => setCarouselAnimating(false), 420);
                  }}
                >
                  <ArrowRightIcon width={22} height={22} style={{ transform: "rotate(180deg)" }} />
                </button>
                <button
                  type="button"
                  className={`${styles.carouselBtn} ${styles.carouselBtnRight}`}
                  aria-label="下一张"
                  onClick={() => {
                    if (carouselAnimating) return;
                    setCarouselAnimating(true);
                    setCarouselIndex(prev => (prev === detail.images.length - 1 ? 0 : prev + 1));
                    setTimeout(() => setCarouselAnimating(false), 420);
                  }}
                >
                  <ArrowRightIcon width={22} height={22} />
                </button>

                <div className={styles.carouselDots}>
                  {detail.images.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`${styles.carouselDot} ${idx === carouselIndex ? styles.carouselDotActive : ""}`}
                      aria-label={`跳到第 ${idx + 1} 张`}
                      onClick={() => {
                        if (carouselAnimating) return;
                        setCarouselAnimating(true);
                        setCarouselIndex(idx);
                        setTimeout(() => setCarouselAnimating(false), 420);
                      }}
                    />
                  ))}
                </div>

                <div className={styles.carouselCounter}>
                  {carouselIndex + 1} / {detail.images.length}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}></div>
          <div className={styles.meta}>
            {detail?.authorAvatar ? (
              <img className={styles.authorAvatar} src={detail.authorAvatar} alt={detail.authorNickname} />
            ) : (
              <div className={styles.authorAvatarFallback}>
                {(detail?.authorNickname ?? "灵").charAt(0)}
              </div>
            )}
            <span className={styles.authorName}>{detail?.authorNickname ?? ""}</span>
            {(() => {
              const derivedId = detail?.authorId ?? parseAvatarUserId(detail?.authorAvatar);
              const isSelf = (derivedId && user?.id === derivedId) || (!!detail?.authorNickname && !!user?.nickname && detail.authorNickname === user.nickname);
              return derivedId && !isSelf ? <FollowButton targetUserId={derivedId} /> : null;
            })()}
          </div>
          <div className={styles.tagList}>
            {(detail?.tags ?? []).map(tag => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
          </div>
          <div className={styles.meta}>
            {detail?.publishTime ? (
              <span>{new Date(detail.publishTime).toLocaleDateString("zh-CN")}</span>
            ) : null}
          </div>
          <div className={styles.bottomBar}>
            {detail ? (
              <LikeFavBar
                entityId={detail.id}
                initialCounts={{ like: detail.likeCount ?? 0, fav: detail.favoriteCount ?? 0 }}
                initialState={{ liked: detail.liked, faved: detail.faved }}
              />
            ) : null}
          </div>
        </div>

        <SectionHeader title="内容正文" subtitle="" />

        <div className={styles.contentRow}>
          <div className={styles.contentMain}>
            <div className={`${styles.body} ${styles.markdown}`}>
              {contentText ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, ...props }) => (
                      <a {...props} target="_blank" rel="noreferrer" />
                    ),
                    img: ({ node, ...props }) => (
                      <img {...props} style={{ maxWidth: "100%", borderRadius: 12 }} />
                    ),
                  }}
                >
                  {contentText}
                </ReactMarkdown>
              ) : (
                "暂无内容"
              )}
            </div>
            {contentError ? (
              <div style={{ color: "var(--color-danger)" }}>{contentError} {detail?.contentUrl ? (<a href={detail.contentUrl} target="_blank" rel="noreferrer">查看原文</a>) : null}</div>
            ) : null}
          </div>

          <aside className={styles.ragPanel}>
            <div className={styles.ragBody}>
              <textarea
                className={styles.ragTextarea}
                placeholder="围绕本知文提问，例如：这篇知文的核心观点是什么？"
                value={ragQuestion}
                onChange={(e) => setRagQuestion(e.target.value)}
              />
              <div className={styles.ragControls}>
                <button
                  type="button"
                  className={`${styles.ragBtn} ${styles.ragBtnPrimary}`}
                  onClick={startRag}
                  disabled={ragLoading || !ragQuestion.trim()}
                >
                  {ragLoading ? "生成中…" : "发送"}
                </button>
                <button type="button" className={`${styles.ragBtn} ${styles.ragBtnGhost}`} onClick={stopRag} disabled={!ragLoading}>
                  停止
                </button>
              </div>
              <div className={styles.ragHint}>
                说明：仅“公开”内容支持问答，答案基于当前内容的索引片段实时生成。
              </div>
              {ragError ? (
                <div style={{ color: "var(--color-danger)" }}>{ragError}</div>
              ) : null}
              <div className={styles.ragAnswer}>
                {isQueuing ? (
                  <div className={styles.ragPlaceholder}>
                    <div style={{ fontWeight: 720, color: "var(--color-text-strong)", marginBottom: 6 }}>
                      ⏳ 排队等待中
                    </div>
                    <div style={{ fontSize: 13 }}>
                      前面还有 <strong>{queuePosition}</strong> 人
                      {queueTotal > 0 ? `（共 ${queueTotal} 人排队）` : ""}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>
                      获取槽位后将自动开始生成…
                    </div>
                  </div>
                ) : ragAnswer ? (
                  <div className={styles.markdown}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, ...props }) => (
                          <a {...props} target="_blank" rel="noreferrer" />
                        ),
                        img: ({ node, ...props }) => (
                          <img {...props} style={{ maxWidth: "100%", borderRadius: 12 }} />
                        ),
                      }}
                    >
                      {ragAnswer}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className={styles.ragPlaceholder}>
                    {ragLoading ? "等待生成…" : "这里将展示答案（支持流式）"}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

        {previewOpen && detail?.images?.length ? (
          <div className={styles.previewOverlay} onClick={() => setPreviewOpen(false)}>
            <div
              className={styles.previewBox}
              ref={previewBoxRef}
              onMouseMove={handlePreviewMouseMove}
              onMouseLeave={handlePreviewMouseLeave}
              onClick={(e) => e.stopPropagation()}
            >
              <img className={styles.previewImage} src={detail.images[previewIndex]} alt={detail.title} />
              <button
                type="button"
                className={`${styles.navButton} ${styles.navButtonLeft} ${showNavLeft ? styles.navButtonVisible : ""}`}
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                aria-label="上一张"
              >
                <ArrowRightIcon width={24} height={24} style={{ transform: "rotate(180deg)" }} />
              </button>
              <button
                type="button"
                className={`${styles.navButton} ${styles.navButtonRight} ${showNavRight ? styles.navButtonVisible : ""}`}
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                aria-label="下一张"
              >
                <ArrowRightIcon width={24} height={24} />
              </button>
              <button type="button" className={styles.closeButton} onClick={(e) => { e.stopPropagation(); setPreviewOpen(false); }} aria-label="关闭">关</button>
            </div>
          </div>
        ) : null}
      </article>
    </AppLayout>
  );
};

export default CourseDetailPage;
