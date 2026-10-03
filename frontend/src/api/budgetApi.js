import api, { unwrap } from './client.js';

// { budgets, totals }: every request, and what was asked for and approved per category
export const listBudgets = async () => unwrap(await api.get('/budgets')).data;

// form: { title, category, description, requestedAmount }, with an optional bill
export const requestBudget = async (form, bill) => {
  const body = new FormData();
  body.append('title', form.title);
  body.append('category', form.category);
  body.append('description', form.description);
  body.append('requestedAmount', form.requestedAmount);
  if (bill) body.append('bill', bill);

  return unwrap(await api.post('/budgets', body));
};

// decision: { status: "approved", approvedAmount, comment } or { status: "rejected", comment }
export const decideBudget = async (id, decision) => unwrap(await api.patch(`/budgets/${id}/decision`, decision));
