import { errorHandler } from "@/lib/ErrorHandler";
import axios from "axios";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import { create } from "zustand";

type AuthStoreState = {
  signup: (
    name: string,
    email: string,
    password: string,
    route: AppRouterInstance,
  ) => Promise<void>;
  signin: (
    email: string,
    password: string,
    route: AppRouterInstance,
  ) => Promise<void>;
};

export const AuthStore = create<AuthStoreState>((set) => ({
  signup: async (
    name: string,
    email: string,
    password: string,
    route: AppRouterInstance,
  ) => {
    try {
      console.log("here");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_HTTP_BACKEND_URL}/signup`,
        {
          name,
          password,
          email,
        },
      );

      if (response.data.success) {
        toast.success("Account created successfully");
        route.push("/signin");
      } else {
        toast.error(response.data.error);
      }
    } catch (error) {
      errorHandler(error);
    }
  },
  signin: async (email: string, password: string, route: AppRouterInstance) => {
    try {
      console.log("here");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_HTTP_BACKEND_URL}/signin`,
        {
          password,
          email,
        },
      );

      if (response.data.success) {
        toast.success("Signin successfully");
        const token = response.data.token;
        localStorage.setItem("token", token);
        route.push("/dashboard");
      } else {
        toast.error(response.data.error);
      }
    } catch (error) {
      errorHandler(error);
    }
  },
}));
