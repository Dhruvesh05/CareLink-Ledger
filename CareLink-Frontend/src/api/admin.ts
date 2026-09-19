import { apiGet } from "./client";
import { getToken } from "./auth";

async function getCount(path: string): Promise<number> {
  const token = getToken() ?? undefined;
  const response = await apiGet<{ total?: number; count?: number }>(path, token);
  return response.total ?? response.count ?? 0;
}

export const getDoctorCount = () => getCount("/doctors/total");
export const getHospitalCount = () => getCount("/hospitals/count");
export const getAuditLogCount = () => getCount("/audit/stats/total");