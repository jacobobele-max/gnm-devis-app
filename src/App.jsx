import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, Plus, Check, Clock, FileText, Send, Wallet, X, ChevronRight, Building2, User, Calendar, Home } from "lucide-react";

// ---------- Constants ----------
const STATUS_FLOW = ["Demande", "Réponse à la demande par WhatsApp", "État des lieux", "Facturation", "Envoi facture PDF par WhatsApp", "Payé"];
const STATUS_COLOR = {
  "Demande": "#9A9590",
  "Réponse à la demande par WhatsApp": "#D4A54A",
  "État des lieux": "#B08A3E",
  "Facturation": "#4A9B8E",
  "Envoi facture PDF par WhatsApp": "#0F3D3E",
  "Payé": "#2E7D5B",
};

// Tarif standard GN&M — moyenne des prix de la Mercuriale Unitaire (11 prestations au m²)
const RATE_RECOMMENDED = 3570;
const RATE_FLOOR = 1051;

const SERVICES = [
  // Nettoyage professionnel et entretien des locaux
  { id: "bureaux_standard", label: "Entretien courant bureaux / commerces", category: "Nettoyage professionnel et entretien des locaux", rate: RATE_RECOMMENDED, floorRate: RATE_FLOOR },
  { id: "bureaux_renforce", label: "Entretien bureaux — fréquence renforcée (2x/jour)", category: "Nettoyage professionnel et entretien des locaux", rate: RATE_RECOMMENDED, floorRate: RATE_FLOOR },
  { id: "vitres_normal", label: "Nettoyage vitres — accès normal", category: "Nettoyage professionnel et entretien des locaux", rate: RATE_RECOMMENDED, floorRate: RATE_FLOOR },
  { id: "vitres_hauteur", label: "Nettoyage vitres — en hauteur / nacelle", category: "Nettoyage professionnel et entretien des locaux", rate: RATE_RECOMMENDED, floorRate: RATE_FLOOR },
  { id: "decapage", label: "Décapage et lustrage sols durs", category: "Nettoyage professionnel et entretien des locaux", rate: RATE_RECOMMENDED, floorRate: RATE_FLOOR },
  { id: "moquette", label: "Shampooing moquette / textile", category: "Nettoyage professionnel et entretien des locaux", rate: RATE_RECOMMENDED, floorRate: RATE_FLOOR },
  { id: "fin_chantier", label: "Nettoyage fin de chantier", category: "Nettoyage professionnel et entretien des locaux", rate: RATE_RECOMMENDED, floorRate: RATE_FLOOR },

  // Facility Management
  { id: "facility_management", label: "Facility Management — gestion technique de site", category: "Facility Management", rate: RATE_RECOMMENDED, floorRate: RATE_FLOOR },

  // Désinfection, dératisation et désinsectisation
  { id: "desinfection", label: "Désinfection de locaux (COVID / sanitaire)", category: "Désinfection, dératisation et désinsectisation", rate: RATE_RECOMMENDED, floorRate: RATE_FLOOR },
  { id: "deratisation", label: "Dératisation", category: "Désinfection, dératisation et désinsectisation", rate: RATE_RECOMMENDED, floorRate: RATE_FLOOR },
  { id: "desinsectisation", label: "Désinsectisation", category: "Désinfection, dératisation et désinsectisation", rate: RATE_RECOMMENDED, floorRate: RATE_FLOOR },

  // Gestion et entretien des espaces verts
  { id: "espaces_verts", label: "Entretien espaces verts", category: "Gestion et entretien des espaces verts", rate: RATE_RECOMMENDED, floorRate: RATE_FLOOR },

  // Maintenance et multiservices
  { id: "maintenance_multiservices", label: "Maintenance multiservices (technique, plomberie, électricité)", category: "Maintenance et multiservices", rate: RATE_RECOMMENDED, floorRate: RATE_FLOOR },

  // Logistique et services de support
  { id: "logistique_support", label: "Logistique et services de support", category: "Logistique et services de support", rate: RATE_RECOMMENDED, floorRate: RATE_FLOOR },

  // Gestion environnementale et hygiène
  { id: "gestion_environnementale", label: "Gestion environnementale et hygiène", category: "Gestion environnementale et hygiène", rate: RATE_RECOMMENDED, floorRate: RATE_FLOOR },

  // Nettoyage industriel et spécialisé
  { id: "industriel", label: "Entretien sites industriels / entrepôts", category: "Nettoyage industriel et spécialisé", rate: RATE_RECOMMENDED, floorRate: RATE_FLOOR },
];

