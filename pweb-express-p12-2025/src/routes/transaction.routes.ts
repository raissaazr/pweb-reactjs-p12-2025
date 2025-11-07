// src/routes/transaction.routes.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
// FIX: Impor tipe Prisma yang diperlukan
import { Prisma } from '@prisma/client';

// ==========================================================
// HELPER TYPES (Untuk membuat kode lebih bersih dan type-safe)
// ==========================================================

// Tipe untuk hasil query GET /
type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    user: { select: { username: true } };
    items: {
      include: {
        book: { select: { title: true } };
      };
    };
  };
}>;

// Tipe untuk satu item dalam query GET /
type OrderItemWithBook = Prisma.OrderItemGetPayload<{
  include: {
    book: { select: { title: true } };
  };
}>;

// Tipe untuk hasil query GET /statistics
type BookWithGenre = Prisma.BookGetPayload<{
  select: { id: true; genreId: true; genre: { select: { name: true } } };
}>;

// Tipe untuk hasil query GET /:id
type OrderItemWithBookDetails = Prisma.OrderItemGetPayload<{
  include: {
    book: { select: { title: true; writer: true; price: true } };
  };
}>;

// Tipe untuk item dalam respons GET /:id
type ItemResponse = {
  bookId: string;
  bookTitle: string;
  quantity: number;
  subtotalPrice: number;
};

// ==========================================================

const router = Router();

// ==========================================================
// ORDER ENDPOINTS (Previously Transactions)
// ==========================================================

