import firestore from '@react-native-firebase/firestore';

export const bulkUpload = async (data) => {
  try {
    const batch = firestore().batch();
    
    // Process each topic
    for (const topic of data.topics) {
      // Create topic document reference
      const topicRef = firestore().collection('topics').doc();
      
      // Set topic data (name)
      batch.set(topicRef, {
        name: topic.name
      });
      
      // Process questions for this topic
      if (topic.questions && topic.questions.length > 0) {
        for (const question of topic.questions) {
          const questionRef = topicRef.collection('questions').doc();
          batch.set(questionRef, question);
        }
      }
    }
    
    // Commit the batch
    await batch.commit();
    return { success: true, message: 'Bulk upload completed successfully' };
  } catch (error) {
    console.error('Bulk upload error:', error);
    return { success: false, message: error.message };
  }
};