// Code d'accès à l'espace Gérant — à modifier selon vos besoins
const MANAGER_PIN = "2027";

const STORAGE_KEY = "quotes-and-invoices";

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatFCFA(n) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

function computeNetAmount(q) {
  return q.estimate * (1 - (q.discount || 0) / 100);
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ---------- Storage helpers (localStorage — persistance locale au navigateur) ----------
async function loadQuotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQuotes(quotes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
  } catch (e) {
    console.error("Erreur de sauvegarde", e);
  }
}

// ---------- Status Timeline ----------
function StatusTimeline({ status }) {
  const idx = STATUS_FLOW.indexOf(status);
  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
      {STATUS_FLOW.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: i <= idx ? STATUS_COLOR[status] : "#E4E0D8",
                border: i === idx ? `3px solid ${STATUS_COLOR[status]}33` : "none",
                boxShadow: i === idx ? `0 0 0 4px ${STATUS_COLOR[status]}22` : "none",
                transition: "all 0.3s ease",
              }}
            />
            <span
              style={{
                fontSize: 11,
                marginTop: 6,
                color: i <= idx ? "#2B2D2D" : "#B0ABA2",
                fontWeight: i === idx ? 700 : 500,
                whiteSpace: "nowrap",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {s}
            </span>
          </div>
          {i < STATUS_FLOW.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 2,
                background: i < idx ? STATUS_COLOR[status] : "#E4E0D8",
                marginBottom: 18,
                transition: "background 0.3s ease",
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ---------- Client Request Form ----------
function ClientRequestForm({ onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    serviceId: SERVICES[0].id,
    surface: "",
    date: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);

  const service = SERVICES.find((s) => s.id === form.serviceId);
  const estimate = form.surface ? Number(form.surface) * service.rate : 0;

  const handleSubmit = () => {
    if (!form.name || !form.phone || !form.address || !form.date) {
      setError("Merci de remplir tous les champs pour recevoir votre devis.");
      return;
    }
    setError("");
    onSubmit({ ...form, estimate, service });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={styles.confirmBox}>
        <div style={{ ...styles.iconCircle, background: "#4A9B8E22" }}>
          <Check size={28} color="#4A9B8E" strokeWidth={2.5} />
        </div>
        <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 24, margin: "16px 0 8px", color: "#0F3D3E" }}>
          Demande envoyée
        </h2>
        <p style={{ color: "#5C5850", fontSize: 15, maxWidth: 340, lineHeight: 1.5 }}>
          Nous avons bien reçu votre demande pour <strong>{form.address}</strong>. Notre équipe vous enverra un devis détaillé sous 24h au {form.phone}.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm({ name: "", phone: "", address: "", serviceId: SERVICES[0].id, surface: "", date: "", notes: "" });
          }}
          style={styles.ghostButton}
        >
          Faire une nouvelle demande
        </button>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 26, color: "#0F3D3E", margin: 0 }}>
          Demander un devis
        </h2>
        <p style={{ color: "#8A8579", fontSize: 14, marginTop: 6 }}>
          Décrivez votre besoin, recevez une estimation immédiate.
        </p>
      </div>

      <FieldRow icon={<User size={16} />} label="Nom complet">
        <input
          style={styles.input}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex : Pierre Nzé"
        />
      </FieldRow>

      <FieldRow icon={<Send size={16} />} label="Téléphone">
        <input
          style={styles.input}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Ex : 077 12 34 56"
        />
      </FieldRow>

      <FieldRow icon={<Home size={16} />} label="Adresse d'intervention">
        <input
          style={styles.input}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Ex : Quartier Louis, Libreville"
        />
      </FieldRow>

      <FieldRow icon={<Building2 size={16} />} label="Type de prestation">
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setServiceMenuOpen((o) => !o)}
            style={{ ...styles.input, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}
          >
            <span>{service.label}</span>
            <ChevronRight size={15} color="#8A8579" style={{ transform: serviceMenuOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease", flexShrink: 0 }} />
          </button>
          {serviceMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1.5px solid #E4E0D8",
                borderRadius: 9,
                boxShadow: "0 6px 20px rgba(15,61,62,0.14)",
                zIndex: 30,
                maxHeight: 260,
                overflowY: "auto",
              }}
            >
              {SERVICES.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setForm({ ...form, serviceId: s.id });
                    setServiceMenuOpen(false);
                  }}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontSize: 14,
                    color: s.id === form.serviceId ? "#0F3D3E" : "#2B2D2D",
                    fontWeight: s.id === form.serviceId ? 700 : 500,
                    background: s.id === form.serviceId ? "#0F3D3E0d" : "transparent",
                  }}
                >
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </div>
        <p style={{ fontSize: 12.5, color: "#8A8579", marginTop: 6, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600 }}>{service.category}</span>
        </p>
      </FieldRow>

      <FieldRow icon={<Calendar size={16} />} label="Date souhaitée">
        <input
          type="date"
          style={styles.input}
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
      </FieldRow>

      <FieldRow icon={<FileText size={16} />} label="Précisions (facultatif)">
        <textarea
          style={{ ...styles.input, minHeight: 60, resize: "vertical" }}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Ex : présence d'animaux, accès difficile..."
        />
      </FieldRow>

      {error && <p style={{ color: "#C0392B", fontSize: 13, marginTop: 8 }}>{error}</p>}

      <button type="button" onClick={handleSubmit} style={styles.primaryButton}>
        Envoyer ma demande <ChevronRight size={16} />
      </button>
    </div>
  );
}

