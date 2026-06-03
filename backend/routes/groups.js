// backend/routes/groups.js
const { sendResponse, getRequestBody } = require('../helpers/response');
const { getDB }      = require('../db');
const { ObjectId }   = require('mongodb');

function groupRoutes(req, res, pathname) {

  // POST /api/groups — Create group
  if (pathname === '/api/groups' && req.method === 'POST') {
    getRequestBody(req, function(err, body) {
      if (err) {
        sendResponse(res, 400, { error: 'Invalid request body' });
        return;
      }

      const { name, memberEmails, createdBy } = body;

      if (!name || !name.trim()) {
        sendResponse(res, 400, { error: 'Group name is required' });
        return;
      }
      if (!createdBy) {
        sendResponse(res, 400, { error: 'createdBy is required' });
        return;
      }
      if (!memberEmails || !Array.isArray(memberEmails) || memberEmails.length === 0) {
        sendResponse(res, 400, { error: 'At least one member email is required' });
        return;
      }

      const db               = getDB();
      const usersCollection  = db.collection('users');
      const groupsCollection = db.collection('groups');

      // Normalize emails
      const normalizedEmails = memberEmails.map(function(e) {
        return e.toLowerCase().trim();
      });

      usersCollection.find({ email: { $in: normalizedEmails } }).toArray()
        .then(function(foundUsers) {
          const memberIds = foundUsers.map(function(u) {
            return u._id.toString();
          });

          // Always include creator
          if (!memberIds.includes(createdBy)) {
            memberIds.push(createdBy);
          }

          const newGroup = {
            name:      name.trim(),
            createdBy: createdBy,
            members:   memberIds,
            createdAt: new Date()
          };

          return groupsCollection.insertOne(newGroup);
        })
        .then(function(result) {
          sendResponse(res, 201, {
            message: '✅ Group created successfully!',
            groupId: result.insertedId
          });
        })
        .catch(function(err) {
          console.error('Create group error:', err.message);
          sendResponse(res, 500, { error: 'Server error while creating group' });
        });
    });
    return true;
  }

  // GET /api/groups?userId=xxx — Get groups for user
  if (pathname === '/api/groups' && req.method === 'GET') {
    const queryParams = require('url').parse(req.url, true).query;
    const userId      = queryParams.userId;

    if (!userId) {
      sendResponse(res, 400, { error: 'userId is required' });
      return true;
    }

    const db               = getDB();
    const groupsCollection = db.collection('groups');

    groupsCollection.find({ members: userId }).toArray()
      .then(function(groups) {
        sendResponse(res, 200, { groups: groups });
      })
      .catch(function(err) {
        console.error('Fetch groups error:', err.message);
        sendResponse(res, 500, { error: 'Server error while fetching groups' });
      });

    return true;
  }

  // GET /api/groups/:id — Get single group with members
  if (pathname.startsWith('/api/groups/') && req.method === 'GET') {
    const groupId = pathname.split('/')[3];

    if (!ObjectId.isValid(groupId)) {
      sendResponse(res, 400, { error: 'Invalid group ID' });
      return true;
    }

    const db               = getDB();
    const groupsCollection = db.collection('groups');
    const usersCollection  = db.collection('users');

    groupsCollection.findOne({ _id: new ObjectId(groupId) })
      .then(function(group) {
        if (!group) {
          sendResponse(res, 404, { error: 'Group not found' });
          return null;
        }

        return usersCollection.find({
          _id: {
            $in: group.members
              .filter(function(id) { return ObjectId.isValid(id); })
              .map(function(id)    { return new ObjectId(id); })
          }
        }).toArray()
          .then(function(members) {
            sendResponse(res, 200, {
              group:   group,
              members: members.map(function(m) {
                return { id: m._id.toString(), name: m.name, email: m.email };
              })
            });
          });
      })
      .catch(function(err) {
        console.error('Get group error:', err.message);
        sendResponse(res, 500, { error: 'Server error' });
      });

    return true;
  }

  // DELETE /api/groups/:id — Delete group + its expenses
  if (pathname.startsWith('/api/groups/') && req.method === 'DELETE') {
    const groupId = pathname.split('/')[3];

    if (!ObjectId.isValid(groupId)) {
      sendResponse(res, 400, { error: 'Invalid group ID' });
      return true;
    }

    const db                 = getDB();
    const groupsCollection   = db.collection('groups');
    const expensesCollection = db.collection('expenses');

    groupsCollection.deleteOne({ _id: new ObjectId(groupId) })
      .then(function(result) {
        if (result.deletedCount === 0) {
          sendResponse(res, 404, { error: 'Group not found' });
          return null;
        }
        return expensesCollection.deleteMany({ groupId: groupId });
      })
      .then(function(expResult) {
        if (!expResult) return;
        sendResponse(res, 200, {
          message:         '✅ Group deleted successfully!',
          expensesDeleted: expResult.deletedCount
        });
      })
      .catch(function(err) {
        console.error('Delete group error:', err.message);
        sendResponse(res, 500, { error: 'Server error while deleting group' });
      });

    return true;
  }

  return false;
}

module.exports = groupRoutes;