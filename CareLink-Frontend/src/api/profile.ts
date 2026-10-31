import { apiDelete, apiGet, apiPost, apiPut } from "./client";
import type { UserRole } from "./auth";

export interface UserProfile {
  id: string;
  role: UserRole;
  displayName: string;
  email: string;
  phone: string;
  professionalBio: string;
  website: string;
  contactAddress: string;
  avatarDataUrl: string | null;
  updatedAt: string;
}

export type UserProfileUpdate = Partial<Pick<UserProfile,
  "displayName" | "email" | "phone" | "professionalBio" | "website" | "contactAddress"
>>;

export const getMyProfile = (token: string) => apiGet<UserProfile>("/profile/me", token);
export const updateMyProfile = (token: string, data: UserProfileUpdate) => apiPut<UserProfile>("/profile/me", data, token);
export function uploadMyAvatar(token: string, file: File) {
  const form = new FormData();
  form.append("avatar", file);
  return apiPost<UserProfile>("/profile/me/avatar", form, token);
}
export const deleteMyAvatar = (token: string) => apiDelete<UserProfile>("/profile/me/avatar", token);
