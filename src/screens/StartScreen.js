import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Button, Card, Portal, Modal, ActivityIndicator } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { bulkUpload } from '../utils/bulkUpload';
import { sampleData } from '../data/sampleData';

const StartScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  //enable this for bulk upload
  const [isBulkButtonVisible, setIsBulkButtonVisible] = useState(false);
  const handleBulkUpload = async () => {
    setLoading(true);
    try {
      const result = await bulkUpload(sampleData);
      if (result.success) {
        Alert.alert('Success', 'Sample data uploaded successfully!');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload sample data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Portal>
        <Modal visible={loading} dismissable={false}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Uploading sample data...</Text>
          </View>
        </Modal>
      </Portal>
      <LinearGradient colors={['#4c12a1', '#2b076e']} style={styles.container}>
        <View style={styles.starBackground}>
          {[...Array(20)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.star, 
                { 
                  top: `${Math.random() * 100}%`, 
                  left: `${Math.random() * 100}%`,
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                }
              ]} 
            />
          ))}
        </View>
        <Text style={[styles.title,{marginBottom:10}]}>HVAC MCQ ADMIN APP</Text>
        <View style={styles.cardContainer}>
          <Card style={styles.card}>
            <Card.Content>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Home')}
                style={styles.quizButton}
                labelStyle={styles.quizButtonLabel}
                contentStyle={{paddingVertical: 8}}
                icon="gamepad-circle"
                marginBottom="10"
                >
                Quiz Data
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Article')}
                style={styles.articleButton}
                labelStyle={styles.articleButtonLabel}
                contentStyle={{paddingVertical: 8}}
                icon="book-open-variant">
                Articles Data
              </Button>

              {isBulkButtonVisible && <Button
                mode="outlined"
                onPress={handleBulkUpload}
                style={[styles.articleButton, { marginTop: 10 }]}
                labelStyle={styles.articleButtonLabel}
                contentStyle={{paddingVertical: 8}}
                icon="database-import"
                disabled={loading}>
                {loading ? 'Uploading...' : 'Bulk Upload Sample Data'}
              </Button>}
            </Card.Content>
          </Card>
        </View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  quizButton: {
    borderColor: '#6200ee',
    borderWidth: 1.5,
    borderRadius: 10,
    marginBottom: 10,
  },
  quizButtonLabel: {
    color: '#6200ee',
    fontWeight: '500',
  },
  starBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 10,
    opacity: 0.7,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
  },
  button: {
    backgroundColor: '#FFA500',
    marginBottom: 16,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  articleButton: {
    borderColor: '#6200ee',
    borderWidth: 1.5,
    borderRadius: 10,
  },
  articleButtonLabel: {
    color: '#6200ee',
    fontWeight: '500',
  },
});

export default StartScreen;
