// backend/routes/expenses.js
const { sendResponse, getRequestBody } = require('../helpers/response');
const { getDB }    = require('../db');
const { ObjectId } = require('mongodb');

function expenseRoutes(req, res, pathname) {

  // POST /api/expenses — Add expense
  if (pathname === '/api/expenses' && req.method === 'POST') {
    getRequestBody(req, function(err, body) {
      if (err) {
        sendResponse(res, 400, { error: 'Invalid request body' });
        return;
      }

      const { groupId, description, amount, paidBy } = body;

      if (!groupId || !description || !amount || !paidBy) {
        sendResponse(res, 400, { error: 'groupId, description, amount and paidBy are required' });
        return;
      }
      if (isNaN(amount) || Number(amount) <= 0) {
        sendResponse(res, 400, { error: 'Amount must be a positive number' });
        return;
      }
      if (!ObjectId.isValid(groupId)) {
        sendResponse(res, 400, { error: 'Invalid groupId' });
        return;
      }

      const db                 = getDB();
      const groupsCollection   = db.collection('groups');
      const expensesCollection = db.collection('expenses');

      groupsCollection.findOne({ _id: new ObjectId(groupId) })
        .then(function(group) {
          if (!group) {
            sendResponse(res, 404, { error: 'Group not found' });
            return null;
          }

          const totalAmount    = Number(amount);
          const splitCount     = group.members.length;
          const perPersonShare = parseFloat((totalAmount / splitCount).toFixed(2));

          const splits = group.members.map(function(memberId) {
            return { userId: memberId, share: perPersonShare };
          });

          const newExpense = {
            groupId:     groupId,
            description: description.trim(),
            amount:      totalAmount,
            paidBy:      paidBy,
            splits:      splits,
            createdAt:   new Date()
          };

          return expensesCollection.insertOne(newExpense);
        })
        .then(function(result) {
          if (!result) return;
          sendResponse(res, 201, {
            message:   '✅ Expense added!',
            expenseId: result.insertedId
          });
        })
        .catch(function(err) {
          console.error('Add expense error:', err.message);
          sendResponse(res, 500, { error: 'Server error while adding expense' });
        });
    });
    return true;
  }

  // GET /api/expenses/dashboard?userId=xxx
  if (pathname === '/api/expenses/dashboard' && req.method === 'GET') {
    const queryParams = require('url').parse(req.url, true).query;
    const userId      = queryParams.userId;

    if (!userId) {
      sendResponse(res, 400, { error: 'userId is required' });
      return true;
    }

    const db                 = getDB();
    const groupsCollection   = db.collection('groups');
    const expensesCollection = db.collection('expenses');
    const usersCollection    = db.collection('users');

    groupsCollection.find({ members: userId }).toArray()
      .then(function(groups) {
        if (groups.length === 0) {
          sendResponse(res, 200, {
            summary: { totalOwed: 0, totalOwe: 0, totalGroups: 0, totalExpenses: 0 },
            recentExpenses: []
          });
          return null;
        }

        const groupIds = groups.map(function(g) { return g._id.toString(); });

        return expensesCollection
          .find({ groupId: { $in: groupIds } })
          .sort({ createdAt: -1 })
          .toArray()
          .then(function(expenses) {
            const netBalance = {};

            expenses.forEach(function(expense) {
              expense.splits.forEach(function(split) {
                if (split.userId === expense.paidBy) return;
                if (expense.paidBy === userId) {
                  if (!netBalance[split.userId]) netBalance[split.userId] = 0;
                  netBalance[split.userId] += split.share;
                } else if (split.userId === userId) {
                  if (!netBalance[expense.paidBy]) netBalance[expense.paidBy] = 0;
                  netBalance[expense.paidBy] -= split.share;
                }
              });
            });

            let totalOwed = 0;
            let totalOwe  = 0;
            Object.keys(netBalance).forEach(function(id) {
              if (netBalance[id] > 0) totalOwed += netBalance[id];
              else                    totalOwe  += Math.abs(netBalance[id]);
            });

            const recent5  = expenses.slice(0, 5);
            const payerIds = [...new Set(recent5.map(function(e) { return e.paidBy; }))];

            return usersCollection.find({
              _id: {
                $in: payerIds
                  .filter(function(id) { return ObjectId.isValid(id); })
                  .map(function(id)    { return new ObjectId(id); })
              }
            }).toArray()
              .then(function(users) {
                const userMap  = {};
                const groupMap = {};
                users.forEach(function(u)  { userMap[u._id.toString()]  = u.name; });
                groups.forEach(function(g) { groupMap[g._id.toString()] = g.name; });

                const recentExpenses = recent5.map(function(e) {
                  return {
                    _id:         e._id,
                    description: e.description,
                    amount:      e.amount,
                    paidBy:      e.paidBy,
                    paidByName:  userMap[e.paidBy] || 'Unknown',
                    groupName:   groupMap[e.groupId] || 'Unknown',
                    splits:      e.splits,
                    createdAt:   e.createdAt
                  };
                });

                sendResponse(res, 200, {
                  summary: {
                    totalOwed:     parseFloat(totalOwed.toFixed(2)),
                    totalOwe:      parseFloat(totalOwe.toFixed(2)),
                    totalGroups:   groups.length,
                    totalExpenses: expenses.length
                  },
                  recentExpenses: recentExpenses
                });
              });
          });
      })
      .catch(function(err) {
        console.error('Dashboard error:', err.message);
        sendResponse(res, 500, { error: 'Server error' });
      });

    return true;
  }

  // GET /api/expenses/all?userId=xxx
  if (pathname === '/api/expenses/all' && req.method === 'GET') {
    const queryParams = require('url').parse(req.url, true).query;
    const userId      = queryParams.userId;

    if (!userId) {
      sendResponse(res, 400, { error: 'userId is required' });
      return true;
    }

    const db                 = getDB();
    const groupsCollection   = db.collection('groups');
    const expensesCollection = db.collection('expenses');
    const usersCollection    = db.collection('users');

    groupsCollection.find({ members: userId }).toArray()
      .then(function(groups) {
        if (groups.length === 0) {
          sendResponse(res, 200, { expenses: [] });
          return null;
        }

        const groupIds = groups.map(function(g) { return g._id.toString(); });
        const groupMap = {};
        groups.forEach(function(g) { groupMap[g._id.toString()] = g.name; });

        return expensesCollection
          .find({ groupId: { $in: groupIds } })
          .sort({ createdAt: -1 })
          .toArray()
          .then(function(expenses) {
            if (expenses.length === 0) {
              sendResponse(res, 200, { expenses: [] });
              return;
            }

            const payerIds = [...new Set(expenses.map(function(e) { return e.paidBy; }))];

            return usersCollection.find({
              _id: {
                $in: payerIds
                  .filter(function(id) { return ObjectId.isValid(id); })
                  .map(function(id)    { return new ObjectId(id); })
              }
            }).toArray()
              .then(function(users) {
                const userMap = {};
                users.forEach(function(u) { userMap[u._id.toString()] = u.name; });

                const enriched = expenses.map(function(e) {
                  return {
                    _id:         e._id,
                    description: e.description,
                    amount:      e.amount,
                    paidBy:      e.paidBy,
                    paidByName:  userMap[e.paidBy] || 'Unknown',
                    groupId:     e.groupId,
                    groupName:   groupMap[e.groupId] || 'Unknown',
                    splits:      e.splits,
                    createdAt:   e.createdAt
                  };
                });

                sendResponse(res, 200, { expenses: enriched });
              });
          });
      })
      .catch(function(err) {
        console.error('Fetch all expenses error:', err.message);
        sendResponse(res, 500, { error: 'Server error' });
      });

    return true;
  }

  // GET /api/expenses/balance?userId=xxx
  if (pathname === '/api/expenses/balance' && req.method === 'GET') {
    const queryParams = require('url').parse(req.url, true).query;
    const userId      = queryParams.userId;

    if (!userId) {
      sendResponse(res, 400, { error: 'userId is required' });
      return true;
    }

    const db                 = getDB();
    const groupsCollection   = db.collection('groups');
    const expensesCollection = db.collection('expenses');
    const usersCollection    = db.collection('users');

    groupsCollection.find({ members: userId }).toArray()
      .then(function(groups) {
        if (groups.length === 0) {
          sendResponse(res, 200, {
            balances: [],
            summary:  { totalOwed: 0, totalOwe: 0 }
          });
          return null;
        }

        const groupIds = groups.map(function(g) { return g._id.toString(); });

        return expensesCollection
          .find({ groupId: { $in: groupIds } })
          .toArray()
          .then(function(expenses) {
            const netBalance = {};

            expenses.forEach(function(expense) {
              expense.splits.forEach(function(split) {
                if (split.userId === expense.paidBy) return;
                if (expense.paidBy === userId) {
                  if (!netBalance[split.userId]) netBalance[split.userId] = 0;
                  netBalance[split.userId] += split.share;
                } else if (split.userId === userId) {
                  if (!netBalance[expense.paidBy]) netBalance[expense.paidBy] = 0;
                  netBalance[expense.paidBy] -= split.share;
                }
              });
            });

            const otherIds = Object.keys(netBalance).filter(function(id) {
              return netBalance[id] !== 0;
            });

            if (otherIds.length === 0) {
              sendResponse(res, 200, {
                balances: [],
                summary:  { totalOwed: 0, totalOwe: 0 }
              });
              return;
            }

            return usersCollection.find({
              _id: {
                $in: otherIds
                  .filter(function(id) { return ObjectId.isValid(id); })
                  .map(function(id)    { return new ObjectId(id); })
              }
            }).toArray()
              .then(function(users) {
                const userMap = {};
                users.forEach(function(u) { userMap[u._id.toString()] = u.name; });

                let totalOwed = 0;
                let totalOwe  = 0;

                const balances = otherIds.map(function(id) {
                  const amount = parseFloat(netBalance[id].toFixed(2));
                  if (amount > 0) totalOwed += amount;
                  else            totalOwe  += Math.abs(amount);
                  return {
                    userId:   id,
                    userName: userMap[id] || 'Unknown',
                    amount:   amount,
                    type:     amount > 0 ? 'owes_me' : 'i_owe'
                  };
                });

                sendResponse(res, 200, {
                  balances: balances,
                  summary:  {
                    totalOwed: parseFloat(totalOwed.toFixed(2)),
                    totalOwe:  parseFloat(totalOwe.toFixed(2))
                  }
                });
              });
          });
      })
      .catch(function(err) {
        console.error('Balance error:', err.message);
        sendResponse(res, 500, { error: 'Server error' });
      });

    return true;
  }

  // GET /api/expenses/:groupId
  if (pathname.startsWith('/api/expenses/') && req.method === 'GET') {
    const groupId = pathname.split('/')[3];

    const db                 = getDB();
    const expensesCollection = db.collection('expenses');
    const usersCollection    = db.collection('users');

    expensesCollection
      .find({ groupId: groupId })
      .sort({ createdAt: -1 })
      .toArray()
      .then(function(expenses) {
        if (expenses.length === 0) {
          sendResponse(res, 200, { expenses: [] });
          return;
        }

        const payerIds = [...new Set(expenses.map(function(e) { return e.paidBy; }))];

        return usersCollection.find({
          _id: {
            $in: payerIds
              .filter(function(id) { return ObjectId.isValid(id); })
              .map(function(id)    { return new ObjectId(id); })
          }
        }).toArray()
          .then(function(users) {
            const userMap = {};
            users.forEach(function(u) { userMap[u._id.toString()] = u.name; });

            const enriched = expenses.map(function(e) {
              return {
                _id:         e._id,
                description: e.description,
                amount:      e.amount,
                paidBy:      e.paidBy,
                paidByName:  userMap[e.paidBy] || 'Unknown',
                splits:      e.splits,
                createdAt:   e.createdAt
              };
            });

            sendResponse(res, 200, { expenses: enriched });
          });
      })
      .catch(function(err) {
        console.error('Fetch expenses error:', err.message);
        sendResponse(res, 500, { error: 'Server error' });
      });

    return true;
  }

  return false;
}

module.exports = expenseRoutes;