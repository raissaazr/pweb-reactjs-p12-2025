// src/routes/genre.routes.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../prisma'; // Import shared Prisma Client

const router = Router();

// Middleware (Placeholder - Should be implemented and used if auth is required)
// import { authenticateToken } from '../middleware/authMiddleware'; 
// router.use(authenticateToken); // Apply to all genre routes if needed

/**
 * @route   POST /genre
 * @desc    Create a new genre
 * @access  Private (Needs Auth)
 */
router.post('/', async (req: Request, res: Response) => {
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
        return res.status(400).json({ success: false, message: 'Genre name is required and must be a string.', data: null });
    }

    try {
        // Check for duplicate name (case-insensitive check might be better)
        const existingGenre = await prisma.genre.findUnique({
            where: { name: name } 
        });
        if (existingGenre) {
            return res.status(409).json({ success: false, message: `Genre with name '${name}' already exists.`, data: null });
        }

        const newGenre = await prisma.genre.create({
            data: { name },
        });

        return res.status(201).json({ success: true, message: 'Genre created successfully.', data: newGenre });
    } catch (error) {
        console.error('Error creating genre:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', data: null });
    }
});

/**
 * @route   GET /genre
 * @desc    Get all genres with pagination, search, sorting
 * @access  Public (As per Postman example)
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search as string;
        const orderByName = (req.query.orderByName as string)?.toLowerCase() === 'desc' ? 'desc' : 'asc';

        const where: any = {
            deletedAt: null // Assuming soft delete, only show non-deleted
        };
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const genres = await prisma.genre.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: orderByName },
            // Only select necessary fields if needed
            // select: { id: true, name: true } 
        });

        const totalItems = await prisma.genre.count({ where });
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            message: 'Get all genre successfully',
            data: genres,
            meta: { // Pagination meta as shown in Postman example
                page: page,
                limit: limit,
                totalItems: totalItems,
                totalPages: totalPages,
                prev_page: page > 1 ? page - 1 : null,
                next_page: page < totalPages ? page + 1 : null,
            }
        });
    } catch (error) {
        console.error('Error fetching genres:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', data: null });
    }
});

/**
 * @route   GET /genre/:id
 * @desc    Get genre detail by ID
 * @access  Public (As per Postman example)
 */
router.get('/:id', async (req: Request, res: Response) => {
    // === FIX: Use string ID directly ===
    const { id: genreId } = req.params; 

    // Basic validation for the ID format (UUID check could be added)
    if (!genreId) {
        return res.status(400).json({ success: false, message: 'Genre ID is required', data: null });
    }

    try {
        const genre = await prisma.genre.findUnique({
             // === FIX: Use string ID ===
            where: { id: genreId, deletedAt: null }, // Also check if soft deleted
            // include: { books: true } // Optionally include related books
        });

        if (!genre) {
            return res.status(404).json({ success: false, message: `Genre with ID ${genreId} not found or has been deleted.`, data: null });
        }

        return res.status(200).json({ success: true, message: 'Get genre detail successfully', data: genre });
    } catch (error) {
        // Handle potential Prisma error if the ID format is totally wrong
        if (error instanceof Error && error.message.includes('Invalid UUID')) {
             return res.status(400).json({ success: false, message: 'Invalid Genre ID format (must be UUID).', data: null });
        }
        console.error('Error fetching genre detail:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', data: null });
    }
});

/**
 * @route   PATCH /genre/:id
 * @desc    Update genre name
 * @access  Private (Needs Auth)
 */
router.patch('/:id', async (req: Request, res: Response) => {
    // === FIX: Use string ID directly ===
    const { id: genreId } = req.params; 
    const { name } = req.body;

    if (!genreId) {
        return res.status(400).json({ success: false, message: 'Genre ID is required', data: null });
    }
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ success: false, message: 'New genre name is required and must be a string.', data: null });
    }

    try {
        // Check if genre exists (and isn't soft deleted)
        const existingGenre = await prisma.genre.findUnique({ where: { id: genreId, deletedAt: null } });
        if (!existingGenre) {
             return res.status(404).json({ success: false, message: `Genre with ID ${genreId} not found or has been deleted.`, data: null });
        }

        // Check for name conflict if name is actually changing
        if (name !== existingGenre.name) {
            const nameConflict = await prisma.genre.findFirst({ where: { name: name, deletedAt: null } });
            if (nameConflict) {
                 return res.status(409).json({ success: false, message: `Genre name '${name}' already exists.`, data: null });
            }
        }

        const updatedGenre = await prisma.genre.update({
             // === FIX: Use string ID ===
            where: { id: genreId }, 
            data: { name },
        });

        return res.status(200).json({ success: true, message: 'Genre updated successfully', data: updatedGenre });
    } catch (error) {
         if (error instanceof Error && error.message.includes('Invalid UUID')) {
             return res.status(400).json({ success: false, message: 'Invalid Genre ID format (must be UUID).', data: null });
        }
        console.error('Error updating genre:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', data: null });
    }
});

/**
 * @route   DELETE /genre/:id
 * @desc    Delete a genre (Soft delete based on schema)
 * @access  Private (Needs Auth)
 */
router.delete('/:id', async (req: Request, res: Response) => {
    // === FIX: Use string ID directly ===
    const { id: genreId } = req.params; 

     if (!genreId) {
        return res.status(400).json({ success: false, message: 'Genre ID is required', data: null });
    }

    try {
        // Check if genre exists first (optional, update handles this but gives less specific error)
         const existingGenre = await prisma.genre.findUnique({ where: { id: genreId, deletedAt: null } });
         if (!existingGenre) {
             return res.status(404).json({ success: false, message: `Genre with ID ${genreId} not found or already deleted.`, data: null });
         }
        
        // Check for related books - Soft delete means we don't strictly need this check,
        // but the original requirement mentioned constraints, so keeping it might be safer
        // === FIX: Use string genreId ===
        const relatedBooks = await prisma.book.count({ where: { genreId: genreId, deletedAt: null } }); 
        if (relatedBooks > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot delete genre with ID ${genreId} because it still has ${relatedBooks} associated book(s).`,
                data: null 
            });
        }

        // Perform soft delete by updating deletedAt
        await prisma.genre.update({
             // === FIX: Use string ID ===
            where: { id: genreId }, 
            data: { deletedAt: new Date() } // Set current timestamp
        });

        // Postman example expects no data on successful delete
        return res.status(200).json({ success: true, message: 'Genre removed successfully', data: null }); 
        
        /* // --- Alternative: Hard Delete (If soft delete NOT required) ---
        await prisma.genre.delete({ 
            where: { id: genreId } 
        });
        return res.status(200).json({ success: true, message: 'Genre deleted successfully', data: null });
        */

    } catch (error) {
        if (error instanceof Error && error.message.includes('Invalid UUID')) {
             return res.status(400).json({ success: false, message: 'Invalid Genre ID format (must be UUID).', data: null });
        }
        // Handle constraint violation if NOT using soft delete and books exist
        if (error instanceof Error && error.message.includes('Foreign key constraint failed')) {
             return res.status(400).json({ success: false, message: `Cannot delete genre with ID ${genreId} due to existing relations.`, data: null });
        }
        console.error('Error deleting genre:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', data: null });
    }
});


// ===============================================

export default router;