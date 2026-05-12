const express = require('express');
const router = express.Router();
const crm = require('../controllers/crmController');
const auth = require('../middleware/auth');

router.use(auth);

// Candidates
router.get('/candidates', crm.listCandidates);
router.post('/candidates', crm.createCandidate);
router.post('/candidates/from-cv/:cvId', crm.importFromCV);
router.get('/candidates/:id', crm.getCandidate);
router.put('/candidates/:id', crm.updateCandidate);
router.patch('/candidates/:id/stage', crm.updateStage);
router.delete('/candidates/:id', crm.deleteCandidate);

// Companies
router.get('/companies', crm.listCompanies);
router.post('/companies', crm.createCompany);
router.get('/companies/:id', crm.getCompany);
router.put('/companies/:id', crm.updateCompany);
router.delete('/companies/:id', crm.deleteCompany);

// Contacts
router.get('/contacts', crm.listContacts);
router.post('/contacts', crm.createContact);
router.put('/contacts/:id', crm.updateContact);
router.delete('/contacts/:id', crm.deleteContact);

// Jobs
router.get('/jobs', crm.listJobs);
router.post('/jobs', crm.createJob);
router.get('/jobs/:id', crm.getJob);
router.put('/jobs/:id', crm.updateJob);
router.delete('/jobs/:id', crm.deleteJob);

// Applications
router.post('/applications', crm.createApplication);
router.put('/applications/:id', crm.updateApplication);

// Activities
router.get('/activities/:entityType/:entityId', crm.listActivities);
router.post('/activities', crm.createActivity);
router.delete('/activities/:id', crm.deleteActivity);

// Tasks
router.get('/tasks', crm.listTasks);
router.post('/tasks', crm.createTask);
router.patch('/tasks/:id/toggle', crm.toggleTask);
router.delete('/tasks/:id', crm.deleteTask);

// Dashboard
router.get('/stats', crm.getStats);

module.exports = router;
