import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db/client";
import { SECRET_TOKEN } from "@repo/backendcommon/secret";
import { WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: number[];
  userId: string;
  username: string | null;
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, SECRET_TOKEN);

    if (typeof decoded === "string") {
      return null;
    }

    if (!decoded || !decoded.userId) {
      return null;
    }
    console.log("User ID in checkUser funtion :-" + decoded.userId);
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

async function findUserName(userId: string) {
  try {
    if (!userId) {
      return;
    }

    console.log("WebSocket UserId " + userId);

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    console.log(user);

    if (user) {
      return user.name;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
  }
}

wss.on("connection", function connection(ws, request) {
  const url = request.url;

  if (!url) {
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";

  const userId = checkUser(token);

  if (userId === null) {
    ws.close();
    return;
  }

  users.push({
    ws,
    userId,
    rooms: [],
    username: null,
  });

  ws.on("message", async function message(data) {
    let parsedData;

    if (typeof data !== "string") {
      parsedData = JSON.parse(data.toString());
    } else {
      parsedData = JSON.parse(data);
    }

    if (parsedData.type === "join_room") {
      const user = users.find((x) => x.ws === ws);

      if (!user) return;

      const roomId = Number(parsedData.roomId);
      user.rooms.push(roomId);

      const name = await findUserName(user.userId);
      console.log("lookup:", user.userId, typeof user.userId, "->", name);
      user.username ??= name ?? null;

      user.username ??= (await findUserName(user.userId)) ?? null;

      // Broadcasting new user-joined
      users.forEach((otherUsers) => {
        if (otherUsers.rooms.includes(roomId) && otherUsers.ws !== ws) {
          otherUsers.ws.send(
            JSON.stringify({
              type: "user-joined",
              roomId,
              userId: user.userId,
              username: user.username,
            }),
          );
        }
      });

      const roomUsers = users
        .filter((user) => user.rooms.includes(roomId) && user.ws !== ws)
        .map((user) => ({ userId: user.userId, username: user.username }));

      console.log(roomUsers);

      // Telling new user who is already present in room
      ws.send(
        JSON.stringify({
          type: "room-users",
          roomId,
          users: roomUsers,
        }),
      );
    }

    if (parsedData.type === "leave_room") {
      const user = users.find((x) => x.ws === ws);
      if (!user) {
        return;
      }

      const roomId = Number(parsedData.roomId);
      if (!user.rooms.includes(roomId)) {
        return;
      }

      user.rooms = user.rooms.filter((x) => x !== parsedData.room);

      users.forEach((otherUser) => {
        if (otherUser.rooms.includes(roomId) && otherUser.ws !== ws) {
          otherUser.ws.send(
            JSON.stringify({
              type: "user-left",
              roomId,
              userId: user.userId,
              username: user.username,
            }),
          );
        }
      });
    }

    if (parsedData.type === "chat") {
      const roomId = Number(parsedData.roomId);
      const message = parsedData.message;
      const clientId = parsedData.clientId;

      try {
        await prisma.chat.create({
          data: {
            roomId: Number(roomId),
            message,
            userId,
          },
        });
      } catch (error: any) {
        console.log(error.message);
      }
      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              message: message,
              roomId,
              clientId,
            }),
          );
        }
      });
    }
    if (parsedData.type === "undo") {
      const roomId = Number(parsedData.roomId);
      const clientId = parsedData.clientId;
      const shape = parsedData.shape;

      users.forEach((user) => {
        if (user.rooms.includes(roomId) && user.ws !== ws) {
          user.ws.send(
            JSON.stringify({
              type: "undo",
              roomId,
              shape,
              clientId,
            }),
          );
        }
      });
    }

    if (parsedData.type === "redo") {
      const roomId = Number(parsedData.roomId);
      const clientId = parsedData.clientId;
      const shape = parsedData.shape;

      users.forEach((user) => {
        if (user.rooms.includes(roomId) && user.ws !== ws) {
          user.ws.send(
            JSON.stringify({
              type: "redo",
              roomId,
              shape,
              clientId,
            }),
          );
        }
      });
    }

    if (parsedData.type === "delete") {
      const roomId = Number(parsedData.roomId);
      const clientId = parsedData.clientId;

      users.forEach((user) => {
        if (user.rooms.includes(roomId) && user.ws !== ws) {
          user.ws.send(
            JSON.stringify({
              type: "delete",
              roomId,
              clientId,
            }),
          );
        }
      });
    }
  });

  ws.on("close", () => {
    const idx = users.findIndex((x) => x.ws === ws);
    if (idx === -1) return;
    const [gone] = users.splice(idx, 1);

    if (!gone) {
      return;
    }

    for (const roomId of gone.rooms) {
      users.forEach((other) => {
        if (other.rooms.includes(roomId)) {
          other.ws.send(
            JSON.stringify({
              type: "user-left",
              roomId,
              userId: gone.userId,
              username: gone.username,
            }),
          );
        }
      });
    }
  });
});

console.log("server is running on port 8080");
