import React, {useEffect, useState} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Button,
  Card,
  Text,
  Modal,
  TextInput,
  Portal,
  RadioButton,
  Divider,
  IconButton,
} from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';

const QuestionScreen = ({route, navigation}) => {
  const {topicId, topicName} = route.params;
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);

  // Form states
  const [questionEn, setQuestionEn] = useState('');
  const [questionHi, setQuestionHi] = useState('');
  const [optionAEn, setOptionAEn] = useState('');
  const [optionAHi, setOptionAHi] = useState('');
  const [optionBEn, setOptionBEn] = useState('');
  const [optionBHi, setOptionBHi] = useState('');
  const [optionCEn, setOptionCEn] = useState('');
  const [optionCHi, setOptionCHi] = useState('');
  const [optionDEn, setOptionDEn] = useState('');
  const [optionDHi, setOptionDHi] = useState('');
  const [correctOption, setCorrectOption] = useState('A');

  useEffect(() => {
    navigation.setOptions({
      title: `Questions: ${topicName}`,
    });

    fetchQuestions();
  }, [navigation, topicName]);

  const fetchQuestions = async () => {
    try {
      const questionsSnapshot = await firestore()
        .collection('topics')
        .doc(topicId)
        .collection('questions')
        .get();

      const questionsArray = questionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setQuestions(questionsArray);
      console.log('Questions:', questionsArray);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const showAddModal = () => {
    setEditMode(false);
    setCurrentQuestionId(null);
    resetForm();
    setModalVisible(true);
  };

  const showEditModal = question => {
    setEditMode(true);
    setCurrentQuestionId(question.id);

    // Populate form with question data
    setQuestionEn(question.text?.en || '');
    setQuestionHi(question.text?.hi || '');
    setOptionAEn(question.options?.A?.en || '');
    setOptionAHi(question.options?.A?.hi || '');
    setOptionBEn(question.options?.B?.en || '');
    setOptionBHi(question.options?.B?.hi || '');
    setOptionCEn(question.options?.C?.en || '');
    setOptionCHi(question.options?.C?.hi || '');
    setOptionDEn(question.options?.D?.en || '');
    setOptionDHi(question.options?.D?.hi || '');
    setCorrectOption(question.correctOption || 'A');

    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setQuestionEn('');
    setQuestionHi('');
    setOptionAEn('');
    setOptionAHi('');
    setOptionBEn('');
    setOptionBHi('');
    setOptionCEn('');
    setOptionCHi('');
    setOptionDEn('');
    setOptionDHi('');
    setCorrectOption('A');
  };

  const confirmDelete = questionId => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => deleteQuestion(questionId),
          style: 'destructive',
        },
      ],
    );
  };

  const deleteQuestion = async questionId => {
    try {
      await firestore()
        .collection('topics')
        .doc(topicId)
        .collection('questions')
        .doc(questionId)
        .delete();

      console.log('Question deleted successfully');
      fetchQuestions(); // Refresh questions list
    } catch (error) {
      console.error('Error deleting question:', error);
      Alert.alert('Error', 'Failed to delete question. Please try again.');
    }
  };

  const saveQuestion = async () => {
    // Form validation
    if (!questionEn.trim()) {
      Alert.alert('Error', 'Please enter the question in English');
      return;
    }
    if (
      !optionAEn.trim() ||
      !optionBEn.trim() ||
      !optionCEn.trim() ||
      !optionDEn.trim()
    ) {
      Alert.alert('Error', 'Please enter all options in English');
      return;
    }

    try {
      const questionData = {
        text: {
          en: questionEn.trim(),
          hi: questionHi.trim() || questionEn.trim(),
        },
        options: {
          A: {
            en: optionAEn.trim(),
            hi: optionAHi.trim() || optionAEn.trim(),
          },
          B: {
            en: optionBEn.trim(),
            hi: optionBHi.trim() || optionBEn.trim(),
          },
          C: {
            en: optionCEn.trim(),
            hi: optionCHi.trim() || optionCEn.trim(),
          },
          D: {
            en: optionDEn.trim(),
            hi: optionDHi.trim() || optionDEn.trim(),
          },
        },
        correctOption: correctOption,
      };

      if (editMode && currentQuestionId) {
        // Update existing question
        await firestore()
          .collection('topics')
          .doc(topicId)
          .collection('questions')
          .doc(currentQuestionId)
          .update(questionData);

        console.log('Question updated successfully');
      } else {
        // Add new question
        await firestore()
          .collection('topics')
          .doc(topicId)
          .collection('questions')
          .add(questionData);

        console.log('Question added successfully');
      }

      hideModal();
      fetchQuestions(); // Refresh questions list
    } catch (error) {
      console.error('Error saving question:', error);
      Alert.alert('Error', 'Failed to save question. Please try again.');
    }
  };

  const renderQuestion = ({item}) => {
    return (
      <Card style={styles.questionCard} mode="outlined">
        <Card.Content>
          {/* English Question */}
          <Text variant="titleMedium" style={styles.questionText}>
            {item.text?.en || ''}
          </Text>

          {/* Hindi Question */}
          <Text variant="titleMedium" style={styles.hindiText}>
            {item.text?.hi || ''}
          </Text>

          <View style={styles.optionsContainer}>
            {['A', 'B', 'C', 'D'].map(option => (
              <View
                key={option}
                style={[
                  styles.optionRow,
                  item.correctOption === option && styles.correctOptionRow,
                ]}>
                <Text
                  style={[
                    styles.optionLabel,
                    item.correctOption === option && styles.correctOptionText,
                  ]}>
                  {option}:
                </Text>
                <View style={styles.optionContent}>
                  <Text
                    style={
                      item.correctOption === option
                        ? styles.correctOptionText
                        : null
                    }>
                    {item.options?.[option]?.en || ''}
                  </Text>
                  <Text
                    style={[
                      styles.hindiText,
                      item.correctOption === option && styles.correctOptionText,
                    ]}>
                    {item.options?.[option]?.hi || ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.actionContainer}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => showEditModal(item)}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => confirmDelete(item.id)}
              iconColor="#FF5252"
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      

      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : questions.length === 0 ? (
        <Text style={styles.noQuestionsText}>
          No questions found. Add some questions!
        </Text>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={item => item.id}
          renderItem={renderQuestion}
          contentContainerStyle={styles.listContainer}
        />
      )}
      <Button mode="contained" onPress={showAddModal} style={styles.addButton}>
        Add Question
      </Button>

      {/* Add/Edit Question Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContainer}>
          <ScrollView>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Question' : 'Add New Question'}
            </Text>

            <Text style={styles.sectionTitle}>Question</Text>
            <TextInput
              label="Question (English)"
              value={questionEn}
              onChangeText={setQuestionEn}
              mode="outlined"
              style={styles.input}
              multiline
            />
            <TextInput
              label="Question (Hindi)"
              value={questionHi}
              onChangeText={setQuestionHi}
              mode="outlined"
              style={styles.input}
              multiline
            />

            <Divider style={styles.divider} />
            <Text style={styles.sectionTitle}>Option A</Text>
            <TextInput
              label="Option A (English)"
              value={optionAEn}
              onChangeText={setOptionAEn}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Option A (Hindi)"
              value={optionAHi}
              onChangeText={setOptionAHi}
              mode="outlined"
              style={styles.input}
            />

            <Divider style={styles.divider} />
            <Text style={styles.sectionTitle}>Option B</Text>
            <TextInput
              label="Option B (English)"
              value={optionBEn}
              onChangeText={setOptionBEn}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Option B (Hindi)"
              value={optionBHi}
              onChangeText={setOptionBHi}
              mode="outlined"
              style={styles.input}
            />

            <Divider style={styles.divider} />
            <Text style={styles.sectionTitle}>Option C</Text>
            <TextInput
              label="Option C (English)"
              value={optionCEn}
              onChangeText={setOptionCEn}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Option C (Hindi)"
              value={optionCHi}
              onChangeText={setOptionCHi}
              mode="outlined"
              style={styles.input}
            />

            <Divider style={styles.divider} />
            <Text style={styles.sectionTitle}>Option D</Text>
            <TextInput
              label="Option D (English)"
              value={optionDEn}
              onChangeText={setOptionDEn}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Option D (Hindi)"
              value={optionDHi}
              onChangeText={setOptionDHi}
              mode="outlined"
              style={styles.input}
            />

            <Divider style={styles.divider} />
            <Text style={styles.sectionTitle}>Correct Answer</Text>
            <View style={styles.radioContainer}>
              <RadioButton.Group
                onValueChange={value => setCorrectOption(value)}
                value={correctOption}>
                <View style={styles.radioGroup}>
                  {['A', 'B', 'C', 'D'].map(option => (
                    <View key={option} style={styles.radioItem}>
                      <RadioButton value={option} />
                      <Text>{option}</Text>
                    </View>
                  ))}
                </View>
              </RadioButton.Group>
            </View>

            <View style={styles.buttonContainer}>
              <Button onPress={hideModal} style={styles.button}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={saveQuestion}
                style={styles.button}>
                {editMode ? 'Update' : 'Add'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  addButton: {
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
  },
  noQuestionsText: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  questionCard: {
    marginBottom: 16,
  },
  questionText: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hindiText: {
    fontStyle: 'italic',
    marginBottom: 8,
  },
  optionsContainer: {
    marginTop: 12,
  },
  optionRow: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 4,
  },
  correctOptionRow: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  optionLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    width: 24,
  },
  optionContent: {
    flex: 1,
  },
  correctOptionText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 5,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  input: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  radioContainer: {
    marginVertical: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    marginBottom: 20,
  },
  button: {
    marginLeft: 8,
  },
});

export default QuestionScreen;
