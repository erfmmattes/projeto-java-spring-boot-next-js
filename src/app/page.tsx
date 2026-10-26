"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Visit = {
  id: number;
  name: string;
  cpf: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED";
  protocol: string | null;
  attempts: number;
  createdAt: string;
};

function normalizeCpf(value: string) { return value.replace(/\D/g, ""); }

function isValidCpf(value: string) {
  const cpf = normalizeCpf(value);
  if (cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false;
  const digit = (part: string, weight: number) => {
    const sum = [...part].reduce((total, number) => total + Number(number) * weight--, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return Number(cpf[9]) === digit(cpf.slice(0, 9), 10) && Number(cpf[10]) === digit(cpf.slice(0, 9) + cpf[9], 11);
}

function formatCpf(value: string) {
  return normalizeCpf(value).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

async function readError(response: Response) {
  try {
    const body = await response.json();
    return body.message || body.detail || "Não foi possível concluir a operação. Tente novamente.";
  } catch { return "Não foi possível concluir a operação. Tente novamente."; }
}

const statusCopy = {
  PENDING: { label: "Aguardando processamento", note: "Seu atendimento foi registrado e está na fila." },
  PROCESSING: { label: "Gerando seu protocolo", note: "Estamos consultando o serviço de atendimento." },
  COMPLETED: { label: "Atendimento confirmado", note: "Seu protocolo já está disponível." },
};

export default function Home() {
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [recent, setRecent] = useState<Visit[]>([]);
  const [copied, setCopied] = useState(false);

  const refreshRecent = useCallback(async () => {
    try {
      const response = await fetch("/api/visits", { cache: "no-store" });
      if (response.ok) setRecent(await response.json());
    } catch { /* O formulário continua disponível quando a lista não puder carregar. */ }
  }, []);

  useEffect(() => { void refreshRecent(); }, [refreshRecent]);

  useEffect(() => {
    if (!visit || visit.status === "COMPLETED") return;
    let active = true;
    const poll = async () => {
      try {
        const response = await fetch(`/api/visits/${visit.id}`, { cache: "no-store" });
        if (!response.ok) throw new Error(await readError(response));
        const updated: Visit = await response.json();
        if (!active) return;
        setVisit(updated);
        if (updated.status === "COMPLETED") void refreshRecent();
      } catch { /* Uma falha breve de rede não cancela o acompanhamento. */ }
    };
    void poll();
    const timer = window.setInterval(poll, 2500);
    return () => { active = false; window.clearInterval(timer); };
  }, [visit?.id, visit?.status, refreshRecent]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setFieldError(""); setCopied(false);
    if (name.trim().length < 2) { setFieldError("Informe seu nome completo."); return; }
    if (!isValidCpf(cpf)) { setFieldError("Confira o CPF digitado."); return; }
    setSubmitting(true);
    try {
      const response = await fetch("/api/visits", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), cpf: normalizeCpf(cpf) }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const created: Visit = await response.json();
      setVisit(created); setName(""); setCpf("");
      setRecent((items) => [created, ...items.filter((item) => item.id !== created.id)]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível conectar ao servidor. Tente novamente.");
    } finally { setSubmitting(false); }
  }

  async function copyProtocol() {
    if (!visit?.protocol) return;
    try { await navigator.clipboard.writeText(visit.protocol); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { setError("Não foi possível copiar o protocolo neste navegador."); }
  }

  const completed = visit?.status === "COMPLETED";

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" aria-label="Clínica Aurora, início">
          <span className="brand-mark"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 8v24M8 20h24" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"/><circle cx="20" cy="20" r="16.5" stroke="currentColor" strokeWidth="1.5" opacity=".55"/></svg></span>
          <span className="brand-type"><strong>aurora</strong><span>CLÍNICA INTEGRADA</span></span>
        </a>

        <div className="sidebar-rule" />
        <div className="sidebar-caption">ESPAÇO DO PACIENTE</div>
        <div className="nav-current"><span className="nav-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7.8 12 4l8 3.8v8.4L12 20l-8-3.8V7.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M4.6 7.7 12 11.5l7.4-3.8M12 11.5V20" stroke="currentColor" strokeWidth="1.6"/></svg></span>Meus atendimentos</div>
        <div className="sidebar-bottom"><span className="online-dot" />Recepção digital <span className="live-label">ONLINE</span></div>
      </aside>

      <section className="main-panel" id="inicio">
        <header className="topbar"><div className="breadcrumb">Início <span>/</span> <strong>Atendimento</strong></div><div className="secure-label"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3.7" y="8.5" width="12.6" height="8.2" rx="1.8" stroke="currentColor" strokeWidth="1.4"/><path d="M6.3 8.5V6.2a3.7 3.7 0 1 1 7.4 0v2.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>Ambiente seguro</div></header>

        <div className="content-wrap">
          <section className="intro"><div className="eyebrow"><span className="eyebrow-line" />ATENDIMENTO DIGITAL</div><h1>Estamos aqui<br/>para <em>cuidar de você.</em></h1><p>Informe seus dados para iniciar seu atendimento.<br className="desktop-break"/> Em instantes, você recebe seu protocolo.</p></section>

          <div className="content-grid">
            <section className="form-card" aria-labelledby="form-title">
              <div className="card-heading"><div><div className="step-label">01 <span>—</span> IDENTIFICAÇÃO</div><h2 id="form-title">Seus dados</h2></div><div className="heading-stamp" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.4"/><path d="M5.5 20v-1.7a6.5 6.5 0 0 1 13 0V20h-13Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg></div></div>

              <form onSubmit={submit} noValidate>
                <label className="field-label" htmlFor="name">Nome completo <span>*</span></label>
                <div className="input-wrap"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="6.4" r="2.7" stroke="currentColor" strokeWidth="1.35"/><path d="M4.4 16.7v-1.2a5.6 5.6 0 0 1 11.2 0v1.2H4.4Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round"/></svg><input id="name" name="name" autoComplete="name" placeholder="Como podemos chamar você?" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} disabled={submitting}/></div>

                <label className="field-label cpf-label" htmlFor="cpf">CPF <span>*</span></label>
                <div className="input-wrap"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.8" y="4.2" width="14.4" height="11.6" rx="2" stroke="currentColor" strokeWidth="1.35"/><circle cx="7.1" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4.9 13a2.3 2.3 0 0 1 4.4 0M11.2 8h3.3M11.2 10.4h3.3M11.2 12.8h2.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg><input id="cpf" name="cpf" inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" value={cpf} onChange={(event) => setCpf(formatCpf(event.target.value))} maxLength={14} disabled={submitting}/></div>
                <div className="privacy-note"><svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="3.4" y="7.5" width="11.2" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.25"/><path d="M5.7 7.5V5.7a3.3 3.3 0 1 1 6.6 0v1.8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>Seus dados são protegidos e usados apenas para identificação.</div>
                {fieldError && <div className="inline-error" role="alert">{fieldError}</div>}
                {error && <div className="inline-error" role="alert">{error}</div>}
                <button className="submit-button" type="submit" disabled={submitting}>{submitting ? <><span className="button-spinner"/>Enviando seus dados...</> : <>Iniciar atendimento <span aria-hidden="true">↗</span></>}</button>
              </form>
              <div className="required-note"><span>*</span> Campos obrigatórios</div>
            </section>

            <section className="status-card" aria-labelledby="status-title" aria-live="polite">
              <div className="card-heading status-heading"><div><div className="step-label">02 <span>—</span> ACOMPANHAMENTO</div><h2 id="status-title">Seu atendimento</h2></div><span className="status-indicator"><i/>AO VIVO</span></div>
              {visit ? <div className="status-content">
                <div className={`status-illustration ${completed ? "is-complete" : ""}`}><div className="pulse pulse-one"/><div className="pulse pulse-two"/><div className="status-icon">{completed ? <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m8 16.4 5.1 5.1L24.5 10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg> : <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="10.5" stroke="currentColor" strokeWidth="1.7"/><path d="M16 9.8v6.7l4.4 2.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>}</div></div>
                <div className={`status-title ${completed ? "complete-text" : ""}`}>{statusCopy[visit.status].label}</div><p className="status-note">{statusCopy[visit.status].note}</p>
                {completed && visit.protocol ? <div className="protocol-box"><div className="protocol-label">SEU PROTOCOLO</div><div className="protocol-value">{visit.protocol}</div><button className="copy-button" type="button" onClick={copyProtocol}>{copied ? "Copiado ✓" : "Copiar protocolo"}</button></div> : <div className="progress-wrap"><div className="progress-meta"><span>ATENDIMENTO <strong>#{String(visit.id).padStart(5, "0")}</strong></span><span>EM ANDAMENTO</span></div><div className="progress-track"><span/></div></div>}
                <div className="status-footnote"><span className="online-dot"/>Atualização automática a cada instante</div>
              </div> : <div className="empty-status"><div className="empty-art"><div className="empty-ring"><svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M22 12v20M12 22h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="22" cy="22" r="16" stroke="currentColor" strokeWidth="1.25" opacity=".55"/></svg></div><span className="spark spark-a">✳</span><span className="spark spark-b">✦</span></div><h3>Seu próximo passo começa aqui.</h3><p>Preencha seus dados ao lado.<br/>Assim que seu atendimento for iniciado,<br/> acompanhamos tudo para você.</p><div className="empty-caption"><span/>AGUARDANDO SEU CADASTRO<span/></div></div>}
            </section>
          </div>

          <section className="care-strip"><div className="care-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20.2s-7.7-4.3-7.7-10.1a4.1 4.1 0 0 1 7.7-1.9 4.1 4.1 0 0 1 7.7 1.9c0 5.8-7.7 10.1-7.7 10.1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg></div><div><strong>Cuidado que começa no primeiro contato.</strong><span>Nossa equipe está pronta para receber você.</span></div><span className="care-signature">Com carinho, <em>Clínica Aurora</em></span></section>

          {recent.length > 1 && <section className="recent-section"><div className="recent-heading"><div className="step-label">HISTÓRICO</div><h2>Atendimentos recentes</h2></div><div className="recent-list">{recent.slice(0, 4).map((item) => <button className={`recent-item ${visit?.id === item.id ? "selected" : ""}`} key={item.id} onClick={() => { setVisit(item); setError(""); }}><span className={`recent-dot ${item.status === "COMPLETED" ? "done" : ""}`}/><span className="recent-name">{item.name}</span><span className="recent-id">#{String(item.id).padStart(5, "0")}</span><span className="recent-state">{item.status === "COMPLETED" ? "Concluído" : "Em andamento"}</span><span className="recent-arrow">↗</span></button>)}</div></section>}

          <footer className="page-footer"><span>© 2026 Clínica Aurora</span><span>Feito com cuidado <i>♥</i></span></footer>
        </div>
      </section>
    </main>
  );
}

