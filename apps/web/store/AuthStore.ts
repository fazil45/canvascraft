import { errorHandler } from "@/lib/ErrorHandler";
import axios from "axios";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import { create } from "zustand";

type SigninResult = {
  success: boolean;
  error?: string;
};

type AuthStoreState = {
  signupLoading: boolean;
  signinLoading: boolean;
  signup: (
    name: string,
    email: string,
    password: string,
    route: AppRouterInstance,
  ) => Promise<void>;
  signin: (email: string, password: string) => Promise<SigninResult>;
  resendVerification: (email: string) => Promise<void>;
  signout: () => Promise<void>;
};

export const AuthStore = create<AuthStoreState>((set) => ({
  signinLoading: false,
  signupLoading: false,
  signup: async (
    name: string,
    email: string,
    password: string,
    route: AppRouterInstance,
  ) => {
    try {
      set({ signupLoading: true });
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_HTTP_BACKEND_URL}/signup`,
        {
          name,
          password,
          email,
        },
      );

      if (response.data.success) {
        toast.success("Verify Email has sent to your email");
        route.push("/signin");
      } else {
        toast.error(response.data.error);
      }
    } catch (error) {
      errorHandler(error);
    } finally {
      set({ signupLoading: false });
    }
  },
  signin: async (email: string, password: string) => {
    try {
      set({ signinLoading: true });
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_HTTP_BACKEND_URL!}/signin`,
        {
          password,
          email,
        },
        {
          withCredentials: true,
        },
      );

      return { success: response.data.success };
    } catch (error) {
      errorHandler(error);
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error,
        };
      }
      return { success: false };
    } finally {
      set({ signinLoading: false });
    }
  },
  resendVerification: async (email: string) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_HTTP_BACKEND_URL}/resend-verification`,
        { email },
      );
      toast.success("If the account exists, a verification email was sent");
    } catch (error) {
      errorHandler(error);
    }
  },
  signout: async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_HTTP_BACKEND_URL}/signout`,
        undefined,
        { withCredentials: true },
      );
    } catch (error) {
      errorHandler(error);
    }
  },
}));