/**
 * @route   POST /transactions (Path remains /transactions as per docs)
 * @desc    Membuat order pembelian baru
 * @access  Private (Asumsi)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // 1. Ambil data dari body (gunakan camelCase)
    const { userId, items } = req.body; // items: [{ bookId: string, quantity: number }]

    // 2. Validasi input
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid input: userId and a non-empty items array are required.', data: null });
    }

    // 3. Siapkan data & validasi items
    const processedBooks: { id: string; price: number; newStock: number; quantity: number }[] = [];
    // Total amount now needs to be calculated manually as it's not in Order model
    let calculatedTotalAmount = 0;

    // 4. Loop cek stok & harga
    for (const item of items) {
      if (!item.bookId || !item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: `Invalid item data: ${JSON.stringify(item)}`, data: null });
      }

      const book = await prisma.book.findUnique({
        where: { id: item.bookId },
      });

      if (!book) {
        return res.status(404).json({ success: false, message: `Book with id ${item.bookId} not found`, data: null });
      }
      // === UPDATED: Use stockQuantity ===
      if (book.stockQuantity < item.quantity) {
        return res.status(400).json({ success: false, message: `Not enough stock for book: ${book.title} (Stock: ${book.stockQuantity})`, data: null });
      }

      calculatedTotalAmount += book.price * item.quantity; // Calculate total amount here
      processedBooks.push({
        id: item.bookId,
        price: book.price,
        // === UPDATED: Use stockQuantity ===
        newStock: book.stockQuantity - item.quantity,
        quantity: item.quantity,
      });
    }

    // 5. Jalankan dalam Prisma Transaction (Atomik)
    // FIX (Baris 60): Memberi tipe 'tx' sebagai Prisma.TransactionClient
    const newOrder = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // === UPDATED: Use prisma.order ===
      const createdOrder = await tx.order.create({
        data: {
          userId: userId,
          // totalAmount is removed from schema, maybe log calculatedTotalAmount elsewhere if needed
          // We still need items below
        },
      });

      // b. Buat OrderItems (detail)
      // === UPDATED: Use orderId, bookId, quantity (pricePerItem removed) ===
      const orderItemsData = processedBooks.map((book) => ({
        orderId: createdOrder.id, // Link to the created Order ID
        bookId: book.id,
        quantity: book.quantity,
        // pricePerItem is removed from schema
      }));
      // === UPDATED: Use prisma.orderItem ===
      await tx.orderItem.createMany({ data: orderItemsData });

      // c. Update stok buku
      for (const book of processedBooks) {
        await tx.book.update({
          where: { id: book.id },
          // === UPDATED: Use stockQuantity ===
          data: { stockQuantity: book.newStock },
        });
      }

      return createdOrder; // Return the created order header
    });

    // 6. Kirim response sukses (Calculate quantity for response based on Postman example)
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully', // Keeping message similar to docs
      data: {
        orderId: newOrder.id, // Use orderId
        totalQuantity: totalQuantity,
        totalPrice: calculatedTotalAmount, // Use calculated total
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Internal server error', data: null });
  }
});

/**
 * @route   GET /transactions (Path remains /transactions)
 * @desc    Melihat list semua order yang tercatat
 * @access  Public/Private
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // === UPDATED: Use prisma.order ===
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { username: true } }, // Assuming User model still has username
        items: {
          // Relation name in Order model is 'items'
          include: {
            book: { select: { title: true } }, // Assuming Book model still has title
          },
        },
      },
      orderBy: { createdAt: 'desc' }, // Assuming Order model still has createdAt
    });
    // Calculate extra fields if needed to match Postman exactly
    // FIX (Baris 131): Memberi tipe 'order' sebagai OrderWithItems
    const responseData = orders.map((order: OrderWithItems) => {
      // FIX (Baris 132): Memberi tipe 'sum' sebagai number dan 'item' sebagai OrderItemWithBook
      const totalQuantity = order.items.reduce((sum: number, item: OrderItemWithBook) => sum + item.quantity, 0);
      // totalPrice needs calculation as it's not stored
      // This is complex without pricePerItem stored. We'll omit it for now,
      // or you'd need another query inside the map which is inefficient.
      return {
        id: order.id,
        totalQuantity: totalQuantity,
        // totalPrice: calculatedPrice // Omitted for now
        userId: order.userId,
        user: order.user,
        items: order.items,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    res.status(200).json({ success: true, message: 'Get all transactions successfully', data: responseData });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Internal server error', data: null });
  }
});

router.get('/statistics', async (req: Request, res: Response) => {
  // Keep path '/statistics'
  try {
    // 1. Jumlah keseluruhan order
    // === UPDATED: Use prisma.order ===
    const totalOrders = await prisma.order.count();

    // 2. Rata-rata nominal tiap order (Cannot calculate easily without totalAmount stored)
    // We will calculate average quantity per order instead for now, or omit avg amount.
    const avgItemsResult = await prisma.orderItem.aggregate({
      _avg: { quantity: true },
    });
    const averageItemsPerOrder = avgItemsResult._avg.quantity || 0;
    // Note: Calculating average amount requires fetching all orders and items, then averaging manually. Omitted here.

    // 3. Genre dengan transaksi paling banyak & sedikit (Based on OrderItem)
    // === UPDATED: Use prisma.orderItem ===
    const genreSales = await prisma.orderItem.groupBy({
      by: ['bookId'],
      _sum: { quantity: true },
    });
    console.log('--- genreSales (groupBy bookId):', genreSales);

    const bookIds = genreSales.map((item: { bookId: string }) => item.bookId); // Added type hint
    console.log('--- bookIds from genreSales:', bookIds);

    const booksWithGenre = await prisma.book.findMany({
      where: { id: { in: bookIds } },
      select: { id: true, genreId: true, genre: { select: { name: true } } },
    });
    console.log('--- booksWithGenre (findMany result):', booksWithGenre);

    const salesByGenre: { [genreName: string]: number } = {};
    for (const sale of genreSales) {
      // FIX (Baris 188): Memberi tipe 'b' sebagai BookWithGenre
      const book = booksWithGenre.find((b: BookWithGenre) => b.id === sale.bookId);
      if (book && book.genre) {
        const genreName = book.genre.name;
        salesByGenre[genreName] = (salesByGenre[genreName] || 0) + (sale._sum.quantity || 0);
      } else {
        console.log(`---> Warning: Book or genre not found for sale item with bookId: ${sale.bookId}`);
      }
    }
    console.log('--- salesByGenre (after population):', salesByGenre);

    // Cari genre min & max (Logic remains the same)
    let mostSoldGenre: string | null = null;
    let leastSoldGenre: string | null = null;
    let maxSales = -1;
    let minSales = Infinity;
    let isFirstGenre = true;

    console.log('--- salesByGenre (before min/max loop):', salesByGenre);

    for (const genreName in salesByGenre) {
      if (Object.prototype.hasOwnProperty.call(salesByGenre, genreName)) {
        const sales = salesByGenre[genreName];
        console.log(`---> Checking genre: ${genreName}, Sales: ${sales}`);

        if (typeof sales === 'number' && isFinite(sales)) {
          if (isFirstGenre) {
            mostSoldGenre = genreName;
            leastSoldGenre = genreName;
            maxSales = sales;
            minSales = sales;
            isFirstGenre = false;
          } else {
            if (sales > maxSales) {
              maxSales = sales;
              mostSoldGenre = genreName;
            }
            if (sales < minSales) {
              minSales = sales;
              leastSoldGenre = genreName;
            }
          }
        } else {
          console.warn(`---> Skipping genre '${genreName}' due to invalid sales count: ${sales}`);
        }
      }
    }
    console.log(`--- Min/Max Result: Most: ${mostSoldGenre} (${maxSales}), Least: ${leastSoldGenre} (${minSales})`);

    // 4. Kirim response (Adjusted field names and removed average amount)
    res.status(200).json({
      success: true,
      message: 'Get transactions statistics successfully', // Kept message similar
      data: {
        totalTransactions: totalOrders, // Renamed for clarity
        // averageTransactionAmount is omitted due to schema change
        averageItemsPerOrder: averageItemsPerOrder, // Added alternative metric
        mostSoldGenre: mostSoldGenre ? { name: mostSoldGenre, totalItemsSold: maxSales } : null,
        leastSoldGenre: leastSoldGenre ? { name: leastSoldGenre, totalItemsSold: minSales === Infinity ? 0 : minSales } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({ success: false, message: 'Internal server error', data: null });
  }
});

/**
 * @route   GET /transactions/statistics (Path remains /transactions/statistics)
 * @desc    Melihat statistik penjualan (based on Orders)
 * @access  Public/Private
 */

