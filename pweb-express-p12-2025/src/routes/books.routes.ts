// src/routes/books.routes.ts
import { Router } from 'express';
import {
    createBook,
    getAllBooks,
    getBookDetail,
    getBooksByGenre,
    updateBook,
    deleteBook
} from '../controllers/bookController';

const router = Router();

// Base path '/books' ditangani di index.ts

// Handles POST /books
router.post('/', createBook);

// Handles GET /books
router.get('/', getAllBooks);

// Handles GET /books/:book_id
router.get('/:book_id', getBookDetail);

// Handles GET /books/genre/:genre_id
router.get('/genre/:genre_id', getBooksByGenre);

// Handles PATCH /books/:book_id
router.patch('/:book_id', updateBook);

// Handles DELETE /books/:book_id
router.delete('/:book_id', deleteBook);

export default router;