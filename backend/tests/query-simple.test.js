const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');

// Simple test app setup
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock auth middleware
  app.use((req, res, next) => {
    req.admin = { 
      _id: new mongoose.Types.ObjectId(), 
      name: 'Test Admin', 
      email: 'test@admin.com' 
    };
    next();
  });

  return app;
};

// Define schemas directly in test
const noteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdBy: { type: mongoose.Schema.ObjectId, required: true },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

const querySchema = new mongoose.Schema({
  removed: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  customerName: { type: String, required: true },
  customerId: { type: mongoose.Schema.ObjectId, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Open', 'InProgress', 'Closed'], 
    default: 'Open' 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  resolution: { type: String, default: '' },
  notes: [noteSchema],
  createdBy: { type: mongoose.Schema.ObjectId },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  country: String,
  address: String,
});

const adminSchema = new mongoose.Schema({
  name: String,
  email: String,
});

// Create models
const Query = mongoose.model('TestQuery', querySchema);
const Client = mongoose.model('TestClient', clientSchema);
const Admin = mongoose.model('TestAdmin', adminSchema);

// Simple CRUD functions
const createQuery = async (req, res) => {
  try {
    const { customerName } = req.body;
    
    // Find or create a client based on customerName
    let customer = await Client.findOne({ name: customerName });
    
    // If customer doesn't exist, create a new one
    if (!customer) {
      customer = await Client.create({
        name: customerName,
        createdBy: req.admin._id
      });
    }
    
    // Create the query with the customer ID
    const queryData = {
      ...req.body,
      customerId: customer._id,
      createdBy: req.admin._id
    };
    
    const query = await Query.create(queryData);
    res.status(200).json({ success: true, result: query });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getQueries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const items = parseInt(req.query.items) || 10;
    const skip = (page - 1) * items;
    
    const queries = await Query.find({ removed: false })
      .skip(skip)
      .limit(items)
      .sort({ created: -1 });
    
    const total = await Query.countDocuments({ removed: false });
    const pages = Math.ceil(total / items);
    
    res.status(200).json({ 
      success: true, 
      result: queries,
      pagination: { page, pages, count: total }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getQuery = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(200).json({ success: false, message: 'Query not found' });
    }
    res.status(200).json({ success: true, result: query });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateQuery = async (req, res) => {
  try {
    const query = await Query.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updated: new Date() }, 
      { new: true }
    );
    if (!query) {
      return res.status(200).json({ success: false, message: 'Query not found' });
    }
    res.status(200).json({ success: true, result: query });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Note content is required',
      });
    }

    const query = await Query.findById(id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found',
      });
    }

    const newNote = {
      content: content.trim(),
      createdBy: req.admin._id,
      created: new Date(),
      updated: new Date(),
    };

    query.notes.push(newNote);
    query.updated = new Date();
    
    const updatedQuery = await query.save();
    const addedNote = updatedQuery.notes[updatedQuery.notes.length - 1];

    return res.status(200).json({
      success: true,
      result: addedNote,
      message: 'Note added successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const removeNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;

    const query = await Query.findById(id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found',
      });
    }

    const noteIndex = query.notes.findIndex(note => note._id.toString() === noteId);
    if (noteIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    query.notes.splice(noteIndex, 1);
    query.updated = new Date();
    
    await query.save();

    return res.status(200).json({
      success: true,
      message: 'Note removed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

describe('Query Management API Tests', () => {
  let app;
  let testClient;
  let testAdmin;

  beforeAll(async () => {
    app = createTestApp();
    
    // Add routes
    app.post('/api/query/create', createQuery);
    app.get('/api/query/list', getQueries);
    app.get('/api/query/read/:id', getQuery);
    app.patch('/api/query/update/:id', updateQuery);
    app.post('/api/query/:id/notes', addNote);
    app.delete('/api/query/:id/notes/:noteId', removeNote);
    
    // Error handling
    app.use((err, req, res, next) => {
      res.status(500).json({ success: false, message: err.message });
    });
    
    // Create test data
    testAdmin = await Admin.create({
      name: 'Test Admin',
      email: 'test@admin.com'
    });

    testClient = await Client.create({
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '123-456-7890',
      country: 'Test Country',
      address: '123 Test St'
    });
  });

  describe('POST /api/query/create', () => {
    it('should create a new query successfully', async () => {
      const queryData = {
        customerName: 'Test Customer',
        description: 'Test query description',
        status: 'Open',
        priority: 'Medium'
      };

      const response = await request(app)
        .post('/api/query/create')
        .send(queryData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.customerName).toBe(queryData.customerName);
      expect(response.body.result.description).toBe(queryData.description);
      expect(response.body.result.status).toBe(queryData.status);
      expect(response.body.result.customerId).toBeDefined();
    });

    it('should return error for missing required fields', async () => {
      const incompleteData = {
        customerName: 'Test Customer'
        // Missing description
      };

      const response = await request(app)
        .post('/api/query/create')
        .send(incompleteData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/query/list', () => {
    beforeEach(async () => {
      // Clean and create test queries
      await Query.deleteMany({});
      await Query.create([
        {
          customerName: 'Customer 1',
          customerId: testClient._id,
          description: 'First query',
          status: 'Open',
          createdBy: testAdmin._id
        },
        {
          customerName: 'Customer 2',
          customerId: testClient._id,
          description: 'Second query',
          status: 'InProgress',
          createdBy: testAdmin._id
        },
        {
          customerName: 'Customer 3',
          customerId: testClient._id,
          description: 'Third query',
          status: 'Closed',
          createdBy: testAdmin._id
        }
      ]);
    });

    it('should retrieve paginated queries', async () => {
      const response = await request(app)
        .get('/api/query/list?page=1&items=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/query/list?page=2&items=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result).toHaveLength(1);
      expect(response.body.pagination.page).toBe(2);
    });
  });

  describe('GET /api/query/read/:id', () => {
    let testQuery;

    beforeEach(async () => {
      testQuery = await Query.create({
        customerName: 'Test Customer',
        customerId: testClient._id,
        description: 'Test query for reading',
        status: 'Open',
        createdBy: testAdmin._id
      });
    });

    it('should retrieve a single query by ID', async () => {
      const response = await request(app)
        .get(`/api/query/read/${testQuery._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result._id).toBe(testQuery._id.toString());
      expect(response.body.result.customerName).toBe('Test Customer');
    });

    it('should return error for non-existent query', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/query/read/${nonExistentId}`)
        .expect(200);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/query/update/:id', () => {
    let testQuery;

    beforeEach(async () => {
      testQuery = await Query.create({
        customerName: 'Test Customer',
        customerId: testClient._id,
        description: 'Test query for updating',
        status: 'Open',
        createdBy: testAdmin._id
      });
    });

    it('should update query status and resolution', async () => {
      const updateData = {
        status: 'Closed',
        resolution: 'Issue resolved successfully'
      };

      const response = await request(app)
        .patch(`/api/query/update/${testQuery._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.status).toBe('Closed');
      expect(response.body.result.resolution).toBe('Issue resolved successfully');
    });
  });

  describe('POST /api/query/:id/notes', () => {
    let testQuery;

    beforeEach(async () => {
      testQuery = await Query.create({
        customerName: 'Test Customer',
        customerId: testClient._id,
        description: 'Test query for notes',
        status: 'Open',
        createdBy: testAdmin._id
      });
    });

    it('should add a note to a query', async () => {
      const noteData = {
        content: 'This is a test note'
      };

      const response = await request(app)
        .post(`/api/query/${testQuery._id}/notes`)
        .send(noteData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.content).toBe('This is a test note');
      expect(response.body.message).toBe('Note added successfully');
    });

    it('should return error for empty note content', async () => {
      const noteData = {
        content: ''
      };

      const response = await request(app)
        .post(`/api/query/${testQuery._id}/notes`)
        .send(noteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Note content is required');
    });

    it('should return error for non-existent query', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const noteData = {
        content: 'Test note'
      };

      const response = await request(app)
        .post(`/api/query/${nonExistentId}/notes`)
        .send(noteData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Query not found');
    });
  });

  describe('DELETE /api/query/:id/notes/:noteId', () => {
    let testQuery;
    let noteId;

    beforeEach(async () => {
      testQuery = await Query.create({
        customerName: 'Test Customer',
        customerId: testClient._id,
        description: 'Test query for note deletion',
        status: 'Open',
        createdBy: testAdmin._id,
        notes: [{
          content: 'Test note to delete',
          createdBy: testAdmin._id
        }]
      });
      noteId = testQuery.notes[0]._id;
    });

    it('should delete a note from a query', async () => {
      const response = await request(app)
        .delete(`/api/query/${testQuery._id}/notes/${noteId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Note removed successfully');
    });

    it('should return error for non-existent note', async () => {
      const nonExistentNoteId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/query/${testQuery._id}/notes/${nonExistentNoteId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Note not found');
    });
  });
});
