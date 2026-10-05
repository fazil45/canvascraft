import axios from "axios";

export async function getExistingShapes(roomId: number) {
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_HTTP_BACKEND_URL}/chats/${roomId}`,
    {
      withCredentials: true,
    },
  );

  const messages = res.data.messages;

  const shapes = messages.map((x: { message: string }) => {
    return JSON.parse(x.message);
  });

  return shapes;
}