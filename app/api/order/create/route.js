import { inngest } from "@/configs/inngest";
import Product from "@/models/Product";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { address, items } = await request.json();
    if (!address || !items) {
      return NextResponse.json({ success: false, message: "Invalid Data" });
    }
    const amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);
      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    await inngest.send({
      name: "create-user-order",
      data: {
        userId,
        address,
        items,
        amount: amount + Math.floor(amount * 0.02),
        status: "Order Placed",
        date: Date.now(),
      },
    });

    const user = await User.findById(userId);
    user.cartItems = {};
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Order Placed",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}
