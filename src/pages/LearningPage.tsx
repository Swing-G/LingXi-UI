import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
// 移除对 mock 数据文件的依赖，改为本地常量
const learningEmptyState = {
  title: "还没有收藏的技术内容",
  description: "先从首页发现值得复盘的工程经验和技术讨论。",
  actionLabel: "前往首页"
};
import AuthStatus from "@/features/auth/AuthStatus";
import styles from "./LearningPage.module.css";

const LearningPage = () => {
  return (
    <AppLayout
      header={
        <MainHeader
          headline="技术收藏"
          subtitle="保存值得回看的文章、方案和讨论，形成自己的工程知识库"
          rightSlot={<AuthStatus />}
        />
      }
    >
      <div className={styles.emptyCard}>
        <div>
          <div className={styles.title}>{learningEmptyState.title}</div>
          <div className={styles.description}>{learningEmptyState.description}</div>
        </div>
        <div className={styles.icon} aria-hidden="true" />
        <button type="button" className="ghost-button">
          {learningEmptyState.actionLabel}
        </button>
      </div>
    </AppLayout>
  );
};

export default LearningPage;
