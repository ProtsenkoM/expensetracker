export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};
export type Transaction = {
  id: string;
  amount: string;
  type: 'Income' | 'Expense';
  description: string | null;
  date: string;
  categoryId: string;
};
export type TransactionPage = {
  items: Transaction[];
  total: number;
  page: number;
  pageSize: number;
};
export type Summary = {
  totalIncome: string;
  totalExpense: string;
  balance: string;
};
export { CategoryIcon } from './ui/category-icon';
