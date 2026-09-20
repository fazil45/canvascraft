import { SECRET_TOKEN } from "@repo/backendcommon/secret";
import { CreateUserSchema, SigninSchema } from "@repo/common/types";
import { prisma } from "@repo/db/client";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

export const signup = async (req: Request, res: Response) => {
  try {
    const parseData = CreateUserSchema.safeParse(req.body);
    if (!parseData.success) {
      return res.status(400).json({
        success: false,
        error: "Incorrect inputs",
      });
    }
    const email = parseData.data.email;
    const password = parseData.data.password;
    const name = parseData.data.name;

    const userAlreadyExists = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (userAlreadyExists) {
      return res.status(409).json({
        success: false,
        error: `User with email:- ${email} already exists`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const response = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      success: true,
      message: "SignUp successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Failed to sign up",
    });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const siginData = SigninSchema.safeParse(req.body);

    if (!siginData.success) {
      return res.status(400).json({
        success: false,
        error: "Incorrect input",
      });
    }

    const email = siginData.data.email;
    const password = siginData.data.password;

    const checkUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!checkUser) {
      return res.status(404).json({
        success: false,
        error: `User with email:- ${email} does not exists`,
      });
    }

    if (!checkUser || !checkUser.password) {
      return res.status(404).json({
        success: false,
        error: "user not exist",
      });
    }

    const hashedPassword = await bcrypt.compare(password, checkUser.password);

    if (hashedPassword) {
      const token = jwt.sign(
        {
          userId: checkUser.id,
        },
        SECRET_TOKEN,
      );
      return res.status(200).json({
        success: true,
        token,
      });
    } else {
      return res.status(401).json({
        success: false,
        msg: "incorrect credential",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Failed to sign in",
    });
  }
};
