import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as paymentService from "../services/payment.service.js";

export const handlePostPaymentRecord = asyncHandler(async (req, res) => {
  const { customerId, amountPaid, paymentMode, referenceNo, remarks } =
    req.body;

  const data = await paymentService.createPaymentRecord({
    customerId,
    amountPaid,
    paymentMode,
    referenceNo,
    remarks,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, data, "Payment receipt posted successfully."));
});
