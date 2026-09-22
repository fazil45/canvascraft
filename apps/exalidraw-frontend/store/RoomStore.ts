import { errorHandler } from "@/lib/ErrorHandler";
import axios from "axios";
import { toast } from "sonner";
import { create } from "zustand";

export type Participant = { userId: string; username: string | null };

type Room = {
  id: number;
  slug: string;
  createdAt: Date;
  adminId: string;
};

type RoomStoreState = {
  fetchRoom: () => Promise<void>;
  isLoading: boolean;
  roomCreationLoading: boolean;
  roomsCreated: Room[];
  deleteRoom: (id: number) => Promise<void>;
  createRoom: (slug: string) => Promise<void>;

  // for user left and join messages
  participants: Record<string, Participant>;
  setParticipants: (users: Participant[]) => void;
  addParticipant: (user: Participant) => void;
  removeParticipant: (userId: string) => void;
  reset: () => void;
};

export const RoomStore = create<RoomStoreState>((set) => ({
  isLoading: false,
  roomCreationLoading: false,
  roomsCreated: [],
  fetchRoom: async () => {
    try {
      const token = localStorage.getItem("token");
      set({ isLoading: true });
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_HTTP_BACKEND_URL}/room`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log("ROOM RESPONSE:", response.data);

      if (response.data.success) {
        new Promise((resolve) =>
          resolve(set({ roomsCreated: response.data.rooms })),
        );
      }
    } catch (error) {
      errorHandler(error);
    } finally {
      set({ isLoading: false });
    }
  },
  deleteRoom: async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_HTTP_BACKEND_URL}/room/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        toast.message(response.data.message);
        set((state) => ({
          roomsCreated: state.roomsCreated.filter((room) => room.id !== id),
        }));
      }
    } catch (error) {
      errorHandler(error);
    }
  },
  createRoom: async (slug: string) => {
    try {
      const token = localStorage.getItem("token");
      set({ roomCreationLoading: true });
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_HTTP_BACKEND_URL}/create-room`,
        {
          slug: slug,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        toast.success(response.data.message);
        set((state) => ({
          roomsCreated: [...state.roomsCreated, response.data.room],
        }));
      }
    } catch (error) {
      errorHandler(error);
    } finally {
      set({ roomCreationLoading: false });
    }
  },
  participants: {},
  setParticipants: (users) =>
    set({ participants: Object.fromEntries(users.map((u) => [u.userId, u])) }),

  addParticipant: (user) =>
    set((s) => ({ participants: { ...s.participants, [user.userId]: user } })),

  removeParticipant: (userId) =>
    set((s) => {
      const { [userId]: _removed, ...rest } = s.participants;
      return { participants: rest };
    }),
    
  reset: () => set({ participants: {} }),
}));
