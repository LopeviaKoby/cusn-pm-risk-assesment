// Provisional visual bands only. These do not determine lifecycle decisions,
// approvals, treatment priority, or the official score in the validated data.
export function riskPresentation(type: string, score: number) {
  if (type === "Oportunidad") {
    const band = score <= 4 ? "opportunity-limited" : score <= 9 ? "opportunity-moderate" : score <= 14 ? "opportunity-high" : "opportunity-very-high";
    const label = score <= 4 ? "potencial limitado" : score <= 9 ? "potencial moderado" : score <= 14 ? "potencial alto" : "potencial muy alto";
    return { band, description: `Potencial ${score}, ${label}` };
  }
  const band = score <= 4 ? "risk-low" : score <= 9 ? "risk-medium" : score <= 14 ? "risk-high" : "risk-critical";
  const label = score <= 4 ? "bajo" : score <= 9 ? "medio" : score <= 14 ? "alto" : "crítico";
  return { band, description: `Exposición ${score}, nivel ${label}` };
}

export function riskStatusTone(status: string) {
  switch (status) {
    case "Materializado": return "danger" as const;
    case "Controlado": case "Potenciada": case "Realizada": return "positive" as const;
    case "Activo": case "Activa": return "info" as const;
    default: return "neutral" as const;
  }
}

export function projectStatusTone(status: string) {
  switch (status) {
    case "Cancelado": return "danger" as const;
    case "Detenido": return "review" as const;
    case "Terminado": case "Cerrado exitoso": return "positive" as const;
    case "En ejecución": case "En transición": return "info" as const;
    default: return "neutral" as const;
  }
}
