import { create } from 'zustand';
import * as cvService from '../services/cvService';

export const DEFAULT_CV = {
  id: null,
  title: 'Mein Lebenslauf',
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Deutschland',
    birthDate: '',
    birthPlace: '',
    nationality: 'Deutsch',
    photo: null,
    linkedin: '',
    website: '',
    summary: '',
  },
  workExperience: [],
  education: [],
  skills: [],
  languages: [],
  hobbies: [],
  design: {
    template: 'Modern',
    primaryColor: '#005542',
    fontFamily: 'Inter, sans-serif',
  },
};

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const useCVStore = create((set, get) => ({
  currentCV: { ...DEFAULT_CV },
  wizardStep: 1,
  isDirty: false,
  isSaving: false,
  lastSaved: null,

  initNewCV: () => set({
    currentCV: { ...DEFAULT_CV, personalInfo: { ...DEFAULT_CV.personalInfo } },
    wizardStep: 1,
    isDirty: false,
    lastSaved: null,
  }),

  loadCV: async (id) => {
    const cv = await cvService.getCV(id);
    set({
      currentCV: {
        id: cv.id,
        title: cv.title,
        ...cv.cvData,
      },
      wizardStep: 1,
      isDirty: false,
      lastSaved: new Date(cv.updated_at),
    });
  },

  setTitle: (title) => set(s => ({
    currentCV: { ...s.currentCV, title },
    isDirty: true,
  })),

  updatePersonalInfo: (field, value) => set(s => ({
    currentCV: {
      ...s.currentCV,
      personalInfo: { ...s.currentCV.personalInfo, [field]: value },
    },
    isDirty: true,
  })),

  updateDesign: (field, value) => set(s => ({
    currentCV: {
      ...s.currentCV,
      design: { ...s.currentCV.design, [field]: value },
    },
    isDirty: true,
  })),

  // Generic array operations
  addArrayItem: (field, item) => set(s => ({
    currentCV: {
      ...s.currentCV,
      [field]: [...s.currentCV[field], { ...item, id: newId() }],
    },
    isDirty: true,
  })),

  updateArrayItem: (field, id, updates) => set(s => ({
    currentCV: {
      ...s.currentCV,
      [field]: s.currentCV[field].map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    },
    isDirty: true,
  })),

  removeArrayItem: (field, id) => set(s => ({
    currentCV: {
      ...s.currentCV,
      [field]: s.currentCV[field].filter(item => item.id !== id),
    },
    isDirty: true,
  })),

  reorderArray: (field, fromIdx, toIdx) => set(s => {
    const arr = [...s.currentCV[field]];
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    return { currentCV: { ...s.currentCV, [field]: arr }, isDirty: true };
  }),

  setHobbies: (hobbies) => set(s => ({
    currentCV: { ...s.currentCV, hobbies },
    isDirty: true,
  })),

  setStep: (step) => set({ wizardStep: step }),

  saveCV: async () => {
    const { currentCV } = get();
    set({ isSaving: true });
    try {
      const { id, title, ...cvData } = currentCV;
      let saved;
      if (id) {
        saved = await cvService.updateCV(id, { title, cvData });
      } else {
        saved = await cvService.createCV(title, cvData);
      }
      set(s => ({
        currentCV: { ...s.currentCV, id: saved.id },
        isDirty: false,
        isSaving: false,
        lastSaved: new Date(),
      }));
      return saved.id;
    } catch (err) {
      set({ isSaving: false });
      throw err;
    }
  },
}));

export default useCVStore;
