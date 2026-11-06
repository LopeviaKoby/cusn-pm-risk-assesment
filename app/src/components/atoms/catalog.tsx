import { cloneElement, useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type ReactElement } from "react";
import { LuExternalLink, LuUserRound } from "react-icons/lu";
import type { IconType } from "react-icons";
import { Button } from "./primitives";

export { Button, Badge } from "./primitives";

type Size = "sm" | "md" | "lg";
type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

export function Icon({ glyph: Glyph, size = "md", label, className = "" }: { glyph: IconType; size?: Size; label?: string; className?: string }) {
  return <Glyph className={`atom-icon atom-icon-${size} ${className}`} aria-hidden={label ? undefined : true} aria-label={label} role={label ? "img" : undefined} focusable="false" />;
}

export function IconButton({ icon, label, size = "md", variant = "ghost", ...props }: Omit<ComponentProps<typeof Button>, "children" | "size" | "variant"> & { icon: IconType; label: string; size?: Size; variant?: ButtonVariant }) {
  return <Button {...props} size={size} variant={variant} className={`atom-icon-button ${props.className ?? ""}`} aria-label={label}><Icon glyph={icon} size={size} /></Button>;
}

export function TextInput({ size = "md", error = false, className = "", ...props }: Omit<ComponentProps<"input">, "size"> & { size?: Size; error?: boolean }) {
  return <input {...props} className={`atom-input atom-input-${size} ${className}`} aria-invalid={error || props["aria-invalid"] || undefined} />;
}

export function Checkbox({ indeterminate = false, ...props }: ComponentProps<"input"> & { indeterminate?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return <input {...props} ref={ref} type="checkbox" className={`atom-check ${props.className ?? ""}`} aria-checked={indeterminate ? "mixed" : props.checked} />;
}

export function RadioButton(props: Omit<ComponentProps<"input">, "type">) {
  return <input {...props} type="radio" className={`atom-radio ${props.className ?? ""}`} />;
}

export function Switch(props: Omit<ComponentProps<"input">, "type" | "role">) {
  return <input {...props} type="checkbox" role="switch" className={`atom-switch ${props.className ?? ""}`} />;
}

export function Avatar({ initials, name, size = "md", imageUrl }: { initials?: string; name?: string; size?: Size; imageUrl?: string }) {
  const [failed, setFailed] = useState(false);
  return <span className={`atom-avatar atom-avatar-${size}`} role="img" aria-label={name ?? initials ?? "Usuario sin imagen"}>{imageUrl && !failed ? <img src={imageUrl} alt="" onError={() => setFailed(true)} /> : initials ? initials : <Icon glyph={LuUserRound} />}</span>;
}

export function TextLink({ external = false, children, ...props }: ComponentProps<"a"> & { external?: boolean }) {
  return <a {...props} className={`atom-link ${props.className ?? ""}`} target={external ? "_blank" : props.target} rel={external ? "noopener noreferrer" : props.rel}>{children}{external && <Icon glyph={LuExternalLink} size="sm" />}</a>;
}

export function BreadcrumbItem({ current = false, children, ...props }: ComponentProps<"a"> & { current?: boolean }) {
  return current ? <span className="atom-breadcrumb" aria-current="page">{children}</span> : <a {...props} className={`atom-breadcrumb ${props.className ?? ""}`}>{children}</a>;
}

export function TabItem({ selected = false, children, ...props }: ComponentProps<"button"> & { selected?: boolean }) {
  return <button {...props} type={props.type ?? "button"} className={`atom-tab ${props.className ?? ""}`} data-selected={selected}>{children}</button>;
}

export function Spinner({ size = "md", label = "Cargando" }: { size?: Size; label?: string }) {
  return <span className={`atom-spinner atom-spinner-${size}`} role="status" aria-label={label} />;
}

export function Skeleton({ width = "100%", height = 16 }: { width?: CSSProperties["width"]; height?: CSSProperties["height"] }) {
  return <span className="atom-skeleton" aria-hidden="true" style={{ width, height }} />;
}

export function Tooltip({ text, children }: { text: string; children: ReactElement<{ "aria-describedby"?: string }> }) {
  const id = useId();
  return <span className="atom-tooltip">{cloneElement(children, { "aria-describedby": id })}<span id={id} className="atom-tooltip-bubble" role="tooltip">{text}</span></span>;
}

export function Divider({ orientation = "horizontal" }: { orientation?: "horizontal" | "vertical" }) {
  return <span className={`atom-divider atom-divider-${orientation}`} aria-hidden="true" />;
}