/**
 * @route   GET /transactions/:id (Path updated to :id)
 * @desc    Melihat detail satu order buku
 * @access  Public/Private
 */
router.get('/:id', async (req: Request, res: Response) => {
  // Updated path to :id
  try {
    const { id } = req.params; // Updated param name
    if (!id) {
      return res.status(400).json({ success: false, message: 'Transaction ID is required', data: null }); // Kept message similar
    }

    // === UPDATED: Use prisma.order ===
    const order = await prisma.order.findUnique({
      where: { id: id }, // Use id
      include: {
        user: { select: { username: true } },
        items: {
          include: {
            // === UPDATED: Use writer ===
            book: { select: { title: true, writer: true, price: true } },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Transaction not found', data: null }); // Kept message similar
    }

    // Calculate response data to match Postman example if needed
    // FIX (Baris 293): Memberi tipe 'sum' sebagai number dan 'item' sebagai OrderItemWithBookDetails
    const totalQuantity = order.items.reduce((sum: number, item: OrderItemWithBookDetails) => sum + item.quantity, 0);
    // Again, calculating total price accurately without stored pricePerItem is hard.
    // We'll calculate subtotal based on current book price for the example.
    // FIX (Baris 296): Memberi tipe 'item' sebagai OrderItemWithBookDetails dan tipe 'itemsResponse' sebagai ItemResponse[]
    const itemsResponse: ItemResponse[] = order.items.map((item: OrderItemWithBookDetails) => ({
      bookId: item.bookId,
      bookTitle: item.book.title,
      quantity: item.quantity,
      // Calculate subtotal based on current price; ideally use stored price if available
      subtotalPrice: item.quantity * item.book.price,
    }));
    // Calculate total price based on subtotals
    // FIX (Baris 304): Memberi tipe 'sum' sebagai number dan 'item' sebagai ItemResponse
    const totalPrice = itemsResponse.reduce((sum: number, item: ItemResponse) => sum + item.subtotalPrice, 0);

    res.status(200).json({
      success: true,
      message: 'Get transaction detail successfully', // Kept message similar
      data: {
        id: order.id,
        items: itemsResponse,
        totalQuantity: totalQuantity,
        totalPrice: totalPrice, // Use calculated total price
        // Add user info if needed
        user: order.user,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching order detail:', error);
    res.status(500).json({ success: false, message: 'Internal server error', data: null });
  }
});

// ==========================================================

export default router;
