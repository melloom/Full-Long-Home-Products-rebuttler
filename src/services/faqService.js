import { getDb } from './firebase/config';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

const FAQ_COLLECTION = 'faqs';

const faqService = {
  // Get all FAQ items
  async getAllFAQs() {
    try {
      const q = query(collection(getDb(), FAQ_COLLECTION), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      throw new Error('Failed to fetch FAQs');
    }
  },

  // Get a single FAQ by ID
  async getFAQById(id) {
    try {
      const docRef = doc(getDb(), FAQ_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('FAQ not found');
      }
    } catch (error) {
      console.error('Error fetching FAQ:', error);
      throw new Error('Failed to fetch FAQ');
    }
  },

  // Add a new FAQ
  async addFAQ(faqData) {
    try {
      const docRef = await addDoc(collection(getDb(), FAQ_COLLECTION), {
        ...faqData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...faqData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error adding FAQ:', error);
      throw new Error('Failed to add FAQ');
    }
  },

  // Update an existing FAQ
  async updateFAQ(id, faqData) {
    try {
      const docRef = doc(getDb(), FAQ_COLLECTION, id);
      await updateDoc(docRef, {
        ...faqData,
        updatedAt: serverTimestamp()
      });
      
      return {
        id,
        ...faqData,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error updating FAQ:', error);
      throw new Error('Failed to update FAQ');
    }
  },

  // Delete an FAQ
  async deleteFAQ(id) {
    try {
      const docRef = doc(getDb(), FAQ_COLLECTION, id);
      await deleteDoc(docRef);
      return id;
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      throw new Error('Failed to delete FAQ');
    }
  },

  // Search FAQs
  async searchFAQs(searchTerm) {
    try {
      const allFAQs = await this.getAllFAQs();
      const searchLower = searchTerm.toLowerCase();
      
      return allFAQs.filter(faq => 
        faq.question.toLowerCase().includes(searchLower) ||
        faq.answer.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching FAQs:', error);
      throw new Error('Failed to search FAQs');
    }
  }
};

export default faqService; 