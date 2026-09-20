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
}

const users: User[] = [];

const u = new URL(process.env.DATABASE_URL ?? "postgres://missing");
console.log("adapter target:", u.hostname, u.port, "cwd:", process.cwd());

   console.log("DB URL set:", !!process.env.DATABASE_URL);

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

  console.log("Userid in username function :- " + userId);

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  console.log("User :- " + user);

  if (user) {
    return user.name;
  } else {
    return null;
  }
  } catch (error) {
    console.log(error)
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

      const username = await findUserName(user.userId);

      // Broadcasting new user-joined
      users.forEach((otherUsers) => {
        if (otherUsers.rooms.includes(roomId) && otherUsers.ws !== ws) {
          otherUsers.ws.send(
            JSON.stringify({
              type: "user-joined",
              roomId,
              userId: user.userId,
              username,
            }),
          );
        }
      });

      const roomUsers = users
        .filter((user) => user.rooms.includes(roomId) && user.ws !== ws)
        .map((user) => ({ userId: user.userId }));

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

      const username = await findUserName(user.userId);

      user.rooms = user.rooms.filter((x) => x !== parsedData.room);

      users.forEach((otherUser) => {
        if (otherUser.rooms.includes(roomId) && otherUser.ws !== ws) {
          otherUser.ws.send(
            JSON.stringify({
              type: "user-left",
              roomId,
              userId: user.userId,
              username,
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
});

console.log("server is running on port 8080");
