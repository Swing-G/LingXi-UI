import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import CourseCard from "@/components/cards/CourseCard";
import LikeFavBar from "@/components/common/LikeFavBar";
import { knowpostService } from "@/services/knowpostService";
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./HomePage.module.css";

const HomePage = () => {
  const [items, setItems] = useState<Array<{
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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await knowpostService.feed(1, 20);
        if (!cancelled) {
          setItems(resp.items ?? []);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "加载失败";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppLayout
      header={
        <MainHeader
          headline="灵析"
          subtitle="开发者技术互动平台。沉淀工程经验、分享技术判断，也让问题在讨论中更快被看清。"
          rightSlot={<AuthStatus />}
        />
      }
      variant="cardless"
    >
      <section className={styles.heroPanel}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>LINGXI / DEV INTERACTION</span>
          <h2>把排查过程、架构取舍和真实踩坑讲清楚。</h2>
          <p>这里不是资讯流，而是开发者之间交换判断的工作台。问题、方案、复盘和代码经验会被组织成可以检索、收藏、继续讨论的内容。</p>
        </div>
        <div className={styles.heroBoard} aria-hidden="true">
          <div className={styles.terminalTop}>/ ask runtime-patterns</div>
          <div className={styles.terminalLine}><span>01</span> React 状态拆分边界</div>
          <div className={styles.terminalLine}><span>02</span> Spring Boot 鉴权链路复盘</div>
          <div className={styles.terminalLine}><span>03</span> 前端上传直传异常处理</div>
          <div className={styles.terminalFoot}>indexed threads: {items.length || "--"}</div>
        </div>
      </section>

      <section className={styles.streamHeader}>
        <div>
          <span className={styles.kicker}>RECENT THREADS</span>
          <h2>最新技术内容</h2>
        </div>
        <p>优先展示有明确问题、可复盘过程和可执行结论的内容。</p>
      </section>

      {error ? <div className={styles.stateBox}>{error}</div> : null}
      <div className={styles.masonry}>
        {items.map(item => (
          <div key={item.id} className={styles.masonryItem}>
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
        {loading ? <div className={styles.masonryItem}><div className={styles.stateBox}>正在同步内容流</div></div> : null}
        {!loading && items.length === 0 ? (
          <div className={styles.masonryItem}><div className={styles.stateBox}>暂无内容，先发布一篇技术笔记</div></div>
        ) : null}
      </div>
    </AppLayout>
  );
};

export default HomePage;
