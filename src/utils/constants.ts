export const SAMPLE_CONTRACT = `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of January 1, 2025, between Acme Corp ("Company") and Vendor Solutions Inc ("Vendor").

1. SERVICES
Vendor agrees to provide software development services as directed by Company. Company retains the right to modify the scope of work at any time without additional compensation to Vendor.

2. PAYMENT TERMS
Company shall pay Vendor within 90 days of invoice receipt. Company reserves the right to withhold payment indefinitely if, in Company's sole discretion, deliverables do not meet expectations. Late payments shall not accrue interest.

3. INTELLECTUAL PROPERTY
All work product, inventions, and developments created by Vendor, including any pre-existing intellectual property incorporated into deliverables, shall become the exclusive property of Company upon creation. Vendor waives all moral rights to such work.

4. CONFIDENTIALITY
Vendor shall maintain strict confidentiality of all Company information in perpetuity, including after termination. This obligation survives termination of this Agreement indefinitely. Company has no reciprocal confidentiality obligations.

5. LIABILITY
Company's liability is limited to fees paid in the last 30 days. Vendor shall indemnify and hold harmless Company from any and all claims, including those arising from Company's own negligence. Vendor waives any right to consequential, indirect, or punitive damages.

6. TERMINATION
Company may terminate this Agreement at any time without cause and without notice. Upon termination, Vendor forfeits all unpaid invoices regardless of work completed.

7. DISPUTE RESOLUTION
All disputes shall be resolved through binding arbitration in Company's home jurisdiction. Vendor waives the right to participate in class action lawsuits. The prevailing party's legal fees shall be borne by Vendor.

8. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Delaware.`;

export const RC = {
  // bg uses rgba so highlights are VISIBLE in both dark and light themes
  high:   { bg: "rgba(229,57,53,0.14)",   border: "#E53935", text: "#B71C1C", dot: "#E53935", badge: "#FFEBEE", glow: "rgba(229,57,53,0.20)" },
  medium: { bg: "rgba(251,140,0,0.13)",   border: "#FB8C00", text: "#E65100", dot: "#FB8C00", badge: "#FFF3E0", glow: "rgba(251,140,0,0.20)" },
  low:    { bg: "rgba(30,136,229,0.11)",  border: "#1E88E5", text: "#0D47A1", dot: "#1E88E5", badge: "#E3F2FD", glow: "rgba(30,136,229,0.18)" },
};

export function btnStyle(bg, border, color, outlined = false) {
  return {
    background: outlined ? "transparent" : `linear-gradient(135deg,${bg},${border})`,
    border: `1px solid ${outlined ? border : "transparent"}`,
    color, padding: "8px 16px", borderRadius: 6,
    cursor: "pointer", fontSize: 11, fontWeight: 700,
    letterSpacing: "0.07em", fontFamily: "system-ui",
  };
}
