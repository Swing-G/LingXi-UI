import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import SectionHeader from "@/components/common/SectionHeader";
import CourseCard from "@/components/cards/CourseCard";
import LikeFavBar from "@/components/common/LikeFavBar";
import AuthStatus from "@/features/auth/AuthStatus";
import { knowpostService } from "@/services/knowpostService";
import { getHistory, clearHistory, type HistoryItem } from "@/services/readingHistory";
import styles from "./LearningPage.module.css";
import feedStyles from "./HomePage.module.css";

const LearningPage = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [feedItems, setFeedItems] = useState<Array<{
    id: string;
    title: string;
    description: string;
    coverImage?: string;
    tags: string[];
    tagJson?: string;
    authorAvatar?: string;
    authorAvator?: string;
    authorNickname: string;
    likeCount?: number;
    favoriteCount?: number;
    liked?: boolean;
    faved?: boolean;
  }>>([]);
  const [feedLoading, setFeedLoading] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setFeedLoading(true);
      try {
        const resp = await knowpostService.feed(1, 6);
        if (!cancelled) setFeedItems(resp.items ?? []);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const refreshHistory = () => setHistory(getHistory());

  return (
    <AppLayout
      header={
        <MainHeader
          headline="技术收藏"
          subtitle="浏览历史与推荐内容，构建你的工程知识体系"
          rightSlot={<AuthStatus />}
        />
      }
    >
      {/* 浏览历史 */}
      <SectionHeader
        title="最近浏览"
        subtitle="你最近查看过的技术内容"
        actions={
          history.length > 0 ? (
            <button
              type="button"
              className="ghost-button"
              onClick={() => { clearHistory(); refreshHistory(); }}
            >
              清空历史
            </button>
          ) : undefined
        }
      />

      {history.length > 0 ? (
        <div className={styles.historyList}>
          {history.slice(0, 8).map((item) => (
            <Link key={item.id} to={`/post/${item.id}`} className={styles.historyItem} onClick={refreshHistory}>
              {item.coverImage ? (
                <img className={styles.historyCover} src={item.coverImage} alt="" />
              ) : (
                <div className={styles.historyCoverPlaceholder} />
              )}
              <div className={styles.historyMeta}>
                <span className={styles.historyTitle}>{item.title}</span>
                <span className={styles.historyAuthor}>{item.authorNickname}</span>
                <span className={styles.historyTime}>
                  {new Date(item.visitedAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.emptyHint}>
          <p>还没有浏览记录，去首页发现感兴趣的技术内容。</p>
          <Link to="/" className="ghost-button">前往首页</Link>
        </div>
      )}

      {/* 推荐阅读 */}
      <SectionHeader
        title="为你推荐"
        subtitle="基于社区热度的技术内容推荐"
      />

      {feedLoading ? (
        <div className={styles.emptyHint}>加载中...</div>
      ) : (
        <div className={feedStyles.masonry}>
          {feedItems.map((item) => (
            <div key={item.id} className={feedStyles.masonryItem}>
              <CourseCard
                id={item.id}
                title={item.title}
                summary={item.description ?? ""}
                tags={item.tags ?? []}
                authorTags={(() => {
                  try {
                    return item.tagJson ? (JSON.parse(item.tagJson) as unknown[]).filter((t) => typeof t === "string") as string[] : [];
                  } catch {
                    return [];
                  }
                })()}
                teacher={{ name: item.authorNickname, avatarUrl: item.authorAvatar ?? item.authorAvator }}
                coverImage={item.coverImage}
                to={`/post/${item.id}`}
                footerExtra={<LikeFavBar entityId={item.id} compact initialCounts={{ like: item.likeCount ?? 0, fav: item.favoriteCount ?? 0 }} initialState={{ liked: item.liked, faved: item.faved }} />}
              />
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default LearningPage;
