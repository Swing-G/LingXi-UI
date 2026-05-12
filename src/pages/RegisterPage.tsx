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
      <div className={styles.card}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>加入灵析</h1>
          <p className={styles.subtitle}>使用手机号和密码注册账号</p>
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
            <span className={styles.tips}>短信注册验证码接口已保留，后续接入短信服务后可恢复校验。</span>
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
