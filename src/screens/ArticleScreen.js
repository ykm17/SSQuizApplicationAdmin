import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
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
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    resetForm();
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

  const saveArticle = async () => {
    if (!titleEn.trim()) {
      Alert.alert('Error', 'Please enter the article title in English');
      return;
    }

    if (!editMode && !imageUri) {
      Alert.alert('Error', 'Please select an image for the article');
      return;
    }

    try {
      let finalImageUrl = imageUrl;
      if (imageUri) {
        finalImageUrl = await uploadImage();
        if (!finalImageUrl) {
          Alert.alert('Error', 'Failed to upload image. Please try again.');
          return;
        }
      }

      const articleData = {
        title: {
          en: titleEn.trim(),
          hi: titleHi.trim() || titleEn.trim(),
        },
        description: {
          en: descriptionEn.trim(),
          hi: descriptionHi.trim() || descriptionEn.trim(),
        },
        imageUrl: finalImageUrl,
        referenceLink: referenceLink.trim(),
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
    }
  };

  const deleteArticle = async articleId => {
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
              // Get the article data to get the image URL
              const articleDoc = await firestore().collection('articles').doc(articleId).get();
              const articleData = articleDoc.data();

              // Delete the image from Firebase Storage if it exists
              if (articleData?.imageUrl) {
                try {
                  // Extract the file path from the URL
                  const imageRef = storage().refFromURL(articleData.imageUrl);
                  await imageRef.delete();
                } catch (error) {
                  console.error('Error deleting image from storage:', error);
                  // Continue with article deletion even if image deletion fails
                }
              }

              // Delete the article document
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
      {item.imageUrl && (
        <Card.Cover source={{ uri: item.imageUrl }} style={styles.articleImage} />
      )}
      <Card.Content>
        <Text variant="titleLarge" style={styles.articleTitle}>
          {item.title?.en}
        </Text>
        <Text variant="bodyMedium" style={styles.articleDescription}>
          {item.description?.en}
        </Text>
        {item.referenceLink && (
          <Text variant="bodySmall" style={styles.referenceLink}>
            Reference: {item.referenceLink}
          </Text>
        )}
        <View style={styles.actionContainer}>
          <IconButton
            icon="pencil"
            size={20}
            onPress={() => showEditModal(item)}
          />
          <IconButton
            icon="delete"
            size={20}
            onPress={() => deleteArticle(item.id)}
            iconColor="#FF5252"
          />
        </View>
      </Card.Content>
    </Card>
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

      <Button
        mode="contained"
        onPress={showAddModal}
        style={styles.addButton}
        labelStyle={styles.buttonLabel}>
        Add Article
      </Button>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContainer}>
          <ScrollView>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Article' : 'Add New Article'}
            </Text>

            <TextInput
              label="Title (English)"
              value={titleEn}
              onChangeText={setTitleEn}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Title (Hindi)"
              value={titleHi}
              onChangeText={setTitleHi}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Description (English)"
              value={descriptionEn}
              onChangeText={setDescriptionEn}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={4}
            />
            <TextInput
              label="Description (Hindi)"
              value={descriptionHi}
              onChangeText={setDescriptionHi}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={4}
            />

            <TextInput
              label="Reference Link"
              value={referenceLink}
              onChangeText={setReferenceLink}
              mode="outlined"
              style={styles.input}
            />

            <View style={styles.imageContainer}>
              {imageUrl && (
                <Image source={{ uri: imageUrl }} style={styles.previewImage} />
              )}
              {imageUri && (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              )}
              <Button
                mode="outlined"
                onPress={selectImage}
                style={styles.imageButton}
                labelStyle={styles.imageButtonLabel}>
                {imageUrl || imageUri ? 'Change Image' : 'Select Image'}
              </Button>
            </View>

            <View style={styles.buttonContainer}>
              <Button onPress={hideModal} style={styles.button}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={saveArticle}
                style={styles.button}
                loading={uploading}>
                {editMode ? 'Update' : 'Add'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
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
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  addButton: {
    margin: 16,
    backgroundColor: '#FFA500',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
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
  },
});

export default ArticlesScreen; 