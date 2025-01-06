"use server";

import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { CartItem } from "@/types";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";

import { convertToPlainObject, formatError, roundNumber } from "../utils";
import { cartItemSchema, insertCartSchema } from "../validators";


// Calculate cart prices
const calculateCartPrices = (items: CartItem[]) => {
  const itemsPrice = roundNumber(
    items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)
  );
  const shippingPrice = roundNumber(itemsPrice > 100 ? 0 : 10);
  const taxPrice = roundNumber(itemsPrice * 0.15);
  const totalPrice = roundNumber(itemsPrice + shippingPrice + taxPrice);
  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

export const addItemToCart = async (item: CartItem) => {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;

    if (!sessionCartId) {
      throw new Error("Cart session not found");
    }

    const session = await auth();
    const userId = session?.user?.id;

    // Get cart
    const cart = await getMyCart();

    // Parse and validate item
    const parsedItem = cartItemSchema.parse(item);

    // Find product in database
    const product = await prisma.product.findUnique({
      where: {
        id: parsedItem.productId,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (!cart) {
      // Create new cart
      const newCart = insertCartSchema.parse({
        userId: userId,
        items: [parsedItem],
        sessionCartId: sessionCartId,
        ...calculateCartPrices([parsedItem]),
      });

      // Add to database
      await prisma.cart.create({
        data: newCart,
      });

      // Revalidate product page
      revalidatePath(`/products/${product.slug}`);

      return {
        success: true,
        message: `${product.name} added to cart`,
      };
    } else {
      // Check if item already exists in cart
      const itemExists = (cart.items as CartItem[]).find(
        (item) => item.productId === parsedItem.productId
      );
      if (itemExists) {
        // Check the stock
        if (product.stock < itemExists.qty + 1) {
          throw new Error("Not enough stock");
        }

        // Update item quantity
        (cart.items as CartItem[]).find((item) => item.productId === parsedItem.productId)!.qty++;
      } else {
        // Check the stock
        if (product.stock < parsedItem.qty) {
          throw new Error("Not enough stock");
        }

        // Add item to cart
        cart.items.push(parsedItem);
      }
      // Save to database
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: cart.items as Prisma.CartUpdateitemsInput[],
          ...calculateCartPrices(cart.items as CartItem[]),
        },
      });

      // Revalidate product page
      revalidatePath(`/products/${product.slug}`);

      return {
        success: true,
        message: `${product.name} ${itemExists ? "updated in" : "added to"} cart`,
      };
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: formatError(error),
    };
  }
};

export async function getMyCart() {
  // Check for cart cookie
  const sessionCartId = (await cookies()).get("sessionCartId")?.value;

  if (!sessionCartId) {
    throw new Error("Cart session not found");
  }

  const session = await auth();
  const userId = session?.user?.id;

  // Get user cart from database
  const cart = await prisma.cart.findFirst({
    where: userId ? { userId } : { sessionCartId },
  });

  if (!cart) {
    return undefined;
  }

  // Convert decimals and return
  return convertToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  });
}

export const removeItemFromCart = async (productId: string) => {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    if (!sessionCartId) {
      throw new Error("Cart session not found");
    }

    // Get Product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Get cart
    const cart = await getMyCart();

    if (!cart) {
      throw new Error("Cart not found");
    }

    // Check for item in cart
    const item = cart.items.find((item) => item.productId === productId);
    if (!item) {
      throw new Error("Item not found in cart");
    }

    // Check if only one in qty
    if (item.qty === 1) {
      // Remove item from cart
      cart.items = (cart.items as CartItem[]).filter((x) => x.productId !== item.productId);
    } else {
      // Decrease item quantity
      (cart.items as CartItem[]).find((x) => x.productId === item.productId)!.qty--;
    }

    // Save to database
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items as Prisma.CartUpdateitemsInput[],
        ...calculateCartPrices(cart.items as CartItem[]),
      },
    });

    // Revalidate product page
    revalidatePath(`/products/${product.slug}`);

    return {
      success: true,
      message: `${product.name} wasremoved from cart`,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: formatError(error),
    };
  }
};