function FieldRow({ icon, label, children, style }) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#5C5850", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

// ---------- Manager PIN Gate ----------
function PinGate({ onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const checkPin = () => {
    if (pin === MANAGER_PIN) {
      setError("");
      onSuccess();
    } else {
      setError("Code incorrect.");
      setPin("");
    }
  };

  return (
    <div style={{ ...styles.card, textAlign: "center" }}>
      <div style={{ ...styles.iconCircle, background: "#0F3D3E14", margin: "0 auto" }}>
        <Wallet size={26} color="#0F3D3E" />
      </div>
      <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 22, margin: "16px 0 6px", color: "#0F3D3E" }}>
        Espace Gérant
      </h2>
      <p style={{ color: "#8A8579", fontSize: 14, marginBottom: 20 }}>
        Saisissez le code d'accès pour continuer.
      </p>
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        style={{ ...styles.input, textAlign: "center", letterSpacing: 4, fontSize: 18 }}
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") checkPin();
        }}
        placeholder="••••"
        maxLength={8}
      />
      {error && <p style={{ color: "#C0392B", fontSize: 13, marginTop: 10 }}>{error}</p>}
      <button type="button" onClick={checkPin} style={styles.primaryButton}>
        Accéder au tableau de bord <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ---------- Manager Dashboard ----------
