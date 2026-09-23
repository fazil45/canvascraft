import { CreateRoomSchema } from "@repo/common/types";
import { prisma } from "@repo/db/client";
import { Request, Response } from "express";

export const createRoom = async (req: Request, res: Response) => {
  try {
    const parseData = CreateRoomSchema.safeParse(req.body);

    if (!parseData.success) {
      return res.status(400).json({
        success: false,
        error: "Incorrect inputs",
      });
    }
    //@ts-ignore
    const userId = req.userId;
    const room = await prisma.room.create({
      data: {
        slug: parseData.data.slug,
        adminId: userId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      roomId: room.id,
    });
    return res.status(409).json({
      success: false,
      error: "Slug already used",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Failed to create room",
    });
  }
};

export const getRooms = async (req: Request, res: Response) => {
  try {
    //@ts-ignore
    const userID = req.userId;
    const rooms = await prisma.room.findMany({
      where: {
        adminId: userID,
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      rooms: rooms,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch rooms",
    });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const roomId = Number(req.params.id);
    //@ts-ignore
    const userId = req.userId;

    await prisma.chat.deleteMany({
      where: {
        roomId: roomId,
      },
    });

    await prisma.room.delete({
      where: {
        adminId: userId,
        id: roomId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Room deleted succesfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(404).json({
      success: false,
      error: "Room doesn't exist",
    });
  }
};

export const allChatsDelete = async (req: Request, res: Response) => {
  try {
    const roomId = Number(req.params.roomId);

    if (!roomId) {
      return res.status(404).json({
        success: false,
        error: "RoomId doesn't exist",
      });
    }

    await prisma.chat.deleteMany({
      where: {
        roomId: roomId,
      },
    });

    res.status(200).json({
      success: true,
      message: "All chats deleted",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete chats",
    });
  }
};

export const fetchMessage = async (req: Request, res: Response) => {
  try {
    const roomId = Number(req.params["roomId"]);
    const messages = await prisma.chat.findMany({
      where: {
        roomId: roomId,
        deleted: false,
      },
      orderBy: {
        id: "desc",
      },
      take: 500,
    });
    res.status(200).json({
      success: true,
      messages: messages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch messages",
    });
  }
};

export const getRoomSlug = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const room = await prisma.room.findFirst({
      where: {
        //@ts-ignore
        slug: slug,
      },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room doesn't exist",
      });
    }

    return res.status(200).json({
      success: true,
      roomId: room?.id,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch room",
    });
  }
};
