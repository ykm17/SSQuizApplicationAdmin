import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  Button,
  Card,
  Text,
  Modal,
  TextInput,
  Portal,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';

const ArticlesScreen = ({ navigation }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionHi, setDescriptionHi] = useState('');
  const [referenceLink, setReferenceLink] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const querySnapshot = await firestore().collection('articles').get();
      const articlesArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setArticles(articlesArray);
    } catch (error) {
      console.error('Error fetching articles:', error);
      Alert.alert('Error', 'Failed to fetch articles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showAddModal = () => {
    setEditMode(false);
    setCurrentArticleId(null);
    resetForm();
    setModalVisible(true);
  };

  const showEditModal = article => {
    setEditMode(true);
    setCurrentArticleId(article.id);
    setTitleEn(article.title?.en || '');
    setTitleHi(article.title?.hi || '');
    setDescriptionEn(article.description?.en || '');
    setDescriptionHi(article.description?.hi || '');
    setReferenceLink(article.referenceLink || '');
    setImageUrl(article.imageUrl || '');
    setImageUri(null);
    setModalVisible(true);
  };

  const hideModal = () => {
    if (!isSubmitting) {
      setModalVisible(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setTitleEn('');
    setTitleHi('');
    setDescriptionEn('');
    setDescriptionHi('');
    setReferenceLink('');
    setImageUri(null);
    setImageUrl('');
  };

  const selectImage = () => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
      },
      response => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('Error', 'Failed to select image. Please try again.');
          return;
        }
        setImageUri(response.assets[0].uri);
      },
    );
  };

  const uploadImage = async () => {
    if (!imageUri) return imageUrl;

    try {
      setUploading(true);
      const filename = `articles/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const reference = storage().ref(filename);

      await reference.putFile(imageUri);
      const url = await reference.getDownloadURL();
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      return imageUrl;
    } finally {
      setUploading(false);
    }
  };

  const deleteImageFromStorage = async (imageUrl) => {
    try {
      if (!imageUrl) return;
      const imageRef = storage().refFromURL(imageUrl);
      await imageRef.delete();
    } catch (error) {
      console.error('Error deleting image from storage:', error);
    }
  };

  const saveArticle = async () => {
    if (isSubmitting) {
      return;
    }

    // Validation checks
    if (!titleEn.trim()) {
      Alert.alert('Error', 'Please enter the article title in English');
      return;
    }
    if (!titleHi.trim()) {
      Alert.alert('Error', 'Please enter the article title in Hindi');
      return;
    }
    if (!descriptionEn.trim()) {
      Alert.alert('Error', 'Please enter the article description in English');
      return;
    }
    if (!descriptionHi.trim()) {
      Alert.alert('Error', 'Please enter the article description in Hindi');
      return;
    }
    if (!editMode && !imageUri) {
      Alert.alert('Error', 'Please select an image for the article');
      return;
    }

    try {
      setIsSubmitting(true);
      let finalImageUrl = imageUrl;
      
      if (imageUri) {
        if (editMode && imageUrl) {
          await deleteImageFromStorage(imageUrl);
        }
        
        finalImageUrl = await uploadImage();
        if (!finalImageUrl) {
          Alert.alert('Error', 'Failed to upload image. Please try again.');
          return;
        }
      }

      const articleData = {
        title: {
          en: titleEn.trim(),
          hi: titleHi.trim(),
        },
        description: {
          en: descriptionEn.trim(),
          hi: descriptionHi.trim(),
        },
        imageUrl: finalImageUrl,
        referenceLink: referenceLink.trim() || null,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      if (editMode && currentArticleId) {
        await firestore().collection('articles').doc(currentArticleId).update(articleData);
      } else {
        articleData.createdAt = firestore.FieldValue.serverTimestamp();
        await firestore().collection('articles').add(articleData);
      }

      hideModal();
      fetchArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      Alert.alert('Error', 'Failed to save article. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteArticle = async (articleId) => {
    Alert.alert(
      'Delete Article',
      'Are you sure you want to delete this article? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setModalVisible(false);

              const articleDoc = await firestore().collection('articles').doc(articleId).get();
              const articleData = articleDoc.data();

              if (articleData?.imageUrl) {
                try {
                  const imageRef = storage().refFromURL(articleData.imageUrl);
                  await imageRef.delete();
                } catch (error) {
                  console.error('Error deleting image from storage:', error);
                }
              }

              await firestore().collection('articles').doc(articleId).delete();
              
              fetchArticles();
            } catch (error) {
              console.error('Error deleting article:', error);
              Alert.alert('Error', 'Failed to delete article. Please try again.');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  const renderArticle = ({ item }) => (
    <Card style={styles.articleCard} mode="elevated">
      <Card.Content style={styles.articleListContent}>
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.articleListImage} />
        )}
        <View style={styles.articleListTextContainer}>
          <Text variant="titleMedium" style={styles.articleListTitle}>
            {item.title?.en}
          </Text>
        </View>
        <View style={styles.articleListActionContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => showEditModal(item)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteActionButton]} 
            onPress={() => deleteArticle(item.id)}
          >
            <Text style={[styles.actionButtonText, styles.deleteActionButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

  const renderModalContent = () => (
    <ScrollView style={styles.modalContent}>
      <View style={styles.imageContainer}>
        {(imageUri || imageUrl) && (
          <Image 
            source={{ uri: imageUri || imageUrl }} 
            style={styles.previewImage} 
          />
        )}
        <Button
          mode="outlined"
          onPress={selectImage}
          style={styles.imageButton}
          labelStyle={styles.imageButtonLabel}
          disabled={isSubmitting}>
          {imageUri || imageUrl ? 'Change Image' : 'Select Image *'}
        </Button>
      </View>
      
      <TextInput
        label="Title (English) *"
        value={titleEn}
        onChangeText={setTitleEn}
        mode="outlined"
        style={styles.input}
        error={!titleEn.trim()}
        disabled={isSubmitting}
      />
      <TextInput
        label="Title (Hindi) *"
        value={titleHi}
        onChangeText={setTitleHi}
        mode="outlined"
        style={styles.input}
        error={!titleHi.trim()}
        disabled={isSubmitting}
      />

      <TextInput
        label="Description (English) *"
        value={descriptionEn}
        onChangeText={setDescriptionEn}
        mode="outlined"
        style={[styles.input, styles.descriptionInput]}
        multiline
        numberOfLines={3}
        error={!descriptionEn.trim()}
        disabled={isSubmitting}
      />
      <TextInput
        label="Description (Hindi) *"
        value={descriptionHi}
        onChangeText={setDescriptionHi}
        mode="outlined"
        style={[styles.input, styles.descriptionInput]}
        multiline
        numberOfLines={3}
        error={!descriptionHi.trim()}
        disabled={isSubmitting}
      />

      <TextInput
        label="Reference Link (Optional)"
        value={referenceLink}
        onChangeText={setReferenceLink}
        mode="outlined"
        style={styles.input}
        disabled={isSubmitting}
      />

      

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={saveArticle}
          style={styles.button}
          loading={uploading || isSubmitting}
          disabled={isSubmitting}>
          {editMode ? 'Update Article' : 'Add Article'}
        </Button>
      </View>
    </ScrollView>
  );

  return (
    <LinearGradient colors={['#4c12a1', '#2b076e']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Articles</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : articles.length === 0 ? (
        <Text style={styles.noArticlesText}>
          No articles found. Add some articles!
        </Text>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={item => item.id}
          renderItem={renderArticle}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Article' : 'Add New Article'}
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={hideModal}
              disabled={isSubmitting}
            />
          </View>
          {renderModalContent()}
        </Modal>
      </Portal>

      <View style={styles.bottomButtonContainer}>
        <Button
          mode="contained"
          onPress={showAddModal}
          style={styles.addButton}
          labelStyle={styles.buttonLabel}
          disabled={isSubmitting}>
          New Article
        </Button>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noArticlesText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#ffffff',
    fontStyle: 'italic',
  },
  listContainer: {
    padding: 16,
  },
  articleCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  articleImage: {
    height: 200,
  },
  articleTitle: {
    marginTop: 12,
    fontWeight: 'bold',
  },
  articleDescription: {
    marginTop: 8,
    color: '#666',
  },
  referenceLink: {
    marginTop: 8,
    color: '#6200ee',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
  },
  addButton: {
    backgroundColor: '#FFA500',
    borderRadius: 10,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalContent: {
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  imageButton: {
    marginTop: 8,
  },
  imageButtonLabel: {
    color: '#6200ee',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    marginLeft: 8,
    marginBottom: 30,
    flex:1
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'transparent',
  },
  articleListContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  articleListImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  articleListTextContainer: {
    flex: 1,
  },
  articleListTitle: {
    fontWeight: 'bold',
  },
  articleDetailsContainer: {
    alignItems: 'center',
    padding: 16,
  },
  articleDetailsImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  articleDetailsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 24,
  },
  articleDetailsSubtitle: {
    marginBottom: 16,
    fontSize: 20,
  },
  articleDetailsDescription: {
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  actionContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
    borderRadius: 8,
    width: '100%',
  },
  articleListActionContainer: {
    flexDirection: 'column',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginVertical: 4,
    backgroundColor: '#e0e0e0',
  },
  deleteActionButton: {
    backgroundColor: '#FF5252',
  },
  actionButtonText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteActionButtonText: {
    color: 'white',
  },
});

export default ArticlesScreen; 