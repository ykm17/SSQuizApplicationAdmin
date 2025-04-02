import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Button,
  Card,
  Text,
  Modal,
  TextInput,
  Portal,
  IconButton,
} from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import debounce from 'lodash/debounce';

const HomeScreen = ({ route, navigation }) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [topicNameEn, setTopicNameEn] = useState('');
  const [topicNameHi, setTopicNameHi] = useState('');
  const [editingTopic, setEditingTopic] = useState(null);

  // Debounced handlers for text input changes
  const debouncedSetTopicNameEn = useCallback(
    debounce((text) => {
      setTopicNameEn(text);
    }, 100),
    []
  );

  const debouncedSetTopicNameHi = useCallback(
    debounce((text) => {
      setTopicNameHi(text);
    }, 100),
    []
  );

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const querySnapshot = await firestore().collection('topics').get();
      const topicsArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTopics(topicsArray);
    } catch (error) {
      console.error('Error fetching topics:', error);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicPress = topic => {
    navigation.navigate('Question', {
      topicId: topic.id,
      topicName: topic.name,
    });
  };

  const showModal = (topic = null) => {
    if (topic) {
      // Edit mode
      setEditingTopic(topic);
      setTopicNameEn(topic.name.en);
      setTopicNameHi(topic.name.hi);
    } else {
      // Add mode
      setEditingTopic(null);
      setTopicNameEn('');
      setTopicNameHi('');
    }
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    setEditingTopic(null);
    setTopicNameEn('');
    setTopicNameHi('');
  };

  const addOrUpdateTopic = async () => {
    if (!topicNameEn.trim()) {
      Alert.alert('Error', 'Please enter topic name in English');
      return;
    }

    try {
      const topicData = {
        name: {
          en: topicNameEn.trim(),
          hi: topicNameHi.trim() || topicNameEn.trim(),
        },
      };

      if (editingTopic) {
        // Update existing topic
        await firestore().collection('topics').doc(editingTopic.id).update(topicData);
      } else {
        // Add new topic
        await firestore().collection('topics').add(topicData);
      }

      hideModal();
      fetchTopics();
    } catch (error) {
      console.error('Error saving topic:', error);
      Alert.alert('Error', 'Failed to save topic. Please try again.');
    }
  };

  const deleteTopic = async (topicId) => {
    Alert.alert(
      'Delete Topic',
      'Are you sure you want to delete this topic?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore().collection('topics').doc(topicId).delete();
              fetchTopics();
            } catch (error) {
              console.error('Error deleting topic:', error);
              Alert.alert('Error', 'Failed to delete topic. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={['#4c12a1', '#2b076e']} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Quiz Topic</Text>
            <View style={styles.countContainer}>
              <Text style={styles.countNumber}>{topics.length}</Text>
            </View>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={topics}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleTopicPress(item)}
              style={styles.touchContainer}
              activeOpacity={0.7}>
              <Card style={styles.topicCard} mode="elevated">
                <Card.Content style={styles.cardContent}>
                  <View style={styles.topicTextContainer}>
                    <Text variant="titleMedium" style={styles.topicTextEn}>
                      {item.name.en}
                    </Text>
                    <Text variant="bodyMedium" style={styles.topicTextHi}>
                      {item.name.hi}
                    </Text>
                  </View>
                  <View style={styles.topicActions}>
                    <IconButton 
                      icon="pencil" 
                      size={20} 
                      onPress={(e) => {
                        e.stopPropagation();
                        showModal(item);
                      }}
                      iconColor="#6200ee"
                      style={styles.actionButton}
                    />
                    <IconButton 
                      icon="delete" 
                      size={20} 
                      onPress={(e) => {
                        e.stopPropagation();
                        deleteTopic(item.id);
                      }}
                      iconColor="#ff0000"
                      style={styles.actionButton}
                    />
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      <Button
        mode="contained"
        onPress={() => showModal()}
        style={styles.addButton}
        labelStyle={styles.buttonLabel}
        contentStyle={{ paddingVertical: 8 }}
        icon="plus">
        Add Topic
      </Button>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingTopic ? 'Edit Topic' : 'Add New Topic'}
            </Text>
            <IconButton icon="close" size={24} onPress={hideModal} />
          </View>

          <View style={styles.divider} />

          <TextInput
            label="Topic Name (English)"
            defaultValue={topicNameEn}
            onChangeText={debouncedSetTopicNameEn}
            mode="outlined"
            style={styles.input}
            outlineColor="#6200ee"
            activeOutlineColor="#6200ee"
            maxLength={100}
            theme={{
              colors: {
                primary: '#6200ee',
                placeholder: '#6200ee80',
              },
            }}
          />
          <TextInput
            label="Topic Name (Hindi)"
            defaultValue={topicNameHi}
            onChangeText={debouncedSetTopicNameHi}
            mode="outlined"
            style={styles.input}
            outlineColor="#6200ee"
            activeOutlineColor="#6200ee"
            maxLength={100}
            theme={{
              colors: {
                primary: '#6200ee',
                placeholder: '#6200ee80',
              },
            }}
          />
          <View style={styles.buttonContainer}>
            <Button
              onPress={hideModal}
              style={styles.cancelButton}
              labelStyle={styles.cancelButtonLabel}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={addOrUpdateTopic}
              style={styles.saveButton}
              labelStyle={styles.saveButtonLabel}>
              {editingTopic ? 'Update' : 'Add'}
            </Button>
          </View>
        </Modal>
      </Portal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 16,
  },
  headerContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  countContainer: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  countNumber: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#ffffff',
  },
  listContainer: {
    padding: 12,
  },
  touchContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 18,
    overflow: 'hidden',
  },
  topicCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    elevation: 8,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicTextContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  topicTextEn: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  topicTextHi: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  topicActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    margin: 0,
  },
  addButton: {
    backgroundColor: '#FFA500',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 12,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
    height: 56,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  cancelButton: {
    marginRight: 12,
    borderColor: '#6200ee',
    borderWidth: 1,
  },
  cancelButtonLabel: {
    color: '#6200ee',
  },
  saveButton: {
    backgroundColor: '#6200ee',
    borderRadius: 10,
  },
  saveButtonLabel: {
    color: '#ffffff',
  },
});

export default HomeScreen;