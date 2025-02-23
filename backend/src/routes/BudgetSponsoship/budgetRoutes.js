import express from "express";
import { verifyJwt, isAdmin } from "../../middlewares/auth.middleware.js";

import { submitBudget, getAllBudgets, approveBudget, rejectBudget } from "../../controllers/BudgetSponsoship/budgetController.js";


const router = express.Router();

// Submit a budget request (Students)
router.post("/submit", verifyJwt, submitBudget);

// Retrieve all budgets (Admins only)
router.get("/", verifyJwt, getAllBudgets);

// Approve a budget (Admins only)
router.patch("/approve/:id", verifyJwt, isAdmin, approveBudget);

// Reject a budget (Admins only)
router.patch("/reject/:id", verifyJwt, isAdmin, rejectBudget);

export default router;