function ManagerDashboard({ quotes, setQuotes }) {
  const [selected, setSelected] = useState(null);

  const updateStatus = async (id, newStatus) => {
    const updated = quotes.map((q) => (q.id === id ? { ...q, status: newStatus } : q));
    setQuotes(updated);
    await saveQuotes(updated);
    if (selected?.id === id) setSelected({ ...selected, status: newStatus });
  };

  const updateSurface = async (id, surfaceValue, rate) => {
    const s = Number(surfaceValue) || 0;
    const estimate = s * rate;
    const updated = quotes.map((q) => (q.id === id ? { ...q, surface: surfaceValue, estimate } : q));
    setQuotes(updated);
    await saveQuotes(updated);
    if (selected?.id === id) setSelected({ ...selected, surface: surfaceValue, estimate });
  };

  const updateDiscount = async (id, discount) => {
    const updated = quotes.map((q) => (q.id === id ? { ...q, discount } : q));
    setQuotes(updated);
    await saveQuotes(updated);
    if (selected?.id === id) setSelected({ ...selected, discount });
  };

  const stats = {
    total: quotes.length,
    enAttente: quotes.filter((q) => q.status === "Demande" || q.status === "Réponse à la demande par WhatsApp" || q.status === "État des lieux").length,
    revenueEnCours: quotes.filter((q) => q.status !== "Payé").reduce((s, q) => s + computeNetAmount(q), 0),
    revenuePaye: quotes.filter((q) => q.status === "Payé").reduce((s, q) => s + computeNetAmount(q), 0),
  };

  if (selected) {
    const idx = STATUS_FLOW.indexOf(selected.status);
    const nextStatus = STATUS_FLOW[idx + 1];
    const packDef = SERVICES.find((s) => s.id === selected.service?.id);
    return (
      <div style={styles.card}>
        <button onClick={() => setSelected(null)} style={styles.backLink}>
          ← Retour à la liste
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 16 }}>
          <div>
            <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 24, color: "#0F3D3E", margin: 0 }}>
              {selected.name}
            </h2>
            <p style={{ color: "#8A8579", fontSize: 14, margin: "4px 0 0" }}>{selected.address}</p>
          </div>
          <span
            style={{
              background: STATUS_COLOR[selected.status] + "1a",
              color: STATUS_COLOR[selected.status],
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 700,
            }}
          >
            {selected.status}
          </span>
        </div>

        <div style={{ margin: "28px 0" }}>
          <StatusTimeline status={selected.status} />
        </div>

        <div style={styles.detailGrid}>
          <DetailItem label="Téléphone" value={selected.phone} />
          <DetailItem label="Prestation" value={selected.service.label} />
          <div>
            <span style={styles.detailLabel}>Surface (m²)</span>
            <input
              type="number"
              style={{ ...styles.input, marginTop: 4, padding: "6px 10px", fontSize: 14.5 }}
              value={selected.surface || ""}
              onChange={(e) => updateSurface(selected.id, e.target.value, packDef ? packDef.rate : 0)}
              placeholder="À renseigner"
            />
          </div>
          <DetailItem label="Date souhaitée" value={formatDate(selected.date)} />
        </div>

        {selected.notes && (
          <div style={{ marginTop: 16 }}>
            <span style={styles.detailLabel}>Notes</span>
            <p style={{ fontSize: 14.5, color: "#2B2D2D", marginTop: 4 }}>{selected.notes}</p>
          </div>
        )}

        <div style={styles.estimateBox}>
          <div>
            <span style={{ fontSize: 13, color: "#5C5850" }}>Montant du devis</span>
            <div style={{ fontSize: 12, color: "#8A8579", marginTop: 2 }}>
              {packDef ? `${formatFCFA(packDef.rate)}/m² × ${selected.surface || "?"} m²` : ""}
            </div>
          </div>
          <span style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 24, color: "#0F3D3E", fontWeight: 600, textDecoration: selected.discount ? "line-through" : "none", opacity: selected.discount ? 0.5 : 1 }}>
            {formatFCFA(selected.estimate)}
          </span>
        </div>

        <div style={{ marginTop: 10 }}>
          <span style={styles.detailLabel}>Remise</span>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            {[0, 5, 10, 15].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => updateDiscount(selected.id, pct)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border: (selected.discount || 0) === pct ? "1.5px solid #0F3D3E" : "1.5px solid #E4E0D8",
                  background: (selected.discount || 0) === pct ? "#0F3D3E" : "#fff",
                  color: (selected.discount || 0) === pct ? "#F7F5F0" : "#5C5850",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {selected.discount > 0 && (() => {
          const net = computeNetAmount(selected);
          const floorTotal = packDef && selected.surface ? packDef.floorRate * Number(selected.surface) : null;
          const belowFloor = floorTotal !== null && net < floorTotal;
          return (
            <div style={{ ...styles.estimateBox, marginTop: 8, background: belowFloor ? "#C0392B14" : "#4A9B8E14" }}>
              <span style={{ fontSize: 13, color: belowFloor ? "#C0392B" : "#2E7D5B", fontWeight: 600 }}>
                Montant net (remise {selected.discount}%){belowFloor ? " ⚠ sous le plancher" : ""}
              </span>
              <span style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 22, fontWeight: 600, color: belowFloor ? "#C0392B" : "#2E7D5B" }}>
                {formatFCFA(net)}
              </span>
            </div>
          );
        })()}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, padding: "10px 16px", background: "#D4A54A14", borderRadius: 10 }}>
          <span style={{ fontSize: 12.5, color: "#8A6D1F", fontWeight: 600 }}>
            Marge de négociation (usage interne)
          </span>
          <span style={{ fontSize: 13.5, color: "#8A6D1F", fontWeight: 700 }}>
            Plancher : {packDef && selected.surface ? formatFCFA(packDef.floorRate * Number(selected.surface)) : "n/d"}
          </span>
        </div>

        {nextStatus && (
          <button onClick={() => updateStatus(selected.id, nextStatus)} style={styles.primaryButton}>
            Passer à « {nextStatus} » <ChevronRight size={16} />
          </button>
        )}
        {selected.status === "Payé" && (
          <div style={{ ...styles.confirmBox, padding: "20px 0 0", boxShadow: "none" }}>
            <p style={{ color: "#2E7D5B", fontWeight: 600, fontSize: 14 }}>✓ Dossier soldé</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={styles.statsRow}>
        <StatCard label="Demandes" value={stats.total} icon={<FileText size={18} />} />
        <StatCard label="En attente" value={stats.enAttente} icon={<Clock size={18} />} />
        <StatCard label="À encaisser" value={formatFCFA(stats.revenueEnCours)} icon={<Send size={18} />} small />
        <StatCard label="Encaissé" value={formatFCFA(stats.revenuePaye)} icon={<Wallet size={18} />} small accent />
      </div>

      <h3 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 19, color: "#0F3D3E", margin: "28px 0 12px" }}>
        Devis &amp; factures
      </h3>

      {quotes.length === 0 ? (
        <div style={styles.emptyState}>
          <FileText size={32} color="#C4BFB4" />
          <p style={{ color: "#8A8579", fontSize: 14.5, marginTop: 10, textAlign: "center" }}>
            Aucune demande pour le moment.<br />Les demandes clients apparaîtront ici.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {quotes
            .slice()
            .reverse()
            .map((q) => (
              <button key={q.id} onClick={() => setSelected(q)} style={styles.quoteRow}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#2B2D2D" }}>{q.name}</div>
                  <div style={{ fontSize: 13, color: "#8A8579", marginTop: 2 }}>
                    {q.service.label}{q.surface ? ` · ${q.surface} m²` : ""} · {formatDate(q.date)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#0F3D3E" }}>{formatFCFA(computeNetAmount(q))}{q.discount > 0 ? ` (-${q.discount}%)` : ""}</span>
                  <span
                    style={{
                      background: STATUS_COLOR[q.status] + "1a",
                      color: STATUS_COLOR[q.status],
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 11.5,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {q.status}
                  </span>
                  <ChevronRight size={16} color="#C4BFB4" />
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <span style={styles.detailLabel}>{label}</span>
      <p style={{ fontSize: 14.5, color: "#2B2D2D", margin: "4px 0 0", fontWeight: 500 }}>{value}</p>
    </div>
  );
}

function StatCard({ label, value, icon, small, accent }) {
  return (
    <div style={{ ...styles.statCard, background: accent ? "#0F3D3E" : "#fff" }}>
      <div style={{ color: accent ? "#F7F5F0aa" : "#8A8579" }}>{icon}</div>
      <span
        style={{
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: small ? 16 : 22,
          fontWeight: 600,
          color: accent ? "#fff" : "#0F3D3E",
          marginTop: 6,
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 11.5, color: accent ? "#F7F5F0aa" : "#8A8579", marginTop: 2 }}>{label}</span>
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  const [view, setView] = useState("client");
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [managerAuthed, setManagerAuthed] = useState(false);

  useEffect(() => {
    loadQuotes().then((q) => {
      setQuotes(q);
      setLoading(false);
    });
  }, []);

  const addQuote = useCallback(
    async (data) => {
      const newQuote = {
        id: genId(),
        status: "Demande",
        createdAt: new Date().toISOString(),
        ...data,
      };
      const updated = [...quotes, newQuote];
      setQuotes(updated);
      await saveQuotes(updated);
    },
    [quotes]
  );

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
        input, select, textarea { font-family: 'Inter', sans-serif; }
        input:focus, select:focus, textarea:focus { outline: 2px solid #4A9B8E; outline-offset: 1px; }
        button:focus-visible { outline: 2px solid #4A9B8E; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={styles.logoMark}>
            <Sparkles size={18} color="#F7F5F0" />
          </div>
          <div>
            <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 17, fontWeight: 600, color: "#0F3D3E", lineHeight: 1.1 }}>
              Gabon Nettoyage
            </div>
            <div style={{ fontSize: 10.5, color: "#8A8579", letterSpacing: 1, textTransform: "uppercase" }}>
              Multiservices
            </div>
          </div>
        </div>
        <div style={styles.tabSwitch}>
          <button
            onClick={() => setView("client")}
            style={{ ...styles.tabButton, ...(view === "client" ? styles.tabButtonActive : {}) }}
          >
            Client
          </button>
          <button
            onClick={() => {
              setManagerAuthed(false);
              setView("manager");
            }}
            style={{ ...styles.tabButton, ...(view === "manager" ? styles.tabButtonActive : {}) }}
          >
            Gérant
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#8A8579", padding: 60 }}>Chargement…</div>
        ) : view === "client" ? (
          <ClientRequestForm onSubmit={addQuote} />
        ) : managerAuthed ? (
          <ManagerDashboard quotes={quotes} setQuotes={setQuotes} />
        ) : (
          <PinGate onSuccess={() => setManagerAuthed(true)} />
        )}
      </main>
    </div>
  );
}

// ---------- Styles ----------
const styles = {
  page: {
    minHeight: "100vh",
    background: "#F7F5F0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingBottom: 40,
  },
  header: {
    width: "100%",
    maxWidth: 560,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 20px 12px",
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 9,
    background: "#0F3D3E",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tabSwitch: {
    display: "flex",
    background: "#EAE6DC",
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    border: "none",
    background: "transparent",
    padding: "7px 14px",
    fontSize: 13,
    fontWeight: 600,
    color: "#8A8579",
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  tabButtonActive: {
    background: "#fff",
    color: "#0F3D3E",
    boxShadow: "0 1px 3px rgba(15,61,62,0.12)",
  },
  main: {
    width: "100%",
    maxWidth: 560,
    padding: "12px 20px",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 1px 3px rgba(15,61,62,0.06), 0 8px 24px rgba(15,61,62,0.04)",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 9,
    border: "1.5px solid #E4E0D8",
    fontSize: 14.5,
    color: "#2B2D2D",
    background: "#FBFAF7",
  },
  primaryButton: {
    width: "100%",
    marginTop: 20,
    padding: "13px 18px",
    borderRadius: 10,
    border: "none",
    background: "#0F3D3E",
    color: "#F7F5F0",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    transition: "background 0.2s ease",
  },
  ghostButton: {
    marginTop: 20,
    padding: "10px 16px",
    borderRadius: 9,
    border: "1.5px solid #E4E0D8",
    background: "transparent",
    color: "#0F3D3E",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  estimateBox: {
    marginTop: 8,
    padding: "14px 16px",
    background: "#0F3D3E0d",
    borderRadius: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  confirmBox: {
    background: "#fff",
    borderRadius: 16,
    padding: "36px 24px",
    boxShadow: "0 1px 3px rgba(15,61,62,0.06), 0 8px 24px rgba(15,61,62,0.04)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: 8,
  },
  statCard: {
    borderRadius: 12,
    padding: "14px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    boxShadow: "0 1px 3px rgba(15,61,62,0.06)",
  },
  emptyState: {
    background: "#fff",
    borderRadius: 16,
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  quoteRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px 16px",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(15,61,62,0.06)",
    width: "100%",
    textAlign: "left",
  },
  backLink: {
    border: "none",
    background: "transparent",
    color: "#4A9B8E",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginTop: 8,
  },
  detailLabel: {
    fontSize: 11.5,
    color: "#8A8579",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: 600,
  },
};
