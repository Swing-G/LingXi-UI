import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { IdentifierType, RegisterRequest } from "@/types/auth";
import styles from "./RegisterPage.module.css";

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const identifierType: IdentifierType = "PHONE";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setSubmitting(true);
    try {
      const payload: RegisterRequest = {
        identifierType,
        identifier,
        password,
        agreeTerms
      };
      await register(payload);
      setMessage("注册成功，已自动登录");
      const from = (location.state as { from?: string } | undefined)?.from ?? "/";
      redirectTimerRef.current = window.setTimeout(() => {
        navigate(from, { replace: true });
      }, 400);
    } catch (err) {
      const info = err instanceof Error ? err.message : "注册失败，请稍后重试";
      setError(info);
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting || !identifier || !password || !confirmPassword || !agreeTerms;

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
            加入灵析
            <span className={styles.heroTitleAccent}>.</span>
          </h1>
          <p className={styles.heroSub}>
            注册账号，开始发布技术内容、参与讨论，构建你的工程知识体系。
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>01</div>
              <span>创建技术文章，沉淀排查过程与架构决策</span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>02</div>
              <span>全文检索社区内容，快速找到可复用的经验</span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>03</div>
              <span>AI 辅助问答，基于文章内容智能解答</span>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>04</div>
              <span>关注感兴趣的开发者，建立技术人脉</span>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧注册表单 */}
      <div className={styles.card}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>创建账号</h1>
          <p className={styles.subtitle}>使用手机号和密码注册</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="identifier">手机号</label>
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
              placeholder="请设置不少于 8 位且包含字母和数字的密码"
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmPassword">
              确认密码
            </label>
            <input
              id="confirmPassword"
              className={styles.input}
              type="password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              placeholder="请再次输入密码"
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <div className={styles.checkboxRow}>
              <input
                id="agreeTerms"
                type="checkbox"
                checked={agreeTerms}
                onChange={event => setAgreeTerms(event.target.checked)}
              />
              <label className={styles.label} htmlFor="agreeTerms">
                我已阅读并同意
                <a href="#" onClick={e => e.preventDefault()}>《用户协议》</a>
                和
                <a href="#" onClick={e => e.preventDefault()}>《隐私政策》</a>
              </label>
            </div>
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}
          {message ? <div className={styles.success}>{message}</div> : null}

          <div className={styles.actions}>
            <button type="submit" className={styles.submitButton} disabled={isDisabled}>
              {submitting ? "注册中..." : "立即注册"}
            </button>
            <div className={styles.switchLink}>
              已有账号？
              <button type="button" onClick={() => navigate("/login")}>返回登录</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
