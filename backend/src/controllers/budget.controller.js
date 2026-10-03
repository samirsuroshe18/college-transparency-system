import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Budget, BUDGET_CATEGORIES } from '../models/budget.model.js';
import { readChoice, readMoney, readText } from '../utils/input.js';
import { assertReach } from '../utils/reach.js';
import { attach, attachmentNote } from '../utils/attachments.js';
import { notify } from '../utils/notices.js';
import { isValidObjectId } from '../utils/objectId.js';

const TITLE_MAX = 120;
const TEXT_MAX = 2000;
const COMMENT_MAX = 500;
const LIST_LIMIT = 300;
const MAX_AMOUNT = 10000000;

const withPeople = (query) => query
    .populate('requestedBy', 'name role department')
    .populate('decision.by', 'name');

const present = (budget, viewer) => ({
    ...budget.toObject(),
    mine: String(budget.requestedBy?._id || budget.requestedBy) === String(viewer._id),
});

const findBudget = async (id) => {
    const budget = isValidObjectId(id) ? await Budget.findById(id) : null;

    if (!budget) {
        throw new ApiError(404, "Budget request not found");
    }

    return budget;
};

// money is added in hundredths, so the sums come out exact
const toCents = (amount) => Math.round((amount || 0) * 100);

// what was asked for and what was approved, for every category
const totalsOf = async () => {
    const rows = await Budget.find().select('category status requestedAmount approvedAmount');

    return BUDGET_CATEGORIES.map((category) => {
        const inCategory = rows.filter((row) => row.category === category);
        const requested = inCategory.reduce((sum, row) => sum + toCents(row.requestedAmount), 0);
        const approved = inCategory
            .filter((row) => row.status === 'approved')
            .reduce((sum, row) => sum + toCents(row.approvedAmount), 0);

        return { category, requested: requested / 100, approved: approved / 100 };
    });
};

const listBudgets = asyncHandler(async (req, res) => {
    const [budgets, totals] = await Promise.all([
        withPeople(Budget.find()).sort({ createdAt: -1 }).limit(LIST_LIMIT),
        totalsOf(),
    ]);

    return res.status(200).json(
        new ApiResponse(200, { budgets: budgets.map((budget) => present(budget, req.user)), totals }, "Budget requests")
    );
});

const requestBudget = asyncHandler(async (req, res) => {
    const title = readText(req.body.title, 'Title', { max: TITLE_MAX, required: true });
    const category = readChoice(req.body.category, 'Category', BUDGET_CATEGORIES, { required: true });
    const description = readText(req.body.description, 'Description', { max: TEXT_MAX, required: true });
    const requestedAmount = readMoney(req.body.requestedAmount, 'Requested amount');

    if (requestedAmount > MAX_AMOUNT) {
        throw new ApiError(400, "Requested amount is too large");
    }

    // status, approved amount and decision are never read from the form
    const budget = await Budget.create({
        title,
        category,
        description,
        requestedAmount,
        requestedBy: req.user._id,
        isDemo: req.user.isDemo,
    });

    // the bill is stored only once the request itself has been accepted
    const { url, problem } = await attach(req, 'budgets');
    if (url) {
        budget.billUrl = url;
        await budget.save();
    }

    return res.status(201).json(
        new ApiResponse(201, { budget: present(await withPeople(Budget.findById(budget._id)), req.user) }, `Budget request submitted${attachmentNote(problem)}`)
    );
});

// the amount an admin approves: above zero and not more than what was asked for
const readApprovedAmount = (value, requestedAmount) => {
    let amount;
    try {
        amount = readMoney(value, 'Approved amount');
    } catch (error) {
        amount = null;
    }

    if (amount === null || amount > requestedAmount) {
        throw new ApiError(400, "Approved amount must be above 0 and at most the requested amount");
    }

    return amount;
};

const decideBudget = asyncHandler(async (req, res) => {
    const budget = await findBudget(req.params.id);
    assertReach(req.user, budget);

    const status = readChoice(req.body.status, 'Status', ['approved', 'rejected'], { required: true });
    const comment = readText(req.body.comment, 'Comment', { max: COMMENT_MAX });

    const changes = { status, decision: { comment, by: req.user._id, at: new Date() } };

    if (status === 'approved') {
        changes.approvedAmount = readApprovedAmount(req.body.approvedAmount, budget.requestedAmount);
    } else if (!comment) {
        throw new ApiError(400, "A comment is required to reject");
    }

    // the filter lets one decision through, however many arrive together
    const decided = await Budget.updateOne({ _id: budget._id, status: 'pending' }, { $set: changes });

    if (decided.modifiedCount === 0) {
        throw new ApiError(409, "This request has already been decided");
    }

    await notify(budget.requestedBy, {
        type: 'budget',
        title: `Your budget request was ${status}`,
        body: status === 'approved'
            ? `${budget.title}: ${changes.approvedAmount} approved of ${budget.requestedAmount} requested`
            : `${budget.title}: ${comment}`,
        link: '/budgets',
    });

    return res.status(200).json(
        new ApiResponse(200, { budget: present(await withPeople(Budget.findById(budget._id)), req.user) }, `Budget request ${status}`)
    );
});

export { listBudgets, requestBudget, decideBudget }
