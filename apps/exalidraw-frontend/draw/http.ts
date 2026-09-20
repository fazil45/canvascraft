import axios from "axios";

export async function getExistingShapes(roomId: number) {
  const token = localStorage.getItem("token");
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_HTTP_BACKEND_URL}/chats/${roomId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const messages = res.data.messages;

  const shapes = messages.map((x: { message: string }) => {
    const messageData = JSON.parse(x.message);
    return messageData.shape;
  });
  return shapes;
}
