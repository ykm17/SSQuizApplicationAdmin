import React, {useEffect, useState} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
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
  Surface,
  useTheme,
} from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';

const QuestionScreen = ({route, navigation}) => {
  const theme = useTheme();
  const {topicId, topicName} = route.params;
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

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

  const renderQuestion = ({item, index}) => {
    const isExpanded = expandedQuestionId === item.id;

    return (
      <Surface style={styles.questionCard} elevation={2}>
        <TouchableOpacity
          onPress={() => setExpandedQuestionId(isExpanded ? null : item.id)}>
          <Card.Content>
            {/* Question Header */}
            <View style={styles.questionHeader}>
              <View style={styles.questionTextContainer}>
                <View style={styles.questionNumberContainer}>
                  <View style={styles.numberBadge}>
                    <Text style={styles.questionNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.questionsContainer}>
                    <View style={styles.questionWrapper}>
                      <View style={styles.languageLabel}>
                        <Text style={styles.languageText}>EN</Text>
                      </View>
                      <Text variant="titleMedium" style={styles.questionText}>
                        {item.text?.en || ''}
                      </Text>
                    </View>
                    <View style={styles.questionWrapper}>
                      <View style={styles.languageLabel}>
                        <Text style={styles.languageText}>HI</Text>
                      </View>
                      <Text variant="bodyMedium" style={styles.hindiText}>
                        {item.text?.hi || ''}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <IconButton
                icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={24}
                onPress={() => setExpandedQuestionId(isExpanded ? null : item.id)}
              />
            </View>

            {/* Expanded Content */}
            {isExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.optionsContainer}>
                  {['A', 'B', 'C', 'D'].map(option => (
                    <View
                      key={option}
                      style={[
                        styles.optionRow,
                        item.correctOption === option && styles.correctOptionRow,
                      ]}>
                      <View style={[
                        styles.optionLabel,
                        item.correctOption === option && styles.correctOptionLabel
                      ]}>
                        <Text style={[
                          styles.optionLabelText,
                          item.correctOption === option && styles.correctOptionText
                        ]}>
                          {option}
                        </Text>
                      </View>
                      <View style={styles.optionContent}>
                        <View style={styles.optionTextWrapper}>
                          <View style={styles.languageLabel}>
                            <Text style={styles.languageText}>EN</Text>
                          </View>
                          <Text
                            style={[
                              styles.optionText,
                              item.correctOption === option && styles.correctOptionText
                            ]}>
                            {item.options?.[option]?.en || ''}
                          </Text>
                        </View>
                        <View style={styles.optionTextWrapper}>
                          <View style={styles.languageLabel}>
                            <Text style={styles.languageText}>HI</Text>
                          </View>
                          <Text
                            style={[
                              styles.hindiText,
                              item.correctOption === option && styles.correctOptionText,
                            ]}>
                            {item.options?.[option]?.hi || ''}
                          </Text>
                        </View>
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
                    iconColor={theme.colors.primary}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => confirmDelete(item.id)}
                    iconColor="#FF5252"
                  />
                </View>
              </View>
            )}
          </Card.Content>
        </TouchableOpacity>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      {/* Total Questions Count */}
      <Surface style={styles.headerContainer} elevation={2}>
        <View style={styles.headerContent}>
          <Text style={styles.totalQuestionsText}>
            Total Questions: {questions.length}
          </Text>
          <Button
            mode="contained"
            onPress={showAddModal}
            style={styles.addButton}
            icon="plus">
            Add Question
          </Button>
        </View>
      </Surface>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : questions.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.noQuestionsText}>
            No questions found. Add some questions!
          </Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={item => item.id}
          renderItem={({item, index}) => renderQuestion({item, index})}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Add/Edit Question Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={hideModal}
          dismissable={false}
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
              numberOfLines={3}
            />
            <TextInput
              label="Question (Hindi)"
              value={questionHi}
              onChangeText={setQuestionHi}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
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
    backgroundColor: '#6200ee', // Purple background
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalQuestionsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee', // Purple text
  },
  addButton: {
    marginLeft: 16,
  },
  listContainer: {
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#fff', // White text for loading state
  },
  noQuestionsText: {
    fontSize: 16,
    color: '#fff', // White text for empty state
    fontStyle: 'italic',
    textAlign: 'center',
  },
  questionCard: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    paddingVertical: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 2,
  },
  questionTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  questionNumberContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  numberBadge: {
    backgroundColor: '#ede7f6',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  questionsContainer: {
    flex: 1,
    marginLeft: 8,
  },
  questionWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  languageLabel: {
    backgroundColor: '#ede7f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    marginTop: 2,
    minWidth: 32,
  },
  languageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6200ee',
    textAlign: 'center',
  },
  questionText: {
    fontWeight: 'bold',
    flex: 1,
    color: '#000',
    fontSize: 15,
  },
  hindiText: {
    fontWeight: 'bold',
    flex: 1,
    color: '#000',
    fontSize: 15,
  },
  expandedContent: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  correctOptionRow: {
    backgroundColor: '#e8f5e9',
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ede7f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  correctOptionLabel: {
    backgroundColor: '#c8e6c9',
  },
  optionLabelText: {
    fontWeight: 'bold',
    color: '#6200ee',
    fontSize: 14,
  },
  optionContent: {
    flex: 1,
    paddingVertical: 2,
  },
  optionTextWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  optionText: {
    flex: 1,
    color: '#000',
    fontSize: 14,
  },
  correctOptionText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#6200ee', // Purple text
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#333',
  },
  input: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  radioContainer: {
    marginVertical: 12,
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
    marginTop: 20,
    marginBottom: 20,
  },
  button: {
    marginLeft: 12,
  },
});

export default QuestionScreen;
