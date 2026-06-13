import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { LoginRequest } from "@/types/auth";
import styles from "./LoginPage.module.css";

type LocationState = {
  from?: string;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, user } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as LocationState | undefined)?.from ?? "/";

  useEffect(() => {
    if (!isLoading && user) {
      navigate(from, { replace: true });
    }
  }, [isLoading, user, navigate, from]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload: LoginRequest = { identifierType: "PHONE", identifier, password };
      await login(payload);
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "登录失败，请稍后重试";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting || !identifier || !password;

  return (
    <div className={styles.page}>
      {/* 左侧装饰区 */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.brandRow}>
            <div className={styles.brandMark} aria-hidden="true" />
            <span className={styles.brandKicker}>LINGXI · DEV FORUM</span>
          </div>

          <h1 className={styles.heroTitle}>
            灵析
            <span className={styles.heroTitleAccent}>.</span>
          </h1>
          <p className={styles.heroSub}>
            开发者技术互动平台。沉淀工程经验、分享技术判断，也让问题在讨论中更快被看清。
          </p>

          <div className={styles.terminal} aria-hidden="true">
            <div className={styles.terminalBar}>
              <span className={styles.terminalDot} />
              <span className={styles.terminalDot} />
              <span className={styles.terminalDot} />
              <span className={styles.terminalLabel}>lingxi ~ dev/forum</span>
            </div>
            <div className={styles.terminalBody}>
              <div className={styles.terminalLine}>
                <span className={styles.terminalPrompt}>$</span>
                <span>search --topic</span>
                <span className={styles.terminalArg}>"Spring Boot 鉴权"</span>
              </div>
              <div className={styles.terminalLine}>
                <span className={styles.terminalOutput}>▸</span>
                <span>3 篇复盘文章 · 12 条讨论</span>
              </div>
              <div className={styles.terminalLine} style={{ marginTop: 10 }}>
                <span className={styles.terminalPrompt}>$</span>
                <span>publish --draft</span>
                <span className={styles.terminalArg}>"MySQL 死锁排查记"</span>
              </div>
              <div className={styles.terminalLine}>
                <span className={styles.terminalOutput}>▸</span>
                <span>草稿已保存 · 可继续编辑</span>
              </div>
              <div className={styles.terminalLine} style={{ marginTop: 10 }}>
                <span className={styles.terminalPrompt}>$</span>
                <span>rag --ask</span>
                <span className={styles.terminalArg}>"Redis 分布式队列如何实现？"</span>
              </div>
              <div className={styles.terminalLine}>
                <span className={styles.terminalOutput}>▸</span>
                <span>检索到 4 个相关上下文 · 生成中</span>
                <span className={styles.terminalCursor}>▌</span>
              </div>
            </div>
          </div>

          <div className={styles.featureTags}>
            <span>全文检索</span>
            <span>RAG 智能问答</span>
            <span>Markdown 创作</span>
            <span>关注动态</span>
          </div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className={styles.card}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>欢迎回来</h1>
          <p className={styles.subtitle}>使用手机号和密码登录灵析</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="identifier">
              手机号
            </label>
            <input
              id="identifier"
              className={styles.input}
              value={identifier}
              onChange={event => setIdentifier(event.target.value)}
              placeholder="请输入手机号"
              type="tel"
              autoComplete="tel"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              登录密码
            </label>
            <input
              id="password"
              className={styles.input}
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}

          <div className={styles.actions}>
            <button type="submit" className={styles.submitButton} disabled={isDisabled}>
              {submitting ? "登录中..." : "登录"}
            </button>
            <div className={styles.switchLink}>
              还没有账号？
              <button
                type="button"
                className={styles.inlineLink}
                onClick={() => navigate("/register", { state: { from } })}
              >
                前往注册
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
