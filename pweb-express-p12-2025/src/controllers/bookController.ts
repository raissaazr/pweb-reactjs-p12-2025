// src/controllers/bookController.ts
import { Request, Response } from 'express';
import { prisma } from '../prisma'; // Import shared Prisma Client

// ===============================================
// 1. Create Book (POST /) - Path is '/' because prefix '/books' is in index.ts
// ===============================================
export const createBook = async (req: Request, res: Response) => {
    // === UPDATED: Use new field names, expect genreId as string ===
    const { title, writer, publisher, publicationYear, description, price, stockQuantity, genreId } = req.body;

    // 1. Validasi Keberadaan Field Wajib (Adjusted for new schema)
    if (!title || !writer || !publisher || price === undefined || stockQuantity === undefined || !genreId) {
        return res.status(400).json({ success: false, message: 'Required fields (title, writer, publisher, price, stockQuantity, genreId) must be provided.', data: null });
    }
    
    // 2. Validasi Tipe Data (Adjusted for new schema)
    if (typeof price !== 'number' || typeof stockQuantity !== 'number' || typeof genreId !== 'string') { // genreId must be string
        return res.status(400).json({ success: false, message: 'Invalid data type for price, stockQuantity (must be number), or genreId (must be string).', data: null });
    }
     // Optional: Validate publicationYear if provided
     if (publicationYear !== undefined && typeof publicationYear !== 'number') {
        return res.status(400).json({ success: false, message: 'Invalid data type for publicationYear (must be number).', data: null });
    }

    try {
        // Cek duplikasi judul (409 Conflict)
        const existingBook = await prisma.book.findUnique({ where: { title } });
        if (existingBook) {
            return res.status(409).json({ success: false, message: `A book with the title '${title}' already exists.`, data: null });
        }

        // Cek Genre (404 Not Found) - Use string genreId
        const genreExists = await prisma.genre.findUnique({ where: { id: genreId } });
        if (!genreExists || genreExists.deletedAt !== null) { // Also check if genre is soft-deleted
            return res.status(404).json({ success: false, message: `Genre with ID ${genreId} not found or has been deleted.`, data: null });
        }

        // === UPDATED: Use new field names in create ===
        const newBook = await prisma.book.create({
            data: { 
                title, 
                writer, 
                publisher, 
                publicationYear, // Add optional fields
                description,     // Add optional fields
                price, 
                stockQuantity, 
                genreId // String ID
            },
        });

        return res.status(201).json({ success: true, message: 'Book created successfully.', data: newBook });
    } catch (error) {
         if (error instanceof Error && error.message.includes('Invalid UUID')) {
             return res.status(400).json({ success: false, message: 'Invalid Genre ID format (must be UUID).', data: null });
        }
        console.error('Error creating book:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', data: null });
    }
};

// ===============================================
// Reusable Handler for GET All and GET By Genre
// ===============================================
const getBooksHandler = async (req: Request, res: Response, genreId?: string) => { // genreId is now string
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const orderByTitle = (req.query.orderByTitle as string)?.toLowerCase() === 'desc' ? 'desc' : 'asc';
    const orderByPublishDate = (req.query.orderByPublishDate as string)?.toLowerCase();

    const where: any = {
        deletedAt: null // Only show non-deleted books
    };
    if (genreId) {
        where.genreId = genreId; 
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { writer: { contains: search, mode: 'insensitive' } },
        { publisher: { contains: search, mode: 'insensitive' } } 
      ];
    }

    const orderBy: any[] = [];
    if (orderByTitle) orderBy.push({ title: orderByTitle });
    if (orderByPublishDate === 'asc' || orderByPublishDate === 'desc') {
        orderBy.push({ publicationYear: orderByPublishDate });
    }
    if(orderBy.length === 0) {
        orderBy.push({ createdAt: 'desc' });
    }

    try {
        if (genreId) { // Check Genre only if using endpoint by genre
            const genreExists = await prisma.genre.findUnique({ where: { id: genreId, deletedAt: null } }); 
            if (!genreExists) {
                return res.status(404).json({ success: false, message: `Genre with ID ${genreId} not found or has been deleted.`, data: null });
            }
        }
        
        const totalItems = await prisma.book.count({ where });
        const books = await prisma.book.findMany({
            where, skip, take: limit,
            orderBy,
            include: { genre: { select: { name: true } } }
        });

        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            message: genreId ? `Get books by genre successfully` : 'Get all books successfully',
            data: books,
            meta: {
                page: page,
                limit: limit,
                totalItems: totalItems,
                totalPages: totalPages,
                prev_page: page > 1 ? page - 1 : null,
                next_page: page < totalPages ? page + 1 : null,
            }
        });
    } catch (error) {
        if (genreId && error instanceof Error && error.message.includes('Invalid UUID')) {
             return res.status(400).json({ success: false, message: 'Invalid Genre ID format (must be UUID).', data: null });
        }
        console.error('Error fetching books:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', data: null });
    }
};

