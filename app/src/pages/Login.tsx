import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { Button } from "@/components/atoms/primitives";
import { useAccess, useTheme } from "@/data/access";
import { safeReturn, useNavigation } from "@/navigation";
import logo from "@/assets/img/tivit-logo-no-bg.png";
import banner from "@/assets/img/tivit-login-banner.jpeg";

export default function Login() {
  const { signIn } = useAccess(), { light, toggle } = useTheme(), { url, navigate } = useNavigation();
  const [identifier, setIdentifier] = useState(""), [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false), [error, setError] = useState(""), [submitting, setSubmitting] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { document.title = "Inicia sesión · GPL"; }, []);
  return <main className={`login-layout ${light ? "light" : "dark"}`}><div className="login-image"><img src={banner} alt="" /></div><section className="login-panel" aria-labelledby="login-title">
    <div className="login-brand"><img src={logo} alt="TIVIT Almaviva Group" width="200" height="72" /><Button variant="ghost" aria-label={light ? "Activar tema oscuro" : "Activar tema claro"} onClick={toggle}>{light ? <Moon /> : <Sun />}</Button></div>
    <div className="login-content"><header><h1 id="login-title">Inicia sesión</h1><p>Ingresa tus credenciales para acceder.</p></header><form onSubmit={async event => { event.preventDefault(); if (submitting) return; setSubmitting(true); setError(""); try { const ok = await signIn(identifier, password); if (!ok) { setError("Identificación o contraseña incorrectas."); input.current?.focus(); return; } navigate(safeReturn(new URLSearchParams(url.split("?")[1]).get("destino"), "/workspace"), true); } catch { setError("No se pudo verificar la sesión. Confirma que el servicio de datos esté disponible."); } finally { setSubmitting(false); } }}>
      <label className="field">Identificación<input ref={input} name="identifier" autoComplete="username" required value={identifier} onChange={event => { setIdentifier(event.target.value); setError(""); }} aria-invalid={!!error} aria-describedby={error ? "login-error" : undefined} /></label>
      <label className="field">Contraseña<span className="password-input"><input name="password" autoComplete="current-password" required type={visible ? "text" : "password"} value={password} onChange={event => { setPassword(event.target.value); setError(""); }} aria-invalid={!!error} aria-describedby={error ? "login-error" : undefined} /><Button type="button" variant="ghost" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff /> : <Eye />}</Button></span></label>
      {error && <p id="login-error" className="form-error" role="alert">{error}</p>}<Button type="submit" variant="primary" disabled={submitting}>{submitting ? "Verificando…" : "Entrar a mi espacio →"}</Button>
    </form></div>
  </section></main>;
}
