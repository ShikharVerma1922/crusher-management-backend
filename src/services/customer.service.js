import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

export const getAllCustomers = async () => {
  const customers = await prisma.customer.findMany();

  return { customerList: customers };
};
