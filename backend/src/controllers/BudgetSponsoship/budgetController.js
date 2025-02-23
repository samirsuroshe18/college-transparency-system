import mongoose from "mongoose";
import Budget from "../../models/BudgetSponsoshipModel/budget.model.js";


// Submit a new budget request (Student)
const submitBudget = async (req, res) => {
  try {
    const { budget, requestedAmount, document, category, description } = req.body;
    console.log(budget);
    const userId = req.user._id; // From JWT token

    const newBudget = new Budget({
      budget,
      requestedAmount,
      document,
      category,
      description,
      requestedBy: userId,
    });

    await newBudget.save();
    res.status(201).json({ success: true, message: "Budget request submitted", budget: newBudget });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all budget requests (Admin & Student)
const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find().populate("requestedBy", "name email").populate("approvedBy", "name email");
    res.status(200).json({ success: true, budgets });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a single budget request by ID
const getBudgetById = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findById(id).populate("requestedBy", "name email").populate("approvedBy", "name email");

    if (!budget) return res.status(404).json({ success: false, message: "Budget request not found" });

    res.status(200).json({ success: true, budget });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve a budget request (Admin)
const approveBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budgetId = mongoose.Types.ObjectId.createFromHexString(id);
    const budget = await Budget.findByIdAndUpdate(
        budgetId,
      { status: 'approved' },
      { new: true }
    );

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Budget approved successfully",
      budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error approving budget",
      error: error.message
    });
  }
};

// Reject a budget request (Admin)
const rejectBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id; // From JWT token

    const budget = await Budget.findByIdAndUpdate(
      id,
      { status: "rejected", approvedBy: adminId },
      { new: true }
    );

    if (!budget) return res.status(404).json({ success: false, message: "Budget request not found" });

    res.status(200).json({ success: true, message: "Budget request rejected", budget });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all budget requests (Admin & Student)
const getAllBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find().sort({ createdAt: -1 });
    res.status(200).json(budgets);
  } catch (error) {
    res.status(500).json({ error: "Server Error: " + error.message });
  }
};

export { 
  submitBudget, 
  getAllBudgets, 
  approveBudget,
  rejectBudget 
};
