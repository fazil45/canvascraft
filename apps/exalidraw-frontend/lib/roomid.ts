"use client";

import axios from "axios";

export const getRoomId = async (slug: string) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_HTTP_BACKEND_URL}/room/${slug}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const roomID = response.data.roomId;

    if (!roomID) {
      throw new Error("Room ID not found in response");
    }
    return Number(roomID);
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", error.response?.data);
      throw new Error(error.response?.data?.error || "Failed to get room ID");
    }
    throw error;
  }
};