// ===============================================
// 2. Get All Books Controller (GET /)
// ===============================================
export const getAllBooks = (req: Request, res: Response) => getBooksHandler(req, res);

// ===============================================
// 4. Get Books By Genre Controller (GET /genre/:genre_id)
// ===============================================
export const getBooksByGenre = (req: Request, res: Response) => {
    const { genre_id: genreId } = req.params;
    if (!genreId) {
        return res.status(400).json({ success: false, message: 'Genre ID is required', data: null });
    }
    return getBooksHandler(req, res, genreId);
};

// ===============================================
// 3. Get Book Detail (GET /:book_id)
// ===============================================
export const getBookDetail = async (req: Request, res: Response) => {
    const { book_id: bookId } = req.params;

    if (!bookId) {
        return res.status(400).json({ success: false, message: 'Book ID is required', data: null });
    }

    try {
        const book = await prisma.book.findUnique({
            where: { id: bookId, deletedAt: null },
            include: { genre: { select: { name: true } } }
        });

        if (!book) {
            return res.status(404).json({ success: false, message: `Book with ID ${bookId} not found or has been deleted.`, data: null });
        }

        return res.status(200).json({ success: true, message: 'Get book detail successfully', data: book });
    } catch (error) {
         if (error instanceof Error && error.message.includes('Invalid UUID')) {
             return res.status(400).json({ success: false, message: 'Invalid Book ID format (must be UUID).', data: null });
        }
        console.error('Error fetching book detail:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', data: null });
    }
};

// ===============================================
// 5. Update Book (PATCH /:book_id)
// ===============================================
export const updateBook = async (req: Request, res: Response) => {
    const { book_id: bookId } = req.params;
    const updates = req.body;

    const allowedUpdates = ['description', 'price', 'stockQuantity']; 
    const dataToUpdate: any = {};
    
    for (const key of allowedUpdates) {
        if (updates.hasOwnProperty(key)) {
             if (key === 'price' && typeof updates[key] !== 'number') {
                 return res.status(400).json({ success: false, message: 'Price must be a number.', data: null });
             }
             if (key === 'stockQuantity' && typeof updates[key] !== 'number') {
                 return res.status(400).json({ success: false, message: 'Stock quantity must be a number.', data: null });
             }
            dataToUpdate[key] = updates[key];
        }
    }

    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ success: false, message: 'No valid fields provided for update (allowed: description, price, stockQuantity).', data: null });
    }
     if (!bookId) {
        return res.status(400).json({ success: false, message: 'Book ID is required', data: null });
    }

    try {
        const existingBook = await prisma.book.findUnique({ where: { id: bookId, deletedAt: null } });
        if (!existingBook) {
            return res.status(404).json({ success: false, message: `Book with ID ${bookId} not found or has been deleted.`, data: null });
        }
        
        // Cek duplikasi judul jika title di-update (meskipun tidak diizinkan di allowedUpdates)
        // Jika title boleh diupdate, tambahkan 'title' ke allowedUpdates dan aktifkan cek ini
        /*
        if (dataToUpdate.title && dataToUpdate.title !== existingBook.title) {
            const titleConflict = await prisma.book.findFirst({ where: { title: dataToUpdate.title, deletedAt: null } });
            if (titleConflict) {
                 return res.status(409).json({ success: false, message: `Book title '${dataToUpdate.title}' already exists.`, data: null });
            }
        }
        */

        const updatedBook = await prisma.book.update({
            where: { id: bookId },
            data: dataToUpdate,
        });

        return res.status(200).json({ success: true, message: 'Book updated successfully.', data: updatedBook });
    } catch (error) {
         if (error instanceof Error && error.message.includes('Invalid UUID')) {
             return res.status(400).json({ success: false, message: 'Invalid Book ID format (must be UUID).', data: null });
        }
        console.error('Error updating book:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', data: null });
    }
};

// ===============================================
// 6. Delete Book (DELETE /:book_id)
// ===============================================
export const deleteBook = async (req: Request, res: Response) => {
    const { book_id: bookId } = req.params;

     if (!bookId) {
        return res.status(400).json({ success: false, message: 'Book ID is required', data: null });
    }

    try {
         const existingBook = await prisma.book.findUnique({ where: { id: bookId, deletedAt: null } });
         if (!existingBook) {
             return res.status(404).json({ success: false, message: `Book with ID ${bookId} not found or already deleted.`, data: null });
         }

        // Perform soft delete by updating deletedAt
        await prisma.book.update({
            where: { id: bookId },
            data: { deletedAt: new Date() } // Set current timestamp
        });

        return res.status(200).json({ success: true, message: `Book removed successfully`, data: null });

    } catch (error) {
         if (error instanceof Error && error.message.includes('Invalid UUID')) {
             return res.status(400).json({ success: false, message: 'Invalid Book ID format (must be UUID).', data: null });
        }
        console.error('Error deleting book:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', data: null });
    }
};