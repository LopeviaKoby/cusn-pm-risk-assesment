import { projects, users } from "./data";

// Functional catalogs: docs/Propuesta_IA_Modulo_Gestion_Riesgos_Squad.docx, Annex A.
export const riskCatalog = {
  Amenaza: { initial: "Activo", strategies: ["Evitar", "Mitigar", "Transferir", "Aceptar", "Escalar"] },
  Oportunidad: { initial: "Activa", strategies: ["Explotar", "Potenciar", "Compartir", "Aceptar", "Escalar"] },
};
export type RiskType = keyof typeof riskCatalog;
export const impactDomains = ["Alcance", "Costo", "Calidad", "Plazo"];
// AI_PMO_Propuesta_Iniciativa_Requerimientos_v2.docx, Annex D.
export let projectStates = ["Requiere P1P2", "En ejecución", "Detenido", "Cancelado", "En transición", "Terminado"];
export let countries = [...new Map(projects.map(project => [project.country, { name: project.country, code: project.countryCode }])).values()];
export let managers = users.filter(user => user.active && user.role === "Project Manager");
export const riskTypes = Object.keys(riskCatalog) as RiskType[];

export function refreshCatalogs(states: string[] = []) {
  if (states.length) projectStates = [...new Set(states)];
  countries = [...new Map(projects.map(project => [project.country, { name: project.country, code: project.countryCode }])).values()];
  managers = users.filter(user => user.active && user.role === "Project Manager");
}
