import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type User = {
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      photo: string;
    };
  };
};

export const useAuth = () => {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const response: User = await axios.get(
        `${process.env.NEXT_PUBLIC_HTTP_BACKEND_URL}/me`,
        {
          withCredentials: true,
        },
      );

      return response.data.user;
    },
    retry: false,
  });
};
