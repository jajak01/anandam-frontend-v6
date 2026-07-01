import userApi from "./userApi";
import api from "./api"; // Admin API (pakai token admin)
import { saveLoginTimestamp, clearLoginTimestamp } from "./userLoginCache";

export interface RegisterDto {
  full_name: string;
  email: string;
  password: string;
  phone_number: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
    avatar_url?: string;
    gender?: string;
    date_of_birth?: string;
  };
}

export interface GoogleLoginDto {
  token: string;
}

export interface UpdateProfileDto {
  full_name?: string;
  phone_number?: string;
  avatar_url?: string;
  gender?: string;       
  date_of_birth?: string; 
}

export interface AddressDto {
  id?: string;
  label: string; 
  recipient_name: string;
  phone_number: string;
  full_address: string;
  is_default: boolean;
  latitude?: number; 
  longitude?: number;
}

export interface UserAdminDto {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  avatar_url?: string;
  gender?: string;
  birth_date?: string;
  is_active: boolean;
  created_at: string;
  addresses?: AddressDto[];
}

export interface UsersResponse {
  data: UserAdminDto[];
  total: number;
  page: number;
  last_page: number;
}

// ================= ADMIN: USER MANAGEMENT =================
// Pakai `api` (admin token) bukan `userApi`

export const adminGetAllUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<UsersResponse> => {
  const res = await api.get("/user/auth/admin/all", { params });
  return res.data;
};

export const adminGetUserById = async (id: string): Promise<UserAdminDto> => {
  const res = await api.get(`/user/auth/admin/${id}`);
  return res.data;
};

export const adminToggleUserActive = async (id: string) => {
  const res = await api.patch(`/user/auth/admin/${id}/toggle-active`);
  return res.data;
};

// ================= ADDRESS MANAGEMENT =================

export const getMyAddresses = async (): Promise<AddressDto[]> => {
  const res = await userApi.get("/user/auth/addresses");
  return res.data;
};

export const addAddress = async (data: AddressDto) => {
  const res = await userApi.post("/user/auth/addresses", data);
  return res.data;
};

export const updateAddress = async (id: string, data: AddressDto) => {
  const res = await userApi.put(`/user/auth/addresses/${id}`, data);
  return res.data;
};

export const deleteAddress = async (id: string) => {
  const res = await userApi.delete(`/user/auth/addresses/${id}`);
  return res.data;
};

export const setDefaultAddress = async (id: string) => {
  const res = await userApi.patch(`/user/auth/addresses/${id}/default`);
  return res.data;
};

// ================= REGISTER =================
export const registerUser = async (data: RegisterDto) => {
  const res = await userApi.post("/user/auth/register", data);
  return res.data;
};

// ================= LOGIN =================
export const loginUser = async (data: LoginDto): Promise<AuthResponse> => {
  const res = await userApi.post("/user/auth/login", data);
  const result = res.data;

  localStorage.setItem("user_token", result.access_token);
  localStorage.setItem("user_refresh_token", result.refresh_token);
  localStorage.setItem("user_data", JSON.stringify(result.user));
  saveLoginTimestamp();

  return result;
};

// ================= LOGOUT =================
export const logoutUser = async () => {
  try {
    await userApi.post("/user/auth/logout");
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_refresh_token");
    localStorage.removeItem("user_data");
    clearLoginTimestamp();
  }
};

// ================= GOOGLE LOGIN =================
export const googleLoginUser = async (data: GoogleLoginDto): Promise<AuthResponse> => {
  const res = await userApi.post("/user/auth/google", data);
  const result = res.data;

  localStorage.setItem("user_token", result.access_token);
  localStorage.setItem("user_refresh_token", result.refresh_token);
  localStorage.setItem("user_data", JSON.stringify(result.user));
  saveLoginTimestamp();

  return result;
};

// ================= GET PROFILE =================
export const getUserProfile = async () => {
  const res = await userApi.get("/user/auth/profile");
  return res.data;
};

// ================= UPDATE PROFILE =================
export const updateUserProfile = async (data: UpdateProfileDto) => {
  const res = await userApi.put("/user/auth/profile", data);
  
  const currentUserData = JSON.parse(localStorage.getItem("user_data") || "{}");
  const updatedData = { ...currentUserData, ...res.data };
  localStorage.setItem("user_data", JSON.stringify(updatedData));
  
  window.dispatchEvent(new Event("storage"));
  
  return res.data;
};

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await userApi.post("/user/auth/profile/avatar", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const changePasswordUser = async (data: any) => {
  const res = await userApi.put("/user/auth/change-password", data);
  return res.data;
};

// ================= FORGOT & RESET PASSWORD =================

export const forgotPasswordUser = async (email: string) => {
  const res = await userApi.post("/user/auth/forgot-password", { email });
  return res.data;
};

export const resetPasswordUser = async (data: any) => {
  const res = await userApi.post("/user/auth/reset-password", data);
  return res.data;
};