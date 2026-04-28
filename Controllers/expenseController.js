const Expense = require('../Models/expenseModel');
const User = require('../Models/userModel');

const addExpense = async (req, res) => {
  try {
    const { money, description, category } = req.body;
    const userId = req.user?.id;

    if (!money || !description || !category || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const parsedMoney = parseFloat(money);
    if (isNaN(parsedMoney) || parsedMoney < 0) {
      return res.status(400).json({ error: "Invalid money amount" });
    }

    const expense = await Expense.create({
      money: parsedMoney,
      description,
      category,
      userId
    });

    await User.findByIdAndUpdate(userId, {
      $inc: { totalExpense: parsedMoney }
    });

    res.status(201).json(expense);
  } catch (err) {
    console.error("Error in addExpense:", err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

const getExpense = async (req, res) => {
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 10;
  const skip = (page - 1) * limit;
  const userId = req.user?.id;

  try {
    const count = await Expense.countDocuments({ userId });
    const expenses = await Expense.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      expenses,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error("Error in getExpense:", err.message);
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await User.findByIdAndUpdate(expense.userId, {
      $inc: { totalExpense: -parseFloat(expense.money) }
    });

    await Expense.findByIdAndDelete(id);
    res.status(200).json({ message: "Expense deleted and total updated" });
  } catch (error) {
    console.error("Error in deleteExpense:", error.message);
    res.status(500).json({ message: "Failed to delete expense" });
  }
};

module.exports = {
  addExpense,
  getExpense,
  deleteExpense
};
